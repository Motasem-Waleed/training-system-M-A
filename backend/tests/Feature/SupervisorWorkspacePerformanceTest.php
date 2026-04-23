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
use App\Models\TrainingPeriod;
use App\Models\TrainingRequest;
use App\Models\TrainingSite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupervisorWorkspacePerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_students_endpoint_query_count_is_reasonable_for_page_size(): void
    {
        $ctx = $this->seedDataset(12);
        Sanctum::actingAs($ctx['supervisor']);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->getJson('/api/supervisor/students?page=1&per_page=10');

        $response->assertOk()->assertJsonPath('success', true);
        $queries = DB::getQueryLog();

        // Guard against accidental N+1 regression.
        $this->assertLessThanOrEqual(40, count($queries));
    }

    private function seedDataset(int $studentsCount): array
    {
        $supervisorRole = Role::create(['name' => 'academic_supervisor']);
        $studentRole = Role::create(['name' => 'student']);
        $department = Department::create(['name' => 'usool_tarbiah']);

        $supervisor = User::create([
            'name' => 'Perf Supervisor',
            'email' => 'perf.supervisor@example.com',
            'role_id' => $supervisorRole->id,
            'department_id' => $department->id,
            'university_id' => 'SUP-PERF-01',
            'password' => bcrypt('password'),
        ]);

        $course = Course::create([
            'code' => 'EDUC430',
            'name' => 'Perf Course',
            'credit_hours' => 3,
            'type' => 'practical',
        ]);

        $period = TrainingPeriod::create([
            'name' => '2026-Perf',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'is_active' => true,
        ]);

        $site = TrainingSite::create([
            'name' => 'Perf School',
            'location' => 'Hebron',
            'is_active' => true,
            'directorate' => 'وسط',
            'capacity' => 60,
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
            'name' => 'Perf Section',
            'academic_year' => (int) now()->format('Y'),
            'academic_supervisor_id' => $supervisor->id,
            'semester' => 'first',
            'course_id' => $course->id,
        ]);

        for ($i = 1; $i <= $studentsCount; $i++) {
            $student = User::create([
                'name' => "Perf Student {$i}",
                'email' => "perf.student{$i}@example.com",
                'role_id' => $studentRole->id,
                'department_id' => $department->id,
                'university_id' => sprintf('STD-PERF-%03d', $i),
                'password' => bcrypt('password'),
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
                'status' => $i % 5 === 0 ? 'absent' : 'present',
            ]);

            $task = Task::create([
                'training_assignment_id' => $assignment->id,
                'assigned_by' => $supervisor->id,
                'title' => "Task {$i}",
                'description' => 'Perf task',
                'due_date' => now()->addDays(3)->toDateString(),
                'status' => 'pending',
            ]);

            TaskSubmission::create([
                'task_id' => $task->id,
                'user_id' => $student->id,
                'notes' => 'Perf submission',
                'submitted_at' => now(),
                'review_status' => $i % 4 === 0 ? 'pending' : null,
            ]);
        }

        return compact('supervisor');
    }
}
