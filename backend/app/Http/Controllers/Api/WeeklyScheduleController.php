<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWeeklyScheduleRequest;
use App\Http\Resources\WeeklyScheduleResource;
use App\Models\WeeklySchedule;
use Illuminate\Http\Request;

class WeeklyScheduleController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(WeeklySchedule::class, 'weekly_schedule');
    }

    public function index(Request $request)
    {
        $query = WeeklySchedule::with(['teacher', 'trainingSite', 'submittedBy']);
        if ($request->has('teacher_id')) $query->where('teacher_id', $request->teacher_id);
        if ($request->has('training_site_id')) $query->where('training_site_id', $request->training_site_id);
        if ($request->has('day')) $query->where('day', $request->day);
        
        $schedules = $query->paginate($request->per_page ?? 15);
        return WeeklyScheduleResource::collection($schedules);
    }

    public function store(StoreWeeklyScheduleRequest $request)
    {
        $data = $request->validated();
        $data['submitted_by'] = $request->user()->id;
        $schedule = WeeklySchedule::create($data);
        return new WeeklyScheduleResource($schedule);
    }

    public function show(WeeklySchedule $weeklySchedule)
    {
        return new WeeklyScheduleResource($weeklySchedule->load(['teacher', 'trainingSite', 'submittedBy']));
    }

    public function destroy(WeeklySchedule $weeklySchedule)
    {
        $weeklySchedule->delete();
        return response()->json(['message' => 'تم حذف الجدول']);
    }

    /**
     * جدول الطالب الأسبوعي حسب موقع التدريب والمعلم المرشد في تعيينه الحالي.
     */
    public function studentSchedule(Request $request)
    {
        $user = $request->user();
        abort_unless($user->role?->name === 'student', 403);

        $assignment = $user->currentTrainingAssignment();
        if (! $assignment || ! $assignment->training_site_id || ! $assignment->teacher_id) {
            return WeeklyScheduleResource::collection(collect())->additional([
                'meta' => [
                    'school_name' => null,
                    'mentor_name' => null,
                    'period_name' => null,
                    'period_start' => null,
                    'period_end' => null,
                    'message' => 'لا يوجد تعيين تدريبي نشط أو لم يُحدَّد المعلم المرشد بعد.',
                ],
            ]);
        }

        $assignment->loadMissing(['trainingSite', 'teacher', 'trainingPeriod']);

        $order = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
        $items = WeeklySchedule::with(['teacher', 'trainingSite'])
            ->where('training_site_id', $assignment->training_site_id)
            ->where('teacher_id', $assignment->teacher_id)
            ->get()
            ->sortBy(function ($row) use ($order) {
                $i = array_search($row->day, $order, true);

                return $i === false ? 99 : $i;
            })
            ->values();

        return WeeklyScheduleResource::collection($items)->additional([
            'meta' => [
                'school_name' => $assignment->trainingSite?->name,
                'mentor_name' => $assignment->teacher?->name,
                'period_name' => $assignment->trainingPeriod?->name,
                'period_start' => $assignment->trainingPeriod?->start_date?->toDateString(),
                'period_end' => $assignment->trainingPeriod?->end_date?->toDateString(),
                'message' => null,
            ],
        ]);
    }
}