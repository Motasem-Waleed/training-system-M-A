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
        'user' => new UserResource($this->whenLoaded('user')),
'training_assignment' => $this->whenLoaded('trainingAssignment')
    ? new TrainingAssignmentResource($this->trainingAssignment)
    : null,
        // ✅ FIX HERE
       'entries' => PortfolioEntryResource::collection($this->entries ?? []),

        'created_at' => $this->created_at?->toDateTimeString(),
        'updated_at' => $this->updated_at?->toDateTimeString(),
    ];
}
}