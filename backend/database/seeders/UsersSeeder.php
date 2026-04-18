<?php

namespace Database\Seeders;

use App\Models\TrainingSite;
use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run()
    {
        // 1. مدير النظام
        $adminRole = Role::where('name', 'admin')->first();
        User::firstOrCreate(
            ['email' => 'admin@hebron.edu'],
            [
                'name' => 'مدير النظام',
                'university_id' => 'ADMIN001',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'status' => 'active',
            ]
        );

        // 2. منسق التدريب
        $coordinatorRole = Role::where('name', 'training_coordinator')->first();
        User::firstOrCreate(
            ['email' => 'coordinator@hebron.edu'],
            [
                'name' => 'منسق التدريب',
                'university_id' => 'COORD01',
                'password' => Hash::make('password'),
                'role_id' => $coordinatorRole->id,
                'status' => 'active',
            ]
        );

        // 3. مشرف أكاديمي
        $supervisorRole = Role::where('name', 'academic_supervisor')->first();
        User::firstOrCreate(
            ['email' => 'supervisor@hebron.edu'],
            [
                'name' => 'د. أحمد المشرف',
                'university_id' => 'SUP001',
                'password' => Hash::make('password'),
                'role_id' => $supervisorRole->id,
                'status' => 'active',
            ]
        );

        // 4. معلم مرشد
        $teacherRole = Role::where('name', 'teacher')->first();
        User::firstOrCreate(
            ['email' => 'teacher@hebron.edu'],
            [
                'name' => 'محمد المعلم',
                'university_id' => 'TCH001',
                'password' => Hash::make('password'),
                'role_id' => $teacherRole->id,
                'status' => 'active',
            ]
        );

        // 5. طالب
        $studentRole = Role::where('name', 'student')->first();
        User::firstOrCreate(
            ['email' => 'student@hebron.edu'],
            [
                'name' => 'أحمد الطالب',
                'university_id' => 'STU001',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
            ]
        );

        // 6. مدير مدرسة (يرتبط بأول موقع تدريب لاستلام الطلبات المرسلة للمدرسة)
        $schoolManagerRole = Role::where('name', 'school_manager')->first();
        $defaultSchoolSiteId = TrainingSite::query()->orderBy('id')->value('id');
        $sm = User::firstOrCreate(
            ['email' => 'schoolmanager@hebron.edu'],
            [
                'name' => 'خالد مدير المدرسة',
                'password' => Hash::make('password'),
                'role_id' => $schoolManagerRole->id,
                'status' => 'active',
            ]
        );
        if ($defaultSchoolSiteId && ! $sm->training_site_id) {
            $sm->update(['training_site_id' => $defaultSchoolSiteId]);
        }

        // 7. أخصائي نفسي
        $psychologistRole = Role::where('name', 'psychologist')->first();
        User::firstOrCreate(
            ['email' => 'psychologist@hebron.edu'],
            [
                'name' => 'سعاد الأخصائية',
                'university_id' => 'PSY001',
                'password' => Hash::make('password'),
                'role_id' => $psychologistRole->id,
                'status' => 'active',
            ]
        );

        // 8. رئيس القسم
        $headRole = Role::where('name', 'head_of_department')->first();
        User::firstOrCreate(
            ['email' => 'head@hebron.edu'],
            [
                'name' => 'د. رامي رئيس القسم',
                'university_id' => 'HEAD001',
                'password' => Hash::make('password'),
                'role_id' => $headRole->id,
                'status' => 'active',
            ]
        );

        // 9. مديرية التربية
        $eduDirectorateRole = Role::where('name', 'education_directorate')->first();
        User::firstOrCreate(
            ['email' => 'edudirectorate@hebron.edu'],
            [
                'name' => 'مديرية التربية والتعليم',
                'password' => Hash::make('password'),
                'role_id' => $eduDirectorateRole->id,
                'status' => 'active',
            ]
        );

        // 10. وزارة الصحة
        $healthDirectorateRole = Role::where('name', 'health_directorate')->first();
        User::firstOrCreate(
            ['email' => 'healthdirectorate@hebron.edu'],
            [
                'name' => 'وزارة الصحة',
                'password' => Hash::make('password'),
                'role_id' => $healthDirectorateRole->id,
                'status' => 'active',
            ]
        );
    }
}