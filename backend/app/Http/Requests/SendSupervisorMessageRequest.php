<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendSupervisorMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_user_id' => 'required|exists:users,id',
            'content' => 'required|string|max:4000',
            'related_to' => 'nullable|in:attendance,daily_log,portfolio,visit,task,evaluation,general',
        ];
    }
}
