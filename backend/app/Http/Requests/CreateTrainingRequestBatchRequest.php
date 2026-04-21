<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTrainingRequestBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['training_coordinator', 'coordinator']);
    }

    public function rules(): array
    {
        return [
            'governing_body' => 'required|in:directorate_of_education,ministry_of_health,health_directorate,education_directorate',
            'directorate' => 'nullable|in:وسط,شمال,جنوب,يطا',
            'training_request_ids' => 'required|array|min:1',
            'training_request_ids.*' => 'integer|exists:training_requests,id',
        ];
    }
}

