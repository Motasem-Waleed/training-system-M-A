<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupervisorVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'training_assignment_id' => 'required|exists:training_assignments,id',
            'scheduled_date' => 'required|date|after_or_equal:today',
            'visit_type' => 'required|in:initial,formative,final',
            'location' => 'nullable|string|max:255',
            'training_track' => 'nullable|in:usool_tarbiah_school,psychology_school,psychology_clinic',
            'template_type' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ];
    }
}