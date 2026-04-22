<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\TrainingRequest;
use App\Models\User;

class TrainingRequestNotifications
{
    public static function forCoordinatorsByDepartment(?int $departmentId, string $type, string $message, array $data = []): void
    {
        $ids = collect();

        if ($departmentId) {
            $ids = User::query()
                ->where('department_id', $departmentId)
                ->whereHas('role', fn ($q) => $q->whereIn('name', ['training_coordinator', 'coordinator']))
                ->pluck('id');
        }

        // إذا لم يوجد منسق في قسم الطالب، أرسل لجميع المنسقين
        if ($ids->isEmpty()) {
            $ids = User::query()
                ->whereHas('role', fn ($q) => $q->whereIn('name', ['training_coordinator', 'coordinator']))
                ->pluck('id');
        }

        foreach ($ids as $userId) {
            Notification::query()->create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'notifiable_type' => TrainingRequest::class,
                'notifiable_id' => (int) ($data['training_request_id'] ?? 0),
                'data' => $data,
            ]);
        }
    }

    public static function forCoordinators(string $type, string $message, array $data = []): void
    {
        $ids = User::query()
            ->whereHas('role', fn ($q) => $q->whereIn('name', ['training_coordinator', 'coordinator']))
            ->pluck('id');

        foreach ($ids as $userId) {
            Notification::query()->create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'notifiable_type' => TrainingRequest::class,
                'notifiable_id' => (int) ($data['training_request_id'] ?? 0),
                'data' => $data,
            ]);
        }
    }

    public static function forStudents(TrainingRequest $trainingRequest, string $type, string $message, array $data = []): void
    {
        $ids = $trainingRequest->trainingRequestStudents
            ->pluck('user_id')
            ->merge([$trainingRequest->requested_by])
            ->filter()
            ->unique()
            ->values();

        foreach ($ids as $userId) {
            if (! $userId || ! User::query()->whereKey($userId)->exists()) {
                continue;
            }

            Notification::query()->create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'notifiable_type' => TrainingRequest::class,
                'notifiable_id' => $trainingRequest->id,
                'data' => $data,
            ]);
        }
    }

    /**
     * إشعارات لمديريات التربية والصحة
     */
    public static function forDirectorate(string $governingBody, string $type, string $message, array $data = []): void
    {
        // تحديد الأدوار حسب الجهة
        $roles = match ($governingBody) {
            'directorate_of_education' => ['education_directorate', 'education_admin'],
            'ministry_of_health' => ['health_directorate', 'health_admin'],
            default => [],
        };

        if (empty($roles)) {
            return;
        }

        $query = User::query()
            ->whereHas('role', fn ($q) => $q->whereIn('name', $roles));

        if ($governingBody === 'directorate_of_education' && !empty($data['directorate'])) {
            $query->where('directorate', (string) $data['directorate']);
        }

        $ids = $query->pluck('id');

        foreach ($ids as $userId) {
            Notification::query()->create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'notifiable_type' => TrainingRequest::class,
                'notifiable_id' => (int) ($data['training_request_id'] ?? 0),
                'data' => $data,
            ]);
        }
    }

    /**
     * إشعارات لمدير المدرسة (School Manager)
     */
    public static function forSchoolManager(int $trainingSiteId, string $type, string $message, array $data = []): void
    {
        $ids = User::query()
            ->where(function ($q) {
                $q->whereHas('role', fn ($rq) => $rq->whereIn('name', ['school_manager', 'principal']));
            })
            ->where('training_site_id', $trainingSiteId)
            ->pluck('id');

        foreach ($ids as $userId) {
            Notification::query()->create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'notifiable_type' => TrainingRequest::class,
                'notifiable_id' => (int) ($data['training_request_id'] ?? 0),
                'data' => $data,
            ]);
        }
    }

    /**
     * إشعارات لجميع المدراء (Coordinator + Directorate + School)
     */
    public static function forAllManagers(TrainingRequest $trainingRequest, string $type, string $message, array $data = []): void
    {
        // إشعارات للمنسقين
        self::forCoordinators($type, $message, $data);

        // إشعارات للجهة الرسمية
        if (!empty($trainingRequest->governing_body)) {
            self::forDirectorate($trainingRequest->governing_body, $type, $message, $data);
        }

        // إشعارات لمدير المدرسة
        if ($trainingRequest->training_site_id) {
            self::forSchoolManager($trainingRequest->training_site_id, $type, $message, $data);
        }
    }
}
