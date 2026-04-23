<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupervisorVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scheduled_date' => 'sometimes|date',
            'visit_type' => 'sometimes|in:initial,formative,final',
            'location' => 'sometimes|nullable|string|max:255',
            'training_track' => 'sometimes|nullable|in:usool_tarbiah_school,psychology_school,psychology_clinic',
            'template_type' => 'sometimes|nullable|string|max:100',
            'notes' => 'nullable|string',
        ];
    }
}