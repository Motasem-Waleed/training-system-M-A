<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyReportTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'applies_to',
        'fields',
        'allowed_attachments',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'fields' => 'array',
        'allowed_attachments' => 'array',
        'is_active' => 'boolean',
    ];

    const TYPE_MENTOR_TEACHER = 'mentor_teacher';
    const TYPE_SCHOOL_COUNSELOR = 'school_counselor';
    const TYPE_PSYCHOLOGIST = 'psychologist';

    /**
     * نطاق: القوالب النشطة
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * نطاق: القوالب لنوع معين
     */
    public function scopeForType($query, string $type)
    {
        return $query->where(function($q) use ($type) {
            $q->where('applies_to', $type)
              ->orWhere('applies_to', 'all');
        });
    }

    /**
     * التقارير المستخدمة لهذا القالب
     */
    public function dailyReports()
    {
        return $this->hasMany(DailyReport::class, 'template_id');
    }

    /**
     * الحصول على القالب الافتراضي حسب النوع
     */
    public static function getDefaultForType(string $type): ?self
    {
        return self::active()
            ->forType($type)
            ->orderBy('sort_order')
            ->first();
    }
}
