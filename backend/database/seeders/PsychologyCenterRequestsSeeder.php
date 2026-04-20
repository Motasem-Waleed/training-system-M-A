<?php

namespace Database\Seeders;

use App\Models\TrainingRequest;
use App\Models\TrainingRequestStudent;
use App\Models\TrainingSite;
use App\Models\TrainingPeriod;
use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PsychologyCenterRequestsSeeder extends Seeder
{
    public function run(): void
    {
        // Get health center training site
        $healthSite = TrainingSite::where('site_type', 'health_center')->first();
        $trainingPeriod = TrainingPeriod::where('is_active', true)->first();

        if (!$healthSite || !$trainingPeriod) {
            $this->command->warn('Skipping PsychologyCenterRequestsSeeder: Missing health center or training period');
            return;
        }

        // Get psychology-related courses or fallback to first course
        $course = Course::where('name', 'like', '%نفس%')->first()
            ?? Course::where('name', 'like', '%صحة%')->first()
            ?? Course::first();

        // Get students
        $students = User::whereHas('role', fn($q) => $q->where('name', 'student'))
            ->limit(5)
            ->get();

        if ($students->isEmpty()) {
            $this->command->warn('Skipping PsychologyCenterRequestsSeeder: No students found');
            return;
        }

        // Create training requests for the psychology center
        // These come from ministry_of_health (وزارة الصحة)
        $requestsData = [
            [
                'letter_number' => 'HLTH/PSY/2025/001',
                'letter_date' => '2025-04-10',
                'governing_body' => 'ministry_of_health',
                'book_status' => 'sent_to_school',
                'student_index' => 0,
            ],
            [
                'letter_number' => 'HLTH/PSY/2025/002',
                'letter_date' => '2025-04-12',
                'governing_body' => 'ministry_of_health',
                'book_status' => 'sent_to_school',
                'student_index' => 1,
            ],
            [
                'letter_number' => 'HLTH/PSY/2025/003',
                'letter_date' => '2025-04-14',
                'governing_body' => 'ministry_of_health',
                'book_status' => 'sent_to_school',
                'student_index' => 2,
            ],
            [
                'letter_number' => 'HLTH/PSY/2025/004',
                'letter_date' => '2025-04-16',
                'governing_body' => 'ministry_of_health',
                'book_status' => 'directorate_approved',
                'student_index' => 3,
            ],
            [
                'letter_number' => 'HLTH/PSY/2025/005',
                'letter_date' => '2025-04-18',
                'governing_body' => 'ministry_of_health',
                'book_status' => 'sent_to_health_ministry',
                'student_index' => 4,
            ],
        ];

        foreach ($requestsData as $requestData) {
            $student = $students->get($requestData['student_index'] % $students->count());

            $trainingRequest = TrainingRequest::updateOrCreate(
                ['letter_number' => $requestData['letter_number']],
                [
                    'requested_by' => $student->id,
                    'book_status' => $requestData['book_status'],
                    'status' => 'pending',
                    'training_site_id' => $healthSite->id,
                    'training_period_id' => $trainingPeriod->id,
                    'governing_body' => $requestData['governing_body'],
                    'requested_at' => now()->subDays(rand(10, 20)),
                    'sent_to_directorate_at' => now()->subDays(rand(8, 15)),
                    'directorate_approved_at' => $requestData['book_status'] !== 'sent_to_health_ministry'
                        ? now()->subDays(rand(5, 10)) : null,
                    'sent_to_school_at' => in_array($requestData['book_status'], ['sent_to_school', 'school_approved'])
                        ? now()->subDays(rand(1, 4)) : null,
                    'coordinator_reviewed_at' => now()->subDays(rand(12, 18)),
                    'letter_date' => $requestData['letter_date'],
                ]
            );

            // Create training request student entry
            $trs = TrainingRequestStudent::updateOrCreate(
                [
                    'training_request_id' => $trainingRequest->id,
                    'user_id' => $student->id,
                ],
                [
                    'course_id' => $course->id,
                    'start_date' => $trainingPeriod->start_date ?? now()->addDays(30),
                    'end_date' => $trainingPeriod->end_date ?? now()->addMonths(4),
                    'status' => 'pending',
                ]
            );

            // Create section for the course if not exists (needed for academic_supervisor_id)
            $section = Section::firstOrCreate(
                ['course_id' => $course->id],
                [
                    'name' => 'قسم ' . $course->name,
                    'academic_supervisor_id' => User::whereHas('role', fn($q) => $q->where('name', 'academic_supervisor'))->value('id'),
                    'academic_year' => '2025-2026',
                    'semester' => 'first',
                ]
            );

            // Create enrollment for the student if not exists (needed for training assignment)
            Enrollment::firstOrCreate(
                [
                    'user_id' => $student->id,
                    'section_id' => $section->id,
                ],
                [
                    'academic_year' => '2025-2026',
                    'semester' => 'first',
                    'status' => 'active',
                ]
            );
        }

        $this->command->info('Created ' . count($requestsData) . ' training requests for psychology center (health_center site).');
    }
}
