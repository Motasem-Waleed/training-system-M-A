<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTrainingRequest;
use App\Http\Requests\UpdateTrainingRequest;
use App\Http\Requests\SendTrainingRequestToDirectorateRequest;
use App\Http\Requests\DirectorateApproveTrainingRequest;
use App\Http\Requests\SendTrainingRequestToSchoolRequest;
use App\Http\Requests\SchoolApproveTrainingRequest;
use App\Http\Requests\RejectTrainingRequestRequest;
use App\Http\Requests\CoordinatorReviewTrainingRequest;
use App\Http\Requests\IndexTrainingRequestRequest;
use App\Http\Resources\TrainingRequestResource;
use App\Models\TrainingRequest;
use App\Models\TrainingRequestStudent;
use App\Models\TrainingSite;
use App\Models\TrainingPeriod;
use App\Models\Course;
use App\Models\OfficialLetter;
use App\Models\User;
use App\Services\TrainingRequestService;
use App\Support\TrainingRequestNotifications;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrainingRequestController extends Controller
{
    private function hasManagerAccountForSite(TrainingSite $site): bool
    {
        $managerRoles = $site->site_type === 'health_center'
            ? ['psychology_center_manager']
            : ['school_manager', 'principal'];

        return User::query()
            ->where('training_site_id', $site->id)
            ->whereHas('role', fn ($q) => $q->whereIn('name', $managerRoles))
            ->exists();
    }

    private function resolveAutoTrainingPeriodId(): ?int
    {
        $period = TrainingPeriod::query()
            ->where('is_active', true)
            ->latest('id')
            ->first();

        if (! $period) {
            $period = TrainingPeriod::query()->latest('id')->first();
        }

        return $period?->id;
    }

    private function resolveAutoCourseIdForStudent($user): ?int
    {
        $enrollment = $user?->currentEnrollment();
        $courseId = data_get($enrollment, 'section.course.id');
        if ($courseId) {
            return (int) $courseId;
        }

        $fallbackCourseId = Course::query()->orderBy('id')->value('id');
        return $fallbackCourseId ? (int) $fallbackCourseId : null;
    }

    private function normalizeStudentDates(array $data): array
    {
        $activePeriod = TrainingPeriod::query()
            ->where('is_active', true)
            ->latest('id')
            ->first()
            ?? TrainingPeriod::query()->latest('id')->first();

        $start = $data['start_date'] ?? $activePeriod?->start_date?->toDateString() ?? now()->toDateString();
        $end = $data['end_date'] ?? $activePeriod?->end_date?->toDateString() ?? now()->addDay()->toDateString();

        if ($end <= $start) {
            $end = \Carbon\Carbon::parse($start)->addDay()->toDateString();
        }

        $data['start_date'] = $start;
        $data['end_date'] = $end;

        return $data;
    }

    private function normalizeDirectorate(?string $value): string
    {
        $v = trim((string) $value);
        $v = str_replace(['مديرية', 'مديرية ', '  '], ['', '', ' '], $v);
        return trim($v);
    }

    protected $trainingRequestService;

    public function __construct(TrainingRequestService $trainingRequestService)
    {
        $this->trainingRequestService = $trainingRequestService;
        $this->authorizeResource(TrainingRequest::class, 'training_request');
    }

    public function index(IndexTrainingRequestRequest $request)
    {
        $query = TrainingRequest::with([
            'trainingSite',
            'requestedBy.department',
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
            'trainingPeriod',
        ]);

        if ($request->filled('book_status')) {
            $query->where('book_status', $request->book_status);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('training_site_id')) {
            $query->where('training_site_id', $request->training_site_id);
        }
        if ($request->filled('training_period_id')) {
            $query->where('training_period_id', $request->training_period_id);
        }
        if ($request->filled('governing_body')) {
            $query->where('governing_body', $request->governing_body);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('requested_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('requested_at', '<=', $request->to_date);
        }
        if ($request->filled('search')) {
            $term = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('letter_number', 'like', $term)
                    ->orWhereHas('trainingRequestStudents.user', function ($uq) use ($term) {
                        $uq->where('name', 'like', $term)
                            ->orWhere('university_id', 'like', $term);
                    });
            });
        }

        if (in_array($request->user()->role?->name, ['school_manager', 'psychology_center_manager'], true) && $request->user()->training_site_id) {
            $query->where('training_site_id', $request->user()->training_site_id);
        }
        if (in_array($request->user()->role?->name, ['coordinator', 'training_coordinator'], true)) {
            $coordinatorDeptId = $request->user()->department_id;
            if ($coordinatorDeptId) {
                $query->where(function ($q) use ($coordinatorDeptId) {
                    $q->whereHas('requestedBy', function ($uq) use ($coordinatorDeptId) {
                        $uq->where('department_id', $coordinatorDeptId);
                    })
                    ->orWhereHas('trainingRequestStudents.user', function ($uq) use ($coordinatorDeptId) {
                        $uq->where('department_id', $coordinatorDeptId);
                    });
                });
            }
            // إذا لم يكن للمنسق قسم، يرى جميع الطلبات بدون فلتر
        }
        if ($request->user()->role?->name === 'education_directorate' && !empty($request->user()->directorate)) {
            $userDirectorate = $request->user()->directorate;
            $query->where(function ($q) use ($userDirectorate) {
                $q->where('directorate', $userDirectorate)
                    ->orWhereHas('trainingSite', function ($sq) use ($userDirectorate) {
                        $sq->where('directorate', $userDirectorate);
                    });
            });
        }

        $trainingRequests = $query->latest()->paginate($request->per_page ?? 15);

        return TrainingRequestResource::collection($trainingRequests);
    }

    public function store(StoreTrainingRequest $request)
    {
        $trainingRequest = $this->trainingRequestService->createTrainingRequest(
            $request->validated(),
            $request->user()->id
        );
        return new TrainingRequestResource($trainingRequest);
    }

    public function show(TrainingRequest $trainingRequest)
    {
        return new TrainingRequestResource($trainingRequest->load([
            'trainingSite',
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
        ]));
    }

    public function update(UpdateTrainingRequest $request, TrainingRequest $trainingRequest)
    {
        $trainingRequest->update($request->validated());
        return new TrainingRequestResource($trainingRequest);
    }

    public function destroy(TrainingRequest $trainingRequest)
    {
        $trainingRequest->delete();
        return response()->json(['message' => 'تم حذف الكتاب بنجاح']);
    }

    public function sendToDirectorate(SendTrainingRequestToDirectorateRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('sendToDirectorate', $trainingRequest);
        $this->trainingRequestService->sendToDirectorate(
            $trainingRequest,
            $request->user()->id,
            $request->validated()
        );
        return response()->json(['message' => 'تم إرسال الكتاب إلى المديرية بنجاح']);
    }

    public function directorateApprove(DirectorateApproveTrainingRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('approveByDirectorate', $trainingRequest);
        if ($request->status === 'rejected') {
            $this->trainingRequestService->reject($trainingRequest, $request->rejection_reason, $request->user()->id);
            return response()->json(['message' => 'تم رفض الكتاب']);
        }
        $this->trainingRequestService->directorateApprove($trainingRequest, $request->user()->id);
        return response()->json(['message' => 'تمت موافقة المديرية على الكتاب']);
    }

    public function sendToSchool(SendTrainingRequestToSchoolRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('sendToSchool', $trainingRequest);
        $this->trainingRequestService->sendToSchool(
            $trainingRequest,
            $request->user()->id,
            $request->validated()
        );
        return response()->json(['message' => 'تم إرسال الكتاب إلى المدرسة بنجاح']);
    }

    public function schoolApprove(SchoolApproveTrainingRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('approveBySchool', $trainingRequest);
        if ($request->status === 'rejected') {
            $this->trainingRequestService->reject($trainingRequest, $request->rejection_reason, $request->user()->id);
            return response()->json(['message' => 'تم رفض الكتاب من قبل المدرسة']);
        }
        $this->trainingRequestService->schoolApprove($trainingRequest, $request->user()->id, $request->students);
        return response()->json(['message' => 'تمت موافقة المدرسة وتعيين المعلمين بنجاح']);
    }

    public function reject(RejectTrainingRequestRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('update', $trainingRequest);
        $this->trainingRequestService->reject($trainingRequest, $request->rejection_reason, $request->user()->id);
        return response()->json(['message' => 'تم رفض الكتاب']);
    }

    public function coordinatorReview(CoordinatorReviewTrainingRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('coordinateReview', $trainingRequest);

        $decision = $request->validated()['decision'];
        $reason = $request->validated()['reason'] ?? null;

        if ($decision === 'needs_edit') {
            $trainingRequest->update([
                'book_status' => 'needs_edit',
                'needs_edit_reason' => $reason,
                'coordinator_reviewed_at' => now(),
            ]);
            $msg = 'أعيد طلب التدريب للطالب للتعديل.';
        } elseif ($decision === 'rejected') {
            $trainingRequest->update([
                'book_status' => 'coordinator_rejected',
                'status' => 'rejected',
                'coordinator_rejection_reason' => $reason,
                'coordinator_reviewed_at' => now(),
            ]);
            $msg = 'تم رفض طلب التدريب من المنسق.';
        } else {
            $trainingRequest->update([
                'book_status' => 'prelim_approved',
                'coordinator_reviewed_at' => now(),
            ]);
            $msg = 'تم اعتماد الطلب مبدئيًا. يمكن الآن تجميعه في دفعة وإرساله للجهة الرسمية.';
        }

        $trainingRequest->load([
            'requestedBy.role',
            'trainingSite',
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
            'trainingPeriod',
        ]);

        TrainingRequestNotifications::forStudents(
            $trainingRequest,
            'training_request_coordinator_review',
            $msg,
            [
                'training_request_id' => $trainingRequest->id,
                'book_status' => $trainingRequest->book_status,
                'decision' => $decision,
            ]
        );

        return new TrainingRequestResource($trainingRequest);
    }

    public function studentIndex()
    {
        if (auth()->user()->role?->name !== 'student') {
            abort(403);
        }

        $user = auth()->user();
        $requests = TrainingRequest::with([
            'trainingSite',
            'trainingPeriod',
            'trainingRequestStudents' => function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->with(['user', 'course', 'assignedTeacher']);
            },
        ])
            ->where(function ($q) use ($user) {
                $q->where('requested_by', $user->id)
                    ->orWhereHas('trainingRequestStudents', fn ($sq) => $sq->where('user_id', $user->id));
            })
            ->latest()
            ->paginate(15);

        return TrainingRequestResource::collection($requests);
    }

    public function studentStore(Request $request)
    {
        $this->authorize('create', TrainingRequest::class);

        $user = $request->user();
        $existingRequest = TrainingRequest::query()
            ->where(function ($q) use ($user) {
                $q->where('requested_by', $user->id)
                    ->orWhereHas('trainingRequestStudents', fn ($sq) => $sq->where('user_id', $user->id));
            })
            ->latest('id')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'مسموح للطالب بطلب تدريب واحد فقط. يرجى تعديل الطلب الحالي بدل إنشاء طلب جديد.',
                'training_request_id' => $existingRequest->id,
                'book_status' => $existingRequest->book_status,
            ], 409);
        }

        $data = $request->validate([
            'training_site_id' => 'required|exists:training_sites,id',
            'training_period_id' => 'nullable|exists:training_periods,id',
            'course_id' => 'nullable|exists:courses,id',
            'directorate' => 'nullable|in:وسط,شمال,جنوب,يطا',
            'notes' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'attachment_path' => 'nullable|string|max:2048',
            'governing_body' => 'nullable|in:directorate_of_education,ministry_of_health',
        ]);

        $data['training_period_id'] = $data['training_period_id'] ?? $this->resolveAutoTrainingPeriodId();
        $data['course_id'] = $data['course_id'] ?? $this->resolveAutoCourseIdForStudent($request->user());
        $data = $this->normalizeStudentDates($data);

        if (empty($data['course_id'])) {
            return response()->json([
                'message' => 'تعذر تحديد المساق تلقائيًا. يرجى التأكد من تسجيل الطالب في شعبة مرتبطة بمساق.',
            ], 422);
        }

        $site = TrainingSite::findOrFail($data['training_site_id']);
        $track = auth()->user()?->resolveStudentTrack();
        if ($track === 'education' && $site->site_type !== 'school') {
            return response()->json([
                'message' => 'طالب أصول التربية يمكنه اختيار مدارس فقط.',
            ], 422);
        }
        if ($track === 'education' && empty($data['directorate'])) {
            return response()->json([
                'message' => 'لطالب أصول التربية يجب اختيار المديرية أولاً.',
            ], 422);
        }
        if (
            $track === 'education'
            && ! empty($data['directorate'])
            && $this->normalizeDirectorate((string) $site->directorate) !== $this->normalizeDirectorate((string) $data['directorate'])
        ) {
            return response()->json([
                'message' => 'المدرسة المختارة لا تتبع المديرية المحددة.',
            ], 422);
        }

        if (! empty($data['governing_body']) && $data['governing_body'] !== $site->governing_body) {
            return response()->json([
                'message' => 'الجهة الرسمية المختارة لا تطابق نوع موقع التدريب.',
            ], 422);
        }
        if (! $this->hasManagerAccountForSite($site)) {
            return response()->json([
                'message' => 'المدرسة/جهة التدريب المختارة غير مربوطة بحساب مدير. يرجى اختيار جهة أخرى أو مراجعة الإدارة.',
            ], 422);
        }

        $trainingRequest = TrainingRequest::create([
            'requested_by' => auth()->id(),
            'training_site_id' => $data['training_site_id'],
            'training_period_id' => $data['training_period_id'] ?? null,
            'governing_body' => $site->governing_body,
            'directorate' => $data['directorate'] ?? null,
            'status' => 'pending',
            'book_status' => 'sent_to_coordinator',
            'requested_at' => now(),
            'attachment_path' => $data['attachment_path'] ?? null,
        ]);

        TrainingRequestStudent::create([
            'training_request_id' => $trainingRequest->id,
            'user_id' => auth()->id(),
            'course_id' => $data['course_id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
        ]);

        $resource = $trainingRequest->load([
            'requestedBy.role',
            'trainingSite',
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
            'trainingPeriod',
        ]);

        TrainingRequestNotifications::forCoordinatorsByDepartment(
            (int) auth()->user()->department_id,
            'training_request_new_from_student_department',
            'طلب تدريب جديد من طالب ضمن نفس القسم بانتظار المراجعة.',
            ['training_request_id' => $trainingRequest->id]
        );

        return new TrainingRequestResource($resource);
    }

    public function studentUpdate(Request $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('updateAsStudent', $trainingRequest);

        $data = $request->validate([
            'training_site_id' => 'required|exists:training_sites,id',
            'training_period_id' => 'nullable|exists:training_periods,id',
            'course_id' => 'nullable|exists:courses,id',
            'directorate' => 'nullable|in:وسط,شمال,جنوب,يطا',
            'notes' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'attachment_path' => 'nullable|string|max:2048',
        ]);

        $data['training_period_id'] = $data['training_period_id'] ?? $this->resolveAutoTrainingPeriodId();
        $data['course_id'] = $data['course_id'] ?? $this->resolveAutoCourseIdForStudent($request->user());
        $data = $this->normalizeStudentDates($data);

        if (empty($data['course_id'])) {
            return response()->json([
                'message' => 'تعذر تحديد المساق تلقائيًا. يرجى التأكد من تسجيل الطالب في شعبة مرتبطة بمساق.',
            ], 422);
        }

        $site = TrainingSite::findOrFail($data['training_site_id']);
        $track = auth()->user()?->resolveStudentTrack();
        if ($track === 'education' && $site->site_type !== 'school') {
            return response()->json([
                'message' => 'طالب أصول التربية يمكنه اختيار مدارس فقط.',
            ], 422);
        }
        if ($track === 'education' && empty($data['directorate'])) {
            return response()->json([
                'message' => 'لطالب أصول التربية يجب اختيار المديرية أولاً.',
            ], 422);
        }
        if (
            $track === 'education'
            && ! empty($data['directorate'])
            && $this->normalizeDirectorate((string) $site->directorate) !== $this->normalizeDirectorate((string) $data['directorate'])
        ) {
            return response()->json([
                'message' => 'المدرسة المختارة لا تتبع المديرية المحددة.',
            ], 422);
        }
        if (! $this->hasManagerAccountForSite($site)) {
            return response()->json([
                'message' => 'المدرسة/جهة التدريب المختارة غير مربوطة بحساب مدير. يرجى اختيار جهة أخرى أو مراجعة الإدارة.',
            ], 422);
        }

        $trainingRequest->update([
            'training_site_id' => $data['training_site_id'],
            'training_period_id' => $data['training_period_id'] ?? null,
            'governing_body' => $site->governing_body,
            'directorate' => $data['directorate'] ?? null,
            'attachment_path' => $data['attachment_path'] ?? $trainingRequest->attachment_path,
            'book_status' => 'sent_to_coordinator',
            'needs_edit_reason' => null,
            'coordinator_reviewed_at' => null,
        ]);

        $row = TrainingRequestStudent::query()
            ->where('training_request_id', $trainingRequest->id)
            ->where('user_id', auth()->id())
            ->first();

        if ($row) {
            $row->update([
                'course_id' => $data['course_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
            ]);
        }

        $withRelations = $trainingRequest->fresh()->load([
            'trainingRequestStudents',
            'requestedBy.role',
            'trainingSite',
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
            'trainingPeriod',
        ]);

        TrainingRequestNotifications::forStudents(
            $withRelations,
            'training_request_student_resubmitted',
            'أعاد الطالب تقديم طلب التدريب بعد التعديل.',
            ['training_request_id' => $trainingRequest->id]
        );

        TrainingRequestNotifications::forCoordinators(
            'training_request_student_resubmitted',
            'أعاد طالب تقديم طلب تدريب بعد التعديل.',
            ['training_request_id' => $trainingRequest->id]
        );

        return new TrainingRequestResource($withRelations);
    }

    public function studentDestroy(TrainingRequest $trainingRequest)
    {
        $this->authorize('deleteAsStudent', $trainingRequest);

        TrainingRequestStudent::query()
            ->where('training_request_id', $trainingRequest->id)
            ->delete();

        $trainingRequest->delete();

        return response()->json(['message' => 'تم حذف طلب التدريب بنجاح']);
    }

    // ========== School Manager Endpoints ==========

    /**
     * جلب طلبات التدريب المرسلة إلى جهة التدريب الخاصة بمدير المدرسة
     */
    public function schoolManagerMentorRequests(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['school_manager', 'principal', 'psychology_center_manager'], true)) {
            abort(403, 'هذه الخدمة متاحة فقط لمدير جهة التدريب.');
        }

        $query = TrainingRequest::with([
            'trainingSite',
            'requestedBy.department',
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
            'trainingPeriod',
        ])
            ->where('book_status', 'sent_to_school')
            ->where('status', 'pending');

        if ($user->training_site_id) {
            $query->where('training_site_id', $user->training_site_id);
        }

        if ($request->filled('governing_body')) {
            $query->where('governing_body', $request->governing_body);
        }

        $trainingRequests = $query->latest('sent_to_school_at')->paginate($request->per_page ?? 100);

        return TrainingRequestResource::collection($trainingRequests);
    }

    /**
     * جلب المعلمين المتاحين للتعيين كمرشدين في جهة التدريب
     */
    public function schoolManagerTeachers(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['school_manager', 'principal', 'psychology_center_manager'], true)) {
            abort(403, 'هذه الخدمة متاحة فقط لمدير جهة التدريب.');
        }

        // للمركز النفسي: نبحث عن أخصائيين نفسيين بدلاً من معلمين
        $targetRole = $user->role?->name === 'psychology_center_manager' ? 'psychologist' : 'teacher';

        $teachers = User::where('status', 'active')
            ->whereHas('role', fn($q) => $q->where('name', $targetRole))
            ->when($user->training_site_id, fn ($q) => $q->where('training_site_id', $user->training_site_id))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->search) . '%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('name', 'like', $term)
                        ->orWhere('university_id', 'like', $term);
                });
            })
            ->orderBy('name')
            ->get();

        return UserResource::collection($teachers);
    }

    /**
     * موافقة/رفض مدير المدرسة على طلب التدريب مع تعيين المعلمين المرشدين
     */
    public function schoolManagerApprove(SchoolApproveTrainingRequest $request, TrainingRequest $trainingRequest)
    {
        $this->authorize('approveBySchool', $trainingRequest);

        if ($request->status === 'rejected') {
            $this->trainingRequestService->reject($trainingRequest, $request->rejection_reason, $request->user()->id);
            return response()->json(['message' => 'تم رفض الكتاب من قبل المدرسة']);
        }

        $this->trainingRequestService->schoolApprove($trainingRequest, $request->user()->id, $request->students);
        return response()->json(['message' => 'تمت موافقة المدرسة وتعيين المعلمين المرشدين بنجاح']);
    }
}
