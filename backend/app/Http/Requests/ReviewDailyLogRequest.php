<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewDailyLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_note' => 'required|string|max:2000',
            'needs_discussion' => 'sometimes|boolean',
        ];
    }
}
