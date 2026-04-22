<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentsSeeder extends Seeder
{
    public function run(): void
    {
        $studentRoleId = Role::query()->where('name', 'student')->value('id');
        if (!$studentRoleId) {
            $this->command?->warn('تخطي StudentsSeeder: دور student غير موجود.');
            return;
        }

        $usoolDeptId = Department::where('name', 'usool_tarbiah')->value('id');
        $psychDeptId = Department::where('name', 'psychology')->value('id');

        $students = [
            // طلاب أصول التربية
            ['name' => 'محمد أحمد النجار', 'email' => 'stu01@hebron.edu', 'university_id' => 'STU1001', 'phone' => '0591000001', 'department_id' => $usoolDeptId],
            ['name' => 'آية خالد أبو عيشة', 'email' => 'stu02@hebron.edu', 'university_id' => 'STU1002', 'phone' => '0591000002', 'department_id' => $usoolDeptId],
            ['name' => 'لينا محمود الطروة', 'email' => 'stu03@hebron.edu', 'university_id' => 'STU1003', 'phone' => '0591000003', 'department_id' => $usoolDeptId],
            ['name' => 'سارة محمود الرجبي', 'email' => 'stu04@hebron.edu', 'university_id' => 'STU1004', 'phone' => '0591000004', 'department_id' => $usoolDeptId],
            ['name' => 'يوسف خالد الجعبري', 'email' => 'stu05@hebron.edu', 'university_id' => 'STU1005', 'phone' => '0591000005', 'department_id' => $usoolDeptId],
            ['name' => 'هديل محمد السويطي', 'email' => 'stu06@hebron.edu', 'university_id' => 'STU1006', 'phone' => '0591000006', 'department_id' => $usoolDeptId],
            // طلاب علم النفس
            ['name' => 'رامي أحمد النتشة', 'email' => 'stu07@hebron.edu', 'university_id' => 'STU1007', 'phone' => '0591000007', 'department_id' => $psychDeptId],
            ['name' => 'رهف سامي أبو سنينة', 'email' => 'stu08@hebron.edu', 'university_id' => 'STU1008', 'phone' => '0591000008', 'department_id' => $psychDeptId],
            ['name' => 'عبدالله باسم القواسمي', 'email' => 'stu09@hebron.edu', 'university_id' => 'STU1009', 'phone' => '0591000009', 'department_id' => $psychDeptId],
            ['name' => 'مريم علي الجمل', 'email' => 'stu10@hebron.edu', 'university_id' => 'STU1010', 'phone' => '0591000010', 'department_id' => $psychDeptId],
        ];

        foreach ($students as $data) {
            User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'university_id' => $data['university_id'],
                    'phone' => $data['phone'],
                    'password' => Hash::make('password'),
                    'role_id' => $studentRoleId,
                    'department_id' => $data['department_id'],
                    'status' => 'active',
                ]
            );
        }

        $this->command?->info('تم إدخال بيانات طلاب تجريبية بنجاح.');
    }
}

