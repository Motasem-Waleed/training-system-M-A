<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrainingSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()->role?->name;
        if (in_array($role, ['admin', 'education_directorate', 'ministry_of_health'], true)) {
            return true;
        }
        if (in_array($role, ['school_manager', 'psychology_center_manager'])) {
            $site = $this->route('training_site');

            return $site
                && $this->user()->training_site_id
                && (int) $this->user()->training_site_id === (int) $site->id;
        }

        return false;
    }

    public function rules(): array
    {
        $trainingSite = $this->route('training_site');
        $role = $this->user()->role?->name;

        if (in_array($role, ['school_manager', 'psychology_center_manager'])) {
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
                'directorate' => 'sometimes|in:وسط,شمال,جنوب,يطا',
                'school_type' => 'sometimes|in:public,private',
            ];
        }

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
            'school_type' => 'sometimes|in:public,private',
            'site_type' => 'sometimes|in:school,health_center',
            'governing_body' => 'sometimes|in:directorate_of_education,ministry_of_health',
        ];
    }
}