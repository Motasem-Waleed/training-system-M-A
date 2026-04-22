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
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($routeUserId)],
            'phone' => 'nullable|string|max:20',
            'department_id' => 'required_if:role_id,' . $this->getStudentRoleId() . '|exists:departments,id',
            'directorate' => 'nullable|in:وسط,شمال,جنوب,يطا',
        ];
    }

    private function getStudentRoleId(): ?string
    {
        return (string) Role::where('name', 'student')->value('id');
    }
}