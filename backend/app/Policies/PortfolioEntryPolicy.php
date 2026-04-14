<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PortfolioEntry;

class PortfolioEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // يمكن للجميع عرض القوائم، لكن سيتم تصفيتها حسب الصلاحية
    }

    public function view(User $user, PortfolioEntry $entry): bool
    {
        // يمكن للمستخدم رؤية المدخل إذا كان هو مالك ملف الإنجاز أو أدمن
        return $user->id === $entry->studentPortfolio->user_id || $user->role?->name === 'admin';
    }

    public function create(User $user): bool
    {
        // يمكن لأي مستخدم مسجل الدخول إنشاء مدخل (سيتم ربطه بملفه)
        return true;
    }

    public function update(User $user, PortfolioEntry $entry): bool
    {
        // فقط مالك المدخل أو الأدمن يمكنه التعديل
        return $user->id === $entry->studentPortfolio->user_id || $user->role?->name === 'admin';
    }

    public function delete(User $user, PortfolioEntry $entry): bool
    {
        return $this->update($user, $entry);
    }
}