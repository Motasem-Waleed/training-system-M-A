<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\EvaluationFieldType;

class StoreEvaluationItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'coordinator', 'training_coordinator']);
    }

    public function rules(): array
    {
        return [
            // template_id is inferred from route model binding in addItem endpoint.
            'template_id' => 'nullable|exists:evaluation_templates,id',
            'title' => 'required|string|max:255',
            'field_type' => 'required|in:score,text,textarea,radio,checkbox,date,file',
            'options' => 'required_if:field_type,radio,checkbox|nullable|array',
            'is_required' => 'boolean',
            'max_score' => 'required_if:field_type,score|nullable|numeric|min:0|max:100',
        ];
    }
}