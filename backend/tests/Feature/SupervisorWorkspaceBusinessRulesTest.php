<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Evaluation;
use App\Models\EvaluationTemplate;
use App\Models\Role;
use App\Models\Section;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\TrainingAssignment;
use App\Models\TrainingPeriod;
use App\Models\TrainingRequest;
use App\Models\TrainingSite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupervisorWorkspaceBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_cannot_open_student_outside_his_assignment(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['otherSupervisor']);

        $response = $this->getJson("/api/supervisor/students/{$ctx['student']->id}/overview");

        $response->assertStatus(403);
    }

    public function test_attendance_comment_adds_academic_note_without_changing_raw_attendance_values(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $attendance = Attendance::create([
            'training_assignment_id' => $ctx['assignment']->id,
            'user_id' => $ctx['student']->id,
            'date' => now()->toDateString(),
            'check_in' => '08:00:00',
            'check_out' => '13:00:00',
            'status' => 'present',
            'notes' => 'student raw note',
        ]);

        $response = $this->postJson("/api/supervisor/students/{$ctx['student']->id}/attendance-comment", [
            'attendance_id' => $attendance->id,
            'comment' => 'academic note only',
        ]);

        $response->assertOk()->assertJsonPath('success', true);

        $attendance->refresh();
        $this->assertSame('student raw note', $attendance->notes);
        $this->assertSame('08:00:00', substr((string) $attendance->check_in, 11, 8));
        $this->assertSame('13:00:00', substr((string) $attendance->check_out, 11, 8));
        $this->assertSame('academic note only', $attendance->academic_note);
    }

    public function test_academic_evaluation_draft_is_read_only_after_final_submit(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $template = EvaluationTemplate::create([
            'name' => 'Academic Template',
            'description' => 'Template',
            'form_type' => 'evaluation',
            'target_role' => 'academic_supervisor',
        ]);

        Evaluation::create([
            'training_assignment_id' => $ctx['assignment']->id,
            'evaluator_id' => $ctx['supervisor']->id,
            'template_id' => $template->id,
            'total_score' => 90,
            'status' => 'final',
            'is_final' => true,
        ]);

        $response = $this->postJson("/api/supervisor/students/{$ctx['student']->id}/academic-evaluation-draft", [
            'criteria_scores' => [
                ['criterion' => 'criterion 1', 'score' => 50],
            ],
            'notes' => 'attempted edit',
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_task_update_is_blocked_after_submission_exists(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $task = Task::create([
            'training_assignment_id' => $ctx['assignment']->id,
            'assigned_by' => $ctx['supervisor']->id,
            'title' => 'Task A',
            'description' => 'desc',
            'due_date' => now()->addDay()->toDateString(),
            'status' => 'pending',
        ]);

        TaskSubmission::create([
            'task_id' => $task->id,
            'user_id' => $ctx['student']->id,
            'notes' => 'submitted',
            'submitted_at' => now(),
        ]);

        $response = $this->putJson("/api/supervisor/tasks/{$task->id}", [
            'title' => 'Updated Task A',
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_store_task_for_section_creates_task_for_each_supervised_student_in_section(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $student2 = User::create([
            'name' => 'Student Two',
            'email' => 'std2@example.com',
            'role_id' => $ctx['student']->role_id,
            'department_id' => $ctx['student']->department_id,
            'university_id' => 'STD-002',
            'password' => bcrypt('password'),
        ]);

        $enrollment2 = Enrollment::create([
            'user_id' => $student2->id,
            'section_id' => $ctx['section']->id,
            'academic_year' => $ctx['enrollment']->academic_year,
            'semester' => $ctx['enrollment']->semester,
            'status' => 'active',
        ]);

        TrainingAssignment::create([
            'enrollment_id' => $enrollment2->id,
            'training_request_id' => $ctx['assignment']->training_request_id,
            'training_request_student_id' => null,
            'training_site_id' => $ctx['assignment']->training_site_id,
            'training_period_id' => $ctx['assignment']->training_period_id,
            'teacher_id' => null,
            'academic_supervisor_id' => $ctx['supervisor']->id,
            'coordinator_id' => null,
            'status' => 'ongoing',
            'start_date' => $ctx['assignment']->start_date,
            'end_date' => $ctx['assignment']->end_date,
        ]);

        $response = $this->postJson('/api/supervisor/tasks', [
            'title' => 'Section-wide homework',
            'due_date' => now()->addWeek()->toDateString(),
            'target_type' => 'section',
            'target_ids' => [$ctx['section']->id],
            'task_type' => 'general',
        ]);

        $response->assertCreated()->assertJsonPath('success', true);
        $this->assertSame(2, Task::query()->where('title', 'Section-wide homework')->count());
    }

    private function createSupervisionContext(): array
    {
        $role = Role::create(['name' => 'academic_supervisor']);
        $studentRole = Role::create(['name' => 'student']);
        $department = Department::create(['name' => 'usool_tarbiah']);

        $supervisor = User::create([
            'name' => 'Supervisor One',
            'email' => 'sup1@example.com',
            'role_id' => $role->id,
            'department_id' => $department->id,
            'university_id' => 'SUP-001',
            'password' => bcrypt('password'),
        ]);

        $otherSupervisor = User::create([
            'name' => 'Supervisor Two',
            'email' => 'sup2@example.com',
            'role_id' => $role->id,
            'department_id' => $department->id,
            'university_id' => 'SUP-002',
            'password' => bcrypt('password'),
        ]);

        $student = User::create([
            'name' => 'Student One',
            'email' => 'std1@example.com',
            'role_id' => $studentRole->id,
            'department_id' => $department->id,
            'university_id' => 'STD-001',
            'password' => bcrypt('password'),
        ]);

        $course = Course::create([
            'code' => 'EDUC310',
            'name' => 'Practical Training',
            'credit_hours' => 3,
            'type' => 'practical',
        ]);

        $period = TrainingPeriod::create([
            'name' => '2026-Spring',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'is_active' => true,
        ]);

        $site = TrainingSite::create([
            'name' => 'School A',
            'location' => 'Hebron',
            'is_active' => true,
            'directorate' => 'وسط',
            'capacity' => 20,
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
            'name' => 'Section 1',
            'academic_year' => (int) now()->format('Y'),
            'academic_supervisor_id' => $supervisor->id,
            'semester' => 'second',
            'course_id' => $course->id,
        ]);

        $enrollment = Enrollment::create([
            'user_id' => $student->id,
            'section_id' => $section->id,
            'academic_year' => (int) now()->format('Y'),
            'semester' => 'second',
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

        return compact('supervisor', 'otherSupervisor', 'student', 'assignment', 'section', 'enrollment');
    }
}
