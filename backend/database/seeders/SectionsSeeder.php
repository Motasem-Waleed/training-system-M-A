<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Section;
use App\Models\Course;
use App\Models\User;

class SectionsSeeder extends Seeder
{
    public function run()
    {
        // جلب أول مساق
        $course = Course::first();
        // جلب أول مشرف أكاديمي (يجب أن يكون موجوداً من UsersSeeder)
        $supervisor = User::whereHas('role', function($q) {
            $q->where('name', 'academic_supervisor');
        })->first();

        if ($course && $supervisor) {
            Section::firstOrCreate(
                ['name' => 'شعبة A', 'course_id' => $course->id],
                [
                    'academic_year' => 2025,
                    'semester' => 'first',
                    'academic_supervisor_id' => $supervisor->id,
                    'created_by' => $supervisor->id,
                ]
            );
        }
    }
}