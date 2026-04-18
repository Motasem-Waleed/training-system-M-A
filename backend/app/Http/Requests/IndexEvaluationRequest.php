<?php

namespace App\Http\Requests;

use App\Enums\EvaluationFormType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'training_assignment_id' => 'nullable|exists:training_assignments,id',
            'template_id' => 'nullable|exists:evaluation_templates,id',
            'form_type' => [
                'nullable',
                Rule::in(array_map(static fn (EvaluationFormType $c) => $c->value, EvaluationFormType::cases())),
            ],
            'evaluator_id' => 'nullable|exists:users,id',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }
}