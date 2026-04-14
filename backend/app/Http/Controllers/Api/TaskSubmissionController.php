<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskSubmissionRequest;
use App\Http\Requests\UpdateTaskSubmissionRequest;
use App\Http\Requests\GradeTaskSubmissionRequest;
use App\Http\Resources\TaskSubmissionResource;
use App\Models\TaskSubmission;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TaskSubmissionController extends Controller
{
    public function __construct()
    {
        // تطبيق سياسة الصلاحيات على جميع دوال الـ Resource
        $this->authorizeResource(TaskSubmission::class, 'task_submission');
    }

    /**
     * عرض جميع تسليمات المهام (يمكن تصفيتها حسب task_id أو user_id)
     */
    public function index(Request $request)
    {
        $query = TaskSubmission::with(['task', 'user']);
        
        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        $submissions = $query->latest()->paginate($request->per_page ?? 15);
        return TaskSubmissionResource::collection($submissions);
    }

    /**
     * تسليم مهمة (رفع ملف)
     */
    public function store(StoreTaskSubmissionRequest $request)
    {
        $data = $request->validated();
        
        // رفع الملف
        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('task_submissions', 'public');
        }
        
        $data['submitted_at'] = now();
        $data['user_id'] = $request->user()->id;
        
        $submission = TaskSubmission::create($data);
        
        // تحديث حالة المهمة إلى "submitted" إذا كانت لا تزال pending أو in_progress
        $task = Task::find($data['task_id']);
        if ($task && in_array($task->status, ['pending', 'in_progress'])) {
            $task->update(['status' => 'submitted']);
        }
        
        return new TaskSubmissionResource($submission);
    }

    /**
     * عرض تسليم معين
     */
    public function show(TaskSubmission $taskSubmission)
    {
        return new TaskSubmissionResource($taskSubmission->load(['task', 'user']));
    }

    /**
     * تحديث تسليم (نادراً ما يستخدم، لكن يمكن للطالب تعديل تسليمه قبل التقييم)
     */
    public function update(UpdateTaskSubmissionRequest $request, TaskSubmission $taskSubmission)
    {
        $data = $request->validated();
        
        if ($request->hasFile('file')) {
            // حذف الملف القديم إن وجد
            if ($taskSubmission->file_path) {
                Storage::disk('public')->delete($taskSubmission->file_path);
            }
            $data['file_path'] = $request->file('file')->store('task_submissions', 'public');
        }
        
        $taskSubmission->update($data);
        return new TaskSubmissionResource($taskSubmission);
    }

    /**
     * تقييم التسليم (إضافة درجة وملاحظات) – للمشرف أو المعلم
     */
    public function grade(GradeTaskSubmissionRequest $request, TaskSubmission $taskSubmission)
    {
        $this->authorize('grade', $taskSubmission);
        
        $taskSubmission->update([
            'grade' => $request->grade,
            'feedback' => $request->feedback,
        ]);
        
        // تحديث حالة المهمة إلى "graded"
        $taskSubmission->task->update(['status' => 'graded']);
        
        return new TaskSubmissionResource($taskSubmission);
    }

    /**
     * حذف تسليم
     */
    public function destroy(TaskSubmission $taskSubmission)
    {
        // حذف الملف المرتبط
        if ($taskSubmission->file_path) {
            Storage::disk('public')->delete($taskSubmission->file_path);
        }
        
        $taskSubmission->delete();
        return response()->json(['message' => 'تم حذف التسليم بنجاح']);
    }
}