<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TrainingLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'training_assignment_id', 'log_date', 'start_time', 'end_time',
        'activities_performed', 'supervisor_notes', 'student_reflection', 'status',
        'academic_review_status', 'academic_note', 'needs_discussion', 'academic_reviewed_at'
    ];

    protected $casts = [
        'log_date' => 'date',
        'start_time' => 'datetime:H:i:s',
        'end_time' => 'datetime:H:i:s',
        'needs_discussion' => 'boolean',
        'academic_reviewed_at' => 'datetime',
    ];

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function scopeVisibleToAcademicSupervisor(Builder $query, User $user): Builder
    {
        return $query->whereHas('trainingAssignment', fn (Builder $q) => $q->where('academic_supervisor_id', $user->id));
    }

    public function scopeForTrainingTrack(Builder $query, string $track): Builder
    {
        return $query->whereHas('trainingAssignment', fn (Builder $q) => $q->forTrainingTrack($track));
    }
}