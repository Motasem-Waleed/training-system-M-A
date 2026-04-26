<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvaluationItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'coordinator', 'training_coordinator']);
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'field_type' => 'sometimes|in:score,text,textarea,radio,checkbox,date,file',
            'options' => 'nullable|array',
            'is_required' => 'boolean',
            'max_score' => 'nullable|numeric|min:0|max:100',
        ];
    }
}