<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ArchiveController extends Controller
{
    /**
     * Get the user's department id (for head_of_department restriction).
     * Admin returns null = no restriction.
     */
    private function userDepartmentId(): ?int
    {
        $user = auth()->user();
        $role = $user?->role?->name;
        if ($role === 'admin') {
            return null; // no restriction
        }
        return $user?->department_id;
    }

    /**
     * Build sections query restricted to user's department.
     */
    private function departmentSectionsQuery()
    {
        $departmentId = $this->userDepartmentId();
        // withArchived() bypasses the NotArchivedScope so we can see archived sections too
        $query = Section::withArchived();

        if ($departmentId) {
            $courseIds = Course::where('department_id', $departmentId)->pluck('id');
            $query->whereIn('course_id', $courseIds);
        }

        return $query;
    }

    /**
     * Determine the most recent (current) training period from non-archived sections
     * within the user's department.
     */
    private function getCurrentPeriod(): ?array
    {
        $section = $this->departmentSectionsQuery()
            ->whereNull('archived_at')
            ->orderByDesc('academic_year')
            ->orderByDesc('id')
            ->first();

        if (!$section) {
            return null;
        }

        return [
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
            'label' => $section->academic_year . '-' . $section->semester,
        ];
    }

    /**
     * Returns counts of records that would be archived for current period.
     */
    public function preview(Request $request)
    {
        $this->authorizeArchive();

        $period = $this->getCurrentPeriod();
        if (!$period) {
            return response()->json([
                'message' => 'لا توجد فترة تدريبية حالية للأرشفة في قسمك',
                'period' => null,
                'counts' => [],
            ]);
        }

        $sectionIds = $this->departmentSectionsQuery()
            ->whereNull('archived_at')
            ->where('academic_year', $period['academic_year'])
            ->where('semester', $period['semester'])
            ->pluck('id');

        $enrollmentIds = Enrollment::whereNull('archived_at')
            ->whereIn('section_id', $sectionIds)
            ->pluck('id');

        $userIds = Enrollment::withArchived()->whereIn('id', $enrollmentIds)->pluck('user_id')->unique()->values();

        $counts = [
            'sections' => $sectionIds->count(),
            'enrollments' => $enrollmentIds->count(),
            'training_assignments' => $this->countByEnrollment('training_assignments', $enrollmentIds),
            'student_portfolios' => $this->countByEnrollment('student_portfolios', $enrollmentIds),
            'student_eforms' => $this->countByEnrollment('student_eforms', $enrollmentIds),
            'daily_reports' => $this->countByEnrollment('daily_reports', $enrollmentIds),
            'student_evaluations' => $this->countByEnrollment('student_evaluations', $enrollmentIds),
            'field_evaluations' => $this->countByEnrollment('field_evaluations', $enrollmentIds),
            'evaluations' => $this->countByEnrollment('evaluations', $enrollmentIds),
            'student_attendances' => $this->countByEnrollment('student_attendances', $enrollmentIds),
            'attendances' => $this->countByEnrollment('attendances', $enrollmentIds),
            'supervisor_visits' => $this->countByEnrollment('supervisor_visits', $enrollmentIds),
            'training_logs' => $this->countByEnrollment('training_logs', $enrollmentIds),
            'tasks' => $this->countBySection('tasks', $sectionIds),
            'weekly_schedules' => $this->countBySection('weekly_schedules', $sectionIds),
            'notes' => $this->countByUser('notes', $userIds),
            'notifications' => $this->countByUser('notifications', $userIds),
            'announcements' => $this->countByUser('announcements', $userIds),
            'official_letters' => $this->countByUser('official_letters', $userIds),
        ];

        return response()->json([
            'period' => $period,
            'department_id' => $this->userDepartmentId(),
            'counts' => $counts,
        ]);
    }

    /**
     * Archive all training-period related data for the current period.
     */
    public function archiveCurrentPeriod(Request $request)
    {
        $this->authorizeArchive();

        $period = $this->getCurrentPeriod();
        if (!$period) {
            return response()->json([
                'message' => 'لا توجد فترة تدريبية حالية للأرشفة في قسمك',
            ], 422);
        }

        $now = now();
        $departmentId = $this->userDepartmentId();
        $label = $period['label'] . ($departmentId ? '-d' . $departmentId : '');

        $result = DB::transaction(function () use ($period, $now, $label) {
            $sectionIds = $this->departmentSectionsQuery()
                ->whereNull('archived_at')
                ->where('academic_year', $period['academic_year'])
                ->where('semester', $period['semester'])
                ->pluck('id');

            $enrollmentIds = Enrollment::whereNull('archived_at')
                ->whereIn('section_id', $sectionIds)
                ->pluck('id');

            $userIds = Enrollment::withArchived()->whereIn('id', $enrollmentIds)->pluck('user_id')->unique()->values();

            $archived = [];

            $archived['sections'] = Section::withArchived()->whereIn('id', $sectionIds)
                ->update(['archived_at' => $now, 'archived_period' => $label]);

            $archived['enrollments'] = Enrollment::withArchived()->whereIn('id', $enrollmentIds)
                ->update(['archived_at' => $now, 'archived_period' => $label]);

            $byEnrollment = [
                'training_assignments',
                'student_portfolios',
                'student_eforms',
                'daily_reports',
                'student_evaluations',
                'field_evaluations',
                'evaluations',
                'student_attendances',
                'attendances',
                'supervisor_visits',
                'training_logs',
            ];
            foreach ($byEnrollment as $tbl) {
                $archived[$tbl] = $this->archiveByEnrollment($tbl, $enrollmentIds, $now, $label);
            }

            $bySection = ['tasks', 'weekly_schedules'];
            foreach ($bySection as $tbl) {
                $archived[$tbl] = $this->archiveBySection($tbl, $sectionIds, $now, $label);
            }

            // Cascade portfolio_entries via student_portfolios
            if (Schema::hasTable('portfolio_entries') && Schema::hasColumn('portfolio_entries', 'archived_at')) {
                $portfolioIds = DB::table('student_portfolios')
                    ->where('archived_period', $label)
                    ->pluck('id');
                $archived['portfolio_entries'] = DB::table('portfolio_entries')
                    ->whereIn('student_portfolio_id', $portfolioIds)
                    ->whereNull('archived_at')
                    ->update(['archived_at' => $now, 'archived_period' => $label]);
            }

            // Cascade task_submissions via tasks
            if (Schema::hasTable('task_submissions') && Schema::hasColumn('task_submissions', 'archived_at')) {
                $taskIds = DB::table('tasks')
                    ->where('archived_period', $label)
                    ->pluck('id');
                $archived['task_submissions'] = DB::table('task_submissions')
                    ->whereIn('task_id', $taskIds)
                    ->whereNull('archived_at')
                    ->update(['archived_at' => $now, 'archived_period' => $label]);
            }

            // Communication tables linked via user_id
            $byUser = ['notes', 'notifications', 'announcements', 'official_letters'];
            foreach ($byUser as $tbl) {
                $archived[$tbl] = $this->archiveByUser($tbl, $userIds, $now, $label);
            }

            return $archived;
        });

        return response()->json([
            'message' => 'تمت أرشفة بيانات الفترة التدريبية بنجاح',
            'period' => $period,
            'archived' => $result,
        ]);
    }

    /**
     * List all archived periods for the user's department.
     */
    public function listArchivedPeriods(Request $request)
    {
        $this->authorizeArchive();

        $sectionsQuery = $this->departmentSectionsQuery()
            ->whereNotNull('archived_at')
            ->select(
                'academic_year',
                'semester',
                'archived_period',
                DB::raw('COUNT(*) as sections_count'),
                DB::raw('MAX(archived_at) as archived_at')
            )
            ->groupBy('academic_year', 'semester', 'archived_period')
            ->orderByDesc('archived_at');

        $periods = $sectionsQuery->get()->map(function ($row) {
            $sectionIds = $this->departmentSectionsQuery()
                ->where('academic_year', $row->academic_year)
                ->where('semester', $row->semester)
                ->where('archived_period', $row->archived_period)
                ->pluck('id');

            $enrollmentsCount = DB::table('enrollments')
                ->whereIn('section_id', $sectionIds)
                ->count();

            return [
                'academic_year' => $row->academic_year,
                'semester' => $row->semester,
                'semester_label' => $this->semesterLabel($row->semester),
                'archived_period' => $row->archived_period,
                'archived_at' => $row->archived_at,
                'sections_count' => (int) $row->sections_count,
                'enrollments_count' => $enrollmentsCount,
            ];
        });

        return response()->json([
            'department_id' => $this->userDepartmentId(),
            'periods' => $periods,
        ]);
    }

    /**
     * Get full details of an archived period for current user's department.
     */
    public function periodDetails(Request $request)
    {
        $this->authorizeArchive();

        $academicYear = $request->query('academic_year');
        $semester = $request->query('semester');
        $archivedPeriod = $request->query('archived_period');

        if (!$academicYear || !$semester) {
            return response()->json(['message' => 'يرجى تحديد academic_year و semester'], 422);
        }

        $sectionsQuery = $this->departmentSectionsQuery()
            ->whereNotNull('archived_at')
            ->where('academic_year', $academicYear)
            ->where('semester', $semester);

        if ($archivedPeriod) {
            $sectionsQuery->where('archived_period', $archivedPeriod);
        }

        $sections = $sectionsQuery
            ->with(['course', 'academicSupervisor'])
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'capacity' => $s->capacity,
                    'course' => $s->course ? [
                        'id' => $s->course->id,
                        'name' => $s->course->name,
                        'code' => $s->course->code,
                    ] : null,
                    'academic_supervisor' => $s->academicSupervisor ? [
                        'id' => $s->academicSupervisor->id,
                        'name' => $s->academicSupervisor->name,
                    ] : null,
                    'enrollments_count' => DB::table('enrollments')
                        ->where('section_id', $s->id)
                        ->whereNotNull('archived_at')
                        ->count(),
                    'archived_at' => $s->archived_at,
                ];
            });

        $sectionIds = $sections->pluck('id');

        $enrollments = DB::table('enrollments')
            ->leftJoin('users', 'users.id', '=', 'enrollments.user_id')
            ->leftJoin('sections', 'sections.id', '=', 'enrollments.section_id')
            ->leftJoin('courses', 'courses.id', '=', 'sections.course_id')
            ->whereIn('enrollments.section_id', $sectionIds)
            ->select(
                'enrollments.id',
                'enrollments.status',
                'enrollments.final_grade',
                'enrollments.archived_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.university_id',
                'users.email',
                'sections.id as section_id',
                'sections.name as section_name',
                'courses.name as course_name',
                'courses.code as course_code'
            )
            ->orderBy('courses.name')
            ->orderBy('sections.name')
            ->orderBy('users.name')
            ->get();

        $enrollmentIds = $enrollments->pluck('id');

        $stats = [
            'sections' => $sections->count(),
            'enrollments' => $enrollments->count(),
            'students' => $enrollments->pluck('user_id')->unique()->count(),
            'training_assignments' => $this->countByEnrollment('training_assignments', $enrollmentIds),
            'student_portfolios' => $this->countByEnrollment('student_portfolios', $enrollmentIds),
            'student_eforms' => $this->countByEnrollment('student_eforms', $enrollmentIds),
            'daily_reports' => $this->countByEnrollment('daily_reports', $enrollmentIds),
            'student_evaluations' => $this->countByEnrollment('student_evaluations', $enrollmentIds),
            'field_evaluations' => $this->countByEnrollment('field_evaluations', $enrollmentIds),
            'evaluations' => $this->countByEnrollment('evaluations', $enrollmentIds),
            'student_attendances' => $this->countByEnrollment('student_attendances', $enrollmentIds),
            'attendances' => $this->countByEnrollment('attendances', $enrollmentIds),
            'supervisor_visits' => $this->countByEnrollment('supervisor_visits', $enrollmentIds),
            'training_logs' => $this->countByEnrollment('training_logs', $enrollmentIds),
            'tasks' => $this->countBySection('tasks', $sectionIds),
            'weekly_schedules' => $this->countBySection('weekly_schedules', $sectionIds),
        ];

        return response()->json([
            'period' => [
                'academic_year' => $academicYear,
                'semester' => $semester,
                'semester_label' => $this->semesterLabel($semester),
                'archived_period' => $archivedPeriod,
            ],
            'stats' => $stats,
            'sections' => $sections,
            'enrollments' => $enrollments,
        ]);
    }

    private function semesterLabel(string $s): string
    {
        return match ($s) {
            'first' => 'الفصل الأول',
            'second' => 'الفصل الثاني',
            'summer' => 'الفصل الصيفي',
            default => $s,
        };
    }

    private function authorizeArchive(): void
    {
        $user = auth()->user();
        $role = $user?->role?->name;
        if (!in_array($role, ['admin', 'head_of_department'])) {
            abort(403, 'غير مصرح بأرشفة البيانات');
        }
        if ($role === 'head_of_department' && empty($user->department_id)) {
            abort(403, 'يجب تحديد قسم رئيس القسم قبل الأرشفة');
        }
    }

    private function countByEnrollment(string $table, $enrollmentIds): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'enrollment_id') || !Schema::hasColumn($table, 'archived_at')) {
            return 0;
        }
        return DB::table($table)
            ->whereIn('enrollment_id', $enrollmentIds)
            ->whereNull('archived_at')
            ->count();
    }

    private function countBySection(string $table, $sectionIds): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'section_id') || !Schema::hasColumn($table, 'archived_at')) {
            return 0;
        }
        return DB::table($table)
            ->whereIn('section_id', $sectionIds)
            ->whereNull('archived_at')
            ->count();
    }

    private function countByUser(string $table, $userIds): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'archived_at')) {
            return 0;
        }
        $userColumn = $this->detectUserColumn($table);
        if (!$userColumn) {
            return 0;
        }
        return DB::table($table)
            ->whereIn($userColumn, $userIds)
            ->whereNull('archived_at')
            ->count();
    }

    private function archiveByEnrollment(string $table, $enrollmentIds, $now, string $label): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'enrollment_id') || !Schema::hasColumn($table, 'archived_at')) {
            return 0;
        }
        return DB::table($table)
            ->whereIn('enrollment_id', $enrollmentIds)
            ->whereNull('archived_at')
            ->update(['archived_at' => $now, 'archived_period' => $label]);
    }

    private function archiveBySection(string $table, $sectionIds, $now, string $label): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'section_id') || !Schema::hasColumn($table, 'archived_at')) {
            return 0;
        }
        return DB::table($table)
            ->whereIn('section_id', $sectionIds)
            ->whereNull('archived_at')
            ->update(['archived_at' => $now, 'archived_period' => $label]);
    }

    private function archiveByUser(string $table, $userIds, $now, string $label): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'archived_at')) {
            return 0;
        }
        $userColumn = $this->detectUserColumn($table);
        if (!$userColumn) {
            return 0;
        }
        return DB::table($table)
            ->whereIn($userColumn, $userIds)
            ->whereNull('archived_at')
            ->update(['archived_at' => $now, 'archived_period' => $label]);
    }

    private function detectUserColumn(string $table): ?string
    {
        foreach (['user_id', 'recipient_id', 'sender_id', 'created_by', 'author_id'] as $col) {
            if (Schema::hasColumn($table, $col)) {
                return $col;
            }
        }
        return null;
    }
}
