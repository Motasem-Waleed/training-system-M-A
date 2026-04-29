<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'form_instance_id' => $this->form_instance_id,
            'step' => $this->step,
            'reviewer_role' => $this->reviewer_role,
            'reviewer_id' => $this->reviewer_id,
            'status' => $this->status,
            'comment' => $this->comment,
            'reviewed_at' => $this->reviewed_at?->toDateTimeString(),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
