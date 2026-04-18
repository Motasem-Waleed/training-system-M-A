<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentPortfolioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => UserResource::make($this->whenLoaded('user')),
            'training_assignment' => $this->whenLoaded(
                'trainingAssignment',
                fn () => $this->trainingAssignment
                    ? new TrainingAssignmentResource($this->trainingAssignment)
                    : null
            ),
            'entries' => PortfolioEntryResource::collection(
                $this->relationLoaded('entries') ? $this->entries : collect()
            ),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
