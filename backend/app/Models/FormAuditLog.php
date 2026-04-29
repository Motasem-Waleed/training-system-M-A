<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_instance_id',
        'user_id',
        'action',
        'message',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function instance()
    {
        return $this->belongsTo(FormInstance::class, 'form_instance_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
