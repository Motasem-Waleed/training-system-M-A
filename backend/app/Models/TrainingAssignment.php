<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id', 'training_request_id', 'training_request_student_id',
        'training_site_id', 'training_period_id', 'teacher_id',
        'academic_supervisor_id', 'coordinator_id', 'status', 'start_date', 'end_date'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function trainingRequest()
    {
        return $this->belongsTo(TrainingRequest::class);
    }

    public function trainingRequestStudent()
    {
        return $this->belongsTo(TrainingRequestStudent::class);
    }

    public function trainingSite()
    {
        return $this->belongsTo(TrainingSite::class);
    }

    public function trainingPeriod()
    {
        return $this->belongsTo(TrainingPeriod::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function academicSupervisor()
    {
        return $this->belongsTo(User::class, 'academic_supervisor_id');
    }

    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

 public function trainingLogs()
{
    return $this->hasMany(TrainingLog::class);
}

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function supervisorVisits()
    {
        return $this->hasMany(SupervisorVisit::class);
    }

    public function studentPortfolio()
    {
        return $this->hasOne(StudentPortfolio::class);
    }
}