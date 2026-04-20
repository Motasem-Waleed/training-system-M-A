<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvaluationTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'training_coordinator', 'academic_supervisor', 'school_manager']);
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'form_type' => 'sometimes|in:evaluation,student_form',
            'target_role' => 'nullable|in:teacher,academic_supervisor,psychologist,school_manager',
        ];
    }
}