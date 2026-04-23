<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['code', 'name', 'description', 'credit_hours', 'type', 'department_id'];

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function trainingRequestStudents()
    {
        return $this->hasMany(TrainingRequestStudent::class, 'course_id');
    }
}