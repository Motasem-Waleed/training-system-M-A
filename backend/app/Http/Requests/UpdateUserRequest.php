<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $routeUser = $this->route('user');
        $routeUserId = $routeUser instanceof User ? $routeUser->id : (int) $routeUser;

        return $this->user()->role?->name === 'admin'
            || $this->user()->id === $routeUserId;
    }

    public function rules(): array
    {
        $routeUser = $this->route('user');
        $routeUserId = $routeUser instanceof User ? $routeUser->id : (int) $routeUser;

        return [
            'university_id' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('users', 'university_id')->ignore($routeUserId)],
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($routeUserId)],
            'password' => 'sometimes|nullable|string|min:8',
            'status' => 'sometimes|in:active,inactive,suspended',
            'role_id' => 'sometimes|exists:roles,id',
            'department_id' => 'sometimes|nullable|exists:departments,id',
            'training_site_id' => 'sometimes|nullable|exists:training_sites,id',
            'phone' => 'sometimes|nullable|string|max:20',
            'directorate' => 'sometimes|nullable|in:وسط,شمال,جنوب,يطا',
            'major' => 'sometimes|nullable|string|max:255',
        ];
    }

    private function getStudentRoleId(): ?string
    {
        return (string) Role::where('name', 'student')->value('id');
    }
}