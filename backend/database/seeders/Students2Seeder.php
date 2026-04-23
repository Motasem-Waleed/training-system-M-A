<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class Students2Seeder extends Seeder
{
    public function run(): void
    {
        $studentRoleId = Role::query()->where('name', 'student')->value('id');
        if (! $studentRoleId) {
            $this->command?->warn('تخطي Students2Seeder: دور student غير موجود.');
            return;
        }

        $usoolDeptId = Department::query()->where('name', 'usool_tarbiah')->value('id');
        $psychDeptId = Department::query()->where('name', 'psychology')->value('id');

        if (! $usoolDeptId || ! $psychDeptId) {
            $this->command?->warn('تخطي Students2Seeder: الأقسام المطلوبة غير موجودة.');
            return;
        }

        $students = [
            // 5 طلاب أصول التربية
            ['name' => 'محمود رائد التميمي', 'email' => 'students2.usool01@hebron.edu', 'university_id' => 'S2U2001', 'phone' => '0592200001', 'department_id' => $usoolDeptId],
            ['name' => 'جودي سامر الشرباتي', 'email' => 'students2.usool02@hebron.edu', 'university_id' => 'S2U2002', 'phone' => '0592200002', 'department_id' => $usoolDeptId],
            ['name' => 'ليان عادل جعبري', 'email' => 'students2.usool03@hebron.edu', 'university_id' => 'S2U2003', 'phone' => '0592200003', 'department_id' => $usoolDeptId],
            ['name' => 'سيف ياسر المحتسب', 'email' => 'students2.usool04@hebron.edu', 'university_id' => 'S2U2004', 'phone' => '0592200004', 'department_id' => $usoolDeptId],
            ['name' => 'رغد ناصر الطروة', 'email' => 'students2.usool05@hebron.edu', 'university_id' => 'S2U2005', 'phone' => '0592200005', 'department_id' => $usoolDeptId],

            // 5 طلاب علم النفس
            ['name' => 'أحمد تيسير دعنا', 'email' => 'students2.psy01@hebron.edu', 'university_id' => 'S2P3001', 'phone' => '0592300001', 'department_id' => $psychDeptId],
            ['name' => 'نور فادي القواسمي', 'email' => 'students2.psy02@hebron.edu', 'university_id' => 'S2P3002', 'phone' => '0592300002', 'department_id' => $psychDeptId],
            ['name' => 'محمد رامي النتشة', 'email' => 'students2.psy03@hebron.edu', 'university_id' => 'S2P3003', 'phone' => '0592300003', 'department_id' => $psychDeptId],
            ['name' => 'آية نضال الكركي', 'email' => 'students2.psy04@hebron.edu', 'university_id' => 'S2P3004', 'phone' => '0592300004', 'department_id' => $psychDeptId],
            ['name' => 'رهف حازم السلايمة', 'email' => 'students2.psy05@hebron.edu', 'university_id' => 'S2P3005', 'phone' => '0592300005', 'department_id' => $psychDeptId],
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

        $this->command?->info('تم إدخال 10 طلاب عبر Students2Seeder بنجاح.');
    }
}
