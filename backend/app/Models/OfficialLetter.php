<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\HidesArchived;
use Illuminate\Database\Eloquent\Model;

class OfficialLetter extends Model
{
    use HasFactory, HidesArchived;

    protected $fillable = [
        'training_request_id', 'letter_number', 'letter_date', 'type',
        'content', 'file_path', 'sent_by', 'sent_at', 'received_by',
        'received_at', 'status', 'training_site_id', 'rejection_reason'
    ];

    protected $casts = [
        'letter_date' => 'date',
        'sent_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function trainingRequest()
    {
        return $this->belongsTo(TrainingRequest::class);
    }

    public function sentBy()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function trainingSite()
    {
        return $this->belongsTo(TrainingSite::class);
    }
}