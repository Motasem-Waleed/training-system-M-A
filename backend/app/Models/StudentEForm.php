<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentEForm extends Model
{
    use HasFactory;

    protected $table = 'student_eforms';

    protected $fillable = [
        'user_id',
        'form_key',
        'title',
        'payload',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'submitted_at' => 'datetime',
    ];
}
