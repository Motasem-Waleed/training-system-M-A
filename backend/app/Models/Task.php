<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\HidesArchived;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory, HidesArchived;

    protected $fillable = [
        'title', 'description', 'training_assignment_id', 'assigned_by',
        'due_date', 'status', 'instructions', 'target_type', 'target_ids',
        'task_type', 'attachments', 'grading_weight', 'allow_resubmission', 'is_required', 'distribution_key'
    ];

    protected $casts = [
        'due_date' => 'date',
        'target_ids' => 'array',
        'attachments' => 'array',
        'allow_resubmission' => 'boolean',
        'is_required' => 'boolean',
    ];

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function submissions()
    {
        return $this->hasMany(TaskSubmission::class);
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