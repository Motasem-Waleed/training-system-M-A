<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademicTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'instructions' => 'sometimes|nullable|string',
            'due_date' => 'sometimes|date',
            'task_type' => 'sometimes|in:general,teaching,portfolio,reflection,counseling,case_study,visit_preparation,report',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'string',
            'grading_weight' => 'sometimes|nullable|numeric|min:0|max:100',
            'status' => 'sometimes|in:pending,in_progress,completed,submitted,graded',
        ];
    }
}
