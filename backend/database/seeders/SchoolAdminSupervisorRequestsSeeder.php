<?php

namespace Database\Seeders;

use App\Models\TrainingRequest;
use App\Models\TrainingRequestStudent;
use App\Models\TrainingSite;
use App\Models\TrainingPeriod;
use App\Models\User;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SchoolAdminSupervisorRequestsSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing data
        $trainingSite = TrainingSite::query()->first();
        $trainingPeriod = TrainingPeriod::query()->where('is_active', true)->first();
        $course = Course::query()->first();
        
        if (!$trainingSite || !$trainingPeriod || !$course) {
            $this->command->warn('Skipping SchoolAdminSupervisorRequestsSeeder: Missing required data (training site, period, or course)');
            return;
        }

        // Get students
        $students = User::query()
            ->whereHas('role', fn($q) => $q->where('name', 'student'))
            ->limit(5)
            ->get();

        if ($students->isEmpty()) {
            $this->command->warn('Skipping SchoolAdminSupervisorRequestsSeeder: No students found');
            return;
        }

        // Create multiple requests with 'sent_to_school' status for testing
        $requestsData = [
            [
                'letter_number' => 'EDU/2025/042',
                'letter_date' => '2025-04-15',
                'student_name' => 'Mohammed Ahmad',
                'notes' => 'Book received from Directorate of Education - Hebron'
            ],
            [
                'letter_number' => 'EDU/2025/043',
                'letter_date' => '2025-04-16',
                'student_name' => 'Fatima Mahmoud',
                'notes' => 'Book received from Directorate of Education - Hebron'
            ],
            [
                'letter_number' => 'HLTH/2025/018',
                'letter_date' => '2025-04-17',
                'student_name' => 'Ali Hassan',
                'notes' => 'Book received from Ministry of Health - Hebron Region'
            ],
            [
                'letter_number' => 'EDU/2025/044',
                'letter_date' => '2025-04-18',
                'student_name' => 'Sara Khalil',
                'notes' => 'Book received from Directorate of Education - Hebron'
            ],
            [
                'letter_number' => 'HLTH/2025/019',
                'letter_date' => '2025-04-19',
                'student_name' => 'Omar Youssef',
                'notes' => 'Book received from Ministry of Health - Hebron Region'
            ]
        ];

        foreach ($requestsData as $index => $requestData) {
            $student = $students->get($index % $students->count());
            
            // Create training request with 'sent_to_school' status
            $trainingRequest = TrainingRequest::query()->updateOrCreate(
                ['letter_number' => $requestData['letter_number']],
                [
                    'requested_by' => $student->id,
                    'book_status' => 'sent_to_school', // This is the "sent to training authority" status
                    'status' => 'pending',
                    'training_site_id' => $trainingSite->id,
                    'training_period_id' => $trainingPeriod->id,
                    'governing_body' => str_contains($requestData['letter_number'], 'HLTH') ? 'ministry_of_health' : 'directorate_of_education',
                    'requested_at' => now()->subDays(rand(5, 15)),
                    'sent_to_directorate_at' => now()->subDays(rand(3, 10)),
                    'directorate_approved_at' => now()->subDays(rand(2, 8)),
                    'sent_to_school_at' => now()->subDays(rand(1, 5)),
                    'coordinator_reviewed_at' => now()->subDays(rand(4, 12)),
                    'letter_date' => $requestData['letter_date'],
                                    ]
            );

            // Create training request student entry
            TrainingRequestStudent::query()->updateOrCreate(
                [
                    'training_request_id' => $trainingRequest->id,
                    'user_id' => $student->id,
                ],
                [
                    'course_id' => $course->id,
                    'start_date' => $trainingPeriod->start_date,
                    'end_date' => $trainingPeriod->end_date,
                    'status' => 'approved',
                ]
            );
        }

        $this->command->info('Successfully created test data for school admin supervisor assignment page.');
        $this->command->info('Created ' . count($requestsData) . ' requests with "sent to training authority" status.');
    }
}
