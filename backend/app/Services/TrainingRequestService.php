<?php

namespace App\Services;

use App\Models\TrainingRequest;
use App\Models\TrainingRequestStudent;
use App\Models\TrainingAssignment;
use App\Models\OfficialLetter;
use App\Models\WorkflowInstance;
use App\Models\WorkflowApproval;
use App\Models\Notification as AppNotification;
use App\Enums\BookStatus;
use App\Enums\TrainingRequestStudentStatus;
use App\Enums\OfficialLetterType;
use App\Enums\OfficialLetterStatus;
use App\Support\TrainingRequestNotifications;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrainingRequestService
{
    /**
     * إنشاء كتاب تدريبي جديد (من قبل المنسق)
     */
    public function createTrainingRequest(array $data, int $coordinatorId): TrainingRequest
    {
        return DB::transaction(function () use ($data, $coordinatorId) {
            // إنشاء الكتاب الرئيسي
            $trainingRequest = TrainingRequest::create([
    'letter_number' => $data['letter_number'] ?? $this->generateLetterNumber(),
    'letter_date' => $data['letter_date'] ?? now(),
    'training_site_id' => $data['training_site_id'],
    'training_period_id' => $data['training_period_id'] ?? null,
    'book_status' => BookStatus::DRAFT->value,
    'status' => 'pending',
    'requested_at' => now(),
]);

            // إضافة الطلاب إلى training_request_students
            foreach ($data['students'] as $student) {
                TrainingRequestStudent::create([
                    'training_request_id' => $trainingRequest->id,
                    'user_id' => $student['user_id'],
                    'course_id' => $student['course_id'],
                    'start_date' => $student['start_date'],
                    'end_date' => $student['end_date'],
                    'notes' => $student['notes'] ?? null,
                    'status' => TrainingRequestStudentStatus::PENDING->value,
                ]);
            }

            return $trainingRequest->load('trainingRequestStudents');
        });
    }

    /**
     * إرسال الكتاب إلى مديرية التربية
     */
    public function sendToDirectorate(TrainingRequest $trainingRequest, int $coordinatorId, array $letterData): void
    {
        DB::transaction(function () use ($trainingRequest, $coordinatorId, $letterData) {
            // تحديث حالة الكتاب
            $trainingRequest->update([
                'book_status' => BookStatus::SENT_TO_DIRECTORATE->value,
                'sent_to_directorate_at' => now(),
            ]);

            // إنشاء كتاب رسمي من النوع to_directorate
            OfficialLetter::create([
                'training_request_id' => $trainingRequest->id,
                'letter_number' => $letterData['letter_number'],
                'letter_date' => $letterData['letter_date'],
                'type' => OfficialLetterType::TO_DIRECTORATE->value,
                'content' => $letterData['content'],
                'sent_by' => $coordinatorId,
                'sent_at' => now(),
                'status' => OfficialLetterStatus::SENT_TO_DIRECTORATE->value,
            ]);

            // إنشاء workflow instance
            $workflow = WorkflowInstance::create([
                'workflow_template_id' => 1, // تأكد من وجود template
                'model_type' => TrainingRequest::class,
                'model_id' => $trainingRequest->id,
                'status' => 'in_progress',
            ]);

            // إنشاء أول approval (موافقة المديرية)
            WorkflowApproval::create([
                'workflow_instance_id' => $workflow->id,
                'workflow_step_id' => 1, // خطوة المديرية
                'status' => 'pending',
            ]);

            // إشعار للجهة الرسمية (مديرية)
            TrainingRequestNotifications::forDirectorate(
                $trainingRequest->governing_body,
                'training_request_received_from_coordinator',
                'طلب تدريب جديد بانتظار الموافقة. كتاب رقم: ' . ($trainingRequest->letter_number ?? "#{$trainingRequest->id}"),
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::SENT_TO_DIRECTORATE->value,
                ]
            );
        });
    }

    /**
     * موافقة مديرية التربية على الكتاب
     */
    public function directorateApprove(TrainingRequest $trainingRequest, int $directorateUserId): void
    {
        DB::transaction(function () use ($trainingRequest, $directorateUserId) {
            $trainingRequest->update([
                'book_status' => BookStatus::DIRECTORATE_APPROVED->value,
                'directorate_approved_at' => now(),
            ]);

            // تحديث الـ approval (بافتراض وجوده)
            $workflowInstance = WorkflowInstance::where('model_type', TrainingRequest::class)
                ->where('model_id', $trainingRequest->id)
                ->first();
            if ($workflowInstance) {
                $approval = WorkflowApproval::where('workflow_instance_id', $workflowInstance->id)
                    ->where('status', 'pending')
                    ->first();
                if ($approval) {
                    $approval->update([
                        'status' => 'approved',
                        'approved_by' => $directorateUserId,
                        'approved_at' => now(),
                    ]);
                }
            }

            $this->notifyCoordinator(
                $trainingRequest,
                'training_request_directorate_approved',
                'تمت موافقة الجهة الرسمية على طلب التدريب رقم ' . ($trainingRequest->letter_number ?? "#{$trainingRequest->id}") . '.',
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::DIRECTORATE_APPROVED->value,
                ]
            );

            $trainingRequest->load('trainingRequestStudents');
            TrainingRequestNotifications::forStudents(
                $trainingRequest,
                'training_request_directorate_approved_student',
                'تمت موافقة الجهة الرسمية على طلب التدريب الخاص بك.',
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::DIRECTORATE_APPROVED->value,
                ]
            );

            // إرسال تلقائي إلى المدرسة بعد موافقة المديرية
            $this->sendToSchool($trainingRequest, $directorateUserId, [
                'letter_number' => $this->generateAutoSchoolLetterNumber($trainingRequest),
                'letter_date' => now()->toDateString(),
                'content' => 'تحويل تلقائي لطلب التدريب إلى المدرسة بعد موافقة المديرية.',
            ]);
        });
    }

    /**
     * إرسال الكتاب إلى المدرسة (بعد موافقة المديرية)
     */
    public function sendToSchool(TrainingRequest $trainingRequest, int $directorateUserId, array $letterData): void
    {
        DB::transaction(function () use ($trainingRequest, $directorateUserId, $letterData) {
            $trainingRequest->update([
                'book_status' => BookStatus::SENT_TO_SCHOOL->value,
                'sent_to_school_at' => now(),
            ]);

            OfficialLetter::create([
                'training_request_id' => $trainingRequest->id,
                'letter_number' => $letterData['letter_number'],
                'letter_date' => $letterData['letter_date'],
                'type' => OfficialLetterType::TO_SCHOOL->value,
                'content' => $letterData['content'],
                'sent_by' => $directorateUserId,
                'sent_at' => now(),
                'status' => OfficialLetterStatus::SENT_TO_SCHOOL->value,
                'training_site_id' => $trainingRequest->training_site_id,
            ]);

            // إشعار لمدير المدرسة
            TrainingRequestNotifications::forSchoolManager(
                $trainingRequest->training_site_id,
                'training_request_received_from_directorate',
                'تم إرسال طلب تدريب من الجهة الرسمية بانتظار موافقتك وتعيين المعلمين المرشدين.',
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::SENT_TO_SCHOOL->value,
                ]
            );
        });
    }

    /**
     * موافقة مدير المدرسة وتعيين المعلمين المرشدين
     */
    public function schoolApprove(TrainingRequest $trainingRequest, int $schoolManagerId, array $studentsData): void
    {
        DB::transaction(function () use ($trainingRequest, $schoolManagerId, $studentsData) {
            $activeTrainingPeriodId = $this->requireActiveTrainingPeriodId();

            foreach ($studentsData as $studentData) {
                $studentRequest = TrainingRequestStudent::findOrFail($studentData['id']);
                $enrollmentId = $this->requireEnrollmentId($studentRequest);
                $studentRequest->update([
                    'status' => TrainingRequestStudentStatus::APPROVED->value,
                    'assigned_teacher_id' => $studentData['assigned_teacher_id'],
                ]);

                // إنشاء training assignment
                TrainingAssignment::create([
                    'enrollment_id' => $enrollmentId,
                    'training_request_id' => $trainingRequest->id,
                    'training_request_student_id' => $studentRequest->id,
                    'training_site_id' => $trainingRequest->training_site_id,
                    'training_period_id' => $activeTrainingPeriodId,
                    'teacher_id' => $studentData['assigned_teacher_id'],
                    'academic_supervisor_id' => $this->getAcademicSupervisorId($studentRequest->course_id),
                    'status' => 'assigned',
                    'start_date' => $studentRequest->start_date,
                    'end_date' => $studentRequest->end_date,
                ]);
            }

            $trainingRequest->update([
                'book_status' => BookStatus::SCHOOL_APPROVED->value,
                'school_approved_at' => now(),
            ]);

            $trainingRequest->load('trainingRequestStudents');
            TrainingRequestNotifications::forStudents(
                $trainingRequest,
                'training_request_school_approved_student',
                'تمت موافقة جهة التدريب ويمكنك متابعة التدريب الميداني في النظام.',
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::SCHOOL_APPROVED->value,
                ]
            );

            // تحديث الـ workflow إلى completed
            $workflowInstance = WorkflowInstance::where('model_type', TrainingRequest::class)
                ->where('model_id', $trainingRequest->id)
                ->first();
            if ($workflowInstance) {
                $workflowInstance->update(['status' => 'approved']);
            }
        });
    }

    /**
     * رفض الكتاب مع سبب
     */
    public function reject(TrainingRequest $trainingRequest, string $reason, int $rejectedBy): void
    {
        DB::transaction(function () use ($trainingRequest, $reason, $rejectedBy) {
            $trainingRequest->update([
                'book_status' => BookStatus::REJECTED->value,
                'rejection_reason' => $reason,
            ]);

            // تحديث جميع الطلاب المرتبطين إلى مرفوض
            $trainingRequest->trainingRequestStudents()->update([
                'status' => TrainingRequestStudentStatus::REJECTED->value,
                'rejection_reason' => $reason,
            ]);

            // تحديث workflow إلى rejected
            $workflowInstance = WorkflowInstance::where('model_type', TrainingRequest::class)
                ->where('model_id', $trainingRequest->id)
                ->first();
            if ($workflowInstance) {
                $workflowInstance->update(['status' => 'rejected']);
            }

            $this->notifyCoordinator(
                $trainingRequest,
                'training_request_directorate_rejected',
                'تم رفض طلب التدريب رقم ' . ($trainingRequest->letter_number ?? "#{$trainingRequest->id}") . '. سبب الرفض: ' . $reason,
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::REJECTED->value,
                    'rejection_reason' => $reason,
                ]
            );

            $trainingRequest->load('trainingRequestStudents');
            TrainingRequestNotifications::forStudents(
                $trainingRequest,
                'training_request_rejected_student',
                'تم رفض طلب التدريب. السبب: ' . $reason,
                [
                    'training_request_id' => $trainingRequest->id,
                    'book_status' => BookStatus::REJECTED->value,
                    'rejection_reason' => $reason,
                ]
            );
        });
    }

    private function notifyCoordinator(
        TrainingRequest $trainingRequest,
        string $type,
        string $message,
        array $data = []
    ): void {
        $coordinatorId = OfficialLetter::where('training_request_id', $trainingRequest->id)
            ->where('type', OfficialLetterType::TO_DIRECTORATE->value)
            ->latest('id')
            ->value('sent_by');

        if (!$coordinatorId) {
            return;
        }

        AppNotification::create([
            'user_id' => $coordinatorId,
            'type' => $type,
            'message' => $message,
            'notifiable_type' => TrainingRequest::class,
            'notifiable_id' => $trainingRequest->id,
            'data' => $data,
        ]);
    }

    private function generateLetterNumber(): string
    {
        return 'LET-' . date('Ymd') . '-' . rand(100, 999);
    }

    private function generateAutoSchoolLetterNumber(TrainingRequest $trainingRequest): string
    {
        $base = 'AUTO-SCH-' . $trainingRequest->id . '-' . now()->format('YmdHis');
        $candidate = $base;
        $suffix = 1;

        while (OfficialLetter::query()->where('letter_number', $candidate)->exists()) {
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function getEnrollmentId(int $userId, int $courseId): ?int
    {
        $enrollment = \App\Models\Enrollment::where('user_id', $userId)
            ->whereHas('section', function ($q) use ($courseId) {
                $q->where('course_id', $courseId);
            })->first();
        return $enrollment?->id;
    }

    private function requireEnrollmentId(TrainingRequestStudent $studentRequest): int
    {
        $enrollmentId = $this->getEnrollmentId($studentRequest->user_id, $studentRequest->course_id);

        if ($enrollmentId) {
            return $enrollmentId;
        }

        throw ValidationException::withMessages([
            'students' => [
                "لا يمكن اعتماد الطالب {$studentRequest->user_id} لعدم وجود تسجيل أكاديمي مرتبط بالمساق المطلوب.",
            ],
        ]);
    }

    private function getActiveTrainingPeriodId(): ?int
    {
        $period = \App\Models\TrainingPeriod::where('is_active', true)->first();
        return $period?->id;
    }

    private function requireActiveTrainingPeriodId(): int
    {
        $periodId = $this->getActiveTrainingPeriodId();

        if ($periodId) {
            return $periodId;
        }

        throw ValidationException::withMessages([
            'training_period' => ['لا يمكن اعتماد الطلب لعدم وجود فترة تدريب مفعلة.'],
        ]);
    }

    private function getAcademicSupervisorId(int $courseId): ?int
    {
        $section = \App\Models\Section::where('course_id', $courseId)->first();
        return $section?->academic_supervisor_id;
    }
}
