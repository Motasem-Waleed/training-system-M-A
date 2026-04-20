<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\EvaluationFormType;

class StoreEvaluationTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'training_coordinator', 'academic_supervisor', 'school_manager']);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'form_type' => 'required|in:evaluation,student_form',
            'target_role' => 'nullable|in:teacher,academic_supervisor,psychologist,school_manager',
        ];
    }
}