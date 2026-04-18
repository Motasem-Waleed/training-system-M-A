<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrainingSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, [
            'admin',
            'education_directorate',
            'ministry_of_health',
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:training_sites,name',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'directorate' => 'required|in:وسط,شمال,جنوب,يطا',
            'capacity' => 'required|integer|min:1',

            // الجديد
            'school_type' => 'required|in:public,private',

            // نخليهم اختياريين لأن الباك سيضعهم تلقائياً
            'site_type' => 'nullable|in:school,health_center',
            'governing_body' => 'nullable|in:directorate_of_education,ministry_of_health',
        ];
    }
}