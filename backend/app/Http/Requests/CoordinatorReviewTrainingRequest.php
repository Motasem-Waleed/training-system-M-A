<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CoordinatorReviewTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['training_coordinator', 'coordinator']);
    }

    public function rules(): array
    {
        return [
            'decision' => 'required|in:needs_edit,rejected,prelim_approved',
            'reason' => 'nullable|string',
        ];
    }
}

