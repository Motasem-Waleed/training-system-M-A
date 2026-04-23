<?php

namespace App\Services;

use App\Models\TrainingAssignment;
use App\Models\User;

class TrainingTrackResolver
{
    public const USOOL_TARBIAH = 'usool_tarbiah';
    public const PSYCHOLOGY = 'psychology';

    public const USOOL_TARBIAH_SCHOOL = 'usool_tarbiah_school';
    public const PSYCHOLOGY_SCHOOL = 'psychology_school';
    public const PSYCHOLOGY_CLINIC = 'psychology_clinic';

    public function resolveForAssignment(?TrainingAssignment $assignment): ?string
    {
        if (! $assignment) {
            return null;
        }

        $siteType = strtolower((string) data_get($assignment, 'trainingSite.site_type', ''));
        $department = strtolower((string) data_get($assignment, 'enrollment.user.department.name', ''));
        $courseCode = strtolower((string) data_get($assignment, 'enrollment.section.course.code', ''));
        $courseName = strtolower((string) data_get($assignment, 'enrollment.section.course.name', ''));

        $isPsychology = $this->looksLikePsychology($department, $courseCode, $courseName);

        if ($isPsychology && in_array($siteType, ['health_center', 'clinic', 'center', 'psychology_center'], true)) {
            return self::PSYCHOLOGY_CLINIC;
        }

        if ($isPsychology) {
            return self::PSYCHOLOGY_SCHOOL;
        }

        return self::USOOL_TARBIAH_SCHOOL;
    }

    public function resolveDepartment(User $user): ?string
    {
        $department = strtolower((string) data_get($user, 'department.name', ''));

        if ($this->looksLikePsychology($department)) {
            return self::PSYCHOLOGY;
        }

        if (str_contains($department, 'ترب') || str_contains($department, 'usool') || str_contains($department, 'educ')) {
            return self::USOOL_TARBIAH;
        }

        return null;
    }

    private function looksLikePsychology(string ...$parts): bool
    {
        $text = implode(' ', $parts);

        return str_contains($text, 'psych')
            || str_contains($text, 'علم النفس')
            || str_contains($text, 'نفسي');
    }
}
