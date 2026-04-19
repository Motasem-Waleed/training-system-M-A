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
            'role_id' => $this->role_id,
            'department_id' => $this->department_id,
            'training_site_id' => $this->training_site_id,
            // لا تُمرَّر علاقة null إلى JsonResource — يُسبب 500 عند عدم وجود دور/قسم/موقع
            'training_site' => $this->when(
                $this->relationLoaded('trainingSite') && $this->trainingSite !== null,
                fn () => new TrainingSiteResource($this->trainingSite)
            ),
            'department' => $this->when(
                $this->relationLoaded('department') && $this->department !== null,
                fn () => new DepartmentResource($this->department)
            ),
            'role' => $this->when(
                $this->relationLoaded('role') && $this->role !== null,
                fn () => new RoleResource($this->role)
            ),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'deleted_at' => $this->deleted_at?->toDateTimeString(),
        ];
    }
}