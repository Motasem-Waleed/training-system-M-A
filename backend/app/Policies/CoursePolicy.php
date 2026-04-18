<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Course $course): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->name, ['admin', 'department_head']);
    }

    public function update(User $user, Course $course): bool
    {
        return in_array($user->role?->name, ['admin', 'department_head']);
    }

    public function delete(User $user, Course $course): bool
    {
        return in_array($user->role?->name, ['admin', 'department_head']);
    }
}
