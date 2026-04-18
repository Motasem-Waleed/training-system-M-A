<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrainingSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'education_directorate', 'ministry_of_health']);
    }

    public function rules(): array
    {
        $trainingSite = $this->route('training_site');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('training_sites', 'name')->ignore($trainingSite?->id),
            ],
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'capacity' => 'sometimes|integer|min:1',

            'directorate' => 'sometimes|in:وسط,شمال,جنوب,يطا',
            'site_type' => 'sometimes|in:school,health_center',
            'governing_body' => 'sometimes|in:directorate_of_education,ministry_of_health',
        ];
    }
}