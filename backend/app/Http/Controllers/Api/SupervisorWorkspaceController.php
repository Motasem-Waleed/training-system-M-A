<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TrainingAssignment;
use App\Models\SupervisorVisit;
use App\Models\Attendance;
use App\Models\TrainingLog;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\Evaluation;
use App\Models\StudentPortfolio;
use App\Models\Note;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * SupervisorWorkspaceController
 *
 * مركز التحكم الموحد للمشرف الأكاديمي
 * يجمع كل البيانات اللازمة لمساحة العمل في endpoints مركزية
 */
class SupervisorWorkspaceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * إحصائيات مساحة العمل (Dashboard Summary)
     * GET /supervisor/stats
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        // الشعب التي يشرف عليها
        $sectionsCount = Section::where('academic_supervisor_id', $user->id)->count();

        // الطلبة المشرف عليهم
        $studentIds = $this->getSupervisedStudentIds($user);

        // الزيارات المجدولة هذا الأسبوع
        $visitsThisWeek = SupervisorVisit::where('supervisor_id', $user->id)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_date', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        // السجلات اليومية غير المراجعة
        $unreviewedLogs = TrainingLog::whereIn('student_id', $studentIds)
            ->where('status', 'pending_review')
            ->count();

        // طلبة بغياب أو تأخر
        $absenceAlerts = Attendance::whereIn('user_id', $studentIds)
            ->where('date', '>=', now()->subDays(14))
            ->whereIn('status', ['absent', 'late'])
            ->distinct('user_id')
            ->count('user_id');

        // ملفات إنجاز غير مكتملة
        $incompletePortfolios = StudentPortfolio::whereIn('user_id', $studentIds)
            ->whereColumn('completed_items', '<', 'required_items')
            ->count();

        // مهام بانتظار التقييم
        $pendingTaskReviews = TaskSubmission::whereIn('student_id', $studentIds)
            ->where('status', 'submitted')
            ->count();

        // طلبة بدون تقييم نهائي
        $evaluatedStudentIds = Evaluation::whereIn('student_id', $studentIds)
            ->where('type', 'academic')
            ->where('is_final', true)
            ->pluck('student_id')
            ->toArray();

        $unevaluatedStudents = count($studentIds) - count($evaluatedStudentIds);

        return response()->json([
            'sections_count' => $sectionsCount,
            'students_count' => count($studentIds),
            'visits_this_week' => $visitsThisWeek,
            'unreviewed_logs' => $unreviewedLogs,
            'absence_alerts' => $absenceAlerts,
            'incomplete_portfolios' => $incompletePortfolios,
            'pending_task_reviews' => $pendingTaskReviews,
            'unevaluated_students' => $unevaluatedStudents,
        ]);
    }

    /**
     * قائمة الطلبة المشرف عليهم مع مؤشرات الحالة
     * GET /supervisor/students
     */
    public function students(Request $request)
    {
        $user = $request->user();

        $assignments = TrainingAssignment::with([
            'enrollment.user',
            'enrollment.section',
            'trainingSite',
            'teacher',
        ])
            ->where('academic_supervisor_id', $user->id)
            ->get();

        $students = $assignments->map(function ($assignment) {
            $student = $assignment->enrollment?->user;
            if (!$student) return null;

            $attendanceRate = $this->getAttendanceRate($student->id);
            $logsStatus = $this->getLogsStatus($student->id);
            $portfolioStatus = $this->getPortfolioStatus($student->id);
            $tasksStatus = $this->getTasksStatus($student->id);
            $evalStatus = $this->getEvaluationStatus($student->id);
            $healthStatus = $this->computeHealthStatus($attendanceRate, $logsStatus, $portfolioStatus, $tasksStatus, $evalStatus);

            return [
                'id' => $student->id,
                'name' => $student->name,
                'university_id' => $student->university_id ?? null,
                'specialization' => $student->department?->name ?? null,
                'section_id' => $assignment->enrollment?->section?->id,
                'section_name' => $assignment->enrollment?->section?->name ?? null,
                'site_name' => $assignment->trainingSite?->name ?? null,
                'mentor_name' => $assignment->teacher?->name ?? null,
                'assignment_id' => $assignment->id,
                'attendance_rate' => $attendanceRate,
                'logs_status' => $logsStatus,
                'portfolio_status' => $portfolioStatus,
                'tasks_status' => $tasksStatus,
                'evaluation_status' => $evalStatus,
                'health_status' => $healthStatus,
            ];
        })->filter()->values();

        return response()->json($students);
    }

    /**
     * قائمة الشعب
     * GET /supervisor/sections
     */
    public function sections(Request $request)
    {
        $sections = Section::where('academic_supervisor_id', $request->user()->id)
            ->withCount('enrollments')
            ->get();

        return response()->json($sections);
    }

    /**
     * ملف الطالب الكامل - نظرة عامة
     * GET /supervisor/students/{studentId}/overview
     */
    public function studentOverview(Request $request, $studentId)
    {
        $student = User::with(['department', 'enrollments.section', 'enrollments.course'])
            ->findOrFail($studentId);

        $assignment = TrainingAssignment::where('academic_supervisor_id', $request->user()->id)
            ->whereHas('enrollment', fn($q) => $q->where('user_id', $studentId))
            ->with(['trainingSite', 'teacher', 'trainingPeriod'])
            ->first();

        // إحصائيات الحضور
        $attendanceStats = Attendance::where('user_id', $studentId)
            ->selectRaw("
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
            ")
            ->first();

        $totalDays = $attendanceStats?->total_days ?? 0;
        $presentDays = $attendanceStats?->present_days ?? 0;
        $absentDays = $attendanceStats?->absent_days ?? 0;
        $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : null;

        // آخر زيارة
        $lastVisit = SupervisorVisit::where('supervisor_id', $request->user()->id)
            ->whereHas('trainingAssignment.enrollment', fn($q) => $q->where('user_id', $studentId))
            ->where('status', 'completed')
            ->latest('visit_date')
            ->first();

        // السجلات اليومية
        $logsCount = TrainingLog::where('student_id', $studentId)->count();
        $logsReviewed = TrainingLog::where('student_id', $studentId)->where('status', 'reviewed')->count();

        // ملف الإنجاز
        $portfolio = StudentPortfolio::where('user_id', $studentId)->first();
        $portfolioCompletion = $portfolio ? ($portfolio->required_items > 0
            ? round(($portfolio->completed_items / $portfolio->required_items) * 100)
            : 0) : null;

        // المهام
        $tasksTotal = Task::where('student_id', $studentId)
            ->orWhereHas('section.enrollments', fn($q) => $q->where('user_id', $studentId))
            ->count();
        $tasksCompleted = TaskSubmission::where('student_id', $studentId)
            ->where('status', 'graded')
            ->count();

        // التقييم الميداني
        $fieldEval = Evaluation::where('student_id', $studentId)
            ->whereIn('type', ['mentor', 'site_manager'])
            ->latest()
            ->first();

        // التقييم الأكاديمي
        $academicEval = Evaluation::where('student_id', $studentId)
            ->where('type', 'academic')
            ->latest()
            ->first();

        // آخر مهمة
        $lastTask = Task::where('student_id', $studentId)
            ->orWhereHas('section.enrollments', fn($q) => $q->where('user_id', $studentId))
            ->latest()
            ->first();

        // آخر ملاحظة
        $lastNote = Note::where('student_id', $studentId)->latest()->first();

        return response()->json([
            'training_period' => $assignment?->trainingPeriod?->name ?? '—',
            'site_manager' => $assignment?->trainingSite?->manager_name ?? '—',
            'training_status' => $assignment?->status ?? '—',
            'compliance_rate' => $attendanceRate,
            'present_days' => $presentDays,
            'total_days' => $totalDays,
            'absent_days' => $absentDays,
            'last_visit_date' => $lastVisit?->visit_date?->format('Y-m-d'),
            'last_task' => $lastTask?->title,
            'last_note' => $lastNote?->content,
            'final_evaluation_status' => $academicEval?->is_final ? 'مكتمل' : ($academicEval ? 'قيد الإدخال' : 'لم يبدأ'),
            'attendance_rate' => $attendanceRate,
            'logs_reviewed' => $logsReviewed,
            'logs_total' => $logsCount,
            'portfolio_completion' => $portfolioCompletion,
            'tasks_completed' => $tasksCompleted,
            'tasks_total' => $tasksTotal,
            'visits_completed' => SupervisorVisit::where('supervisor_id', $request->user()->id)
                ->whereHas('trainingAssignment.enrollment', fn($q) => $q->where('user_id', $studentId))
                ->where('status', 'completed')
                ->count(),
            'field_evaluation_score' => $fieldEval?->total_score,
        ]);
    }

    /**
     * سجل حضور الطالب
     * GET /supervisor/students/{studentId}/attendance
     */
    public function studentAttendance(Request $request, $studentId)
    {
        $records = Attendance::where('user_id', $studentId)
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 50);

        $summary = Attendance::where('user_id', $studentId)
            ->selectRaw("
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
            ")
            ->first();

        $total = $summary?->total_days ?? 0;
        $present = $summary?->present_days ?? 0;

        return response()->json([
            'data' => $records->items(),
            'summary' => [
                'total_days' => $total,
                'present_days' => $present,
                'absent_days' => $summary?->absent_days ?? 0,
                'late_days' => $summary?->late_days ?? 0,
                'attendance_rate' => $total > 0 ? round(($present / $total) * 100) : 0,
            ],
        ]);
    }

    /**
     * إضافة ملاحظة على الحضور
     * POST /supervisor/students/{studentId}/attendance-comment
     */
    public function attendanceComment(Request $request, $studentId)
    {
        $request->validate([
            'date' => 'required|date',
            'comment' => 'required|string|max:500',
        ]);

        $attendance = Attendance::where('user_id', $studentId)
            ->where('date', $request->date)
            ->first();

        if ($attendance) {
            $attendance->update([
                'supervisor_comment' => $request->comment,
            ]);
        } else {
            Attendance::create([
                'user_id' => $studentId,
                'date' => $request->date,
                'status' => 'present',
                'supervisor_comment' => $request->comment,
            ]);
        }

        return response()->json(['message' => 'تم إضافة الملاحظة']);
    }

    /**
     * إرسال تنبيه حضور
     * POST /supervisor/students/{studentId}/attendance-alert
     */
    public function attendanceAlert(Request $request, $studentId)
    {
        $request->validate([
            'target' => 'required|in:student,mentor',
        ]);

        // TODO: إرسال إشعار فعلي عبر نظام الإشعارات
        return response()->json(['message' => 'تم إرسال التنبيه']);
    }

    /**
     * السجلات اليومية للطالب
     * GET /supervisor/students/{studentId}/daily-logs
     */
    public function studentDailyLogs(Request $request, $studentId)
    {
        $logs = TrainingLog::where('student_id', $studentId)
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($logs);
    }

    /**
     * ملف إنجاز الطالب
     * GET /supervisor/students/{studentId}/portfolio
     */
    public function studentPortfolio(Request $request, $studentId)
    {
        $portfolio = StudentPortfolio::where('user_id', $studentId)
            ->with('entries')
            ->first();

        if (!$portfolio) {
            return response()->json(['entries' => []]);
        }

        return response()->json([
            'entries' => $portfolio->entries,
            'completion' => $portfolio->required_items > 0
                ? round(($portfolio->completed_items / $portfolio->required_items) * 100)
                : 0,
        ]);
    }

    /**
     * مهام الطالب
     * GET /supervisor/students/{studentId}/tasks
     */
    public function studentTasks(Request $request, $studentId)
    {
        $tasks = Task::where('student_id', $studentId)
            ->orWhereHas('section.enrollments', fn($q) => $q->where('user_id', $studentId))
            ->with('submissions')
            ->orderBy('due_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($tasks);
    }

    /**
     * حلول الطالب
     * GET /supervisor/students/{studentId}/task-submissions
     */
    public function studentTaskSubmissions(Request $request, $studentId)
    {
        $submissions = TaskSubmission::where('student_id', $studentId)
            ->with('task')
            ->orderBy('submitted_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($submissions);
    }

    /**
     * التقييمات الميدانية للطالب
     * GET /supervisor/students/{studentId}/field-evaluations
     */
    public function studentFieldEvaluations(Request $request, $studentId)
    {
        $evaluations = Evaluation::where('student_id', $studentId)
            ->whereIn('type', ['mentor', 'site_manager'])
            ->with('items')
            ->get();

        return response()->json($evaluations);
    }

    /**
     * التقييم الأكاديمي للطالب
     * GET /supervisor/students/{studentId}/academic-evaluation
     */
    public function studentAcademicEvaluation(Request $request, $studentId)
    {
        $evaluation = Evaluation::where('student_id', $studentId)
            ->where('type', 'academic')
            ->with('items')
            ->first();

        return response()->json($evaluation);
    }

    /**
     * رسائل الطالب
     * GET /supervisor/students/{studentId}/messages
     */
    public function studentMessages(Request $request, $studentId)
    {
        $notes = Note::where('student_id', $studentId)
            ->where('author_id', $request->user()->id)
            ->orWhere(function ($q) use ($studentId, $request) {
                $q->where('student_id', $studentId)
                    ->where('target_role', 'academic_supervisor');
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($notes);
    }

    /**
     * إرسال رسالة
     * POST /supervisor/students/{studentId}/messages
     */
    public function sendMessage(Request $request, $studentId)
    {
        $request->validate([
            'target' => 'required|in:student,mentor,site_manager,coordinator',
            'reason' => 'required|in:attendance,daily_log,task,visit,evaluation,general',
            'content' => 'required|string|max:2000',
        ]);

        Note::create([
            'student_id' => $studentId,
            'author_id' => $request->user()->id,
            'target_role' => $request->target,
            'type' => $request->reason,
            'content' => $request->content,
        ]);

        return response()->json(['message' => 'تم إرسال الرسالة']);
    }

    /**
     * سجل نشاط الطالب
     * GET /supervisor/students/{studentId}/timeline
     */
    public function studentTimeline(Request $request, $studentId)
    {
        $activities = \App\Models\ActivityLog::where('subject_type', User::class)
            ->where('subject_id', $studentId)
            ->orWhere(function ($q) use ($studentId) {
                $q->whereJsonContains('properties->student_id', $studentId);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($activities);
    }

    /**
     * تصعيد حالة الطالب
     * POST /supervisor/students/{studentId}/escalate
     */
    public function escalate(Request $request, $studentId)
    {
        $request->validate([
            'reason' => 'nullable|in:attendance,daily_log,portfolio,task,evaluation,general',
        ]);

        // TODO: إنشاء إشعار تصعيد للمنسق

        return response()->json(['message' => 'تم تصعيد الحالة للمنسق']);
    }

    // ─── Helper Methods ───

    private function getSupervisedStudentIds($supervisor): array
    {
        return TrainingAssignment::where('academic_supervisor_id', $supervisor->id)
            ->with('enrollment')
            ->get()
            ->pluck('enrollment.user_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    private function getAttendanceRate(int $studentId): ?float
    {
        $stats = Attendance::where('user_id', $studentId)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            ")
            ->first();

        if (!$stats || $stats->total == 0) return null;
        return round(($stats->present / $stats->total) * 100);
    }

    private function getLogsStatus(int $studentId): string
    {
        $pending = TrainingLog::where('student_id', $studentId)
            ->whereIn('status', ['pending_review', 'new'])
            ->count();

        if ($pending > 3) return 'needs_review';
        if ($pending > 0) return 'good';
        return 'good';
    }

    private function getPortfolioStatus(int $studentId): string
    {
        $portfolio = StudentPortfolio::where('user_id', $studentId)->first();
        if (!$portfolio) return 'incomplete';
        if ($portfolio->completed_items >= $portfolio->required_items) return 'complete';
        return 'incomplete';
    }

    private function getTasksStatus(int $studentId): string
    {
        $pending = TaskSubmission::where('student_id', $studentId)
            ->where('status', 'submitted')
            ->count();

        if ($pending > 0) return 'pending';
        return 'complete';
    }

    private function getEvaluationStatus(int $studentId): string
    {
        $eval = Evaluation::where('student_id', $studentId)
            ->where('type', 'academic')
            ->where('is_final', true)
            ->exists();

        return $eval ? 'graded' : 'pending';
    }

    private function computeHealthStatus($attendance, $logs, $portfolio, $tasks, $evaluation): string
    {
        $warnings = 0;

        if ($attendance !== null && $attendance < 60) return 'critical';
        if ($attendance !== null && $attendance < 80) $warnings++;
        if ($portfolio === 'incomplete') $warnings++;
        if ($evaluation === 'pending') $warnings++;

        if ($warnings >= 3) return 'critical';
        if ($warnings >= 1) return 'warning';
        return 'healthy';
    }
}
