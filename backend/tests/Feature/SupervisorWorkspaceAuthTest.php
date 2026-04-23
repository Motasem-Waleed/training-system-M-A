<?php

namespace Tests\Feature;

use Tests\TestCase;

class SupervisorWorkspaceAuthTest extends TestCase
{
    public function test_supervisor_stats_requires_authentication(): void
    {
        $response = $this->getJson('/api/supervisor/stats');

        $response->assertStatus(401);
    }

    public function test_supervisor_students_requires_authentication(): void
    {
        $response = $this->getJson('/api/supervisor/students');

        $response->assertStatus(401);
    }

    public function test_supervisor_student_overview_requires_authentication(): void
    {
        $response = $this->getJson('/api/supervisor/students/1/overview');

        $response->assertStatus(401);
    }
}
