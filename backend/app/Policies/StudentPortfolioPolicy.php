<?php

namespace App\Policies;

use App\Models\StudentPortfolio;
use App\Models\User;

class StudentPortfolioPolicy
{
 public function viewAny(User $user): bool
{
    $role = $user->role?->name;

    return in_array($role, ['student', 'academic_supervisor', 'coordinator', 'admin']);
}

  public function view(User $user, StudentPortfolio $studentPortfolio): bool
{
    $role = $user->role?->name;

    if ($role === 'student') {
        return $user->id === $studentPortfolio->user_id;
    }

    if ($role === 'academic_supervisor') {
        return $studentPortfolio->trainingAssignment
            && $user->id === $studentPortfolio->trainingAssignment->academic_supervisor_id;
    }

    return in_array($role, ['coordinator', 'admin']);
}

public function create(User $user): bool
{
    return $user->role?->name === 'student';
}

public function update(User $user, StudentPortfolio $studentPortfolio): bool
{
    $role = $user->role?->name;

    if ($role === 'student') {
        return $user->id === $studentPortfolio->user_id;
    }

    return in_array($role, ['coordinator', 'admin']);
}

public function delete(User $user): bool
{
    return $user->role?->name === 'admin';
}
}