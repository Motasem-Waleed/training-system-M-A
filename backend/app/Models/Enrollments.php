<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = ['user_id', 'section_id', 'academic_year', 'semester', 'status', 'final_grade'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

 public function trainingAssignment()
{
    return $this->hasMany(TrainingAssignment::class); // أو hasMany حسب العلاقة
}
    
}