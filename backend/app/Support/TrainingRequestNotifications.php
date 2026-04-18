<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\TrainingRequest;
use App\Models\User;

class TrainingRequestNotifications
{
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
}
