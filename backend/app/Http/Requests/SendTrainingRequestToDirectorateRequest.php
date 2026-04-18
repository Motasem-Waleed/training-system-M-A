<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendTrainingRequestToDirectorateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['coordinator', 'training_coordinator']);
    }

    public function rules(): array
    {
        return [
            'letter_number' => 'required|string|max:255',
            'letter_date' => 'required|date',
            'content' => 'required|string',
        ];
    }
}