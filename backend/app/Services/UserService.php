<?php

namespace App\Services;

use App\Models\User;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function createUser(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        $data['status'] = $data['status'] ?? UserStatus::ACTIVE->value;
        return User::create($data);
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        $user->update($data);
        return $user;
    }

    public function changeStatus(User $user, string $status): User
    {
        $user->update(['status' => $status]);
        return $user;
    }

    public function assignRole(User $user, int $roleId): User
    {
        $user->update(['role_id' => $roleId]);
        return $user;
    }
}