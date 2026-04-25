<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\Semester;

class StoreEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'coordinator', 'head_of_department']);
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $user = \App\Models\User::find($value);
                    if (!$user || $user->status !== 'active') {
                        $fail('الطالب غير مفعل أو غير موجود.');
                    }
                    if ($user && $user->role?->name !== 'student') {
                        $fail('المستخدم المحدد ليس طالباً.');
                    }
                }
            ],
            'section_id' => 'required|exists:sections,id',
            'academic_year' => 'required|digits:4',
            'semester' => 'required|in:first,second,summer',
            'status' => 'sometimes|in:active,dropped,completed',
            'final_grade' => 'nullable|numeric|min:0|max:100',
        ];
    }
}