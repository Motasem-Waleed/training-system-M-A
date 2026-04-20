<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Attendance;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role?->name, [
            'admin',
            'teacher',
            'field_supervisor',
            'school_manager',
            'psychology_center_manager',
            'academic_supervisor',
            'student',
        ], true);
    }

    public function view(User $user, Attendance $attendance): bool
    {
        if ($user->id === $attendance->user_id) return true;
        if ($user->id === $attendance->trainingAssignment->teacher_id) return true;
        if ($user->id === $attendance->trainingAssignment->academic_supervisor_id) return true;
        return $user->role?->name === 'admin';
    }

    public function create(User $user): bool
    {
        return true; // الطالب أو المعلم يمكنه تسجيل الحضور
    }

    public function approve(User $user, Attendance $attendance): bool
    {
        return $user->id === $attendance->trainingAssignment->teacher_id || $user->role?->name === 'admin';
    }
}