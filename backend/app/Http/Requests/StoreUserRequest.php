<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\UserStatus;
use App\Models\Role;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'admin';
    }

    public function rules(): array
    {
        return [
            'university_id' => 'required|string|max:255|unique:users',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'status' => 'required|in:active,inactive,suspended',
            'department_id' => 'required_if:role_id,' . $this->getStudentRoleId() . '|exists:departments,id',
            'role_id' => 'required|exists:roles,id',
            'phone' => 'nullable|string|max:20',
            'training_site_id' => 'nullable|exists:training_sites,id',
            'directorate' => 'nullable|in:وسط,شمال,جنوب,يطا',
            'major' => 'nullable|string|max:255',
        ];
    }

    private function getStudentRoleId(): ?string
    {
        return (string) Role::where('name', 'student')->value('id');
    }
}