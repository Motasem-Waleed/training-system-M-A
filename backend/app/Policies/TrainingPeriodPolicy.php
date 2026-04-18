<?php

namespace App\Policies;

use App\Models\TrainingPeriod;
use App\Models\User;

class TrainingPeriodPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TrainingPeriod $trainingPeriod): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->name, ['admin', 'coordinator', 'training_coordinator'], true);
    }

    public function update(User $user, TrainingPeriod $trainingPeriod): bool
    {
        return in_array($user->role?->name, ['admin', 'coordinator', 'training_coordinator'], true);
    }

    public function delete(User $user, TrainingPeriod $trainingPeriod): bool
    {
        return in_array($user->role?->name, ['admin', 'coordinator', 'training_coordinator'], true);
    }
}
