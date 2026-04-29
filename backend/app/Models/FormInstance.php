<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormInstance extends Model
{
    use HasFactory;

    public const STATUS_NOT_STARTED = 'not_started';
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_RETURNED = 'returned';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_FINALIZED = 'finalized';

    protected $fillable = [
        'form_template_id',
        'training_assignment_id',
        'owner_user_id',
        'subject_user_id',
        'owner_type',
        'status',
        'payload',
        'visibility_roles',
        'workflow_state',
        'available_at',
        'due_at',
        'submitted_at',
        'approved_at',
        'finalized_at',
        'submitted_by',
        'current_reviewer_id',
        'current_review_step',
    ];

    protected $casts = [
        'payload' => 'array',
        'visibility_roles' => 'array',
        'workflow_state' => 'array',
        'available_at' => 'datetime',
        'due_at' => 'datetime',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function subject()
    {
        return $this->belongsTo(User::class, 'subject_user_id');
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function currentReviewer()
    {
        return $this->belongsTo(User::class, 'current_reviewer_id');
    }

    public function reviews()
    {
        return $this->hasMany(FormReview::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(FormAuditLog::class);
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
