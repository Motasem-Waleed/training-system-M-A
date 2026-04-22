<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FeatureFlag;

class FeatureFlagsSeeder extends Seeder
{
    public function run()
    {
        $features = [
            [
                'name' => 'training_requests.create',
                'display_name' => 'تقديم طلبات تدريب جديدة',
                'is_open' => true,
                'description' => 'السماح للطلاب بتقديم طلبات تدريب',
            ],
            [
                'name' => 'evaluations.create',
                'display_name' => 'إضافة تقييمات جديدة',
                'is_open' => true,
                'description' => 'السماح بإدخال التقييمات من المشرفين والمعلمين',
            ],
            [
                'name' => 'attendances.create',
                'display_name' => 'تسجيل الحضور والغياب',
                'is_open' => true,
                'description' => 'السماح بتسجيل الحضور اليومي',
            ],
            [
                'name' => 'tasks.create',
                'display_name' => 'إضافة مهام جديدة',
                'is_open' => true,
                'description' => 'السماح للمشرفين بإضافة مهام',
            ],
            [
                'name' => 'announcements.create',
                'display_name' => 'نشر إعلانات جديدة',
                'is_open' => true,
                'description' => 'السماح بإضافة إعلانات',
            ],
            [
                'name' => 'reports.export',
                'display_name' => 'تصدير التقارير',
                'is_open' => true,
                'description' => 'السماح بتصدير التقارير بصيغ مختلفة',
            ],
            [
                'name' => 'training_program.edit',
                'display_name' => 'إدخال/تعديل برنامج التدريب',
                'is_open' => false,
                'description' => 'السماح للطلاب بإدخال أو تعديل جدول الحصص في برنامج التدريب (يتحكم به المنسق)',
            ],
        ];

        foreach ($features as $feature) {
            FeatureFlag::firstOrCreate(
                ['name' => $feature['name']],
                $feature
            );
        }
    }
}