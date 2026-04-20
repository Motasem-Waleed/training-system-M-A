<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'training_request_student_id',
        'day',
        'date',
        'check_in',
        'check_out',
        'lessons_count',
        'notes',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'date' => 'date',
        'check_in' => 'datetime:H:i',
        'check_out' => 'datetime:H:i',
        'approved_at' => 'datetime',
    ];

    /**
     * الطالب
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * رابط طلب التدريب (لمعرفة جهة التدريب)
     */
    public function trainingRequestStudent(): BelongsTo
    {
        return $this->belongsTo(TrainingRequestStudent::class);
    }

    /**
     * من اعتمد السجل
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope للطالب الحالي
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope للتاريخ
     */
    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    /**
     * Scope للفترة
     */
    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * حساب عدد ساعات الحضور
     */
    public function getWorkingHoursAttribute(): float
    {
        if (!$this->check_in || !$this->check_out) {
            return 0;
        }
        
        $checkIn = \Carbon\Carbon::parse($this->check_in);
        $checkOut = \Carbon\Carbon::parse($this->check_out);
        
        return round($checkIn->diffInHours($checkOut, false), 2);
    }
}
