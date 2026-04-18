<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Enums\UserStatus;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'university_id' => $this->university_id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'status_label' => UserStatus::tryFrom($this->status)?->label() ?? $this->status,
            'phone' => $this->phone,
            'training_site_id' => $this->training_site_id,
            'training_site' => new TrainingSiteResource($this->whenLoaded('trainingSite')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'role' => new RoleResource($this->whenLoaded('role')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'deleted_at' => $this->deleted_at?->toDateTimeString(),
        ];
    }
}