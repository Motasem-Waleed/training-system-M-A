<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Enums\Semester;

class SectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'academic_year' => $this->academic_year,
            'semester' => $this->semester,
            'semester_label' => Semester::tryFrom($this->semester)?->label() ?? $this->semester,
            'capacity' => $this->capacity,
            'active_students_count' => $this->whenLoaded('students', function () {
                return $this->students->where('status', 'active')->count();
            }, 0),
            'students_count' => $this->whenLoaded('students', function () {
                return $this->students->count();
            }, 0),
            'course' => new CourseResource($this->whenLoaded('course')),
            'academic_supervisor' => new UserResource($this->whenLoaded('academicSupervisor')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}