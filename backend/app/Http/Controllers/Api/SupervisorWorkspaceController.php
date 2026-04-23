<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddAttendanceAlertRequest;
use App\Http\Requests\AddAttendanceCommentRequest;
use App\Http\Requests\EscalateStudentIssueRequest;
use App\Http\Requests\ReviewDailyLogRequest;
use App\Http\Requests\ReviewPortfolioSectionRequest;
use App\Http\Requests\ReviewTaskSubmissionRequest;
use App\Http\Requests\SaveAcademicEvaluationDraftRequest;
use App\Http\Requests\SendSupervisorMessageRequest;
use App\Http\Requests\StoreAcademicTaskRequest;
use App\Http\Requests\StoreSupervisorVisitRequest;
use App\Http\Requests\SubmitAcademicEvaluationRequest;
use App\Http\Requests\UpdateAcademicTaskRequest;
use App\Http\Requests\UpdateSupervisorVisitRequest;
use App\Http\Resources\SupervisorSectionResource;
use App\Http\Resources\SupervisorStudentResource;
use App\Models\Conversation;
use App\Models\EvaluationTemplate;
use App\Models\FieldEvaluation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\PortfolioEntry;
use App\Models\Role;
use App\Models\Section;
use App\Services\AcademicSupervisorStudentService;
use App\Services\TrainingTrackResolver;
use App\Support\ApiResponse;
use App\Models\User;
use App\Models\SupervisorVisit;
use App\Models\Attendance;
use App\Models\TrainingLog;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\Evaluation;
use App\Models\StudentPortfolio;
use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class SupervisorWorkspaceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AcademicSupervisorStudentService $studentService,
        private readonly TrainingTrackResolver $trackResolver
    ) {
        $this->middleware('auth:sanctum');
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        $assignments = $this->studentService->supervisedAssignmentsQuery($user)->get();
        $assignmentIds = $assignments->pluck('id');
        $studentIds = $assignments->pluck('enrollment.user_id')->filter()->unique()->values();

        $recentActivity = Note::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->latest('id')
            ->limit(5)
            ->get(['id', 'content', 'training_assignment_id', 'created_at']);

        $upcomingVisits = SupervisorVisit::query()
            ->where('supervisor_id', $user->id)
            ->whereDate('scheduled_date', '>=', now()->toDateString())
            ->orderBy('scheduled_date')
            ->limit(5)
            ->get();

        $trackDistribution = $assignments->groupBy(fn ($a) => $this->trackResolver->resolveForAssignment($a) ?? 'unknown')
            ->map(fn ($group, $track) => ['training_track' => $track, 'count' => $group->count()])
            ->values();

        $openTasksCount = Task::whereIn('training_assignment_id', $assignmentIds)
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        $pendingSubmissionsCount = TaskSubmission::whereHas('task', fn ($q) => $q->whereIn('training_assignment_id', $assignmentIds))
            ->whereIn('review_status', [null, 'pending', 'under_review'])
            ->count();

        $finalAcademicEvaluationsCount = (int) Evaluation::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->where('is_final', true)
            ->distinct()
            ->count('training_assignment_id');

        return $this->successResponse([
            'supervisor_profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'department' => data_get($user, 'department.name'),
            ],
            'department_summary' => [
                'department' => $this->trackResolver->resolveDepartment($user),
            ],
            'sections_count' => $assignments->pluck('enrollment.section_id')->filter()->unique()->count(),
            'students_count' => $studentIds->count(),
            'visits_this_week' => SupervisorVisit::where('supervisor_id', $user->id)
                ->whereBetween('scheduled_date', [now()->startOfWeek(), now()->endOfWeek()])
                ->count(),
            'visible_daily_logs_count' => TrainingLog::whereIn('training_assignment_id', $assignmentIds)
                ->where('status', 'approved')
                ->count(),
            'attendance_alerts_count' => Attendance::whereIn('training_assignment_id', $assignmentIds)
                ->whereIn('status', ['absent', 'late'])
                ->whereDate('date', '>=', now()->subDays(14)->toDateString())
                ->count(),
            'missing_portfolio_items_count' => PortfolioEntry::whereIn('student_portfolio_id', StudentPortfolio::whereIn('training_assignment_id', $assignmentIds)->pluck('id'))
                ->whereNull('file_path')
                ->count(),
            'open_tasks_count' => $openTasksCount,
            'pending_submissions_count' => $pendingSubmissionsCount,
            'pending_academic_evaluations_count' => max(0, $studentIds->count() - $finalAcademicEvaluationsCount),
            'pending_field_evaluations_count' => FieldEvaluation::whereIn('training_assignment_id', $assignmentIds)->where('is_final', false)->count(),
            'critical_cases_count' => Attendance::whereIn('training_assignment_id', $assignmentIds)->where('status', 'absent')->whereDate('date', '>=', now()->subDays(7)->toDateString())->count(),
            'recent_activity' => $recentActivity,
            'upcoming_visits' => $upcomingVisits,
            'track_distribution' => $trackDistribution,
        ], 'Supervisor stats loaded successfully.');
    }

    public function students(Request $request)
    {
        $user = $request->user();
        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        $filters = [
            'section_id' => $request->input('section_id'),
            'department' => $request->input('department'),
            'training_track' => $request->input('training_track'),
            'attendance_status' => $request->input('attendance_status'),
            'daily_log_status' => $request->input('daily_log_status'),
            'portfolio_status' => $request->input('portfolio_status'),
            'evaluation_status' => $request->input('evaluation_status'),
            'search' => $request->input('search'),
        ];

        $query = $this->studentService->supervisedAssignmentsQuery($user);
        if ($filters['section_id']) {
            $query->whereHas('enrollment', fn ($q) => $q->where('section_id', (int) $filters['section_id']));
        }
        if ($filters['department']) {
            $query->whereHas('enrollment.user.department', function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['department'] . '%');
            });
        }
        if ($filters['training_track']) {
            $query->forTrainingTrack((string) $filters['training_track']);
        }
        if ($filters['attendance_status']) {
            $status = (string) $filters['attendance_status'];
            if (in_array($status, ['present', 'absent', 'late'], true)) {
                $query->whereHas('attendances', fn ($q) => $q->where('status', $status));
            }
        }
        if ($filters['daily_log_status']) {
            $logStatus = (string) $filters['daily_log_status'];
            if (in_array($logStatus, ['draft', 'submitted', 'approved', 'returned'], true)) {
                $query->whereHas('trainingLogs', fn ($q) => $q->where('status', $logStatus));
            }
        }
        if ($filters['portfolio_status']) {
            $portfolioFilter = (string) $filters['portfolio_status'];
            if ($portfolioFilter === 'missing_files') {
                $query->whereHas('studentPortfolio.entries', fn ($q) => $q->whereNull('file_path'));
            } elseif (in_array($portfolioFilter, ['complete_files', 'no_missing_files'], true)) {
                $query->whereHas('studentPortfolio')
                    ->whereDoesntHave('studentPortfolio.entries', fn ($q) => $q->whereNull('file_path'));
            }
        }
        if ($filters['evaluation_status']) {
            $evalFilter = (string) $filters['evaluation_status'];
            if ($evalFilter === 'final') {
                $query->whereHas('evaluations', fn ($q) => $q->where('is_final', true));
            } elseif (in_array($evalFilter, ['draft', 'pending', 'not_final', 'draft_or_missing'], true)) {
                $query->whereDoesntHave('evaluations', fn ($q) => $q->where('is_final', true));
            }
        }
        if ($filters['search']) {
            $search = (string) $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('enrollment.user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('university_id', 'like', '%' . $search . '%');
                })->orWhereHas('trainingSite', function ($siteQuery) use ($search) {
                    $siteQuery->where('name', 'like', '%' . $search . '%');
                });
            });
        }

        $paginator = $query->paginate($perPage);
        $assignmentIds = $paginator->getCollection()->pluck('id')->filter()->values();

        $attendanceAggregates = Attendance::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->selectRaw("
                training_assignment_id,
                COUNT(*) as total,
                SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late_count
            ")
            ->groupBy('training_assignment_id')
            ->get()
            ->keyBy('training_assignment_id');

        $approvedLogsCount = TrainingLog::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->where('status', 'approved')
            ->selectRaw('training_assignment_id, COUNT(*) as total')
            ->groupBy('training_assignment_id')
            ->pluck('total', 'training_assignment_id');

        $portfolioEntryCount = StudentPortfolio::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->withCount('entries')
            ->get()
            ->pluck('entries_count', 'training_assignment_id');

        $fieldEvaluationFinalExists = FieldEvaluation::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->where('is_final', true)
            ->select('training_assignment_id')
            ->distinct()
            ->pluck('training_assignment_id')
            ->flip();

        $academicEvaluationFinalExists = Evaluation::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->where('is_final', true)
            ->select('training_assignment_id')
            ->distinct()
            ->pluck('training_assignment_id')
            ->flip();

        $pendingSubmissionExists = TaskSubmission::query()
            ->whereHas('task', fn ($q) => $q->whereIn('training_assignment_id', $assignmentIds))
            ->whereIn('review_status', [null, 'pending', 'under_review'])
            ->with('task:id,training_assignment_id')
            ->get()
            ->groupBy(fn ($submission) => $submission->task?->training_assignment_id)
            ->map(fn ($group) => $group->isNotEmpty());

        $lastActivityByAssignment = Note::query()
            ->whereIn('training_assignment_id', $assignmentIds)
            ->selectRaw('training_assignment_id, MAX(created_at) as last_activity_at')
            ->groupBy('training_assignment_id')
            ->pluck('last_activity_at', 'training_assignment_id');

        $rows = $paginator->getCollection()->map(function ($assignment) use (
            $attendanceAggregates,
            $approvedLogsCount,
            $portfolioEntryCount,
            $fieldEvaluationFinalExists,
            $academicEvaluationFinalExists,
            $pendingSubmissionExists,
            $lastActivityByAssignment
        ) {
            $student = $assignment->enrollment?->user;
            if (! $student) {
                return null;
            }
            $attendanceSummary = $attendanceAggregates->get($assignment->id);
            $portfolioCount = (int) ($portfolioEntryCount[$assignment->id] ?? 0);
            $submissionPending = (bool) ($pendingSubmissionExists[$assignment->id] ?? false);
            $totalAttendance = (int) ($attendanceSummary?->total ?? 0);
            $presentAttendance = (int) ($attendanceSummary?->present ?? 0);
            $attendanceRate = $totalAttendance > 0 ? round(($presentAttendance / $totalAttendance) * 100) : null;
            $absentCount = (int) ($attendanceSummary?->absent ?? 0);
            $lateCount = (int) ($attendanceSummary?->late_count ?? 0);
            $riskLevel = 'low';
            if (($attendanceRate !== null && $attendanceRate < 60) || $absentCount >= 3) {
                $riskLevel = 'critical';
            } elseif ($submissionPending || ($attendanceRate !== null && $attendanceRate < 80) || $lateCount >= 3) {
                $riskLevel = 'medium';
            }

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'university_id' => $student->university_id,
                'department' => data_get($student, 'department.name'),
                'specialization' => data_get($student, 'department.name'),
                'section_id' => data_get($assignment, 'enrollment.section.id'),
                'section' => data_get($assignment, 'enrollment.section.name'),
                'course' => data_get($assignment, 'enrollment.section.course.name'),
                'training_site' => data_get($assignment, 'trainingSite.name'),
                'field_supervisor_name' => data_get($assignment, 'teacher.name'),
                'attendance_status_summary' => $totalAttendance > 0
                    ? $attendanceRate . '%'
                    : 'n/a',
                'daily_log_status_summary' => (int) ($approvedLogsCount[$assignment->id] ?? 0),
                'portfolio_completion' => $portfolioCount,
                'field_evaluation_status' => isset($fieldEvaluationFinalExists[$assignment->id]) ? 'submitted' : 'pending',
                'academic_evaluation_status' => isset($academicEvaluationFinalExists[$assignment->id]) ? 'final' : 'draft_or_missing',
                'risk_level' => $riskLevel,
                'last_activity_at' => $lastActivityByAssignment[$assignment->id] ?? null,
                'training_track' => $this->trackResolver->resolveForAssignment($assignment),
            ];
        })->filter()->values();

        return $this->successResponse(
            SupervisorStudentResource::collection($rows),
            'Students loaded successfully.',
            200,
            [
                'meta' => [
                    'total' => $paginator->total(),
                    'page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'last_page' => $paginator->lastPage(),
                ],
                'filters' => $filters,
                'summary' => [
                    'students_count' => $paginator->total(),
                    'critical_count' => $rows->where('risk_level', 'critical')->count(),
                    'warning_count' => $rows->where('risk_level', 'medium')->count(),
                ],
            ]
        );
    }

    public function sections(Request $request)
    {
        $supervisor = $request->user();
        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        $filters = [
            'department' => $request->input('department'),
            'course_id' => $request->input('course_id'),
            'semester' => $request->input('semester'),
            'training_track' => $request->input('training_track'),
            'search' => $request->input('search'),
        ];

        $query = Section::query()
            ->where('academic_supervisor_id', $supervisor->id)
            ->with(['course', 'academicSupervisor', 'enrollments.user.department', 'enrollments.trainingAssignments.trainingSite'])
            ->withCount('enrollments');

        if ($filters['semester']) {
            $query->where('semester', $filters['semester']);
        }
        if ($filters['course_id']) {
            $query->where('course_id', (int) $filters['course_id']);
        }
        if ($filters['department']) {
            $query->whereHas('enrollments.user.department', function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['department'] . '%');
            });
        }
        if ($filters['training_track']) {
            $track = strtolower((string) $filters['training_track']);
            if ($track === 'psychology_clinic') {
                $query->whereHas('enrollments.trainingAssignments.trainingSite', fn ($q) => $q->whereIn('site_type', ['health_center', 'clinic']));
            } elseif ($track === 'psychology_school') {
                $query
                    ->whereHas('enrollments.trainingAssignments.trainingSite', fn ($q) => $q->where('site_type', 'school'))
                    ->whereHas('enrollments.user.department', function ($q) {
                        $q->where('name', 'like', '%psych%')->orWhere('name', 'like', '%علم النفس%');
                    });
            } else {
                $query->whereHas('enrollments.trainingAssignments.trainingSite', fn ($q) => $q->where('site_type', 'school'));
            }
        }
        if ($filters['search']) {
            $search = (string) $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhereHas('course', fn ($cq) => $cq->where('name', 'like', '%' . $search . '%'));
            });
        }

        $paginator = $query->paginate($perPage);
        $sections = $paginator->getCollection()->map(function ($section) {
            $firstAssignment = $section->enrollments
                ->flatMap(fn ($enrollment) => $enrollment->trainingAssignments)
                ->first();
            $trainingSitesCount = $section->enrollments
                ->flatMap(fn ($enrollment) => $enrollment->trainingAssignments)
                ->pluck('training_site_id')
                ->filter()
                ->unique()
                ->count();

            return [
                'id' => $section->id,
                'section_code' => $section->id,
                'section_name' => $section->name,
                'course' => data_get($section, 'course.name'),
                'department' => data_get($section, 'enrollments.0.user.department.name'),
                'training_track' => $this->trackResolver->resolveForAssignment($firstAssignment),
                'students_count' => (int) $section->enrollments_count,
                'training_sites_count' => $trainingSitesCount,
                'academic_supervisor' => data_get($section, 'academicSupervisor.name'),
                'status' => 'active',
            ];
        })->values();

        return $this->successResponse(
            SupervisorSectionResource::collection($sections),
            'Sections loaded successfully.',
            200,
            [
                'meta' => [
                    'total' => $paginator->total(),
                    'page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'last_page' => $paginator->lastPage(),
                ],
                'filters' => $filters,
                'summary' => [
                    'sections_count' => $paginator->total(),
                    'students_count' => $sections->sum('students_count'),
                ],
            ]
        );
    }

    public function studentOverview(Request $request, $studentId)
    {
        $student = User::with('department')->findOrFail($studentId);
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $assignmentId = $assignment->id;

        $attendanceSummary = Attendance::where('training_assignment_id', $assignmentId)
            ->selectRaw("
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
            ")->first();

        $dailyLogsSummary = TrainingLog::where('training_assignment_id', $assignmentId)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
            ")
            ->first();

        $portfolio = StudentPortfolio::where('training_assignment_id', $assignmentId)->withCount('entries')->first();

        $visitsCompleted = SupervisorVisit::where('training_assignment_id', $assignmentId)
            ->where('status', 'completed')
            ->count();

        $tasksSummary = Task::where('training_assignment_id', $assignmentId)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('pending','in_progress') THEN 1 ELSE 0 END) as open_count
            ")
            ->first();

        $pendingSubmissions = TaskSubmission::whereHas('task', fn ($q) => $q->where('training_assignment_id', $assignmentId))
            ->whereIn('review_status', [null, 'pending', 'under_review'])
            ->count();

        $latestFieldEvaluation = FieldEvaluation::where('training_assignment_id', $assignmentId)->latest()->first();
        $latestAcademicEvaluation = Evaluation::where('training_assignment_id', $assignmentId)
            ->where('evaluator_id', $request->user()->id)
            ->latest()
            ->first();

        return $this->successResponse([
            'student' => $student,
            'summaries' => [
                'attendance' => $attendanceSummary,
                'daily_logs' => [
                    'total' => (int) ($dailyLogsSummary?->total ?? 0),
                    'approved' => (int) ($dailyLogsSummary?->approved ?? 0),
                ],
                'portfolio' => [
                    'entries_count' => (int) ($portfolio?->entries_count ?? 0),
                ],
                'visits' => [
                    'completed' => $visitsCompleted,
                ],
                'tasks' => [
                    'total' => (int) ($tasksSummary?->total ?? 0),
                    'open_count' => (int) ($tasksSummary?->open_count ?? 0),
                    'pending_submissions' => $pendingSubmissions,
                ],
                'evaluations' => [
                    'field' => $latestFieldEvaluation,
                    'academic' => $latestAcademicEvaluation,
                ],
            ],
            'related_data' => [
                'assignment' => $assignment,
                'section' => data_get($assignment, 'enrollment.section'),
                'course' => data_get($assignment, 'enrollment.section.course'),
                'training_site' => $assignment->trainingSite,
                'field_supervisor' => $assignment->teacher,
            ],
            'permissions' => [
                'can_review_attendance' => true,
                'can_review_logs' => true,
                'can_submit_academic_evaluation' => true,
            ],
            'track_config_hints' => [
                'department' => $this->trackResolver->resolveDepartment($student),
                'training_track' => $this->trackResolver->resolveForAssignment($assignment),
            ],
        ], 'Student overview loaded successfully.');
    }

    public function studentAttendance(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $records = Attendance::where('training_assignment_id', $assignment->id)
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 50);

        $summary = Attendance::where('training_assignment_id', $assignment->id)
            ->selectRaw("
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
            ")
            ->first();

        $total = $summary?->total_days ?? 0;
        $present = $summary?->present_days ?? 0;

        return $this->successResponse([
            'records' => $records->items(),
            'summary' => [
                'total_days' => $total,
                'present_days' => $present,
                'absent_days' => $summary?->absent_days ?? 0,
                'late_days' => $summary?->late_days ?? 0,
                'attendance_rate' => $total > 0 ? round(($present / $total) * 100) : 0,
            ],
            'monthly_aggregation' => $this->attendanceMonthlyAggregation($assignment->id),
            'absences_count' => (int) ($summary?->absent_days ?? 0),
            'late_count' => (int) ($summary?->late_days ?? 0),
            'unreviewed_records_count' => Attendance::where('training_assignment_id', $assignment->id)->whereNull('approved_at')->count(),
            'academic_visibility_status' => 'visible',
        ], 'Attendance loaded successfully.', 200, [
            'meta' => [
                'total' => $records->total(),
                'page' => $records->currentPage(),
                'per_page' => $records->perPage(),
                'last_page' => $records->lastPage(),
            ],
            'filters' => [
                'from' => $request->input('from'),
                'to' => $request->input('to'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    public function attendanceComment(AddAttendanceCommentRequest $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $attendance = Attendance::where('id', $request->integer('attendance_id'))
            ->where('training_assignment_id', $assignment->id)
            ->firstOrFail();

        $attendance->update([
            'academic_note' => $request->string('comment'),
            'academic_commented_at' => now(),
        ]);

        $this->createActivity($request->user()->id, 'attendance_comment_added', 'Academic attendance comment added.');

        return $this->successResponse($attendance, 'Attendance comment added.');
    }

    public function attendanceAlert(AddAttendanceAlertRequest $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $attendance = Attendance::where('id', $request->integer('attendance_id'))
            ->where('training_assignment_id', $assignment->id)
            ->firstOrFail();

        $attendance->update([
            'academic_alert_status' => 'raised',
            'academic_commented_at' => now(),
        ]);

        Notification::create([
            'user_id' => $this->resolveTargetUserId($request->string('target')->toString(), (int) $studentId) ?? $request->user()->id,
            'type' => 'attendance_alert',
            'message' => $request->string('message'),
            'data' => [
                'attendance_id' => $attendance->id,
                'target' => $request->string('target'),
                'student_id' => (int) $studentId,
            ],
        ]);

        $this->createActivity($request->user()->id, 'attendance_alert_raised', 'Attendance alert raised by academic supervisor.');

        return $this->successResponse(null, 'Attendance alert created successfully.');
    }

    public function studentDailyLogs(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $logs = TrainingLog::where('training_assignment_id', $assignment->id)
            ->orderBy('log_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return $this->successResponse([
            'logs' => $logs->items(),
            'counters' => [
                'total' => $logs->total(),
                'approved' => TrainingLog::where('training_assignment_id', $assignment->id)->where('status', 'approved')->count(),
                'returned' => TrainingLog::where('training_assignment_id', $assignment->id)->where('status', 'returned')->count(),
            ],
            'status_distribution' => TrainingLog::where('training_assignment_id', $assignment->id)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get(),
        ], 'Daily logs loaded successfully.', 200, [
            'meta' => [
                'total' => $logs->total(),
                'page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'last_page' => $logs->lastPage(),
            ],
            'filters' => [
                'status' => $request->input('status'),
                'from' => $request->input('from'),
                'to' => $request->input('to'),
            ],
            'summary' => [
                'approved_count' => TrainingLog::where('training_assignment_id', $assignment->id)->where('status', 'approved')->count(),
                'returned_count' => TrainingLog::where('training_assignment_id', $assignment->id)->where('status', 'returned')->count(),
            ],
        ]);
    }

    public function reviewDailyLog(ReviewDailyLogRequest $request, $studentId, $logId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $log = TrainingLog::where('id', $logId)->where('training_assignment_id', $assignment->id)->firstOrFail();

        $log->update([
            'academic_review_status' => 'reviewed',
            'academic_note' => $request->string('academic_note'),
            'needs_discussion' => (bool) $request->boolean('needs_discussion'),
            'academic_reviewed_at' => now(),
        ]);

        $this->createActivity($request->user()->id, 'daily_log_reviewed', 'Academic review added to daily log.');

        return $this->successResponse($log, 'Daily log reviewed successfully.');
    }

    public function flagDailyLog(Request $request, $studentId, $logId)
    {
        $request->validate(['flag_reason' => 'required|string|max:1500']);
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $log = TrainingLog::where('id', $logId)->where('training_assignment_id', $assignment->id)->firstOrFail();

        $log->update([
            'academic_review_status' => 'flagged',
            'academic_note' => $request->string('flag_reason'),
            'needs_discussion' => true,
            'academic_reviewed_at' => now(),
        ]);

        $this->createActivity($request->user()->id, 'daily_log_flagged', 'Daily log flagged by academic supervisor.');

        return $this->successResponse($log, 'Daily log flagged successfully.');
    }

    public function studentPortfolio(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $portfolio = StudentPortfolio::where('training_assignment_id', $assignment->id)
            ->with('entries.reviewer')
            ->first();

        if (! $portfolio) {
            return $this->successResponse([
                'portfolio_meta' => null,
                'training_track' => $this->trackResolver->resolveForAssignment($assignment),
                'completion_percentage' => 0,
                'sections' => [],
                'attachments' => [],
                'missing_items' => [],
                'reviewed_items_count' => 0,
                'needs_revision_items_count' => 0,
                'final_review_status' => 'not_started',
            ], 'Portfolio not created yet.');
        }

        $entries = $portfolio->entries;
        $reviewedCount = $entries->where('review_status', 'reviewed')->count();
        $needsRevisionCount = $entries->where('review_status', 'needs_revision')->count();
        $completion = $entries->count() > 0 ? round(($reviewedCount / $entries->count()) * 100) : 0;

        return $this->successResponse([
            'portfolio_meta' => Arr::only($portfolio->toArray(), ['id', 'created_at', 'updated_at']),
            'training_track' => $this->trackResolver->resolveForAssignment($assignment),
            'completion_percentage' => $completion,
            'sections' => $entries,
            'attachments' => $entries->pluck('file_path')->filter()->values(),
            'missing_items' => $entries->whereNull('file_path')->values(),
            'reviewed_items_count' => $reviewedCount,
            'needs_revision_items_count' => $needsRevisionCount,
            'final_review_status' => $needsRevisionCount > 0 ? 'needs_revision' : ($reviewedCount > 0 ? 'in_review' : 'not_started'),
        ], 'Portfolio loaded successfully.');
    }

    public function reviewPortfolioSection(ReviewPortfolioSectionRequest $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $entry = PortfolioEntry::where('id', $request->integer('entry_id'))
            ->whereHas('studentPortfolio', fn ($q) => $q->where('training_assignment_id', $assignment->id))
            ->firstOrFail();

        $entry->update([
            'review_status' => $request->string('status'),
            'reviewer_note' => $request->string('reviewer_note'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $this->createActivity($request->user()->id, 'portfolio_section_reviewed', 'Portfolio section reviewed.');

        return $this->successResponse($entry, 'Portfolio section reviewed successfully.');
    }

    public function finalPortfolioReview(Request $request, $studentId)
    {
        $request->validate(['final_note' => 'required|string|max:2000']);
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        Note::create([
            'user_id' => $request->user()->id,
            'training_assignment_id' => $assignment->id,
            'content' => '[PORTFOLIO_FINAL_REVIEW] ' . $request->string('final_note'),
        ]);

        return $this->successResponse(null, 'Portfolio final review saved.');
    }

    public function studentTasks(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $tasks = Task::where('training_assignment_id', $assignment->id)
            ->with('submissions')
            ->orderBy('due_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return $this->successResponse($tasks, 'Tasks loaded successfully.', 200, [
            'meta' => [
                'total' => $tasks->total(),
                'page' => $tasks->currentPage(),
                'per_page' => $tasks->perPage(),
                'last_page' => $tasks->lastPage(),
            ],
            'filters' => [
                'status' => $request->input('status'),
                'task_type' => $request->input('task_type'),
            ],
            'summary' => [
                'open_tasks_count' => Task::where('training_assignment_id', $assignment->id)->whereIn('status', ['pending', 'in_progress'])->count(),
            ],
        ]);
    }

    public function storeTask(StoreAcademicTaskRequest $request)
    {
        $user = $request->user();
        $created = collect();
        $targetType = $request->string('target_type')->toString();

        $base = [
            'assigned_by' => $user->id,
            'title' => $request->string('title'),
            'description' => $request->input('description'),
            'instructions' => $request->input('instructions'),
            'due_date' => $request->input('due_date'),
            'target_type' => $request->input('target_type'),
            'target_ids' => $request->input('target_ids'),
            'task_type' => $request->input('task_type'),
            'attachments' => $request->input('attachments', []),
            'grading_weight' => $request->input('grading_weight'),
            'status' => $request->input('status', 'pending'),
        ];

        foreach ($request->input('target_ids', []) as $targetId) {
            if (in_array($targetType, ['student', 'group'], true)) {
                $assignment = $this->studentService->getAssignmentForStudent($user, (int) $targetId);
                if ($assignment) {
                    $created->push(Task::create(array_merge($base, [
                        'training_assignment_id' => $assignment->id,
                    ])));
                }
            } elseif ($targetType === 'section') {
                $assignments = $this->studentService->supervisedAssignmentsQuery($user)
                    ->whereHas('enrollment', fn ($q) => $q->where('section_id', (int) $targetId))
                    ->get();
                foreach ($assignments as $assignment) {
                    $created->push(Task::create(array_merge($base, [
                        'training_assignment_id' => $assignment->id,
                    ])));
                }
            }
        }

        abort_if($created->isEmpty(), 422, 'No supervised students match the selected targets.');

        $this->createActivity($user->id, 'task_created', 'Supervisor created new task(s).');

        return $this->successResponse($created->values(), 'Task(s) created successfully.', 201);
    }

    public function updateTask(UpdateAcademicTaskRequest $request, $taskId)
    {
        $task = Task::findOrFail($taskId);
        abort_unless((int) $task->assigned_by === (int) $request->user()->id, 403, 'Unauthorized task update.');
        abort_if(now()->gt($task->due_date) || $task->submissions()->exists(), 422, 'Task can no longer be edited.');

        $task->update($request->validated());
        return $this->successResponse($task, 'Task updated successfully.');
    }

    public function deleteTask(Request $request, $taskId)
    {
        $task = Task::findOrFail($taskId);
        abort_unless((int) $task->assigned_by === (int) $request->user()->id, 403, 'Unauthorized task deletion.');
        abort_if($task->submissions()->exists(), 422, 'Task cannot be deleted after submissions.');
        $task->delete();

        return $this->successResponse(null, 'Task deleted successfully.');
    }

    public function studentTaskSubmissions(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $submissions = TaskSubmission::where('user_id', $studentId)
            ->whereHas('task', fn ($q) => $q->where('training_assignment_id', $assignment->id))
            ->with('task')
            ->orderBy('submitted_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return $this->successResponse($submissions, 'Task submissions loaded successfully.', 200, [
            'meta' => [
                'total' => $submissions->total(),
                'page' => $submissions->currentPage(),
                'per_page' => $submissions->perPage(),
                'last_page' => $submissions->lastPage(),
            ],
            'filters' => [
                'review_status' => $request->input('review_status'),
                'needs_resubmission' => $request->input('needs_resubmission'),
            ],
            'summary' => [
                'pending_review_count' => TaskSubmission::where('user_id', $studentId)
                    ->whereHas('task', fn ($q) => $q->where('training_assignment_id', $assignment->id))
                    ->whereIn('review_status', [null, 'pending', 'under_review'])
                    ->count(),
            ],
        ]);
    }

    public function showTaskSubmission(Request $request, $submissionId)
    {
        $submission = TaskSubmission::with(['task.trainingAssignment.enrollment', 'user'])->findOrFail($submissionId);
        $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $submission->user_id);
        return $this->successResponse($submission);
    }

    public function reviewTaskSubmission(ReviewTaskSubmissionRequest $request, $submissionId)
    {
        $submission = TaskSubmission::with('task.trainingAssignment.enrollment')->findOrFail($submissionId);
        $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $submission->user_id);

        $submission->update([
            'review_status' => 'reviewed',
            'feedback' => $request->string('feedback'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $this->successResponse($submission, 'Submission reviewed successfully.');
    }

    public function requestResubmission(Request $request, $submissionId)
    {
        $request->validate(['feedback' => 'required|string|max:2000']);
        $submission = TaskSubmission::findOrFail($submissionId);
        $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $submission->user_id);
        $submission->update([
            'review_status' => 'needs_resubmission',
            'needs_resubmission' => true,
            'feedback' => $request->string('feedback'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        return $this->successResponse($submission, 'Resubmission requested successfully.');
    }

    public function gradeSubmission(Request $request, $submissionId)
    {
        $request->validate([
            'score' => 'required|numeric|min:0|max:100',
            'feedback' => 'nullable|string|max:2000',
        ]);
        $submission = TaskSubmission::findOrFail($submissionId);
        $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $submission->user_id);
        $submission->update([
            'review_status' => 'graded',
            'score' => $request->input('score'),
            'feedback' => $request->input('feedback'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'needs_resubmission' => false,
        ]);
        return $this->successResponse($submission, 'Submission graded successfully.');
    }

    public function studentFieldEvaluations(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $evaluations = FieldEvaluation::where('training_assignment_id', $assignment->id)
            ->with(['template', 'fieldSupervisor'])
            ->get();

        return $this->successResponse([
            'evaluations' => $evaluations,
            'missing_evaluations' => $evaluations->where('is_final', false)->count(),
            'final_field_score_summary' => $evaluations->where('is_final', true)->avg('total_score'),
        ], 'Field evaluations loaded successfully.');
    }

    public function studentAcademicEvaluation(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $evaluation = Evaluation::where('training_assignment_id', $assignment->id)
            ->where('evaluator_id', $request->user()->id)
            ->latest()
            ->first();

        $template = EvaluationTemplate::query()
            ->where(function ($q) {
                $q->whereNull('target_role')->orWhere('target_role', 'academic_supervisor');
            })
            ->with('items')
            ->first();

        return $this->successResponse([
            'evaluation' => $evaluation,
            'rubric_template' => $template,
            'status' => $evaluation?->status ?? 'draft',
        ]);
    }

    public function saveAcademicEvaluationDraft(SaveAcademicEvaluationDraftRequest $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $evaluation = Evaluation::firstOrCreate(
            [
                'training_assignment_id' => $assignment->id,
                'evaluator_id' => $request->user()->id,
            ],
            [
                'template_id' => EvaluationTemplate::query()
                    ->where(function ($q) {
                        $q->whereNull('target_role')->orWhere('target_role', 'academic_supervisor');
                    })->value('id'),
            ]
        );

        abort_if($evaluation->is_final, 422, 'Final evaluation is read-only.');

        $evaluation->update([
            'criteria_scores' => $request->input('criteria_scores'),
            'notes' => $request->input('notes'),
            'strengths' => $request->input('strengths'),
            'areas_for_improvement' => $request->input('areas_for_improvement'),
            'recommendation' => $request->input('recommendation'),
            'total_score' => $request->input('total_score') ?? collect($request->input('criteria_scores'))->sum('score'),
            'status' => 'draft',
            'is_final' => false,
        ]);

        return $this->successResponse($evaluation, 'Academic evaluation draft saved.');
    }

    public function submitAcademicEvaluation(SubmitAcademicEvaluationRequest $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $evaluation = Evaluation::where('training_assignment_id', $assignment->id)
            ->where('evaluator_id', $request->user()->id)
            ->firstOrFail();

        abort_if($evaluation->is_final, 422, 'Final evaluation is already submitted.');

        $evaluation->update([
            'criteria_scores' => $request->input('criteria_scores'),
            'notes' => $request->input('notes'),
            'strengths' => $request->input('strengths'),
            'areas_for_improvement' => $request->input('areas_for_improvement'),
            'recommendation' => $request->input('recommendation'),
            'total_score' => $request->input('total_score'),
            'status' => 'final',
            'is_final' => true,
            'submitted_at' => now(),
        ]);

        $this->createActivity($request->user()->id, 'academic_evaluation_submitted', 'Academic evaluation submitted as final.');

        return $this->successResponse($evaluation, 'Academic evaluation submitted successfully.');
    }

    public function studentMessages(Request $request, $studentId)
    {
        $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);

        $conversation = Conversation::query()
            ->where(function ($q) use ($studentId, $request) {
                $q->where('participant_one_id', $request->user()->id)->where('participant_two_id', $studentId);
            })->orWhere(function ($q) use ($studentId, $request) {
                $q->where('participant_one_id', $studentId)->where('participant_two_id', $request->user()->id);
            })->first();

        $messages = $conversation
            ? Message::where('conversation_id', $conversation->id)->with('sender')->latest()->paginate($request->per_page ?? 50)
            : null;

        return $this->successResponse($messages ?? ['data' => []], 'Messages loaded successfully.');
    }

    public function sendMessage(SendSupervisorMessageRequest $request, $studentId)
    {
        $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        abort_unless((int) $request->integer('target_user_id') === (int) $studentId, 422, 'Target must match supervised student.');

        $conversation = Conversation::firstOrCreate([
            'participant_one_id' => min($request->user()->id, (int) $studentId),
            'participant_two_id' => max($request->user()->id, (int) $studentId),
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'message' => $request->string('content'),
        ]);

        $this->createActivity($request->user()->id, 'supervisor_message_sent', 'Supervisor sent message to student.');

        return $this->successResponse($message, 'Message sent successfully.');
    }

    public function studentTimeline(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);

        $events = collect()
            ->merge(Attendance::where('training_assignment_id', $assignment->id)->get()->map(fn ($row) => [
                'type' => 'attendance',
                'datetime' => $row->date,
                'data' => $row,
            ]))
            ->merge(TrainingLog::where('training_assignment_id', $assignment->id)->get()->map(fn ($row) => [
                'type' => 'daily_log',
                'datetime' => $row->log_date,
                'data' => $row,
            ]))
            ->merge(SupervisorVisit::where('training_assignment_id', $assignment->id)->get()->map(fn ($row) => [
                'type' => 'visit',
                'datetime' => $row->scheduled_date ?? $row->visit_date,
                'data' => $row,
            ]))
            ->merge(Task::where('training_assignment_id', $assignment->id)->get()->map(fn ($row) => [
                'type' => 'task',
                'datetime' => $row->created_at,
                'data' => $row,
            ]))
            ->merge(Evaluation::where('training_assignment_id', $assignment->id)->get()->map(fn ($row) => [
                'type' => 'evaluation',
                'datetime' => $row->submitted_at ?? $row->created_at,
                'data' => $row,
            ]))
            ->sortByDesc('datetime')
            ->values();

        return $this->successResponse($events, 'Timeline loaded successfully.');
    }

    public function escalate(EscalateStudentIssueRequest $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        Note::create([
            'user_id' => $request->user()->id,
            'training_assignment_id' => $assignment->id,
            'content' => sprintf(
                '[ESCALATION][%s][%s] %s',
                $request->string('target'),
                $request->string('reason'),
                $request->string('details')
            ),
        ]);

        Notification::create([
            'user_id' => $this->resolveTargetUserId($request->string('target')->toString(), (int) $studentId) ?? $request->user()->id,
            'type' => 'student_escalation',
            'message' => 'Student case escalated.',
            'data' => [
                'student_id' => (int) $studentId,
                'reason' => $request->string('reason'),
                'target' => $request->string('target'),
            ],
        ]);

        $this->createActivity($request->user()->id, 'student_escalated', 'Student issue escalated.');

        return $this->successResponse(null, 'Student issue escalated successfully.');
    }

    public function studentVisits(Request $request, $studentId)
    {
        $assignment = $this->studentService->mustGetAssignmentForStudent($request->user(), (int) $studentId);
        $visits = SupervisorVisit::where('training_assignment_id', $assignment->id)->latest('scheduled_date')->get();
        return $this->successResponse($visits);
    }

    public function storeVisit(StoreSupervisorVisitRequest $request)
    {
        $assignment = $this->studentService->supervisedAssignmentsQuery($request->user())
            ->where('id', $request->integer('training_assignment_id'))
            ->firstOrFail();

        $scheduled = $request->input('scheduled_date');
        $visit = SupervisorVisit::create([
            'training_assignment_id' => $assignment->id,
            'supervisor_id' => $request->user()->id,
            'visit_date' => $scheduled ?? now()->toDateString(),
            'scheduled_date' => $scheduled,
            'visit_type' => $request->input('visit_type'),
            'location' => $request->input('location'),
            'training_track' => $request->input('training_track', $this->trackResolver->resolveForAssignment($assignment)),
            'template_type' => $request->input('template_type'),
            'notes' => $request->input('notes'),
            'status' => 'scheduled',
        ]);
        $this->createActivity($request->user()->id, 'visit_scheduled', 'Supervisor visit scheduled.');
        return $this->successResponse($visit, 'Visit scheduled successfully.', 201);
    }

    public function updateVisit(UpdateSupervisorVisitRequest $request, $visitId)
    {
        $visit = SupervisorVisit::findOrFail($visitId);
        abort_unless((int) $visit->supervisor_id === (int) $request->user()->id, 403);
        $visit->update($request->validated());
        return $this->successResponse($visit, 'Visit updated successfully.');
    }

    public function completeVisit(Request $request, $visitId)
    {
        $request->validate([
            'report_data' => 'nullable|array',
            'rating' => 'nullable|numeric|min:0|max:100',
            'positive_points' => 'nullable|string',
            'needs_improvement' => 'nullable|string',
            'general_notes' => 'nullable|string',
        ]);
        $visit = SupervisorVisit::findOrFail($visitId);
        abort_unless((int) $visit->supervisor_id === (int) $request->user()->id, 403);
        $visit->update([
            'visit_date' => now()->toDateString(),
            'status' => 'completed',
            'completed_at' => now(),
            'report_data' => $request->input('report_data'),
            'rating' => $request->input('rating'),
            'positive_points' => $request->input('positive_points'),
            'needs_improvement' => $request->input('needs_improvement'),
            'general_notes' => $request->input('general_notes'),
        ]);
        $this->createActivity($request->user()->id, 'visit_completed', 'Supervisor visit completed.');
        return $this->successResponse($visit, 'Visit completed successfully.');
    }

    public function showVisit(Request $request, $visitId)
    {
        $visit = SupervisorVisit::with('trainingAssignment.enrollment.user')->findOrFail($visitId);
        abort_unless((int) $visit->supervisor_id === (int) $request->user()->id, 403);
        return $this->successResponse($visit);
    }

    private function attendanceMonthlyAggregation(int $assignmentId): \Illuminate\Support\Collection
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            return Attendance::where('training_assignment_id', $assignmentId)
                ->selectRaw("strftime('%Y-%m', date) as month, COUNT(*) as total")
                ->groupByRaw("strftime('%Y-%m', date)")
                ->orderByDesc('month')
                ->get();
        }

        return Attendance::where('training_assignment_id', $assignmentId)
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as total")
            ->groupByRaw("DATE_FORMAT(date, '%Y-%m')")
            ->orderByDesc('month')
            ->get();
    }

    private function createActivity(int $userId, string $action, string $description): void
    {
        \App\Models\ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'ip_address' => request()->ip(),
            'method' => request()->method(),
            'route' => request()->path(),
            'user_agent' => (string) request()->userAgent(),
        ]);
    }

    private function resolveTargetUserId(string $target, int $studentId): ?int
    {
        if ($target === 'student') {
            return $studentId;
        }

        if ($target === 'field_supervisor') {
            $assignment = $this->studentService->getAssignmentForStudent(request()->user(), $studentId);
            return $assignment?->teacher_id;
        }

        $roleName = match ($target) {
            'coordinator' => 'coordinator',
            'department_head' => 'department_head',
            'admin' => 'admin',
            default => null,
        };

        if (! $roleName) {
            return null;
        }

        $roleId = Role::where('name', $roleName)->value('id');
        if (! $roleId) {
            return null;
        }

        return User::where('role_id', $roleId)->value('id');
    }
}
