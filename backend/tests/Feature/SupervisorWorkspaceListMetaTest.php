<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Role;
use App\Models\Section;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\TrainingAssignment;
use App\Models\TrainingLog;
use App\Models\TrainingPeriod;
use App\Models\TrainingRequest;
use App\Models\TrainingSite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupervisorWorkspaceListMetaTest extends TestCase
{
    use RefreshDatabase;

    public function test_students_and_sections_include_meta_filters_summary(): void
    {
        $ctx = $this->createContextWithData();
        Sanctum::actingAs($ctx['supervisor']);

        $students = $this->getJson('/api/supervisor/students?search=Meta&page=1&per_page=1');
        $students->assertOk()->assertJsonStructure([
            'success', 'message', 'data', 'meta', 'filters', 'summary',
        ]);
        $students->assertJsonPath('meta.page', 1);
        $students->assertJsonPath('meta.per_page', 1);
        $this->assertCount(1, $students->json('data'));

        $sections = $this->getJson('/api/supervisor/sections?semester=first&page=1&per_page=1');
        $sections->assertOk()->assertJsonStructure([
            'success', 'message', 'data', 'meta', 'filters', 'summary',
        ]);
        $sections->assertJsonPath('meta.page', 1);
        $sections->assertJsonPath('meta.per_page', 1);
        $this->assertCount(1, $sections->json('data'));
    }

    public function test_student_lists_include_meta_filters_summary(): void
    {
        $ctx = $this->createContextWithData();
        Sanctum::actingAs($ctx['supervisor']);

        $attendance = $this->getJson("/api/supervisor/students/{$ctx['student']->id}/attendance?status=present");
        $attendance->assertOk()->assertJsonStructure([
            'success', 'message', 'data' => ['records', 'summary'], 'meta', 'filters',
        ]);

        $logs = $this->getJson("/api/supervisor/students/{$ctx['student']->id}/daily-logs?status=approved");
        $logs->assertOk()->assertJsonStructure([
            'success', 'message', 'data' => ['logs', 'counters', 'status_distribution'], 'meta', 'filters', 'summary',
        ]);

        $tasks = $this->getJson("/api/supervisor/students/{$ctx['student']->id}/tasks?status=pending");
        $tasks->assertOk()->assertJsonStructure([
            'success', 'message', 'data', 'meta', 'filters', 'summary',
        ]);

        $submissions = $this->getJson("/api/supervisor/students/{$ctx['student']->id}/task-submissions?review_status=pending");
        $submissions->assertOk()->assertJsonStructure([
            'success', 'message', 'data', 'meta', 'filters', 'summary',
        ]);
    }

    private function createContextWithData(): array
    {
        $supervisorRole = Role::create(['name' => 'academic_supervisor']);
        $studentRole = Role::create(['name' => 'student']);
        $department = Department::create(['name' => 'usool_tarbiah']);

        $supervisor = User::create([
            'name' => 'Supervisor Meta',
            'email' => 'meta.sup@example.com',
            'role_id' => $supervisorRole->id,
            'department_id' => $department->id,
            'university_id' => 'SUP-META-01',
            'password' => bcrypt('password'),
        ]);

        $student = User::create([
            'name' => 'Student Meta',
            'email' => 'meta.std@example.com',
            'role_id' => $studentRole->id,
            'department_id' => $department->id,
            'university_id' => 'STD-META-01',
            'password' => bcrypt('password'),
        ]);

        $course = Course::create([
            'code' => 'EDUC420',
            'name' => 'Meta Training',
            'credit_hours' => 3,
            'type' => 'practical',
        ]);

        $period = TrainingPeriod::create([
            'name' => '2026-Meta',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'is_active' => true,
        ]);

        $site = TrainingSite::create([
            'name' => 'Meta School',
            'location' => 'Hebron',
            'is_active' => true,
            'directorate' => 'وسط',
            'capacity' => 30,
            'site_type' => 'school',
            'governing_body' => 'directorate_of_education',
            'school_type' => 'public',
        ]);

        $trainingRequest = TrainingRequest::create([
            'training_site_id' => $site->id,
            'training_period_id' => $period->id,
            'status' => 'approved',
            'requested_at' => now(),
        ]);

        $section = Section::create([
            'name' => 'Meta Section',
            'academic_year' => (int) now()->format('Y'),
            'academic_supervisor_id' => $supervisor->id,
            'semester' => 'first',
            'course_id' => $course->id,
        ]);

        $enrollment = Enrollment::create([
            'user_id' => $student->id,
            'section_id' => $section->id,
            'academic_year' => (int) now()->format('Y'),
            'semester' => 'first',
            'status' => 'active',
        ]);

        $assignment = TrainingAssignment::create([
            'enrollment_id' => $enrollment->id,
            'training_request_id' => $trainingRequest->id,
            'training_request_student_id' => null,
            'training_site_id' => $site->id,
            'training_period_id' => $period->id,
            'teacher_id' => null,
            'academic_supervisor_id' => $supervisor->id,
            'coordinator_id' => null,
            'status' => 'ongoing',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        Attendance::create([
            'training_assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'date' => now()->toDateString(),
            'status' => 'present',
        ]);

        TrainingLog::create([
            'training_assignment_id' => $assignment->id,
            'log_date' => now()->toDateString(),
            'activities_performed' => 'activity',
            'student_reflection' => 'reflection',
            'status' => 'approved',
        ]);

        $task = Task::create([
            'training_assignment_id' => $assignment->id,
            'assigned_by' => $supervisor->id,
            'title' => 'Meta Task',
            'description' => 'desc',
            'due_date' => now()->addDay()->toDateString(),
            'status' => 'pending',
        ]);

        TaskSubmission::create([
            'task_id' => $task->id,
            'user_id' => $student->id,
            'notes' => 'meta submission',
            'submitted_at' => now(),
        ]);

        return compact('supervisor', 'student', 'assignment');
    }
}
