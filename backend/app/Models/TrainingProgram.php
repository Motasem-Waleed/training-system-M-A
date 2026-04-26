<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'training_assignment_id', 'schedule', 'status', 'coordinator_note'];

    protected $casts = [
        'schedule' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }
}
