<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Enums\CourseType;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'credit_hours' => $this->credit_hours,
            'training_hours' => $this->training_hours,
            'semester' => $this->semester,
            'type' => $this->type,
            'type_label' => CourseType::tryFrom($this->type)?->label() ?? $this->type,
            'department_id' => $this->department_id,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'sections_count' => $this->sections_count ?? ($this->relationLoaded('sections') ? $this->sections->count() : 0),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'deleted_at' => $this->deleted_at?->toDateTimeString(),
        ];
    }
}