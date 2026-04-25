<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSectionRequest;
use App\Http\Requests\UpdateSectionRequest;
use App\Http\Resources\SectionResource;
use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Section::class, 'section');
    }

    public function index(Request $request)
    {
        $query = Section::with(['course', 'academicSupervisor', 'createdBy', 'students'])
            ->withCount('enrollments');
        if ($request->has('course_id')) $query->where('course_id', $request->course_id);
        if ($request->has('semester')) $query->where('semester', $request->semester);
        if ($request->has('academic_year')) $query->where('academic_year', $request->academic_year);
        
        $sections = $query->paginate($request->per_page ?? 15);
        return SectionResource::collection($sections);
    }

    public function store(StoreSectionRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        
        // Handle empty academic_supervisor_id
        if (empty($data['academic_supervisor_id'])) {
            $data['academic_supervisor_id'] = null;
        }
        
        $section = Section::create($data);
        return new SectionResource($section->load(['course', 'academicSupervisor', 'createdBy']));
    }

    public function show(Section $section)
    {
        return new SectionResource($section->load(['course', 'academicSupervisor', 'createdBy', 'students']));
    }

    public function update(UpdateSectionRequest $request, Section $section)
    {
        $section->update($request->validated());
        return new SectionResource($section->load(['course', 'academicSupervisor', 'createdBy']));
    }

    public function destroy(Section $section)
    {
        // Check if section has students
        if ($section->students()->count() > 0) {
            return response()->json(['message' => 'لا يمكن حذف شعبة تحتوي على طلاب'], 422);
        }
        
        $section->delete();
        return response()->json(['message' => 'تم حذف الشعبة']);
    }

    // Student assignment methods
    public function addStudent(Request $request, Section $section)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'status' => 'sometimes|in:accepted,rejected,pending',
            'notes' => 'sometimes|nullable|string'
        ]);

        $studentId = $request->student_id;
        
        // Check if student is already assigned to this section
        if ($section->students()->where('student_id', $studentId)->exists()) {
            return response()->json(['message' => 'الطالب مسجل بالفعل في هذه الشعبة'], 422);
        }

        // Check section capacity
        if (!$section->hasAvailableCapacity()) {
            return response()->json(['message' => 'الشعبة ممتلئة'], 422);
        }

        // Remove student from other sections of the same course if exists
        $section->course->sections()->each(function ($otherSection) use ($studentId) {
            $otherSection->students()->detach($studentId);
        });

        // Add student to this section
        $section->students()->attach($studentId, [
            'status' => $request->status ?? 'accepted',
            'notes' => $request->notes
        ]);

        return response()->json(['message' => 'تم إضافة الطالب للشعبة بنجاح']);
    }

    public function removeStudent(Request $request, Section $section)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id'
        ]);

        $studentId = $request->student_id;
        
        if (!$section->students()->where('student_id', $studentId)->exists()) {
            return response()->json(['message' => 'الطالب غير مسجل في هذه الشعبة'], 422);
        }

        $section->students()->detach($studentId);
        return response()->json(['message' => 'تم إزالة الطالب من الشعبة بنجاح']);
    }

    public function moveStudent(Request $request, Section $section)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'target_section_id' => 'required|exists:sections,id'
        ]);

        $studentId = $request->student_id;
        $targetSectionId = $request->target_section_id;

        $targetSection = Section::findOrFail($targetSectionId);

        // Check if target section has capacity
        if (!$targetSection->hasAvailableCapacity()) {
            return response()->json(['message' => 'الشعبة المستهدفة ممتلئة'], 422);
        }

        // Remove from current section
        $section->students()->detach($studentId);

        // Add to target section
        $targetSection->students()->attach($studentId, [
            'status' => 'accepted'
        ]);

        return response()->json(['message' => 'تم نقل الطالب بنجاح']);
    }

    public function assignSupervisor(Request $request, Section $section)
    {
        $request->validate([
            'supervisor_id' => 'nullable|exists:users,id'
        ]);

        // Check if supervisor is already assigned to another section of the same course
        if ($request->supervisor_id) {
            $existingAssignment = Section::where('course_id', $section->course_id)
                ->where('supervisor_id', $request->supervisor_id)
                ->where('id', '!=', $section->id)
                ->exists();

            if ($existingAssignment) {
                return response()->json(['message' => 'المشرف مسجل بالفعل في شعبة أخرى من نفس المساق'], 422);
            }
        }

        $section->update(['supervisor_id' => $request->supervisor_id]);
        return response()->json(['message' => 'تم تعيين المشرف بنجاح']);
    }

    public function getEnrollments(Section $section)
    {
        $this->authorize('view', $section);
        
        $enrollments = $section->enrollments()
            ->with(['user' => function ($query) {
                $query->select('id', 'name', 'university_id', 'email', 'phone');
            }])
            ->get();
        
        return response()->json(['data' => EnrollmentResource::collection($enrollments)]);
    }
}