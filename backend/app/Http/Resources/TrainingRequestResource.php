<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Enums\TrainingRequestStatus;
use App\Enums\BookStatus;

class TrainingRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requested_by' => new UserResource($this->whenLoaded('requestedBy')),
            'letter_number' => $this->letter_number,
            'letter_date' => $this->letter_date?->toDateString(),
            'book_status' => $this->book_status,
            'book_status_label' => BookStatus::tryFrom($this->book_status)?->label() ?? $this->book_status,
            'status' => $this->status,
            'status_label' => TrainingRequestStatus::tryFrom($this->status)?->label() ?? $this->status,
            'sent_to_directorate_at' => $this->sent_to_directorate_at?->toDateTimeString(),
            'directorate_approved_at' => $this->directorate_approved_at?->toDateTimeString(),
            'sent_to_school_at' => $this->sent_to_school_at?->toDateTimeString(),
            'school_approved_at' => $this->school_approved_at?->toDateTimeString(),
            'requested_at' => $this->requested_at?->toDateTimeString(),
            'rejection_reason' => $this->rejection_reason,
            'needs_edit_reason' => $this->needs_edit_reason,
            'coordinator_rejection_reason' => $this->coordinator_rejection_reason,
            'coordinator_reviewed_at' => $this->coordinator_reviewed_at?->toDateTimeString(),
            'batched_at' => $this->batched_at?->toDateTimeString(),
            'attachment_path' => $this->attachment_path,
            'governing_body' => $this->governing_body,
            'training_site' => new TrainingSiteResource($this->whenLoaded('trainingSite')),
            'students' => TrainingRequestStudentResource::collection($this->whenLoaded('trainingRequestStudents')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'training_period_id' => $this->training_period_id,
            'training_period' => new TrainingPeriodResource($this->whenLoaded('trainingPeriod')),
        ];
    }
}