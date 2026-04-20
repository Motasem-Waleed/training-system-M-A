<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SchoolApproveTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['school_manager', 'psychology_center_manager']);
    }

    public function rules(): array
    {
        return [
            'students' => 'required_if:status,approved|array',
            'students.*.id' => 'required_if:status,approved|exists:training_request_students,id',
            'students.*.assigned_teacher_id' => 'required_if:status,approved|exists:users,id',
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string',
        ];
    }
}