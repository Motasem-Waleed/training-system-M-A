<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTrainingAssignmentRequest;
use App\Http\Resources\TrainingAssignmentResource;
use App\Models\TrainingAssignment;
use App\Models\User;
use Illuminate\Http\Request;

class TrainingAssignmentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(TrainingAssignment::class, 'training_assignment');
    }

    public function index(Request $request)
    {
        $query = TrainingAssignment::with(['enrollment.user', 'trainingSite', 'teacher', 'academicSupervisor']);
        
        if ($request->user()->role?->name === 'student') {
            $query->whereHas('enrollment', fn ($q) => $q->where('user_id', $request->user()->id));
        } elseif ($request->user()->role?->name === 'teacher') {
            $query->where('teacher_id', $request->user()->id);
        } elseif ($request->user()->role?->name === 'academic_supervisor') {
            $query->where('academic_supervisor_id', $request->user()->id);
        } elseif ($request->user()->role?->name === 'school_manager' && $request->user()->training_site_id) {
            $query->where('training_site_id', $request->user()->training_site_id);
        }
        
        $assignments = $query->latest()->paginate($request->per_page ?? 15);
        return TrainingAssignmentResource::collection($assignments);
    }

    public function show(TrainingAssignment $trainingAssignment)
    {
        return new TrainingAssignmentResource($trainingAssignment->load(['enrollment.user', 'trainingSite', 'teacher', 'academicSupervisor', 'trainingLogs', 'attendances']));
    }

    public function update(UpdateTrainingAssignmentRequest $request, TrainingAssignment $trainingAssignment)
    {
        $data = $request->validated();
        if (array_key_exists('academic_supervisor_id', $data)) {
            $this->ensureSupervisorMatchesAssignmentDepartment($data['academic_supervisor_id'], $trainingAssignment);
        }

        $trainingAssignment->update($data);
        return new TrainingAssignmentResource($trainingAssignment);
    }

    private function ensureSupervisorMatchesAssignmentDepartment(?int $supervisorId, TrainingAssignment $assignment): void
    {
        if (! $supervisorId) {
            return;
        }

        $supervisor = User::with('role')->findOrFail($supervisorId);
        abort_unless($supervisor->role?->name === 'academic_supervisor', 422, 'المستخدم المحدد ليس مشرفاً أكاديمياً.');

        $assignment->loadMissing(['enrollment.user', 'enrollment.section.course']);
        $studentDepartmentId = $assignment->enrollment?->user?->department_id;
        $courseDepartmentId = $assignment->enrollment?->section?->course?->department_id;

        if ($supervisor->department_id && ($studentDepartmentId || $courseDepartmentId)) {
            abort_unless(
                (int) $supervisor->department_id === (int) ($studentDepartmentId ?: $courseDepartmentId),
                422,
                'قسم المشرف الأكاديمي لا يطابق قسم الطالب أو المساق.'
            );
        }
    }
}