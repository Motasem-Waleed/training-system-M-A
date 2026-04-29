<?php

namespace Database\Seeders;

use App\Models\FormTemplate;
use Illuminate\Database\Seeder;

class FormTemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->templates() as $template) {
            FormTemplate::updateOrCreate(
                ['code' => $template['code']],
                $template
            );
        }
    }

    private function templates(): array
    {
        return [
            $this->template('student_weekly_schedule', 'نموذج بيانات الطالب وجدول الحصص الأسبوعية', 'student', ['usool_tarbiah_school'], 'first_week', 'end_of_first_week', [
                'visible_to_roles' => ['student', 'teacher', 'adviser', 'academic_supervisor', 'school_manager'],
                'review_chain' => ['school_manager'],
                'contributes_to_portfolio' => true,
                'mandatory' => true,
            ]),
            $this->template('student_attendance_log', 'جدول حضور وغياب الطالب', 'student', ['usool_tarbiah_school', 'psychology_school', 'psychology_clinic'], 'daily', 'no_due_date', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'review_chain' => ['field_supervisor', 'academic_supervisor'],
                'lock_after_approval' => true,
                'mandatory' => true,
            ]),
            $this->template('student_taught_classes_count', 'عدد الحصص التي درسها الطالب', 'student', ['usool_tarbiah_school'], 'progressive', 'end_of_training', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'contributes_to_portfolio' => true,
            ]),
            $this->template('weekly_report_usool', 'التقرير الأسبوعي', 'student', ['usool_tarbiah_school'], 'weekly', 'weekly', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor', 'school_manager'],
                'review_chain' => ['field_supervisor'],
                'contributes_to_portfolio' => true,
            ]),
            $this->template('learning_experience_review', 'نموذج نقد خبرات التعلم', 'student', ['usool_tarbiah_school'], 'per_lesson_or_as_assigned', 'no_due_date', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'contributes_to_portfolio' => true,
            ]),
            $this->template('mentor_visit_report', 'تقرير المعلم المتعاون / تقرير الزيارة الصفية', 'field_supervisor', ['usool_tarbiah_school'], 'per_visit_or_as_assigned', 'no_due_date', [
                'primary_actor_role' => 'teacher',
                'visible_to_roles' => ['teacher', 'academic_supervisor', 'admin'],
                'contributes_to_evaluation' => true,
            ]),
            $this->template('school_manager_admin_report', 'تقرير مدير المدرسة الإداري', 'institution_manager', ['usool_tarbiah_school'], 'final', 'end_of_training', [
                'visible_to_roles' => ['school_manager', 'academic_supervisor', 'admin'],
                'contributes_to_evaluation' => true,
            ]),
            $this->template('psych_school_guidance_plan', 'خطة العمل الإرشادي', 'student', ['psychology_school'], 'early_training', 'custom', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'contributes_to_portfolio' => true,
                'mandatory' => true,
            ]),
            $this->template('psych_group_guidance_session', 'نموذج جلسة توجيه جمعي', 'student', ['psychology_school'], 'per_session', 'session_based', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor', 'school_manager'],
                'review_chain' => ['field_supervisor'],
                'supports_attachments' => true,
            ]),
            $this->template('psych_individual_session', 'نموذج جلسة إرشاد فردي', 'student', ['psychology_school'], 'per_session', 'session_based', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'review_chain' => ['field_supervisor'],
            ]),
            $this->template('psych_case_study', 'دراسة الحالة', 'student', ['psychology_school'], 'throughout_case', 'no_due_date', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'contributes_to_portfolio' => true,
            ]),
            $this->template('psych_daily_tasks_report', 'تقرير المهام والأعمال اليومية', 'student', ['psychology_school'], 'daily', 'no_due_date', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'review_chain' => ['field_supervisor', 'academic_supervisor'],
            ]),
            $this->template('school_counselor_final_evaluation', 'تقييم المرشد/المدرب', 'field_supervisor', ['psychology_school'], 'final', 'end_of_training', [
                'primary_actor_role' => 'adviser',
                'visible_to_roles' => ['field_supervisor', 'academic_supervisor', 'admin'],
                'contributes_to_evaluation' => true,
            ]),
            $this->template('psych_clinic_progress_notes', 'Progress Notes', 'student', ['psychology_clinic'], 'per_case_or_per_shift', 'no_due_date', [
                'visible_to_roles' => ['student', 'field_supervisor', 'academic_supervisor'],
                'review_chain' => ['field_supervisor'],
                'supports_attachments' => true,
            ]),
            $this->template('psych_clinic_supervision_notes', 'Supervision Notes', 'field_supervisor', ['psychology_clinic'], 'periodic', 'no_due_date', [
                'primary_actor_role' => 'psychologist',
                'visible_to_roles' => ['field_supervisor', 'academic_supervisor'],
            ]),
            $this->template('academic_final_evaluation', 'تقييم مشرف الجامعة', 'academic_supervisor', ['psychology_school', 'psychology_clinic', 'usool_tarbiah_school'], 'final', 'end_of_training', [
                'visible_to_roles' => ['academic_supervisor', 'admin'],
                'contributes_to_evaluation' => true,
            ]),
            $this->template('institution_final_evaluation', 'Institution Evaluation', 'institution_manager', ['psychology_clinic', 'psychology_school', 'usool_tarbiah_school'], 'final', 'end_of_training', [
                'visible_to_roles' => ['institution_manager', 'academic_supervisor', 'admin'],
                'contributes_to_evaluation' => true,
            ]),
        ];
    }

    private function template(string $code, string $title, string $owner, array $tracks, string $frequency, string $dueRule, array $overrides = []): array
    {
        return array_merge([
            'code' => $code,
            'title_ar' => $title,
            'description' => $title,
            'form_type' => 'training_form',
            'owner_type' => $owner,
            'visible_to_roles' => [$owner],
            'review_chain' => [],
            'department_scope' => [],
            'training_track_scope' => $tracks,
            'site_type_scope' => [],
            'course_scope' => [],
            'frequency_type' => $frequency,
            'due_rule_type' => $dueRule,
            'requires_review' => false,
            'review_roles' => [],
            'can_be_returned' => true,
            'lock_after_submit' => false,
            'lock_after_approval' => true,
            'mandatory' => false,
            'contributes_to_portfolio' => false,
            'contributes_to_evaluation' => false,
            'supports_attachments' => false,
            'allowed_file_types' => ['pdf', 'doc', 'docx', 'jpg', 'png'],
            'is_active' => true,
            'is_archived' => false,
            'version' => 1,
            'schema_json' => $this->defaultSchema(),
            'ui_config_json' => [],
            'workflow_config_json' => [],
        ], $overrides);
    }

    private function defaultSchema(): array
    {
        return [
            ['name' => 'summary', 'label' => 'الوصف / الملخص', 'type' => 'textarea', 'required' => true],
            ['name' => 'notes', 'label' => 'ملاحظات إضافية', 'type' => 'textarea', 'required' => false],
        ];
    }
}
