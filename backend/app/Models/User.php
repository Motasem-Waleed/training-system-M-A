<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'university_id', 'name', 'email', 'password', 'status',
        'department_id', 'role_id', 'phone'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // العلاقات
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
    public function hasPermission($permission)
{
    return $this->role && $this->role->permissions->contains('name', $permission);
}

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function trainingRequests()
    {
        return $this->hasMany(TrainingRequestStudent::class, 'user_id');
    }

    public function assignedTeacherRequests()
    {
        return $this->hasMany(TrainingRequestStudent::class, 'assigned_teacher_id');
    }

    public function evaluationsGiven()
    {
        return $this->hasMany(Evaluation::class, 'evaluator_id');
    }

    public function messagesSent()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function conversationsParticipantOne()
    {
        return $this->hasMany(Conversation::class, 'participant_one_id');
    }

    public function conversationsParticipantTwo()
    {
        return $this->hasMany(Conversation::class, 'participant_two_id');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'user_id');
    }

    public function backups()
    {
        return $this->hasMany(Backup::class, 'user_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    public function approvedAttendances()
    {
        return $this->hasMany(Attendance::class, 'approved_by');
    }

    public function tasksAssigned()
    {
        return $this->hasMany(Task::class, 'assigned_by');
    }

    public function taskSubmissions()
    {
        return $this->hasMany(TaskSubmission::class, 'user_id');
    }

    public function studentPortfolio()
    {
        return $this->hasOne(StudentPortfolio::class, 'user_id');
    }

    public function supervisorVisits()
    {
        return $this->hasMany(SupervisorVisit::class, 'supervisor_id');
    }

    public function sentOfficialLetters()
    {
        return $this->hasMany(OfficialLetter::class, 'sent_by');
    }

    public function receivedOfficialLetters()
    {
        return $this->hasMany(OfficialLetter::class, 'received_by');
    }

    public function notes()
    {
        return $this->hasMany(Note::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }
    public function submittedWeeklySchedules()
{
    return $this->hasMany(WeeklySchedule::class, 'submitted_by');
}

public function enrollments()
{
    return $this->hasMany(Enrollment::class);
}
}