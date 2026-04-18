<?php

namespace App\Http\Requests;

use App\Enums\WeeklyScheduleDay;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexWeeklyScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => 'nullable|exists:users,id',
            'training_site_id' => 'nullable|exists:training_sites,id',
            'day' => [
                'nullable',
                Rule::in(array_map(static fn (WeeklyScheduleDay $c) => $c->value, WeeklyScheduleDay::cases())),
            ],
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }
}