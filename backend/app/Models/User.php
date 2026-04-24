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
        'department_id', 'role_id', 'phone', 'training_site_id', 'directorate',
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

    public function trainingSite()
    {
        return $this->belongsTo(TrainingSite::class);
    }
    public function hasPermission($permission)
{
    return $this->role && $this->role->permissions->contains('name', $permission);
}

    public function hasRole(string $role): bool
    {
        return $this->role?->name === $role;
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

    public function trainingProgram()
    {
        return $this->hasOne(TrainingProgram::class, 'user_id');
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

    /**
     * آخر تسجيل شعبة للطالب مع العلاقات اللازمة.
     */
    public function currentEnrollment(): ?Enrollment
    {
        return $this->enrollments()
            ->with(['section.course'])
            ->latest('id')
            ->first();
    }

    /**
     * تحديد مسار الطالب بناءً على role + section/course/department.
     */
    public function resolveStudentTrack(): ?string
    {
        if ($this->role?->name !== 'student') {
            return null;
        }

        $enrollment = $this->currentEnrollment();
        $courseCode = strtolower((string) data_get($enrollment, 'section.course.code', ''));
        $courseName = strtolower((string) data_get($enrollment, 'section.course.name', ''));
        $departmentName = strtolower((string) data_get($this, 'department.name', ''));

        if (str_contains($courseCode, 'psyc') || str_contains($courseName, 'نفسي') || str_contains($departmentName, 'psych')) {
            return 'psychology';
        }

        if (str_contains($courseCode, 'educ') || str_contains($courseName, 'تربية') || str_contains($departmentName, 'usool') || str_contains($departmentName, 'tarb')) {
            return 'education';
        }

        return null;
    }

    /** أحدث تعيين تدريبي مرتبط بتسجيل الطالب (للجدول، السجل، المهام). */
    public function currentTrainingAssignment(): ?TrainingAssignment
    {
        $enrollment = $this->enrollments()->latest('id')->first();
        if (! $enrollment) {
            return null;
        }

        return $enrollment->trainingAssignments()
            ->with(['trainingSite', 'teacher', 'trainingPeriod'])
            ->latest('id')
            ->first();
    }

    // ─── علاقات المشرف الميداني ───

    /**
     * المشرف الميداني: ملف التعريف
     */
    public function fieldSupervisorProfile()
    {
        return $this->hasOne(FieldSupervisorProfile::class);
    }

    /**
     * المشرف الميداني: التقارير اليومية للمراجعة
     */
    public function dailyReportsToReview()
    {
        return $this->hasMany(DailyReport::class, 'field_supervisor_id');
    }

    /**
     * المشرف الميداني: التقييمات الميدانية
     */
    public function fieldEvaluationsGiven()
    {
        return $this->hasMany(FieldEvaluation::class, 'field_supervisor_id');
    }

    /**
     * الطالب: التقارير اليومية المرفوعة
     */
    public function dailyReports()
    {
        return $this->hasMany(DailyReport::class, 'student_id');
    }

    /**
     * الطالب: التقييمات الميدانية المستلمة
     */
    public function fieldEvaluations()
    {
        return $this->hasMany(FieldEvaluation::class, 'student_id');
    }

    /**
     * التحقق إذا كان المستخدم مشرف ميداني
     */
    public function isFieldSupervisor(): bool
    {
        return $this->fieldSupervisorProfile()->exists();
    }

    /**
     * الحصول على نوع المشرف الميداني
     */
    public function getFieldSupervisorType(): ?string
    {
        return $this->fieldSupervisorProfile?->supervisor_type;
    }
}
