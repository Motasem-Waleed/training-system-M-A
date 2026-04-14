<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Enums\TrainingAssignmentStatus;

class TrainingAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
'status_label' => optional(
    TrainingAssignmentStatus::tryFrom($this->status)
)->label() ?? $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'enrollment' => new EnrollmentResource($this->whenLoaded('enrollment')),
            'training_request' => new TrainingRequestResource($this->whenLoaded('trainingRequest')),
            'training_request_student' => new TrainingRequestStudentResource($this->whenLoaded('trainingRequestStudent')),
            'training_site' => new TrainingSiteResource($this->whenLoaded('trainingSite')),
            'training_period' => new TrainingPeriodResource($this->whenLoaded('trainingPeriod')),
            'teacher' => new UserResource($this->whenLoaded('teacher')),
            'academic_supervisor' => new UserResource($this->whenLoaded('academicSupervisor')),
            'coordinator' => new UserResource($this->whenLoaded('coordinator')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}