<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use App\Models\Section;
use App\Models\TrainingRequestStudent;
use Illuminate\Console\Command;

class RepairTrainingRequestEnrollments extends Command
{
    protected $signature = 'training-requests:repair-enrollments {--dry-run : Show the enrollments that would be created without saving changes}';

    protected $description = 'Backfill missing enrollments for training request students so school approval can create assignments safely.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $studentRequests = TrainingRequestStudent::query()
            ->select(['id', 'user_id', 'course_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->orderBy('id')
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($studentRequests as $studentRequest) {
            $hasEnrollment = Enrollment::query()
                ->where('user_id', $studentRequest->user_id)
                ->whereHas('section', fn ($query) => $query->where('course_id', $studentRequest->course_id))
                ->exists();

            if ($hasEnrollment) {
                $skipped++;
                continue;
            }

            $section = Section::query()
                ->where('course_id', $studentRequest->course_id)
                ->orderBy('id')
                ->first();

            if (! $section) {
                $this->warn("No section found for course {$studentRequest->course_id}; skipped request-student {$studentRequest->id}.");
                continue;
            }

            if ($dryRun) {
                $this->line("Would create enrollment for user {$studentRequest->user_id} in section {$section->id} (course {$studentRequest->course_id}).");
                $created++;
                continue;
            }

            Enrollment::query()->firstOrCreate(
                [
                    'user_id' => $studentRequest->user_id,
                    'section_id' => $section->id,
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                ],
                ['status' => 'active']
            );

            $this->info("Created enrollment for user {$studentRequest->user_id} in section {$section->id}.");
            $created++;
        }

        $summary = $dryRun ? 'Dry run completed.' : 'Repair completed.';
        $this->newLine();
        $this->info("{$summary} Created: {$created}, skipped existing: {$skipped}.");

        return self::SUCCESS;
    }
}
