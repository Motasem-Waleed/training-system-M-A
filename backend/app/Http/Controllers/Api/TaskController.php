<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\SubmitTaskRequest;
use App\Http\Requests\GradeTaskSubmissionRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    protected $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;

        // حماية الـ routes الخاصة بـ CRUD
        $this->authorizeResource(Task::class, 'task');
    }

    /**
     * Student Tasks (FIXED)
     */
    public function studentIndex(Request $request)
    {
        $user = $request->user();

        // حماية من عدم تسجيل الدخول
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // جلب المهام حسب علاقة التدريب
        $tasks = Task::whereHas('trainingAssignment.enrollment', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->latest()
        ->get();

        return response()->json([
            'data' => $tasks
        ]);
    }

    /**
     * Admin / Teacher index
     */
    public function index(Request $request)
    {
        $query = Task::with([
            'trainingAssignment.enrollment.user',
            'assignedBy'
        ]);

        if ($request->user()->role?->name === 'student') {
            $query->whereHas('trainingAssignment.enrollment', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            });

        } elseif ($request->user()->role?->name === 'teacher') {
            $query->where('assigned_by', $request->user()->id);
        }

        $tasks = $query->latest()->paginate($request->per_page ?? 15);

        return TaskResource::collection($tasks);
    }

    /**
     * Create task
     */
    public function store(StoreTaskRequest $request)
    {
        $task = $this->taskService->createTask(
            $request->validated(),
            $request->user()->id
        );

        return new TaskResource($task);
    }

    /**
     * Show task
     */
    public function show(Task $task)
    {
        return new TaskResource(
            $task->load(['submissions.user', 'trainingAssignment'])
        );
    }

    /**
     * Update task
     */
    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task = $this->taskService->updateTask($task, $request->validated());

        return new TaskResource($task);
    }

    /**
     * Delete task
     */
    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json([
            'message' => 'تم حذف المهمة'
        ]);
    }

    /**
     * Submit task (student)
     */
    public function submit(SubmitTaskRequest $request, Task $task)
    {
        $submission = $this->taskService->submitTask(
            $task,
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'تم تسليم المهمة بنجاح',
            'submission_id' => $submission->id
        ]);
    }

    /**
     * Grade submission
     */
    public function grade(GradeTaskSubmissionRequest $request, TaskSubmission $submission)
    {
        $this->taskService->gradeSubmission(
            $submission,
            $request->grade,
            $request->feedback
        );

        return response()->json([
            'message' => 'تم تقييم المهمة بنجاح'
        ]);
    }
}