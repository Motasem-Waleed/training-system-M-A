<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\CourseType;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'head_of_department']);
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:255|unique:courses',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'credit_hours' => 'required|integer|min:1|max:6',
            'training_hours' => 'nullable|integer|min:0|max:500',
            'type' => 'required|in:practical,theoretical,both',
            'department_id' => 'sometimes|exists:departments,id',
        ];
    }

    public function messages(): array
    {
        return [
            'training_hours.max' => 'عدد الساعات التدريبية يجب ألا يتجاوز 500 ساعة.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // If head_of_department, automatically set their department_id
        if ($this->user()->role?->name === 'head_of_department' && $this->user()->department_id) {
            $this->merge([
                'department_id' => $this->user()->department_id,
            ]);
        }
    }
}