<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class StudentPortfolio extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'training_assignment_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function entries()
    {
        return $this->hasMany(PortfolioEntry::class);
    }

    public function scopeVisibleToAcademicSupervisor(Builder $query, User $user): Builder
    {
        return $query->whereHas('trainingAssignment', fn (Builder $q) => $q->where('academic_supervisor_id', $user->id));
    }
}