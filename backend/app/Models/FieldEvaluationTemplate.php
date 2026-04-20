<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FieldEvaluationTemplate extends Model
{
    use HasFactory;

    protected $table = 'field_evaluation_templates';

    protected $fillable = [
        'name',
        'code',
        'applies_to',
        'criteria',
        'total_score',
        'score_ranges',
        'allow_draft',
        'is_active',
    ];

    protected $casts = [
        'criteria' => 'array',
        'score_ranges' => 'array',
        'allow_draft' => 'boolean',
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
     * التقييمات المستخدمة لهذا القالب
     */
    public function fieldEvaluations()
    {
        return $this->hasMany(FieldEvaluation::class, 'template_id');
    }

    /**
     * حساب الدرجة النهائية
     */
    public function calculateGrade(int $totalScore): array
    {
        $ranges = $this->score_ranges ?? $this->getDefaultScoreRanges();
        
        foreach ($ranges as $grade => $range) {
            if ($totalScore >= $range['min']) {
                return [
                    'grade' => $grade,
                    'label' => $range['label'],
                    'color' => $range['color'] ?? 'gray',
                ];
            }
        }

        return [
            'grade' => 'fail',
            'label' => 'ضعيف',
            'color' => 'red',
        ];
    }

    /**
     * نطاقات الدرجات الافتراضية
     */
    private function getDefaultScoreRanges(): array
    {
        return [
            'excellent' => ['min' => 90, 'label' => 'ممتاز', 'color' => 'green'],
            'very_good' => ['min' => 80, 'label' => 'جيد جداً', 'color' => 'blue'],
            'good' => ['min' => 70, 'label' => 'جيد', 'color' => 'yellow'],
            'pass' => ['min' => 60, 'label' => 'مقبول', 'color' => 'orange'],
        ];
    }

    /**
     * الحصول على القالب الافتراضي حسب النوع
     */
    public static function getDefaultForType(string $type): ?self
    {
        return self::active()
            ->forType($type)
            ->first();
    }
}
