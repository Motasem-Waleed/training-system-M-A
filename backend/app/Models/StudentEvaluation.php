<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\HidesArchived;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEvaluation extends Model
{
    use HasFactory, HidesArchived;

    protected $fillable = [
        'student_id',
        'evaluator_id',
        'training_request_student_id',
        // Rating fields from evaluation image
        'supervisor',
        'attendance',
        'cooperation_with_staff',
        'professionalism',
        'dealing_with_students',
        'manners',
        'participation_in_activities',
        'school',
        'comfort',
        'professional_ethics',
        'general_notes',
        'evaluation_date',
    ];

    protected $casts = [
        'evaluation_date' => 'date',
        'supervisor' => 'integer',
        'attendance' => 'integer',
        'cooperation_with_staff' => 'integer',
        'professionalism' => 'integer',
        'dealing_with_students' => 'integer',
        'manners' => 'integer',
        'participation_in_activities' => 'integer',
        'school' => 'integer',
        'comfort' => 'integer',
        'professional_ethics' => 'integer',
    ];

    /**
     * Get the student being evaluated.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the evaluator (school manager).
     */
    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    /**
     * Get the training request student relationship.
     */
    public function trainingRequestStudent(): BelongsTo
    {
        return $this->belongsTo(TrainingRequestStudent::class);
    }

    /**
     * Calculate the average rating.
     */
    public function getAverageRatingAttribute(): float
    {
        $ratings = [
            $this->supervisor,
            $this->attendance,
            $this->cooperation_with_staff,
            $this->professionalism,
            $this->dealing_with_students,
            $this->manners,
            $this->participation_in_activities,
            $this->school,
            $this->comfort,
            $this->professional_ethics,
        ];

        $validRatings = array_filter($ratings, fn($rating) => $rating !== null && $rating > 0);

        if (empty($validRatings)) {
            return 0;
        }

        return round(array_sum($validRatings) / count($validRatings), 2);
    }

    /**
     * Get the rating level based on average.
     */
    public function getRatingLevelAttribute(): string
    {
        $average = $this->average_rating;

        if ($average >= 4.5) {
            return 'ممتاز';
        } elseif ($average >= 3.5) {
            return 'جيد جداً';
        } elseif ($average >= 2.5) {
            return 'جيد';
        } elseif ($average >= 1.5) {
            return 'مقبول';
        } else {
            return 'ضعيف';
        }
    }

    /**
     * Scope to get evaluations by evaluator.
     */
    public function scopeByEvaluator($query, $evaluatorId)
    {
        return $query->where('evaluator_id', $evaluatorId);
    }

    /**
     * Scope to get evaluations by student.
     */
    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Scope to get evaluations within date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('evaluation_date', [$startDate, $endDate]);
    }
}
