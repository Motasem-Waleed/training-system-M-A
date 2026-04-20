<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DailyReportTemplate;
use App\Models\FieldEvaluationTemplate;

/**
 * Seeder لقوالب التقارير والتقييمات للمشرف الميداني
 * يدعم 3 أنواع: mentor_teacher, school_counselor, psychologist
 */
class FieldSupervisorTemplatesSeeder extends Seeder
{
    public function run()
    {
        $this->seedDailyReportTemplates();
        $this->seedEvaluationTemplates();
    }

    /**
     * قوالب التقارير اليومية
     */
    private function seedDailyReportTemplates()
    {
        $templates = [
            // ═══════════════════════════════════════════════════════════
            // Mentor Teacher — المعلم المرشد
            // ═══════════════════════════════════════════════════════════
            [
                'name' => 'تقرير يومي - تدريب تدريسي',
                'code' => 'mentor_daily_report',
                'applies_to' => 'mentor_teacher',
                'fields' => [
                    [
                        'name' => 'lesson_subject',
                        'label' => 'موضوع الدرس',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'class_grade',
                        'label' => 'الصف/الشعبة',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'objectives',
                        'label' => 'أهداف الدرس',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'teaching_strategy',
                        'label' => 'استراتيجية التدريس',
                        'type' => 'select',
                        'options' => ['محاضرة', 'نقاش', 'عمل جماعي', 'تعلم نشط', 'أخرى'],
                        'required' => true,
                    ],
                    [
                        'name' => 'teaching_aids',
                        'label' => 'الوسائل التعليمية المستخدمة',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                    [
                        'name' => 'implementation',
                        'label' => 'ما تم تنفيذه من الدرس',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'classroom_management',
                        'label' => 'ملاحظات إدارة الصف',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                    [
                        'name' => 'self_reflection',
                        'label' => 'انعكاس الطالب على أدائه',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'challenges',
                        'label' => 'الصعوبات والتحديات',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                ],
                'allowed_attachments' => ['pdf', 'doc', 'docx', 'jpg', 'png'],
                'sort_order' => 1,
            ],

            // ═══════════════════════════════════════════════════════════
            // School Counselor — المرشد التربوي
            // ═══════════════════════════════════════════════════════════
            [
                'name' => 'تقرير يومي - إرشاد مدرسي',
                'code' => 'counselor_daily_report',
                'applies_to' => 'school_counselor',
                'fields' => [
                    [
                        'name' => 'activity_type',
                        'label' => 'نوع النشاط الإرشادي',
                        'type' => 'select',
                        'options' => [
                            'متابعة فردية',
                            'جلسة إرشادية',
                            'نشاط جماعي',
                            'ملاحظة صفية',
                            'تواصل مع الأهل',
                            'أخرى'
                        ],
                        'required' => true,
                    ],
                    [
                        'name' => 'target_group',
                        'label' => 'الفئة المستهدفة',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'case_description',
                        'label' => 'وصف الحالة/الموقف',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'intervention_approach',
                        'label' => 'أسلوب التدخل الإرشادي',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'skills_used',
                        'label' => 'المهارات المستخدمة',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                    [
                        'name' => 'observations',
                        'label' => 'الملاحظات التربوية/النفسية',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'recommendations',
                        'label' => 'التوصيات',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                    [
                        'name' => 'follow_up_required',
                        'label' => 'هل يحتاج لمتابعة؟',
                        'type' => 'select',
                        'options' => ['نعم', 'لا'],
                        'required' => true,
                    ],
                ],
                'allowed_attachments' => ['pdf', 'doc', 'docx'],
                'sort_order' => 2,
            ],

            // ═══════════════════════════════════════════════════════════
            // Psychologist — الأخصائي النفسي
            // ═══════════════════════════════════════════════════════════
            [
                'name' => 'تقرير يومي - متابعة نفسية',
                'code' => 'psychologist_daily_report',
                'applies_to' => 'psychologist',
                'fields' => [
                    [
                        'name' => 'session_type',
                        'label' => 'نوع الجلسة/النشاط',
                        'type' => 'select',
                        'options' => [
                            'تقييم نفسي',
                            'جلسة علاجية',
                            'جلسة دعم',
                            'نشاط جماعي',
                            'زيارة ميدانية',
                            'أخرى'
                        ],
                        'required' => true,
                    ],
                    [
                        'name' => 'case_nature',
                        'label' => 'طبيعة الحالة/الخدمة',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'professional_notes',
                        'label' => 'الملاحظات المهنية',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'tools_used',
                        'label' => 'الأدوات والتقنيات المستخدمة',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                    [
                        'name' => 'outcomes',
                        'label' => 'المخرجات/النتائج',
                        'type' => 'textarea',
                        'required' => true,
                    ],
                    [
                        'name' => 'follow_up_plan',
                        'label' => 'خطة المتابعة والتوصيات',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                    [
                        'name' => 'ethical_notes',
                        'label' => 'ملاحظات أخلاقية/مهنية',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                ],
                'allowed_attachments' => ['pdf', 'doc', 'docx'],
                'sort_order' => 3,
            ],
        ];

        foreach ($templates as $template) {
            DailyReportTemplate::firstOrCreate(
                ['code' => $template['code']],
                $template
            );
        }
    }

    /**
     * قوالب التقييم الميداني
     */
    private function seedEvaluationTemplates()
    {
        $templates = [
            // ═══════════════════════════════════════════════════════════
            // Mentor Teacher Evaluation
            // ═══════════════════════════════════════════════════════════
            [
                'name' => 'تقييم ميداني - تدريب تدريسي',
                'code' => 'mentor_evaluation',
                'applies_to' => 'mentor_teacher',
                'criteria' => [
                    [
                        'id' => 'commitment',
                        'label' => 'الالتزام والانضباط',
                        'description' => 'الحضور في الموعد، الالتزام بأنظمة المدرسة',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'classroom_management',
                        'label' => 'إدارة الصف',
                        'description' => 'قدرة الطالب على إدارة الصف وضبط السلوك',
                        'weight' => 20,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'planning_preparation',
                        'label' => 'التخطيط والتحضير',
                        'description' => 'جودة تحضير الدروس والخطة التدريسية',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'lesson_delivery',
                        'label' => 'تنفيذ الدرس',
                        'description' => 'وضوح الشرح، سلاسة الأداء، تحقيق الأهداف',
                        'weight' => 20,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'teaching_aids',
                        'label' => 'استخدام الوسائل التعليمية',
                        'description' => 'استخدام الوسائل والتقنيات بفعالية',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'student_interaction',
                        'label' => 'التفاعل مع الطلبة',
                        'description' => 'التعامل الإيجابي، تحفيز الطلبة، الاستجابة لهم',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'professional_development',
                        'label' => 'التطور المهني',
                        'description' => 'استقبال الملاحظات، التحسن الملحوظ',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                ],
                'total_score' => 100,
                'score_ranges' => [
                    'excellent' => ['min' => 90, 'label' => 'ممتاز', 'color' => 'green'],
                    'very_good' => ['min' => 80, 'label' => 'جيد جداً', 'color' => 'blue'],
                    'good' => ['min' => 70, 'label' => 'جيد', 'color' => 'yellow'],
                    'pass' => ['min' => 60, 'label' => 'مقبول', 'color' => 'orange'],
                    'fail' => ['min' => 0, 'label' => 'ضعيف', 'color' => 'red'],
                ],
                'allow_draft' => true,
            ],

            // ═══════════════════════════════════════════════════════════
            // School Counselor Evaluation
            // ═══════════════════════════════════════════════════════════
            [
                'name' => 'تقييم ميداني - إرشاد مدرسي',
                'code' => 'counselor_evaluation',
                'applies_to' => 'school_counselor',
                'criteria' => [
                    [
                        'id' => 'commitment',
                        'label' => 'الالتزام والانضباط',
                        'description' => 'الحضور، الالتزام بالمواعيد والسياسات',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'communication_skills',
                        'label' => 'مهارات التواصل',
                        'description' => 'القدرة على التواصل الفعال مع الطلاب والكادر',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'observation_analysis',
                        'label' => 'الملاحظة والتحليل',
                        'description' => 'دقة الملاحظة وعمق التحليل للحالات',
                        'weight' => 20,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'intervention_implementation',
                        'label' => 'تنفيذ الأنشطة الإرشادية',
                        'description' => 'جودة التدخلات والأنشطة الإرشادية',
                        'weight' => 20,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'confidentiality',
                        'label' => 'السرية والمهنية',
                        'description' => 'الحفاظ على السرية، الالتزام بالأخلاقيات',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'case_management',
                        'label' => 'التعامل مع الحالات',
                        'description' => 'إدارة الحالات، المتابعة، التوثيق',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'report_quality',
                        'label' => 'جودة التقارير الإرشادية',
                        'description' => 'وضوح وشمول التقارير المرفوعة',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                ],
                'total_score' => 100,
                'score_ranges' => [
                    'excellent' => ['min' => 90, 'label' => 'ممتاز', 'color' => 'green'],
                    'very_good' => ['min' => 80, 'label' => 'جيد جداً', 'color' => 'blue'],
                    'good' => ['min' => 70, 'label' => 'جيد', 'color' => 'yellow'],
                    'pass' => ['min' => 60, 'label' => 'مقبول', 'color' => 'orange'],
                    'fail' => ['min' => 0, 'label' => 'ضعيف', 'color' => 'red'],
                ],
                'allow_draft' => true,
            ],

            // ═══════════════════════════════════════════════════════════
            // Psychologist Evaluation
            // ═══════════════════════════════════════════════════════════
            [
                'name' => 'تقييم ميداني - متابعة نفسية',
                'code' => 'psychologist_evaluation',
                'applies_to' => 'psychologist',
                'criteria' => [
                    [
                        'id' => 'commitment',
                        'label' => 'الالتزام والانضباط',
                        'description' => 'الحضور، الالتزام بالمواعيد والسياسات',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'professional_ethics',
                        'label' => 'المهنية والأخلاقيات',
                        'description' => 'الالتزام بأخلاقيات المهنة، السرية',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'documentation',
                        'label' => 'جودة التوثيق',
                        'description' => 'دقة وشمول التوثيق والتقارير',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'case_understanding',
                        'label' => 'فهم الحالة',
                        'description' => 'عمق الفهم، التشخيص، التحليل',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'tools_usage',
                        'label' => 'استخدام الأدوات والأساليب',
                        'description' => 'اختيار واستخدام الأدوات المناسبة',
                        'weight' => 15,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'communication',
                        'label' => 'مهارات التواصل المهني',
                        'description' => 'التواصل الفعال مع الحالات والفريق',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'report_quality',
                        'label' => 'جودة التقارير النفسية',
                        'description' => 'الوضوح، الدقة، الاستنتاجات المنطقية',
                        'weight' => 10,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                    [
                        'id' => 'guidelines_compliance',
                        'label' => 'الالتزام بالتوجيهات',
                        'description' => 'الالتزام بالبروتوكولات والإشراف',
                        'weight' => 5,
                        'scale' => [1, 2, 3, 4, 5],
                    ],
                ],
                'total_score' => 100,
                'score_ranges' => [
                    'excellent' => ['min' => 90, 'label' => 'ممتاز', 'color' => 'green'],
                    'very_good' => ['min' => 80, 'label' => 'جيد جداً', 'color' => 'blue'],
                    'good' => ['min' => 70, 'label' => 'جيد', 'color' => 'yellow'],
                    'pass' => ['min' => 60, 'label' => 'مقبول', 'color' => 'orange'],
                    'fail' => ['min' => 0, 'label' => 'ضعيف', 'color' => 'red'],
                ],
                'allow_draft' => true,
            ],
        ];

        foreach ($templates as $template) {
            FieldEvaluationTemplate::firstOrCreate(
                ['code' => $template['code']],
                $template
            );
        }
    }
}
