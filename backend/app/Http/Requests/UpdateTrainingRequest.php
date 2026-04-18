<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['coordinator', 'training_coordinator']);
    }

    public function rules(): array
    {
        return [
            'letter_number' => 'sometimes|string|max:255|unique:training_requests,letter_number,' . $this->route('training_request'),
            'letter_date' => 'sometimes|date',
            'training_site_id' => 'sometimes|exists:training_sites,id',
            'training_period_id' => 'sometimes|exists:training_periods,id',
        ];
    }
}