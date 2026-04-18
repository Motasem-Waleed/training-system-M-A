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
use App\Services\TrainingRequestService;
use App\Support\TrainingRequestNotifications;
use Illuminate\Http\Request;

class TrainingRequestController extends Controller
{
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

        if ($request->user()->role?->name === 'school_manager' && $request->user()->training_site_id) {
            $query->where('training_site_id', $request->user()->training_site_id);
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
            $msg = 'تم اعتماد الطلب مبدئيًا وهو جاهز للتجميع في دفعة.';
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
            'trainingRequestStudents.user',
            'trainingRequestStudents.course',
            'trainingRequestStudents.assignedTeacher',
            'trainingPeriod',
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

        $data = $request->validate([
            'training_site_id' => 'required|exists:training_sites,id',
            'training_period_id' => 'nullable|exists:training_periods,id',
            'course_id' => 'required|exists:courses,id',
            'notes' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'attachment_path' => 'nullable|string|max:2048',
            'governing_body' => 'nullable|in:directorate_of_education,ministry_of_health',
        ]);

        $site = TrainingSite::findOrFail($data['training_site_id']);

        if (! empty($data['governing_body']) && $data['governing_body'] !== $site->governing_body) {
            return response()->json([
                'message' => 'الجهة الرسمية المختارة لا تطابق نوع موقع التدريب.',
            ], 422);
        }

        $trainingRequest = TrainingRequest::create([
            'requested_by' => auth()->id(),
            'training_site_id' => $data['training_site_id'],
            'training_period_id' => $data['training_period_id'] ?? null,
            'governing_body' => $site->governing_body,
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

        TrainingRequestNotifications::forCoordinators(
            'training_request_new_from_student',
            'طلب تدريب جديد من طالب بانتظار المراجعة.',
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
            'course_id' => 'required|exists:courses,id',
            'notes' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'attachment_path' => 'nullable|string|max:2048',
        ]);

        $site = TrainingSite::findOrFail($data['training_site_id']);

        $trainingRequest->update([
            'training_site_id' => $data['training_site_id'],
            'training_period_id' => $data['training_period_id'] ?? null,
            'governing_body' => $site->governing_body,
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
}