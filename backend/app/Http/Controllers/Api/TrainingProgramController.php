<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeatureFlag;
use App\Models\PortfolioEntry;
use App\Models\StudentPortfolio;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class TrainingProgramController extends Controller
{
    /**
     * عرض برنامج التدريب للطالب المسجل
     */
    public function show(Request $request)
    {
        $user = $request->user();

        $program = TrainingProgram::where('user_id', $user->id)->first();

        $isOpen = FeatureFlag::where('name', 'training_program.edit')->value('is_open') ?? false;

        $assignment = $user->currentTrainingAssignment();

        return response()->json([
            'data' => $program ? [
                'id' => $program->id,
                'schedule' => $program->schedule,
                'created_at' => $program->created_at,
                'updated_at' => $program->updated_at,
            ] : null,
            'is_editable' => $isOpen,
            'student_info' => [
                'name' => $user->name,
                'university_id' => $user->university_id,
                'school' => $assignment?->trainingSite?->name ?? '—',
                'semester' => $assignment?->trainingPeriod?->name ?? '—',
            ],
        ]);
    }

    /**
     * حفظ/تحديث برنامج التدريب
     */
    public function store(Request $request)
    {
        $isOpen = FeatureFlag::where('name', 'training_program.edit')->value('is_open') ?? false;

        if (! $isOpen) {
            return response()->json([
                'message' => 'إدخال برنامج التدريب مغلق حالياً من قبل المنسق.',
            ], 403);
        }

        $request->validate([
            'schedule' => 'required|array',
        ]);

        $user = $request->user();
        $assignment = $user->currentTrainingAssignment();

        $program = TrainingProgram::updateOrCreate(
            ['user_id' => $user->id],
            [
                'schedule' => $request->schedule,
                'training_assignment_id' => $assignment?->id,
            ]
        );

        // حفظ نسخة في الملف الإنجازي
        $this->syncToPortfolio($user, $program);

        return response()->json([
            'message' => 'تم حفظ برنامج التدريب بنجاح',
            'data' => [
                'id' => $program->id,
                'schedule' => $program->schedule,
            ],
        ]);
    }

    /**
     * عرض برنامج تدريب طالب معين (للمعلم/المشرف/المنسق)
     */
    public function showForStudent(Request $request, $studentId)
    {
        $program = TrainingProgram::where('user_id', $studentId)->first();

        if (! $program) {
            return response()->json(['data' => null, 'message' => 'لا يوجد برنامج تدريب لهذا الطالب بعد.']);
        }

        return response()->json([
            'data' => [
                'id' => $program->id,
                'schedule' => $program->schedule,
                'student' => [
                    'id' => $program->user->id,
                    'name' => $program->user->name,
                    'university_id' => $program->user->university_id,
                ],
                'created_at' => $program->created_at,
                'updated_at' => $program->updated_at,
            ],
        ]);
    }

    /**
     * حفظ نسخة من برنامج التدريب في الملف الإنجازي
     */
    protected function syncToPortfolio($user, $program)
    {
        $portfolio = StudentPortfolio::where('user_id', $user->id)->first();

        if (! $portfolio) {
            try {
                $portfolio = StudentPortfolio::create([
                    'user_id' => $user->id,
                    'training_assignment_id' => $program->training_assignment_id,
                ]);
            } catch (QueryException $e) {
                return;
            }
        }

        $title = 'برنامج التدريب';
        $content = json_encode($program->schedule, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        PortfolioEntry::updateOrCreate(
            [
                'student_portfolio_id' => $portfolio->id,
                'title' => $title,
            ],
            [
                'content' => $content,
            ]
        );
    }
}
