<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\HidesArchived;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, HidesArchived;

    protected $fillable = [
        'user_id', 'type', 'message', 'notifiable_type', 'notifiable_id',
        'read_at', 'data'
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}