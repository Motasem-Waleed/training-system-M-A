<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\PortfolioEntry;
use App\Models\StudentAttendance;
use App\Models\StudentPortfolio;
use App\Models\TrainingAssignment;
use App\Models\TrainingRequestStudent;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class StudentAttendanceController extends Controller
{
    /**
     * عرض جميع سجلات الحضور للطالب الحالي
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // التأكد أن المستخدم طالب
        if ($user->role?->name !== 'student') {
            return response()->json([
                'message' => 'هذه الخدمة متاحة للطلاب فقط.'
            ], 403);
        }
        
        $query = StudentAttendance::with(['trainingRequestStudent.trainingRequest.trainingSite'])
            ->forUser($user->id);
        
        // فلترة حسب الشهر/السنة
        if ($request->filled('month') && $request->filled('year')) {
            $query->whereYear('date', $request->year)
                  ->whereMonth('date', $request->month);
        }
        
        // فلترة حسب الفترة
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->forPeriod($request->start_date, $request->end_date);
        }
        
        $attendances = $query->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 50);
        
        // معلومات إضافية
        $trainingSite = null;
        $activeTraining = TrainingRequestStudent::with('trainingRequest.trainingSite')
            ->whereHas('trainingRequest', function($q) {
                $q->whereIn('book_status', ['school_approved', 'directorate_approved']);
            })
            ->where('user_id', $user->id)
            ->first();
        
        if ($activeTraining && $activeTraining->trainingRequest?->trainingSite) {
            $trainingSite = [
                'id' => $activeTraining->trainingRequest->trainingSite->id,
                'name' => $activeTraining->trainingRequest->trainingSite->name,
                'location' => $activeTraining->trainingRequest->trainingSite->location,
            ];
        }
        
        // جلب معرف مدخل الملف الإنجازي لسجل الحضور
        $portfolio = StudentPortfolio::where('user_id', $user->id)->first();
        $portfolioEntryId = null;
        if ($portfolio) {
            $portfolioEntryId = PortfolioEntry::where('student_portfolio_id', $portfolio->id)
                ->where('title', 'سجل الحضور والغياب')
                ->value('id');
        }

        return response()->json([
            'data' => $attendances->items(),
            'meta' => [
                'current_page' => $attendances->currentPage(),
                'last_page' => $attendances->lastPage(),
                'per_page' => $attendances->perPage(),
                'total' => $attendances->total(),
            ],
            'training_site' => $trainingSite,
            'portfolio_entry_id' => $portfolioEntryId,
        ]);
    }

    /**
     * إضافة سجل حضور جديد
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        if ($user->role?->name !== 'student') {
            return response()->json([
                'message' => 'هذه الخدمة متاحة للطلاب فقط.'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'day' => 'required|string|in:السبت,الأحد,الإثنين,الثلاثاء,الأربعاء,الخميس',
            'date' => 'required|date|before_or_equal:today',
            'check_in' => 'required|date_format:H:i',
            'check_out' => 'required|date_format:H:i|after:check_in',
            'lessons_count' => 'nullable|integer|min:0|max:15',
            'notes' => 'nullable|string|max:1000',
        ], [
            'day.required' => 'اليوم مطلوب.',
            'day.in' => 'اليوم يجب أن يكون من الأيام الدراسية.',
            'date.required' => 'التاريخ مطلوب.',
            'date.before_or_equal' => 'لا يمكن تسجيل حضور لتاريخ مستقبلي.',
            'check_in.required' => 'ساعة الحضور مطلوبة.',
            'check_in.date_format' => 'صيغة ساعة الحضور غير صحيحة.',
            'check_out.required' => 'ساعة المغادرة مطلوبة.',
            'check_out.after' => 'ساعة المغادرة يجب أن تكون بعد ساعة الحضور.',
            'check_out.date_format' => 'صيغة ساعة المغادرة غير صحيحة.',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'خطأ في البيانات المدخلة.',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // التأكد من عدم وجود سجل مكرر لنفس اليوم
        $exists = StudentAttendance::forUser($user->id)
            ->forDate($request->date)
            ->exists();
        
        if ($exists) {
            return response()->json([
                'message' => 'يوجد سجل حضور مسجل مسبقاً لهذا اليوم. يمكنك تعديله.'
            ], 422);
        }
        
        // الحصول على training_request_student_id النشط
        $activeTraining = TrainingRequestStudent::whereHas('trainingRequest', function($q) {
                $q->whereIn('book_status', ['school_approved', 'directorate_approved']);
            })
            ->where('user_id', $user->id)
            ->first();
        
        $attendance = StudentAttendance::create([
            'user_id' => $user->id,
            'training_request_student_id' => $activeTraining?->id,
            'day' => $request->day,
            'date' => $request->date,
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'lessons_count' => $request->lessons_count,
            'notes' => $request->notes,
            'status' => 'present',
        ]);
        
        // مزامنة مع الملف الإنجازي
        $portfolioEntry = $this->syncToPortfolio($user);

        return response()->json([
            'message' => 'تم تسجيل الحضور بنجاح.',
            'data' => $attendance->load('trainingRequestStudent.trainingRequest.trainingSite'),
            'portfolio_entry_id' => $portfolioEntry?->id,
        ], 201);
    }

    /**
     * عرض سجل حضور محدد
     */
    public function show(Request $request, StudentAttendance $attendance)
    {
        $user = $request->user();
        
        // التأكد أن السجل يخص الطالب
        if ($attendance->user_id !== $user->id && $user->role?->name !== 'admin') {
            return response()->json([
                'message' => 'غير مصرح لك بعرض هذا السجل.'
            ], 403);
        }
        
        return response()->json([
            'data' => $attendance->load(['user', 'trainingRequestStudent.trainingRequest.trainingSite', 'approvedBy'])
        ]);
    }

    /**
     * تعديل سجل حضور
     */
    public function update(Request $request, StudentAttendance $attendance)
    {
        $user = $request->user();
        
        // التأكد أن السجل يخص الطالب ولم يتم اعتماده بعد
        if ($attendance->user_id !== $user->id) {
            return response()->json([
                'message' => 'غير مصرح لك بتعديل هذا السجل.'
            ], 403);
        }
        
        if ($attendance->approved_at) {
            return response()->json([
                'message' => 'لا يمكن تعديل سجل تم اعتماده.'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'day' => 'sometimes|string|in:السبت,الأحد,الإثنين,الثلاثاء,الأربعاء,الخميس',
            'date' => 'sometimes|date|before_or_equal:today',
            'check_in' => 'sometimes|date_format:H:i',
            'check_out' => 'sometimes|date_format:H:i|after:check_in',
            'lessons_count' => 'nullable|integer|min:0|max:15',
            'notes' => 'nullable|string|max:1000',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'خطأ في البيانات المدخلة.',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // التأكد من عدم التعارض مع سجل آخر عند تغيير التاريخ
        if ($request->filled('date') && $request->date !== $attendance->date->format('Y-m-d')) {
            $exists = StudentAttendance::forUser($user->id)
                ->forDate($request->date)
                ->where('id', '!=', $attendance->id)
                ->exists();
            
            if ($exists) {
                return response()->json([
                    'message' => 'يوجد سجل حضور آخر مسجل لهذا اليوم.'
                ], 422);
            }
        }
        
        $attendance->update($request->only([
            'day', 'date', 'check_in', 'check_out', 'lessons_count', 'notes'
        ]));
        
        return response()->json([
            'message' => 'تم تحديث سجل الحضور بنجاح.',
            'data' => $attendance->fresh()
        ]);
    }

    /**
     * حذف سجل حضور
     */
    public function destroy(Request $request, StudentAttendance $attendance)
    {
        $user = $request->user();
        
        // التأكد أن السجل يخص الطالب ولم يتم اعتماده
        if ($attendance->user_id !== $user->id && $user->role?->name !== 'admin') {
            return response()->json([
                'message' => 'غير مصرح لك بحذف هذا السجل.'
            ], 403);
        }
        
        if ($attendance->approved_at && $user->role?->name !== 'admin') {
            return response()->json([
                'message' => 'لا يمكن حذف سجل تم اعتماده.'
            ], 403);
        }
        
        $attendance->delete();

        // تحديث الملف الإنجازي
        $this->syncToPortfolio($user);

        return response()->json([
            'message' => 'تم حذف سجل الحضور بنجاح.'
        ]);
    }

    /**
     * إحصائيات الحضور للطالب
     */
    public function statistics(Request $request)
    {
        $user = $request->user();
        
        if ($user->role?->name !== 'student') {
            return response()->json([
                'message' => 'هذه الخدمة متاحة للطلاب فقط.'
            ], 403);
        }
        
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        $stats = StudentAttendance::forUser($user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->selectRaw('
                COUNT(*) as total_days,
                SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = "excused" THEN 1 ELSE 0 END) as excused_days,
                SUM(lessons_count) as total_lessons,
                AVG(TIMESTAMPDIFF(HOUR, check_in, check_out)) as avg_hours
            ')
            ->first();
        
        return response()->json([
            'month' => $month,
            'year' => $year,
            'statistics' => $stats
        ]);
    }

    /**
     * حفظ/تحديث سجل الحضور والغياب في الملف الإنجازي
     */
    protected function syncToPortfolio($user)
    {
        $portfolio = StudentPortfolio::where('user_id', $user->id)->first();

        if (! $portfolio) {
            try {
                $assignmentId = $user->currentTrainingAssignment()?->id;
                $portfolio = StudentPortfolio::create([
                    'user_id' => $user->id,
                    'training_assignment_id' => $assignmentId,
                ]);
            } catch (QueryException $e) {
                return null;
            }
        }

        $title = 'سجل الحضور والغياب';
        $content = 'سجل الحضور والغياب اليومي — يتم تحديثه تلقائياً';

        return PortfolioEntry::updateOrCreate(
            [
                'student_portfolio_id' => $portfolio->id,
                'title' => $title,
            ],
            [
                'content' => $content,
            ]
        );
    }

    /**
     * اعتماد سجل الحضور (للمشرف/المعلم المرشد)
     */
    public function approve(Request $request, StudentAttendance $attendance)
    {
        $user = $request->user();
        
        // يمكن للمشرف أو المعلم المرشد الاعتماد
        if (!in_array($user->role?->name, ['supervisor', 'teacher', 'mentor', 'school_manager', 'principal'])) {
            return response()->json([
                'message' => 'غير مصرح لك باعتماد سجلات الحضور.'
            ], 403);
        }
        
        $attendance->update([
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        $syncedAttendance = $this->syncApprovedAttendanceToAcademicAttendance($attendance->fresh(), $user->id);
        
        return response()->json([
            'message' => 'تم اعتماد سجل الحضور بنجاح.',
            'data' => $attendance->fresh(),
            'academic_attendance_id' => $syncedAttendance?->id,
        ]);
    }

    private function syncApprovedAttendanceToAcademicAttendance(StudentAttendance $studentAttendance, int $approvedBy): ?Attendance
    {
        $assignment = null;

        if ($studentAttendance->training_request_student_id) {
            $assignment = TrainingAssignment::query()
                ->where('training_request_student_id', $studentAttendance->training_request_student_id)
                ->whereHas('enrollment.section', fn ($q) => $q->whereNull('archived_at'))
                ->latest('id')
                ->first();
        }

        if (! $assignment) {
            $assignment = TrainingAssignment::query()
                ->whereHas('enrollment', fn ($query) => $query->where('user_id', $studentAttendance->user_id))
                ->whereHas('enrollment.section', fn ($q) => $q->whereNull('archived_at'))
                ->latest('id')
                ->first();
        }

        if (! $assignment) {
            return null;
        }

        return Attendance::updateOrCreate(
            [
                'training_assignment_id' => $assignment->id,
                'user_id' => $studentAttendance->user_id,
                'date' => $studentAttendance->date,
            ],
            [
                'check_in' => $studentAttendance->check_in,
                'check_out' => $studentAttendance->check_out,
                'notes' => $studentAttendance->notes,
                'status' => in_array($studentAttendance->status, ['present', 'absent', 'late'], true)
                    ? $studentAttendance->status
                    : 'present',
                'approved_by' => $approvedBy,
                'approved_at' => $studentAttendance->approved_at ?? now(),
                'visible_to_academic' => true,
            ]
        );
    }
}
