<?php

namespace Database\Seeders;

use App\Models\TrainingSite;
use Illuminate\Database\Seeder;

class TrainingSitesFromCsvSeeder extends Seeder
{
    public function run(): void
    {
        $csvFile = base_path('database/seeders/data/schools_hebron.csv');
        
        if (!file_exists($csvFile)) {
            // Try alternative location
            $csvFile = storage_path('app/schools_hebron.csv');
        }
        
        if (!file_exists($csvFile)) {
            $this->command->error("CSV file not found: {$csvFile}");
            return;
        }

        $handle = fopen($csvFile, 'r');
        if (!$handle) {
            $this->command->error("Cannot open CSV file");
            return;
        }

        // Skip header row
        fgetcsv($handle, 0, ',');

        $count = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            // Ensure we have enough columns
            if (count($row) < 8) {
                $skipped++;
                continue;
            }

            $name = trim($row[1] ?? '');
            $email = trim($row[2] ?? '');
            $phone = trim($row[3] ?? '');
            $mobile = trim($row[4] ?? '');
            $gender = trim($row[5] ?? ''); // إناث/ذكور/مختلطة
            $stage = trim($row[6] ?? ''); // عليا/دنيا
            $location = trim($row[7] ?? ''); // الخليل/بيت كاحل/تفوح/ترقوميا

            if (empty($name)) {
                $skipped++;
                continue;
            }

            // Build description from available info
            $descriptionParts = [];
            if ($gender) {
                $descriptionParts[] = "تصنيف: {$gender}";
            }
            if ($stage) {
                $descriptionParts[] = "مرحلة: {$stage}";
            }
            if ($email) {
                $descriptionParts[] = "البريد: {$email}";
            }

            $description = implode(' | ', $descriptionParts);

            // Use phone if available, otherwise mobile
            $phoneNumber = $phone ?: $mobile;

            // Map location to directorate (all these are in southern area)
            $directorate = $this->mapLocationToDirectorate($location);

            // Check if school already exists
            $exists = TrainingSite::where('name', $name)->exists();
            if ($exists) {
                $this->command->info("Skipping duplicate: {$name}");
                continue;
            }

            TrainingSite::create([
                'name' => $name,
                'location' => $location ?: 'الخليل',
                'phone' => $phoneNumber,
                'description' => $description,
                'is_active' => true,
                'directorate' => $directorate,
                'capacity' => null,
                'site_type' => 'school',
                'governing_body' => 'directorate_of_education',
                'school_type' => 'public',
            ]);

            $count++;
        }

        fclose($handle);

        $this->command->info("Imported {$count} training sites successfully!");
        if ($skipped > 0) {
            $this->command->warn("Skipped {$skipped} rows");
        }
    }

    private function mapLocationToDirectorate(string $location): ?string
    {
        // Map specific locations to directorates
        $location = trim($location);
        
        // All schools in the CSV are in southern Hebron governorates
        $southernLocations = ['الخليل', 'بيت كاحل', 'تفوح', 'ترقوميا', 'حلحول', 'الشيوخ', 'سمع', 'الظاهرية', 'يطا', 'دورا'];
        
        foreach ($southernLocations as $southLoc) {
            if (str_contains($location, $southLoc)) {
                return 'جنوب';
            }
        }
        
        // Default to جنوب (South) as these are all Hebron schools
        return 'جنوب';
    }
}
