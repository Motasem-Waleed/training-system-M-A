<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['admin', 'coordinator']);
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'target_roles' => 'nullable|array',
            'target_roles.*' => 'exists:roles,id',
            'target_users' => 'nullable|array',
            'target_users.*' => 'exists:users,id',
            'target_departments' => 'nullable|array',
            'target_departments.*' => 'exists:departments,id',
        ];
    }
}