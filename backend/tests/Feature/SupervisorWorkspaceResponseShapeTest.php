<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Role;
use App\Models\Section;
use App\Models\TrainingAssignment;
use App\Models\TrainingPeriod;
use App\Models\TrainingRequest;
use App\Models\TrainingSite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupervisorWorkspaceResponseShapeTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_response_has_unified_shape(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $response = $this->getJson('/api/supervisor/stats');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'supervisor_profile',
                    'department_summary',
                    'sections_count',
                    'students_count',
                    'visits_this_week',
                    'track_distribution',
                ],
            ]);
    }

    public function test_students_and_sections_responses_follow_unified_shape(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $students = $this->getJson('/api/supervisor/students');
        $students->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'student_id',
                        'name',
                        'department',
                        'training_track',
                        'risk_level',
                    ],
                ],
            ]);

        $sections = $this->getJson('/api/supervisor/sections');
        $sections->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'section_name',
                        'course',
                        'department',
                        'training_track',
                        'students_count',
                    ],
                ],
            ]);
    }

    public function test_student_overview_response_contains_workspace_contract_keys(): void
    {
        $ctx = $this->createSupervisionContext();
        Sanctum::actingAs($ctx['supervisor']);

        $response = $this->getJson("/api/supervisor/students/{$ctx['student']->id}/overview");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'student',
                    'summaries',
                    'related_data',
                    'permissions',
                    'track_config_hints',
                ],
            ]);
    }

    private function createSupervisionContext(): array
    {
        $supervisorRole = Role::create(['name' => 'academic_supervisor']);
        $studentRole = Role::create(['name' => 'student']);
        $department = Department::create(['name' => 'usool_tarbiah']);

        $supervisor = User::create([
            'name' => 'Supervisor Shape',
            'email' => 'shape.sup@example.com',
            'role_id' => $supervisorRole->id,
            'department_id' => $department->id,
            'university_id' => 'SUP-SHAPE-01',
            'password' => bcrypt('password'),
        ]);

        $student = User::create([
            'name' => 'Student Shape',
            'email' => 'shape.std@example.com',
            'role_id' => $studentRole->id,
            'department_id' => $department->id,
            'university_id' => 'STD-SHAPE-01',
            'password' => bcrypt('password'),
        ]);

        $course = Course::create([
            'code' => 'EDUC410',
            'name' => 'Training Practice',
            'credit_hours' => 3,
            'type' => 'practical',
        ]);

        $period = TrainingPeriod::create([
            'name' => '2026-Fall',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'is_active' => true,
        ]);

        $site = TrainingSite::create([
            'name' => 'Shape School',
            'location' => 'Hebron',
            'is_active' => true,
            'directorate' => 'وسط',
            'capacity' => 25,
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
            'name' => 'Shape Section',
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

        return compact('supervisor', 'student', 'assignment');
    }
}
