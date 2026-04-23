<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['training_assignment_id', 'status', 'date'], 'att_assign_status_date_idx');
        });

        Schema::table('training_logs', function (Blueprint $table) {
            $table->index(['training_assignment_id', 'status'], 'logs_assign_status_idx');
            $table->index(['training_assignment_id', 'academic_review_status'], 'logs_assign_academic_status_idx');
        });

        Schema::table('task_submissions', function (Blueprint $table) {
            $table->index(['review_status', 'needs_resubmission'], 'task_sub_review_resub_idx');
            $table->index(['user_id', 'review_status'], 'task_sub_user_review_idx');
            $table->index(['task_id', 'review_status'], 'task_sub_task_review_idx');
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->index(['training_assignment_id', 'is_final'], 'eval_assign_final_idx');
            $table->index(['evaluator_id', 'is_final'], 'eval_evaluator_final_idx');
            $table->index(['status', 'submitted_at'], 'eval_status_submitted_idx');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->index(['academic_supervisor_id', 'semester', 'course_id'], 'sections_supervisor_sem_course_idx');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->index(['section_id', 'status'], 'enrollments_section_status_idx');
            $table->index(['user_id', 'status'], 'enrollments_user_status_idx');
        });

        Schema::table('supervisor_visits', function (Blueprint $table) {
            $table->index(['supervisor_id', 'scheduled_date', 'status'], 'visits_supervisor_sched_status_idx');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->index(['training_assignment_id', 'created_at'], 'notes_assign_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_assign_created_idx');
        });

        Schema::table('supervisor_visits', function (Blueprint $table) {
            $table->dropIndex('visits_supervisor_sched_status_idx');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex('enrollments_section_status_idx');
            $table->dropIndex('enrollments_user_status_idx');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->dropIndex('sections_supervisor_sem_course_idx');
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropIndex('eval_assign_final_idx');
            $table->dropIndex('eval_evaluator_final_idx');
            $table->dropIndex('eval_status_submitted_idx');
        });

        Schema::table('task_submissions', function (Blueprint $table) {
            $table->dropIndex('task_sub_review_resub_idx');
            $table->dropIndex('task_sub_user_review_idx');
            $table->dropIndex('task_sub_task_review_idx');
        });

        Schema::table('training_logs', function (Blueprint $table) {
            $table->dropIndex('logs_assign_status_idx');
            $table->dropIndex('logs_assign_academic_status_idx');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('att_assign_status_date_idx');
        });
    }
};
