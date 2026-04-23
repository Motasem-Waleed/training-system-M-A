<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EscalateStudentIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target' => 'required|in:coordinator,department_head,admin',
            'reason' => 'required|in:attendance,daily_log,portfolio,visit,task,evaluation,general',
            'details' => 'required|string|max:3000',
        ];
    }
}
