<?php

namespace App\Helpers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * تسجيل نشاط في النظام.
     *
     * @param string      $type        نوع الكيان (user, training_request, ...)
     * @param string      $action      الإجراء (created, updated, deleted, login, ...)
     * @param string      $description وصف النشاط بالعربية
     * @param Model|null  $subject     الكيان المتأثر (اختياري)
     * @param array       $properties  بيانات إضافية (اختياري)
     * @param Model|null  $causer      المستخدم الذي قام بالإجراء (اختياري)
     */
    public static function log(
        string $type,
        string $action,
        string $description,
        ?Model $subject = null,
        array $properties = [],
        ?Model $causer = null
    ): ActivityLog {
        $oldData = $properties['old'] ?? null;
        $newData = $properties['new'] ?? null;
        unset($properties['old'], $properties['new']);

        return ActivityLog::create([
            'user_id'     => $causer?->getKey() ?? auth()->id(),
            'action'      => $type . '.' . $action,
            'description' => $description,
            'ip_address'  => Request::ip(),
            'old_data'    => $oldData,
            'new_data'    => $newData ?? $properties,
            'method'      => Request::method(),
            'route'       => Request::path(),
            'user_agent'  => Request::userAgent(),
        ]);
    }
}
