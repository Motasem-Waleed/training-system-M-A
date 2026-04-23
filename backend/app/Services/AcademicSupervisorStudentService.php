<?php

namespace App\Services;

use App\Models\TrainingAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AcademicSupervisorStudentService
{
    public function __construct(
        private readonly TrainingTrackResolver $trackResolver
    ) {
    }

    public function supervisedAssignmentsQuery(User $supervisor): Builder
    {
        return TrainingAssignment::query()
            ->where('academic_supervisor_id', $supervisor->id)
            ->with([
                'trainingSite',
                'teacher',
                'trainingPeriod',
                'enrollment.user.department',
                'enrollment.section.course',
            ]);
    }

    public function supervisedStudentIds(User $supervisor): array
    {
        return $this->supervisedAssignmentsQuery($supervisor)
            ->get()
            ->pluck('enrollment.user_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    public function getAssignmentForStudent(User $supervisor, int $studentId): ?TrainingAssignment
    {
        return $this->supervisedAssignmentsQuery($supervisor)
            ->whereHas('enrollment', fn (Builder $q) => $q->where('user_id', $studentId))
            ->latest('id')
            ->first();
    }

    public function mustGetAssignmentForStudent(User $supervisor, int $studentId): TrainingAssignment
    {
        $assignment = $this->getAssignmentForStudent($supervisor, $studentId);

        abort_unless($assignment, 403, 'You are not authorized to access this student.');

        return $assignment;
    }

    public function sections(User $supervisor): Collection
    {
        return $this->supervisedAssignmentsQuery($supervisor)
            ->get()
            ->pluck('enrollment.section')
            ->filter()
            ->unique('id')
            ->values()
            ->map(function ($section) {
                $section->training_track = $this->trackResolver->resolveForAssignment(
                    data_get($section, 'enrollments.0.trainingAssignments.0')
                );

                return $section;
            });
    }
}
