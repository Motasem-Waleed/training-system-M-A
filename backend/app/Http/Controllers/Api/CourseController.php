<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Course::class, 'course');
    }

    public function index(Request $request)
    {
        $query = Course::with('sections', 'department');
        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('department_id')) $query->where('department_id', $request->department_id);
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('code', 'like', '%'.$request->search.'%')
                  ->orWhere('name', 'like', '%'.$request->search.'%');
            });
        }
        $courses = $query->paginate($request->per_page ?? 15);
        return CourseResource::collection($courses);
    }

    public function store(StoreCourseRequest $request)
    {
        $course = Course::create($request->validated());
        return new CourseResource($course);
    }

    public function show(Course $course)
    {
        return new CourseResource($course->load('sections'));
    }

    public function update(UpdateCourseRequest $request, Course $course)
    {
        $course->update($request->validated());
        return new CourseResource($course);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->json(['message' => 'تم حذف المساق']);
    }
}