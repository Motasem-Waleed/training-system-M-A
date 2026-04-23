<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddAttendanceAlertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendance_id' => 'required|exists:attendances,id',
            'target' => 'required|in:student,field_supervisor,coordinator,department_head,admin',
            'message' => 'required|string|max:1000',
        ];
    }
}
