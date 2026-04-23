<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAcademicTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'due_date' => 'required|date|after_or_equal:today',
            'target_type' => 'required|in:student,section,group',
            'target_ids' => 'required|array|min:1',
            'target_ids.*' => 'integer|min:1',
            'task_type' => 'required|in:general,teaching,portfolio,reflection,counseling,case_study,visit_preparation,report',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'string',
            'grading_weight' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:pending,in_progress,completed,submitted,graded',
        ];
    }
}
