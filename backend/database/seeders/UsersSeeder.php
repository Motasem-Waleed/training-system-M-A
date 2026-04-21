<?php

namespace Database\Seeders;

use App\Models\TrainingSite;
use App\Models\User;
use App\Models\Role;
use App\Models\FieldSupervisorProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    private function normalizeDirectorate(string $value): string
    {
        $v = trim($value);
        $v = str_replace(['مديرية', 'مديرية ', '  '], ['', '', ' '], $v);
        return trim($v);
    }

    private function resolveSchoolSiteIdForDirectorate(string $directorate): ?int
    {
        $normalized = $this->normalizeDirectorate($directorate);

        $siteId = TrainingSite::query()
            ->where('site_type', 'school')
            ->where('directorate', $normalized)
            ->orderBy('id')
            ->value('id');

        if ($siteId) {
            return (int) $siteId;
        }

        $siteId = TrainingSite::query()
            ->where('site_type', 'school')
            ->where('directorate', 'like', '%' . $normalized . '%')
            ->orderBy('id')
            ->value('id');

        return $siteId ? (int) $siteId : null;
    }

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
        $defaultSchoolSiteId = $this->resolveSchoolSiteIdForDirectorate('وسط')
            ?? TrainingSite::query()->where('site_type', 'school')->orderBy('id')->value('id');
        $sm = User::firstOrCreate(
            ['email' => 'schoolmanager@hebron.edu'],
            [
                'name' => 'خالد مدير المدرسة',
                'password' => Hash::make('password'),
                'role_id' => $schoolManagerRole->id,
                'status' => 'active',
            ]
        );
        if ($defaultSchoolSiteId && (int) $sm->training_site_id !== (int) $defaultSchoolSiteId) {
            $sm->update(['training_site_id' => $defaultSchoolSiteId]);
        }

        // حسابات مديري مدارس للفحص (كل حساب ثابت لمديرية محددة)
        $schoolManagerAccounts = [
            ['email' => 'schoolmanager.1@hebron.edu', 'name' => 'مدير مدرسة - وسط', 'directorate' => 'وسط'],
            ['email' => 'schoolmanager.2@hebron.edu', 'name' => 'مدير مدرسة - شمال', 'directorate' => 'شمال'],
            ['email' => 'schoolmanager.3@hebron.edu', 'name' => 'مدير مدرسة - جنوب', 'directorate' => 'جنوب'],
            ['email' => 'schoolmanager.4@hebron.edu', 'name' => 'مدير مدرسة - يطا', 'directorate' => 'يطا'],
        ];
        foreach ($schoolManagerAccounts as $account) {
            $siteId = $this->resolveSchoolSiteIdForDirectorate($account['directorate']);

            if (! $siteId) {
                continue;
            }

            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                    'role_id' => $schoolManagerRole->id,
                    'status' => 'active',
                    'training_site_id' => $siteId,
                ]
            );
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
                'directorate' => 'وسط',
            ]
        );

        // حسابات مديريات منفصلة للفحص الدقيق حسب المديرية
        User::firstOrCreate(
            ['email' => 'edudir.west@hebron.edu'],
            [
                'name' => 'مديرية التربية - وسط',
                'password' => Hash::make('password'),
                'role_id' => $eduDirectorateRole->id,
                'status' => 'active',
                'directorate' => 'وسط',
            ]
        );
        User::firstOrCreate(
            ['email' => 'edudir.north@hebron.edu'],
            [
                'name' => 'مديرية التربية - شمال',
                'password' => Hash::make('password'),
                'role_id' => $eduDirectorateRole->id,
                'status' => 'active',
                'directorate' => 'شمال',
            ]
        );
        User::firstOrCreate(
            ['email' => 'edudir.south@hebron.edu'],
            [
                'name' => 'مديرية التربية - جنوب',
                'password' => Hash::make('password'),
                'role_id' => $eduDirectorateRole->id,
                'status' => 'active',
                'directorate' => 'جنوب',
            ]
        );
        User::firstOrCreate(
            ['email' => 'edudir.yatta@hebron.edu'],
            [
                'name' => 'مديرية التربية - يطا',
                'password' => Hash::make('password'),
                'role_id' => $eduDirectorateRole->id,
                'status' => 'active',
                'directorate' => 'يطا',
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

        // 11. مدير المركز النفسي
        $psychCenterManagerRole = Role::where('name', 'psychology_center_manager')->first();
        $healthSite = TrainingSite::where('site_type', 'health_center')->first();
        User::firstOrCreate(
            ['email' => 'psychcentermanager@hebron.edu'],
            [
                'name' => 'أ. أحمد مدير المركز النفسي',
                'university_id' => 'PCM001',
                'password' => Hash::make('password'),
                'role_id' => $psychCenterManagerRole?->id,
                'status' => 'active',
                'training_site_id' => $healthSite?->id,
            ]
        );
    }
}