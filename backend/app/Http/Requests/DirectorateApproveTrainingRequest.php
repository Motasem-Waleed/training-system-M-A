<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DirectorateApproveTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, [
            'education_directorate',
            'health_directorate',
            'ministry_of_health',
        ], true);
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string',
        ];
    }
}