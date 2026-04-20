<?php

namespace App\Console\Commands;

use App\Models\TrainingSite;
use Illuminate\Console\Command;

class ImportSchoolsFromCsv extends Command
{
    protected $signature = 'import:schools {file? : Path to CSV file}';
    protected $description = 'Import schools from CSV file to training_sites table';

    public function handle(): int
    {
        $defaultFile = dirname(base_path()) . '\بيانات المدارس الحكومية - الخليل.csv';
        $file = $this->argument('file') ?? $defaultFile;

        if (!file_exists($file)) {
            $this->error("File not found: {$file}");
            return 1;
        }

        $handle = fopen($file, 'r');
        if (!$handle) {
            $this->error("Cannot open file");
            return 1;
        }

        // Skip header
        fgetcsv($handle, 0, ',');

        $count = 0;
        $skipped = 0;
        $bar = $this->output->createProgressBar();
        $bar->start();

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if (count($row) < 8) {
                $skipped++;
                continue;
            }

            $name = trim($row[1] ?? '');
            $email = trim($row[2] ?? '');
            $phone = trim($row[3] ?? '');
            $mobile = trim($row[4] ?? '');
            $gender = trim($row[5] ?? '');
            $stage = trim($row[6] ?? '');
            $location = trim($row[7] ?? '');

            if (empty($name)) {
                $skipped++;
                continue;
            }

            // Build description
            $descriptionParts = [];
            if ($gender) $descriptionParts[] = "تصنيف: {$gender}";
            if ($stage) $descriptionParts[] = "مرحلة: {$stage}";
            if ($email) $descriptionParts[] = "البريد: {$email}";
            $description = implode(' | ', $descriptionParts);

            $phoneNumber = $phone ?: $mobile;

            // Skip if exists
            if (TrainingSite::where('name', $name)->exists()) {
                continue;
            }

            TrainingSite::create([
                'name' => $name,
                'location' => $location ?: 'الخليل',
                'phone' => $phoneNumber,
                'description' => $description,
                'is_active' => true,
                'directorate' => 'جنوب', // All Hebron schools are southern
                'site_type' => 'school',
                'governing_body' => 'directorate_of_education',
                'school_type' => 'public',
            ]);

            $count++;
            $bar->advance();
        }

        fclose($handle);
        $bar->finish();

        $this->newLine();
        $this->info("✅ Imported {$count} schools successfully!");
        if ($skipped > 0) {
            $this->warn("⚠️ Skipped {$skipped} rows");
        }

        return 0;
    }
}
