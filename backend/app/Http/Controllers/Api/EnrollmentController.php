<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Http\Requests\UpdateEnrollmentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Enrollment::class, 'enrollment');
    }

    public function index(Request $request)
    {
        $query = Enrollment::with(['user', 'section.course']);
        if ($request->has('section_id')) $query->where('section_id', $request->section_id);
        if ($request->has('user_id')) $query->where('user_id', $request->user_id);
        if ($request->has('status')) $query->where('status', $request->status);
        
        $enrollments = $query->paginate($request->per_page ?? 15);
        return EnrollmentResource::collection($enrollments);
    }

    public function store(StoreEnrollmentRequest $request)
    {
        $data = $request->validated();
        
        // Check if student is already enrolled in any section during this period
        $existingEnrollment = Enrollment::where('user_id', $data['user_id'])
            ->where('academic_year', $data['academic_year'])
            ->where('semester', $data['semester'])
            ->where('status', '!=', 'dropped')
            ->with('section.course')
            ->first();
        
        if ($existingEnrollment) {
            $courseName = $existingEnrollment->section?->course?->name ?? 'غير معروف';
            $sectionName = $existingEnrollment->section?->name ?? 'غير معروف';
            return response()->json([
                'message' => "الطالب مسجل بالفعل في مساق ({$courseName}) شعبة ({$sectionName}) لنفس الفترة التدريبية. لا يمكن تسجيله في أكثر من شعبة أو مساق في نفس الفترة."
            ], 422);
        }
        
        $enrollment = Enrollment::create($data);
        return new EnrollmentResource($enrollment);
    }

    public function show(Enrollment $enrollment)
    {
        return new EnrollmentResource($enrollment->load(['user', 'section.course']));
    }

    public function update(UpdateEnrollmentRequest $request, Enrollment $enrollment)
    {
        $enrollment->update($request->validated());
        return new EnrollmentResource($enrollment);
    }

    public function destroy(Enrollment $enrollment)
    {
        $enrollment->delete();
        return response()->json(['message' => 'تم حذف التسجيل']);
    }
}