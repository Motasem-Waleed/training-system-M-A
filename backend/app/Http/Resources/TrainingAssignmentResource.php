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
            'enrollment' => $this->when(
                $this->relationLoaded('enrollment') && $this->enrollment !== null,
                fn () => new EnrollmentResource($this->enrollment)
            ),
            'training_request' => $this->when(
                $this->relationLoaded('trainingRequest') && $this->trainingRequest !== null,
                fn () => new TrainingRequestResource($this->trainingRequest)
            ),
            'training_request_student' => $this->when(
                $this->relationLoaded('trainingRequestStudent') && $this->trainingRequestStudent !== null,
                fn () => new TrainingRequestStudentResource($this->trainingRequestStudent)
            ),
            'training_site' => $this->when(
                $this->relationLoaded('trainingSite') && $this->trainingSite !== null,
                fn () => new TrainingSiteResource($this->trainingSite)
            ),
            'training_period' => $this->when(
                $this->relationLoaded('trainingPeriod') && $this->trainingPeriod !== null,
                fn () => new TrainingPeriodResource($this->trainingPeriod)
            ),
            'teacher' => $this->when(
                $this->relationLoaded('teacher') && $this->teacher !== null,
                fn () => new UserResource($this->teacher)
            ),
            'academic_supervisor' => $this->when(
                $this->relationLoaded('academicSupervisor') && $this->academicSupervisor !== null,
                fn () => new UserResource($this->academicSupervisor)
            ),
            'coordinator' => $this->when(
                $this->relationLoaded('coordinator') && $this->coordinator !== null,
                fn () => new UserResource($this->coordinator)
            ),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}