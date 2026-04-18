<?php

namespace App\Providers;

use App\Models\User;
use App\Models\TrainingRequest;
use App\Models\TrainingAssignment;
use App\Models\Task;
use App\Models\TaskSubmission;        // <-- أضف هذا
use App\Models\Evaluation;
use App\Models\Attendance;
use App\Models\StudentPortfolio;
use App\Models\TrainingSite;
use App\Models\PortfolioEntry;
use App\Models\OfficialLetter;         // <-- أضف هذا إذا لم يكن موجوداً
use App\Models\EvaluationTemplate;
use App\Models\Course;
use App\Models\TrainingPeriod;
use App\Models\WeeklySchedule;
use App\Models\Notification;
use App\Policies\UserPolicy;
use App\Policies\TrainingRequestPolicy;
use App\Policies\TrainingAssignmentPolicy;
use App\Policies\TaskPolicy;
use App\Policies\TaskSubmissionPolicy;  // <-- أضف هذا
use App\Policies\EvaluationPolicy;
use App\Policies\AttendancePolicy;
use App\Policies\StudentPortfolioPolicy;
use App\Policies\TrainingSitePolicy;
use App\Policies\PortfolioEntryPolicy;
use App\Policies\OfficialLetterPolicy;   // <-- أضف هذا
use App\Policies\EvaluationTemplatePolicy;
use App\Policies\CoursePolicy;
use App\Policies\TrainingPeriodPolicy;
use App\Policies\WeeklySchedulePolicy;
use App\Policies\NotificationPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        TrainingRequest::class => TrainingRequestPolicy::class,
        TrainingAssignment::class => TrainingAssignmentPolicy::class,
        Evaluation::class => EvaluationPolicy::class,
        User::class => UserPolicy::class,
        Attendance::class => AttendancePolicy::class,
        Task::class => TaskPolicy::class,
        TaskSubmission::class => TaskSubmissionPolicy::class,   // <-- أضف هذا السطر
        OfficialLetter::class => OfficialLetterPolicy::class,
        EvaluationTemplate::class => EvaluationTemplatePolicy::class,
        TrainingSite::class => TrainingSitePolicy::class,
        PortfolioEntry::class => PortfolioEntryPolicy::class,
        StudentPortfolio::class => StudentPortfolioPolicy::class, // إذا كان لديك
        Course::class => CoursePolicy::class,
        TrainingPeriod::class => TrainingPeriodPolicy::class,
        WeeklySchedule::class => WeeklySchedulePolicy::class,
        Notification::class => NotificationPolicy::class,
    ];

    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            if ($user->role?->name === 'admin') {
                return true;
            }
        });
    }
}