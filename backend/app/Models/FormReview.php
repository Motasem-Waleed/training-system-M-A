<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_instance_id',
        'step',
        'reviewer_role',
        'reviewer_id',
        'status',
        'comment',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function instance()
    {
        return $this->belongsTo(FormInstance::class, 'form_instance_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
