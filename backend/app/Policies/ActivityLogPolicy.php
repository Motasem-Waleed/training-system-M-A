<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, ActivityLog $activityLog): bool
    {
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return false; // النشاطات تُسجل تلقائياً
    }

    public function update(User $user, ActivityLog $activityLog): bool
    {
        return false; // لا يُسمح بتعديل النشاطات
    }

    public function delete(User $user, ActivityLog $activityLog): bool
    {
        return $user->hasRole('admin');
    }
}
