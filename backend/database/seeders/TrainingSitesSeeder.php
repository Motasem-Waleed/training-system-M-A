<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TrainingSite;

class TrainingSitesSeeder extends Seeder
{
    public function run()
    {
        $schools = [
            ['name' => 'مدرسة ذكور الخليل الأساسية', 'location' => 'الخليل - وسط', 'phone' => '02-1111111', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة إناث الخليل الثانوية', 'location' => 'الخليل - وسط', 'phone' => '02-1111112', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 8],
            ['name' => 'مدرسة الخليل الأساسية المختلطة', 'location' => 'الخليل - وسط', 'phone' => '02-1111113', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 12],

            ['name' => 'مدرسة حلحول الثانوية للبنين', 'location' => 'حلحول', 'phone' => '02-2222221', 'directorate' => 'شمال', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة بنات حلحول الأساسية', 'location' => 'حلحول', 'phone' => '02-2222222', 'directorate' => 'شمال', 'is_active' => true, 'capacity' => 8],
            ['name' => 'مدرسة سعير الثانوية', 'location' => 'سعير', 'phone' => '02-2222223', 'directorate' => 'شمال', 'is_active' => true, 'capacity' => 12],

            ['name' => 'مدرسة دورا الثانوية للبنين', 'location' => 'دورا', 'phone' => '02-3333331', 'directorate' => 'جنوب', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة بنات دورا الأساسية', 'location' => 'دورا', 'phone' => '02-3333332', 'directorate' => 'جنوب', 'is_active' => true, 'capacity' => 9],

            ['name' => 'مدرسة يطا الثانوية', 'location' => 'يطا', 'phone' => '02-4444441', 'directorate' => 'يطا', 'is_active' => true, 'capacity' => 15],
            ['name' => 'مدرسة بنات يطا الأساسية', 'location' => 'يطا', 'phone' => '02-4444442', 'directorate' => 'يطا', 'is_active' => true, 'capacity' => 10],

            // مدارس حكومية — مديرية وسط (منطقة الخليل ومحيطها) لدعم الفلترة والعرض
            ['name' => 'مدرسة الحسين الثانوية للبنين', 'location' => 'الخليل', 'phone' => '02-2200101', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 12],
            ['name' => 'مدرسة الخليل الثانوية للبنات', 'location' => 'الخليل', 'phone' => '02-2200102', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة ذكور إذنا الثانوية', 'location' => 'إذنا', 'phone' => '02-2200201', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 11],
            ['name' => 'مدرسة بنات إذنا الأساسية العليا', 'location' => 'إذنا', 'phone' => '02-2200202', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 9],
            ['name' => 'مدرسة ترقوميا الثانوية المختلطة', 'location' => 'ترقوميا', 'phone' => '02-2200301', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 13],
            ['name' => 'مدرسة بيت أمر الثانوية للبنين', 'location' => 'بيت أمر', 'phone' => '02-2200401', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة بنات بيت أمر الأساسية', 'location' => 'بيت أمر', 'phone' => '02-2200402', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 8],
            ['name' => 'مدرسة حتا الثانوية', 'location' => 'حتا', 'phone' => '02-2200501', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة نوبا الأساسية المختلطة', 'location' => 'نوبا', 'phone' => '02-2200601', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 9],
            ['name' => 'مدرسة سموع الثانوية للبنين', 'location' => 'سموع', 'phone' => '02-2200701', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 11],
            ['name' => 'مدرسة العديسية الأساسية', 'location' => 'العديسية', 'phone' => '02-2200801', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 8],
            ['name' => 'مدرسة الشيوخ الأساسية', 'location' => 'الشيوخ', 'phone' => '02-2200901', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 9],
            ['name' => 'مدرسة يطا البلد الأساسية', 'location' => 'يطا', 'phone' => '02-2201001', 'directorate' => 'يطا', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة الخليل الأساسية المشتركة', 'location' => 'الخليل - باب الزاوية', 'phone' => '02-2201101', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 14],
            ['name' => 'مدرسة بني نعيم الثانوية للبنات', 'location' => 'بني نعيم', 'phone' => '02-2201201', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 9],
            ['name' => 'مدرسة دورا الثانوية للبنات', 'location' => 'دورا', 'phone' => '02-2201301', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 10],
            ['name' => 'مدرسة الفوار الأساسية', 'location' => 'الفوار', 'phone' => '02-2201401', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 8],
            ['name' => 'مدرسة بيت أولا الثانوية', 'location' => 'بيت أولا', 'phone' => '02-2201501', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 11],
            ['name' => 'مدرسة تفوح الأساسية المختلطة', 'location' => 'تفوح', 'phone' => '02-2201601', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 9],
            ['name' => 'مدرسة الخليل التقنية الثانوية', 'location' => 'الخليل - الهرمل', 'phone' => '02-2201701', 'directorate' => 'وسط', 'is_active' => true, 'capacity' => 12],
        ];

        foreach ($schools as $school) {
            $school['governing_body'] = 'directorate_of_education';
            $school['school_type'] = $school['school_type'] ?? 'public';
            TrainingSite::query()->updateOrCreate(
                ['name' => $school['name']],
                $school
            );
        }
    }
}