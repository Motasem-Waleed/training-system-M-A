<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $task = $this->route('task');
        if ($task instanceof Task) {
            $this->merge(['task_id' => $task->id]);
        }
    }

    public function rules(): array
    {
        return [
            'task_id' => 'required|exists:tasks,id',
            'file' => 'nullable|file|max:10240',
            'notes' => 'nullable|string|max:5000',
        ];
    }
}
