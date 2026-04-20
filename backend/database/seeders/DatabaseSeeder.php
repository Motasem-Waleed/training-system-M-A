<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 👇 تشغيل seeders أولًا
        $this->call([
            RoleSeeder::class,
            DepartmentSeeder::class,
            PermissionSeeder::class,
            CoursesSeeder::class,
            TrainingPeriodsSeeder::class,
            TrainingSitesSeeder::class,
            HebronGovernmentSchoolsXlsxSeeder::class,
            RolePermissionSeeder::class,
            UsersSeeder::class,
            StudentsSeeder::class,
            SectionsSeeder::class,
            EnrollmentsSeeder::class,
            DemoDataSeeder::class,
            SchoolAdminSupervisorRequestsSeeder::class,
            OfficialLettersSeeder::class,
            FeatureFlagsSeeder::class,
        ]);

      
    }
}