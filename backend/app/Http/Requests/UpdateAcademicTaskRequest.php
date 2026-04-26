<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademicTaskRequest extends FormRequest
{
    private const TASK_TYPE_ALIASES = [
        'teaching' => 'teaching_artifact',
        'portfolio' => 'portfolio_item',
        'report' => 'weekly_report',
        'counseling' => 'counseling_plan',
    ];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $taskType = (string) $this->input('task_type', '');
        if ($taskType !== '' && isset(self::TASK_TYPE_ALIASES[$taskType])) {
            $this->merge(['task_type' => self::TASK_TYPE_ALIASES[$taskType]]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'instructions' => 'sometimes|nullable|string',
            'due_date' => 'sometimes|date',
            'task_type' => 'sometimes|in:general,weekly_report,daily_log,portfolio_item,lesson_critique,teaching_artifact,visit_preparation,reflection,counseling_plan,individual_session,group_guidance,case_study,behavior_plan,form_submission',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'string',
            'grading_weight' => 'sometimes|nullable|numeric|min:0|max:100',
            'allow_resubmission' => 'sometimes|boolean',
            'is_required' => 'sometimes|boolean',
            'status' => 'sometimes|in:pending,in_progress,completed,submitted,graded',
        ];
    }
}
