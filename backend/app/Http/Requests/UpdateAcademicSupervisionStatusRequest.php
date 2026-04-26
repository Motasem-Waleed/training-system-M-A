<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademicSupervisionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role?->name, ['admin', 'training_coordinator', 'head_of_department', 'academic_supervisor'], true);
    }

    public function rules(): array
    {
        return [
            'academic_status' => [
                'required',
                'string',
                Rule::in([
                    'not_started',
                    'in_training',
                    'needs_follow_up',
                    'completed',
                    'late',
                    'withdrawn',
                ]),
            ],
            'note' => 'nullable|string|max:2000',
        ];
    }
}
