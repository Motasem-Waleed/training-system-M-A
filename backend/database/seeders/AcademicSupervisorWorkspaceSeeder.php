<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\TrainingAssignment;
use App\Models\TrainingPeriod;
use App\Models\TrainingRequest;
use App\Models\TrainingRequestStudent;
use App\Models\TrainingSite;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * يربط طلاباً بتعيينات تدريب تحت المشرف supervisor@hebron.edu لاختبار واجهة المشرف الأكاديمي.
 */
class AcademicSupervisorWorkspaceSeeder extends Seeder
{
    public function run(): void
    {
        $supervisor = User::query()->where('email', 'supervisor@hebron.edu')->first();
        if (! $supervisor) {
            $this->command?->warn('تخطي AcademicSupervisorWorkspaceSeeder: لا يوجد supervisor@hebron.edu');

            return;
        }

        $teacher = User::query()->where('email', 'teacher@hebron.edu')->first();
        $coordinator = User::query()
            ->whereHas('role', fn ($q) => $q->where('name', 'training_coordinator'))
            ->orderBy('id')
            ->first();

        $site = TrainingSite::query()->orderBy('id')->first();
        $period = TrainingPeriod::query()->where('is_active', true)->orderBy('id')->first()
            ?? TrainingPeriod::query()->orderBy('id')->first();

        if (! $site || ! $period || ! $teacher) {
            $this->command?->warn('تخطي AcademicSupervisorWorkspaceSeeder: موقع تدريب أو فترة أو معلم مرشد ناقص.');

            return;
        }

        Section::query()->whereIn('name', ['شعبة A', 'شعبة B — تجريبي'])->update(['academic_supervisor_id' => $supervisor->id]);

        $sectionIds = Section::query()->where('academic_supervisor_id', $supervisor->id)->pluck('id');
        if ($sectionIds->isEmpty()) {
            $section = Section::query()->orderBy('id')->first();
            if ($section) {
                $section->update(['academic_supervisor_id' => $supervisor->id]);
                $sectionIds = collect([$section->id]);
            }
        }

        if ($sectionIds->isEmpty()) {
            $this->command?->warn('تخطي AcademicSupervisorWorkspaceSeeder: لا توجد شعب.');

            return;
        }

        $fallbackCourse = Course::query()->orderBy('id')->first();
        if (! $fallbackCourse) {
            $this->command?->warn('تخطي AcademicSupervisorWorkspaceSeeder: لا يوجد مساق.');

            return;
        }

        $tr = TrainingRequest::query()->updateOrCreate(
            ['letter_number' => 'HEBRON-SUPERVISOR-LINK-001'],
            [
                'requested_by' => $supervisor->id,
                'book_status' => 'school_approved',
                'status' => 'approved',
                'training_site_id' => $site->id,
                'training_period_id' => $period->id,
                'governing_body' => 'directorate_of_education',
                'requested_at' => now()->subDays(20),
                'school_approved_at' => now()->subDays(15),
            ]
        );

        $enrollments = Enrollment::query()
            ->whereIn('section_id', $sectionIds)
            ->where('status', 'active')
            ->whereHas('user.role', fn ($q) => $q->where('name', 'student'))
            ->with(['section.course', 'user'])
            ->get();

        $created = 0;
        foreach ($enrollments as $enrollment) {
            $student = $enrollment->user;
            if (! $student) {
                continue;
            }

            $courseId = $enrollment->section?->course_id ?? $fallbackCourse->id;

            $trs = TrainingRequestStudent::query()->updateOrCreate(
                [
                    'training_request_id' => $tr->id,
                    'user_id' => $student->id,
                ],
                [
                    'course_id' => $courseId,
                    'start_date' => $period->start_date,
                    'end_date' => $period->end_date,
                    'status' => 'approved',
                    'assigned_teacher_id' => $teacher->id,
                ]
            );

            TrainingAssignment::query()->updateOrCreate(
                ['enrollment_id' => $enrollment->id],
                [
                    'training_request_id' => $tr->id,
                    'training_request_student_id' => $trs->id,
                    'training_site_id' => $site->id,
                    'training_period_id' => $period->id,
                    'teacher_id' => $teacher->id,
                    'academic_supervisor_id' => $supervisor->id,
                    'coordinator_id' => $coordinator?->id,
                    'status' => 'ongoing',
                    'start_date' => $period->start_date,
                    'end_date' => $period->end_date,
                ]
            );
            $created++;
        }

        $usoolDeptId = Department::query()->where('name', 'usool_tarbiah')->value('id');
        if ($usoolDeptId) {
            User::query()->where('email', 'supervisor@hebron.edu')->whereNull('department_id')->update([
                'department_id' => $usoolDeptId,
            ]);
        }

        $this->command?->info("AcademicSupervisorWorkspaceSeeder: تم ربط {$created} طالباً/تعييناً بالمشرف supervisor@hebron.edu.");
    }
}
