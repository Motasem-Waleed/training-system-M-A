<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'form_type', 'target_role'];

    private static array $targetRoleLabels = [
        'teacher' => 'نموذج المعلم المرشد',
        'academic_supervisor' => 'نموذج المشرف الأكاديمي',
        'psychologist' => 'نموذج الأخصائي النفسي',
        'school_manager' => 'نموذج مدير المدرسة',
    ];

    public function getTargetRoleLabelAttribute(): string
    {
        return static::$targetRoleLabels[$this->target_role] ?? 'نموذج عام';
    }

    public function items()
    {
        return $this->hasMany(EvaluationItem::class, 'template_id');
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }
}