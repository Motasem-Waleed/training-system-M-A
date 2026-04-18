<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingRequestBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'governing_body',
        'directorate',
        'status',
        'letter_number',
        'letter_date',
        'content',
        'created_by',
        'sent_at',
    ];

    protected $casts = [
        'letter_date' => 'date',
        'sent_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(TrainingRequestBatchItem::class, 'batch_id');
    }

    public function trainingRequests()
    {
        return $this->belongsToMany(
            TrainingRequest::class,
            'training_request_batch_items',
            'batch_id',
            'training_request_id'
        )->withTimestamps();
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

