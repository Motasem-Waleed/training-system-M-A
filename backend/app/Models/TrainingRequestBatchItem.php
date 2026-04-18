<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingRequestBatchItem extends Model
{
    use HasFactory;

    protected $table = 'training_request_batch_items';

    protected $fillable = [
        'batch_id',
        'training_request_id',
    ];

    public function batch()
    {
        return $this->belongsTo(TrainingRequestBatch::class, 'batch_id');
    }

    public function trainingRequest()
    {
        return $this->belongsTo(TrainingRequest::class, 'training_request_id');
    }
}

