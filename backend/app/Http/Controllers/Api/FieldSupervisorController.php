<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TrainingAssignment;
use App\Models\Attendance;
use App\Models\DailyReport;
use App\Models\DailyReportTemplate;
use App\Models\FieldEvaluation;
use App\Models\FieldEvaluationTemplate;
use App\Models\Message;
use App\Models\Note;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * FieldSupervisorController
 *
 * مركز التحكم للمشرف الميداني (المعلم المرشد / المرشد التربوي / الأخصائي النفسي)
 */
class FieldSupervisorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * الحصول على ملف المشرف الميداني
     */
    private function getSupervisorProfile(Request $request)
    {
        return $request->user()->fieldSupervisorProfile;
    }

    /**
     * الحصول على معرفات الطلاب المرتبطين بالمشرف
     */
    private function getAssignedStudentIds(Request $request): array
    {
        $user = $request->user();
        
        return TrainingAssignment::where('teacher_id', $user->id)
            ->where('status', 'ongoing')
            ->with('enrollment')
            ->get()
            ->pluck('enrollment.user_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * الحصول على تعيينات الطلاب
     */
    private function getStudentAssignments(Request $request, ?int $studentId = null)
    {
        $query = TrainingAssignment::where('teacher_id', $request->user()->id)
            ->where('status', 'ongoing')
            ->with(['enrollment.user', 'enrollment.section.course', 'trainingSite']);

        if ($studentId) {
            $query->whereHas('enrollment', function ($q) use ($studentId) {
                $q->where('user_id', $studentId);
            });
        }

        return $query->get();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DASHBOARD & STATS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * إحصائيات لوحة التحكم
     * GET /field-supervisor/dashboard
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $profile = $this->getSupervisorProfile($request);
        $studentIds = $this->getAssignedStudentIds($request);

        // البطاقات المشتركة
        $stats = [
            'students_count' => count($studentIds),
            'unreviewed_reports_today' => DailyReport::whereIn('student_id', $studentIds)
                ->whereDate('report_date', today())
                ->where('status', DailyReport::STATUS_SUBMITTED)
                ->count(),
            'pending_attendance_today' => $this->getPendingAttendanceCount($studentIds),
            'returned_reports' => DailyReport::whereIn('student_id', $studentIds)
                ->where('status', DailyReport::STATUS_RETURNED)
                ->count(),
            'incomplete_evaluations' => FieldEvaluation::whereIn('student_id', $studentIds)
                ->where('status', FieldEvaluation::STATUS_DRAFT)
                ->count(),
            'new_alerts' => Notification::where('user_id', $user->id)
                ->where('type', 'alert')
                ->whereNull('read_at')
                ->count(),
            'critical_cases' => $this->getCriticalCasesCount($studentIds),
            'messages_from_supervisor' => Message::where('recipient_id', $user->id)
                ->where('sender_type', 'academic_supervisor')
                ->whereNull('read_at')
                ->count(),
        ];

        // البطاقات الخاصة حسب النوع
        $subtypeStats = $this->getSubtypeSpecificStats($profile?->supervisor_type, $studentIds);

        return response()->json([
            'profile' => $profile,
            'stats' => array_merge($stats, $subtypeStats),
            'supervisor_type' => $profile?->supervisor_type,
            'supervisor_type_label' => $profile?->type_label ?? 'مشرف ميداني',
        ]);
    }

    /**
     * إحصائيات خاصة حسب نوع المشرف
     */
    private function getSubtypeSpecificStats(?string $type, array $studentIds): array
    {
        if (!$type) return [];

        return match($type) {
            'mentor_teacher' => [
                'lessons_conducted' => $this->getLessonsCount($studentIds),
                'preparations_needing_attention' => $this->getPreparationsCount($studentIds),
                'classroom_notes' => $this->getClassroomNotesCount($studentIds),
            ],
            'school_counselor' => [
                'counseling_reports_today' => DailyReport::whereIn('student_id', $studentIds)
                    ->whereDate('report_date', today())
                    ->whereHas('template', fn($q) => $q->where('applies_to', 'school_counselor'))
                    ->count(),
                'observed_cases' => $this->getObservedCasesCount($studentIds),
                'counseling_notes' => $this->getCounselingNotesCount($studentIds),
            ],
            'psychologist' => [
                'professional_reports' => FieldEvaluation::whereIn('student_id', $studentIds)
                    ->whereHas('template', fn($q) => $q->where('applies_to', 'psychologist'))
                    ->where('status', FieldEvaluation::STATUS_SUBMITTED)
                    ->count(),
                'sessions_documented' => $this->getSessionsCount($studentIds),
                'notes_pending_review' => DailyReport::whereIn('student_id', $studentIds)
                    ->whereHas('template', fn($q) => $q->where('applies_to', 'psychologist'))
                    ->whereIn('status', [DailyReport::STATUS_SUBMITTED, DailyReport::STATUS_UNDER_REVIEW])
                    ->count(),
            ],
            default => [],
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STUDENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * قائمة الطلاب المرتبطين بالمشرف
     * GET /field-supervisor/students
     */
    public function students(Request $request)
    {
        $assignments = $this->getStudentAssignments($request);
        $profile = $this->getSupervisorProfile($request);

        $students = $assignments->map(function ($assignment) {
            $student = $assignment->enrollment?->user;
            if (!$student) return null;

            // حساب المؤشرات
            $attendanceRate = $this->getAttendanceRate($student->id);
            $reportStatus = $this->getTodayReportStatus($student->id);
            $evalStatus = $this->getEvaluationStatus($student->id);
            $healthStatus = $this->computeHealthStatus($attendanceRate, $reportStatus, $evalStatus);

            return [
                'id' => $student->id,
                'name' => $student->name,
                'university_id' => $student->university_id,
                'specialization' => $assignment->enrollment?->section?->course?->name,
                'department' => $student->department?->name,
                'section_name' => $assignment->enrollment?->section?->name,
                'training_site' => $assignment->trainingSite?->name,
                'training_type' => $this->getTrainingTypeLabel($profile?->supervisor_type),
                'assignment_id' => $assignment->id,
                'attendance_rate' => $attendanceRate,
                'last_attendance' => $this->getLastAttendance($student->id),
                'today_report_status' => $reportStatus,
                'evaluation_status' => $evalStatus,
                'health_status' => $healthStatus,
                'health_status_label' => $this->getHealthStatusLabel($healthStatus),
            ];
        })->filter()->values();

        return response()->json($students);
    }

    /**
     * ملف طالب كامل - نظرة عامة
     * GET /field-supervisor/students/{id}
     */
    public function studentOverview(Request $request, $studentId)
    {
        $student = User::with(['department', 'enrollments.section.course'])
            ->findOrFail($studentId);

        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'الطالب غير مرتبط بك'], 403);
        }

        $profile = $this->getSupervisorProfile($request);

        // إحصائيات الحضور
        $attendanceStats = $this->getAttendanceStats($studentId);

        // آخر تقرير
        $lastReport = DailyReport::where('student_id', $studentId)
            ->latest('report_date')
            ->first();

        // حالة التقييم
        $evaluation = FieldEvaluation::where('student_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->first();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'university_id' => $student->university_id,
                'specialization' => $assignment->enrollment?->section?->course?->name,
                'department' => $student->department?->name,
                'section' => $assignment->enrollment?->section?->name,
                'training_site' => $assignment->trainingSite?->name,
                'training_start' => $assignment->start_date?->format('Y-m-d'),
                'training_status' => $assignment->status,
            ],
            'attendance' => $attendanceStats,
            'last_report' => $lastReport ? [
                'date' => $lastReport->report_date->format('Y-m-d'),
                'status' => $lastReport->status,
                'status_label' => $lastReport->status_label,
            ] : null,
            'evaluation' => $evaluation ? [
                'status' => $evaluation->status,
                'status_label' => $evaluation->status_label,
                'total_score' => $evaluation->total_score,
                'grade' => $evaluation->grade_label,
                'is_final' => $evaluation->is_final,
            ] : null,
            'quick_actions' => [
                ['key' => 'record_attendance', 'label' => 'تسجيل حضور', 'icon' => 'check-circle'],
                ['key' => 'review_today_report', 'label' => 'مراجعة تقرير اليوم', 'icon' => 'file-text'],
                ['key' => 'open_evaluation', 'label' => 'فتح التقييم', 'icon' => 'star'],
                ['key' => 'message_student', 'label' => 'رسالة للطالب', 'icon' => 'message-circle'],
                ['key' => 'message_supervisor', 'label' => 'رسالة للمشرف الأكاديمي', 'icon' => 'message-square'],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTENDANCE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * سجل حضور الطالب
     * GET /field-supervisor/students/{id}/attendance
     */
    public function studentAttendance(Request $request, $studentId)
    {
        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $records = Attendance::where('user_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'date' => $a->date->format('Y-m-d'),
                'status' => $a->status,
                'check_in' => $a->check_in,
                'check_out' => $a->check_out,
                'notes' => $a->notes,
                'is_locked' => $a->created_at && $a->created_at->diffInHours(now()) > 24,
            ]);

        // حالة حضور اليوم
        $todayRecord = Attendance::where('user_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->whereDate('date', today())
            ->first();

        $calendar = $this->generateAttendanceCalendar($studentId, $assignment->id);

        return response()->json([
            'records' => $records,
            'today_status' => $todayRecord?->status ?? 'not_recorded',
            'can_record_today' => !$todayRecord,
            'calendar' => $calendar,
            'summary' => $this->getAttendanceStats($studentId, $assignment->id),
        ]);
    }

    /**
     * تسجيل حضور
     * POST /field-supervisor/attendance
     */
    public function recordAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,excused',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $studentId = $request->student_id;
        $assignment = $this->getStudentAssignments($request, $studentId)->first();

        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        // التحقق من عدم وجود سجل مسبق
        $existing = Attendance::where('user_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->whereDate('date', $request->date)
            ->first();

        if ($existing) {
            return response()->json(['error' => 'تم تسجيل الحضور مسبقاً'], 409);
        }

        $attendance = Attendance::create([
            'user_id' => $studentId,
            'training_assignment_id' => $assignment->id,
            'date' => $request->date,
            'status' => $request->status,
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'notes' => $request->notes,
            'recorded_by' => $request->user()->id,
        ]);

        // إشعار للطالب
        Notification::create([
            'user_id' => $studentId,
            'title' => 'تم تسجيل حضورك',
            'message' => "تم تسجيل حالتك كـ " . $this->getAttendanceStatusLabel($request->status) . " لتاريخ " . $request->date,
            'type' => 'attendance',
        ]);

        return response()->json([
            'message' => 'تم تسجيل الحضور بنجاح',
            'attendance' => $attendance,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DAILY REPORTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * الحصول على قوالب التقارير
     * GET /field-supervisor/report-templates
     */
    public function getReportTemplates(Request $request)
    {
        $profile = $this->getSupervisorProfile($request);
        $type = $profile?->supervisor_type ?? 'mentor_teacher';

        $templates = DailyReportTemplate::active()
            ->forType($type)
            ->orderBy('sort_order')
            ->get();

        return response()->json($templates);
    }

    /**
     * تقارير الطالب اليومية
     * GET /field-supervisor/students/{id}/daily-reports
     */
    public function studentDailyReports(Request $request, $studentId)
    {
        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $reports = DailyReport::with('template')
            ->where('student_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->orderBy('report_date', 'desc')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'date' => $r->report_date->format('Y-m-d'),
                'template_name' => $r->template?->name,
                'status' => $r->status,
                'status_label' => $r->status_label,
                'status_color' => $r->status_color,
                'has_attachments' => $r->attachments()->exists(),
                'can_review' => in_array($r->status, [DailyReport::STATUS_SUBMITTED, DailyReport::STATUS_UNDER_REVIEW]),
            ]);

        return response()->json($reports);
    }

    /**
     * تقرير محدد
     * GET /field-supervisor/daily-reports/{id}
     */
    public function getDailyReport(Request $request, $reportId)
    {
        $report = DailyReport::with(['template', 'student', 'attachments'])
            ->where('field_supervisor_id', $request->user()->id)
            ->findOrFail($reportId);

        return response()->json([
            'id' => $report->id,
            'date' => $report->report_date->format('Y-m-d'),
            'template' => $report->template,
            'content' => $report->content,
            'status' => $report->status,
            'status_label' => $report->status_label,
            'supervisor_comment' => $report->supervisor_comment,
            'reviewed_at' => $report->reviewed_at?->format('Y-m-d H:i'),
            'student' => [
                'id' => $report->student->id,
                'name' => $report->student->name,
            ],
            'attachments' => $report->attachments,
            'can_confirm' => in_array($report->status, [DailyReport::STATUS_SUBMITTED, DailyReport::STATUS_UNDER_REVIEW]),
            'can_return' => in_array($report->status, [DailyReport::STATUS_SUBMITTED, DailyReport::STATUS_UNDER_REVIEW]),
        ]);
    }

    /**
     * تأكيد تقرير
     * POST /field-supervisor/daily-reports/{id}/confirm
     */
    public function confirmDailyReport(Request $request, $reportId)
    {
        $report = DailyReport::where('field_supervisor_id', $request->user()->id)
            ->findOrFail($reportId);

        if (!in_array($report->status, [DailyReport::STATUS_SUBMITTED, DailyReport::STATUS_UNDER_REVIEW])) {
            return response()->json(['error' => 'لا يمكن تأكيد هذا التقرير'], 422);
        }

        $report->confirm($request->user()->id, $request->comment);

        // إشعار الطالب
        Notification::create([
            'user_id' => $report->student_id,
            'title' => 'تم تأكيد تقريرك',
            'message' => "تم تأكيد تقرير يوم {$report->report_date->format('Y-m-d')}",
            'type' => 'report_confirmed',
        ]);

        return response()->json(['message' => 'تم تأكيد التقرير']);
    }

    /**
     * إعادة تقرير للتعديل
     * POST /field-supervisor/daily-reports/{id}/return
     */
    public function returnDailyReport(Request $request, $reportId)
    {
        $validator = Validator::make($request->all(), [
            'comment' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $report = DailyReport::where('field_supervisor_id', $request->user()->id)
            ->findOrFail($reportId);

        if (!in_array($report->status, [DailyReport::STATUS_SUBMITTED, DailyReport::STATUS_UNDER_REVIEW])) {
            return response()->json(['error' => 'لا يمكن إعادة هذا التقرير'], 422);
        }

        $report->returnForEdit($request->user()->id, $request->comment);

        // إشعار الطالب
        Notification::create([
            'user_id' => $report->student_id,
            'title' => 'تم إعادة التقرير للتعديل',
            'message' => "أُعيد تقرير يوم {$report->report_date->format('Y-m-d')} للتعديل: {$request->comment}",
            'type' => 'report_returned',
        ]);

        return response()->json(['message' => 'تم إعادة التقرير للتعديل']);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVALUATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * الحصول على قوالب التقييم
     * GET /field-supervisor/evaluation-templates
     */
    public function getEvaluationTemplates(Request $request)
    {
        $profile = $this->getSupervisorProfile($request);
        $type = $profile?->supervisor_type ?? 'mentor_teacher';

        $templates = FieldEvaluationTemplate::active()
            ->forType($type)
            ->get();

        return response()->json($templates);
    }

    /**
     * تقييم طالب محدد
     * GET /field-supervisor/students/{id}/evaluation
     */
    public function getStudentEvaluation(Request $request, $studentId)
    {
        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $profile = $this->getSupervisorProfile($request);
        $template = FieldEvaluationTemplate::getDefaultForType($profile?->supervisor_type ?? 'mentor_teacher');

        $evaluation = FieldEvaluation::with('template')
            ->where('student_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->first();

        return response()->json([
            'template' => $template,
            'evaluation' => $evaluation ? [
                'id' => $evaluation->id,
                'status' => $evaluation->status,
                'status_label' => $evaluation->status_label,
                'scores' => $evaluation->scores,
                'total_score' => $evaluation->total_score,
                'grade' => $evaluation->grade,
                'grade_label' => $evaluation->grade_label,
                'general_notes' => $evaluation->general_notes,
                'strengths' => $evaluation->strengths,
                'areas_for_improvement' => $evaluation->areas_for_improvement,
                'is_final' => $evaluation->is_final,
                'is_editable' => $evaluation->isEditable(),
                'submitted_at' => $evaluation->submitted_at?->format('Y-m-d H:i'),
            ] : null,
            'student_id' => $studentId,
            'assignment_id' => $assignment->id,
        ]);
    }

    /**
     * حفظ مسودة تقييم
     * POST /field-supervisor/students/{id}/evaluation-draft
     */
    public function saveEvaluationDraft(Request $request, $studentId)
    {
        $validator = Validator::make($request->all(), [
            'scores' => 'required|array',
            'general_notes' => 'nullable|string',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'template_id' => 'required|exists:field_evaluation_templates,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $evaluation = FieldEvaluation::updateOrCreate(
            [
                'student_id' => $studentId,
                'training_assignment_id' => $assignment->id,
            ],
            [
                'field_supervisor_id' => $request->user()->id,
                'template_id' => $request->template_id,
                'scores' => $request->scores,
                'general_notes' => $request->general_notes,
                'strengths' => $request->strengths,
                'areas_for_improvement' => $request->areas_for_improvement,
                'status' => FieldEvaluation::STATUS_DRAFT,
            ]
        );

        return response()->json([
            'message' => 'تم حفظ المسودة',
            'evaluation' => $evaluation,
        ]);
    }

    /**
     * إرسال تقييم نهائي
     * POST /field-supervisor/students/{id}/evaluation-submit
     */
    public function submitEvaluation(Request $request, $studentId)
    {
        $validator = Validator::make($request->all(), [
            'scores' => 'required|array',
            'general_notes' => 'nullable|string',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'template_id' => 'required|exists:field_evaluation_templates,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $evaluation = FieldEvaluation::updateOrCreate(
            [
                'student_id' => $studentId,
                'training_assignment_id' => $assignment->id,
            ],
            [
                'field_supervisor_id' => $request->user()->id,
                'template_id' => $request->template_id,
                'scores' => $request->scores,
                'general_notes' => $request->general_notes,
                'strengths' => $request->strengths,
                'areas_for_improvement' => $request->areas_for_improvement,
            ]
        );

        $evaluation->submit();

        // إشعار للطالب
        Notification::create([
            'user_id' => $studentId,
            'title' => 'تم رفع تقييمك الميداني',
            'message' => "تم إرسال تقييمك الميداني بنجاح. درجتك: {$evaluation->grade_label}",
            'type' => 'evaluation_submitted',
        ]);

        return response()->json([
            'message' => 'تم إرسال التقييم بنجاح',
            'evaluation' => $evaluation->fresh(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMMUNICATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * رسائل الطالب
     * GET /field-supervisor/students/{id}/messages
     */
    public function studentMessages(Request $request, $studentId)
    {
        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $messages = Message::where(function ($q) use ($request, $studentId) {
                $q->where('sender_id', $request->user()->id)
                  ->where('recipient_id', $studentId)
                  ->orWhere('sender_id', $studentId)
                  ->where('recipient_id', $request->user()->id);
            })
            ->where('related_type', 'training_assignment')
            ->where('related_id', $assignment->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'content' => $m->content,
                'is_from_me' => $m->sender_id === $request->user()->id,
                'sender_name' => $m->sender->name,
                'related_to' => $m->related_context,
                'created_at' => $m->created_at->format('Y-m-d H:i'),
                'is_read' => $m->is_read,
            ]);

        return response()->json($messages);
    }

    /**
     * إرسال رسالة
     * POST /field-supervisor/students/{id}/messages
     */
    public function sendMessage(Request $request, $studentId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:2',
            'related_to' => 'nullable|string|in:attendance,daily_report,evaluation,issue,general',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $studentId,
            'content' => $request->content,
            'related_type' => 'training_assignment',
            'related_id' => $assignment->id,
            'related_context' => $request->related_to ?? 'general',
        ]);

        // إشعار للطالب
        Notification::create([
            'user_id' => $studentId,
            'title' => 'رسالة جديدة من المشرف الميداني',
            'message' => substr($request->content, 0, 100) . (strlen($request->content) > 100 ? '...' : ''),
            'type' => 'message',
        ]);

        return response()->json([
            'message' => 'تم إرسال الرسالة',
            'data' => $message,
        ]);
    }

    /**
     * إرسال رسالة للمشرف الأكاديمي
     * POST /field-supervisor/message-academic-supervisor
     */
    public function messageAcademicSupervisor(Request $request, $studentId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:5',
            'related_to' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment || !$assignment->academic_supervisor_id) {
            return response()->json(['error' => 'لا يوجد مشرف أكاديمي مرتبط'], 404);
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $assignment->academic_supervisor_id,
            'content' => $request->content,
            'related_type' => 'student_concern',
            'related_id' => $studentId,
            'related_context' => $request->related_to ?? 'general',
        ]);

        // إشعار للمشرف الأكاديمي
        Notification::create([
            'user_id' => $assignment->academic_supervisor_id,
            'title' => 'رسالة من المشرف الميداني',
            'message' => "رسالة بخصوص الطالب: {$assignment->enrollment?->user?->name}",
            'type' => 'supervisor_message',
        ]);

        return response()->json([
            'message' => 'تم إرسال الرسالة للمشرف الأكاديمي',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIMELINE / ACTIVITY LOG
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * سجل النشاط
     * GET /field-supervisor/students/{id}/timeline
     */
    public function studentTimeline(Request $request, $studentId)
    {
        $assignment = $this->getStudentAssignments($request, $studentId)->first();
        
        if (!$assignment) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $events = [];

        // حضور
        $attendances = Attendance::where('user_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->orderBy('date', 'desc')
            ->limit(20)
            ->get();

        foreach ($attendances as $a) {
            $events[] = [
                'type' => 'attendance',
                'title' => 'تسجيل حضور',
                'description' => "الحالة: {$this->getAttendanceStatusLabel($a->status)}",
                'date' => $a->date->format('Y-m-d'),
                'time' => $a->created_at->format('H:i'),
                'icon' => 'check-circle',
                'color' => $a->status === 'present' ? 'green' : ($a->status === 'absent' ? 'red' : 'yellow'),
            ];
        }

        // تقارير
        $reports = DailyReport::where('student_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->orderBy('report_date', 'desc')
            ->limit(20)
            ->get();

        foreach ($reports as $r) {
            $events[] = [
                'type' => 'report',
                'title' => $r->status === DailyReport::STATUS_SUBMITTED ? 'رفع تقرير' : 
                    ($r->status === DailyReport::STATUS_CONFIRMED ? 'تأكيد تقرير' : 'إعادة تقرير'),
                'description' => "تقرير يوم {$r->report_date->format('Y-m-d')}",
                'date' => $r->report_date->format('Y-m-d'),
                'time' => $r->created_at->format('H:i'),
                'icon' => 'file-text',
                'color' => $r->status === DailyReport::STATUS_CONFIRMED ? 'green' : 
                    ($r->status === DailyReport::STATUS_RETURNED ? 'red' : 'blue'),
            ];
        }

        // تقييمات
        $evaluations = FieldEvaluation::where('student_id', $studentId)
            ->where('training_assignment_id', $assignment->id)
            ->whereNotNull('submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->get();

        foreach ($evaluations as $e) {
            $events[] = [
                'type' => 'evaluation',
                'title' => 'إرسال تقييم ميداني',
                'description' => $e->grade_label ? "الدرجة: {$e->grade_label}" : '',
                'date' => $e->submitted_at->format('Y-m-d'),
                'time' => $e->submitted_at->format('H:i'),
                'icon' => 'star',
                'color' => 'purple',
            ];
        }

        // رسائل
        $messages = Message::where(function ($q) use ($request, $studentId) {
                $q->where('sender_id', $request->user()->id)
                  ->where('recipient_id', $studentId)
                  ->orWhere('sender_id', $studentId)
                  ->where('recipient_id', $request->user()->id);
            })
            ->where('related_type', 'training_assignment')
            ->where('related_id', $assignment->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        foreach ($messages as $m) {
            $events[] = [
                'type' => 'message',
                'title' => $m->sender_id === $request->user()->id ? 'أرسلت رسالة' : 'استلمت رسالة',
                'description' => substr($m->content, 0, 50) . (strlen($m->content) > 50 ? '...' : ''),
                'date' => $m->created_at->format('Y-m-d'),
                'time' => $m->created_at->format('H:i'),
                'icon' => 'message-circle',
                'color' => 'blue',
            ];
        }

        // ترتيب حسب التاريخ
        usort($events, fn($a, $b) => strtotime($b['date'] . ' ' . $b['time']) - strtotime($a['date'] . ' ' . $a['time']));

        return response()->json(array_slice($events, 0, 30));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    private function getAttendanceRate(int $studentId): ?int
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

    private function getAttendanceStats(int $studentId, ?int $assignmentId = null): array
    {
        $query = Attendance::where('user_id', $studentId);
        if ($assignmentId) {
            $query->where('training_assignment_id', $assignmentId);
        }

        $stats = $query->selectRaw("
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
        ")->first();

        $total = $stats?->total_days ?? 0;
        $present = $stats?->present_days ?? 0;

        return [
            'total_days' => $total,
            'present_days' => $present,
            'absent_days' => $stats?->absent_days ?? 0,
            'late_days' => $stats?->late_days ?? 0,
            'attendance_rate' => $total > 0 ? round(($present / $total) * 100) : 0,
        ];
    }

    private function getLastAttendance(int $studentId): ?string
    {
        $attendance = Attendance::where('user_id', $studentId)
            ->latest('date')
            ->first();

        return $attendance?->date?->format('Y-m-d');
    }

    private function generateAttendanceCalendar(int $studentId, int $assignmentId): array
    {
        $attendances = Attendance::where('user_id', $studentId)
            ->where('training_assignment_id', $assignmentId)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->get()
            ->keyBy(fn($a) => $a->date->format('Y-m-d'));

        $calendar = [];
        $startOfMonth = now()->startOfMonth();
        $daysInMonth = now()->daysInMonth;

        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = $startOfMonth->copy()->addDays($i - 1)->format('Y-m-d');
            $attendance = $attendances[$date] ?? null;

            $calendar[] = [
                'day' => $i,
                'date' => $date,
                'status' => $attendance?->status ?? null,
                'is_today' => $date === today()->format('Y-m-d'),
                'is_weekend' => in_array($startOfMonth->copy()->addDays($i - 1)->dayOfWeek, [5, 6]),
            ];
        }

        return $calendar;
    }

    private function getTodayReportStatus(int $studentId): string
    {
        $report = DailyReport::where('student_id', $studentId)
            ->whereDate('report_date', today())
            ->first();

        return $report?->status ?? 'not_submitted';
    }

    private function getEvaluationStatus(int $studentId): string
    {
        $eval = FieldEvaluation::where('student_id', $studentId)
            ->latest()
            ->first();

        if (!$eval) return 'not_started';
        if ($eval->is_final) return 'completed';
        return $eval->status;
    }

    private function computeHealthStatus(?int $attendanceRate, string $reportStatus, string $evalStatus): string
    {
        $score = 0;

        if ($attendanceRate !== null) {
            if ($attendanceRate >= 90) $score += 3;
            elseif ($attendanceRate >= 75) $score += 2;
            elseif ($attendanceRate >= 60) $score += 1;
        }

        if (in_array($reportStatus, ['confirmed', 'submitted'])) $score += 2;
        elseif ($reportStatus === 'returned') $score -= 1;

        if ($evalStatus === 'completed') $score += 2;
        elseif ($evalStatus === 'draft') $score += 1;

        return match(true) {
            $score >= 6 => 'healthy',
            $score >= 4 => 'warning',
            default => 'critical',
        };
    }

    private function getHealthStatusLabel(string $status): string
    {
        return match($status) {
            'healthy' => 'ممتاز',
            'warning' => 'تحت المتابعة',
            'critical' => 'يتطلب تدخل',
            default => 'غير معروف',
        };
    }

    private function getTrainingTypeLabel(?string $supervisorType): string
    {
        return match($supervisorType) {
            'mentor_teacher' => 'تدريب تدريسي',
            'school_counselor' => 'تدريب إرشادي مدرسي',
            'psychologist' => 'تدريب نفسي/مهني',
            default => 'تدريب ميداني',
        };
    }

    private function getAttendanceStatusLabel(string $status): string
    {
        return match($status) {
            'present' => 'حاضر',
            'absent' => 'غائب',
            'late' => 'متأخر',
            'excused' => 'مُعذر',
            default => $status,
        };
    }

    private function getPendingAttendanceCount(array $studentIds): int
    {
        // الطلاب الذين لم يسجل لهم حضور اليوم
        $recordedToday = Attendance::whereIn('user_id', $studentIds)
            ->whereDate('date', today())
            ->pluck('user_id')
            ->toArray();

        return count($studentIds) - count($recordedToday);
    }

    private function getCriticalCasesCount(array $studentIds): int
    {
        $count = 0;

        foreach ($studentIds as $studentId) {
            $attendanceRate = $this->getAttendanceRate($studentId);
            $reportStatus = $this->getTodayReportStatus($studentId);
            $evalStatus = $this->getEvaluationStatus($studentId);

            $health = $this->computeHealthStatus($attendanceRate, $reportStatus, $evalStatus);
            if ($health === 'critical') $count++;
        }

        return $count;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Subtype-specific helper methods
    // ═══════════════════════════════════════════════════════════════════════════

    private function getLessonsCount(array $studentIds): int
    {
        // يمكن ربطها بجدول محدد لاحقاً
        return DailyReport::whereIn('student_id', $studentIds)
            ->whereHas('template', fn($q) => $q->where('applies_to', 'mentor_teacher'))
            ->where('status', DailyReport::STATUS_CONFIRMED)
            ->count();
    }

    private function getPreparationsCount(array $studentIds): int
    {
        return 0; // يُحسب لاحقاً حسب البيانات
    }

    private function getClassroomNotesCount(array $studentIds): int
    {
        return Note::whereIn('student_id', $studentIds)
            ->where('type', 'classroom')
            ->count();
    }

    private function getObservedCasesCount(array $studentIds): int
    {
        return DailyReport::whereIn('student_id', $studentIds)
            ->whereHas('template', fn($q) => $q->where('applies_to', 'school_counselor'))
            ->where('status', DailyReport::STATUS_CONFIRMED)
            ->count();
    }

    private function getCounselingNotesCount(array $studentIds): int
    {
        return Note::whereIn('student_id', $studentIds)
            ->where('type', 'counseling')
            ->count();
    }

    private function getSessionsCount(array $studentIds): int
    {
        return DailyReport::whereIn('student_id', $studentIds)
            ->whereHas('template', fn($q) => $q->where('applies_to', 'psychologist'))
            ->where('status', DailyReport::STATUS_CONFIRMED)
            ->count();
    }
}
