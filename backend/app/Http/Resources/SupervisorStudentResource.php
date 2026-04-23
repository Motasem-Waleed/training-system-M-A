<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupervisorStudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'student_id' => $this['student_id'] ?? null,
            'name' => $this['name'] ?? null,
            'university_id' => $this['university_id'] ?? null,
            'department' => $this['department'] ?? null,
            'specialization' => $this['specialization'] ?? null,
            'section' => $this['section'] ?? null,
            'course' => $this['course'] ?? null,
            'training_site' => $this['training_site'] ?? null,
            'field_supervisor_name' => $this['field_supervisor_name'] ?? null,
            'attendance_status_summary' => $this['attendance_status_summary'] ?? null,
            'daily_log_status_summary' => $this['daily_log_status_summary'] ?? null,
            'portfolio_completion' => $this['portfolio_completion'] ?? null,
            'field_evaluation_status' => $this['field_evaluation_status'] ?? null,
            'academic_evaluation_status' => $this['academic_evaluation_status'] ?? null,
            'risk_level' => $this['risk_level'] ?? 'low',
            'last_activity_at' => $this['last_activity_at'] ?? null,
            'training_track' => $this['training_track'] ?? null,
        ];
    }
}
