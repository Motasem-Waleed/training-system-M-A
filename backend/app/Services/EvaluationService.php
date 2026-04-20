<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\EvaluationScore;
use App\Models\EvaluationItem;
use App\Models\TrainingAssignment;
use Illuminate\Support\Facades\DB;

class EvaluationService
{
    /**
     * إنشاء تقييم جديد (من مقيم: معلم مرشد، مشرف أكاديمي، مدير مدرسة)
     */
    public function createEvaluation(array $data, int $evaluatorId): Evaluation
    {
        return DB::transaction(function () use ($data, $evaluatorId) {
            // حساب total_score من الأصناف التي تحمل score
            $totalScore = 0;
            foreach ($data['scores'] as $scoreItem) {
                if (isset($scoreItem['score'])) {
                    $totalScore += $scoreItem['score'];
                }
            }

            $evaluation = Evaluation::create([
                'training_assignment_id' => $data['training_assignment_id'],
                'evaluator_id' => $evaluatorId,
                'template_id' => $data['template_id'],
                'total_score' => $totalScore,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['scores'] as $scoreItem) {
                $safeScore = isset($scoreItem['score']) && $scoreItem['score'] !== null
                    ? $scoreItem['score']
                    : 0;

                EvaluationScore::create([
                    'evaluation_id' => $evaluation->id,
                    'item_id' => $scoreItem['item_id'],
                    'score' => $safeScore,
                    'response_text' => $scoreItem['response_text'] ?? null,
                    'file_path' => $scoreItem['file_path'] ?? null,
                ]);
            }

            return $evaluation->load('scores');
        });
    }

    /**
     * تحديث تقييم (إضافة ملاحظات أو تعديل درجات - فقط إذا لم يُعتمد بعد)
     */
    public function updateEvaluation(Evaluation $evaluation, array $data): Evaluation
    {
        return DB::transaction(function () use ($evaluation, $data) {
            if (isset($data['notes'])) {
                $evaluation->update(['notes' => $data['notes']]);
            }

            if (isset($data['scores'])) {
                foreach ($data['scores'] as $scoreData) {
                    $score = EvaluationScore::where('evaluation_id', $evaluation->id)
                        ->where('item_id', $scoreData['item_id'])
                        ->first();
                    if ($score) {
                        $safeScore = isset($scoreData['score']) && $scoreData['score'] !== null
                            ? $scoreData['score']
                            : 0;

                        $score->update([
                            'score' => $safeScore,
                            'response_text' => $scoreData['response_text'] ?? $score->response_text,
                        ]);
                    }
                }
                // إعادة حساب total_score
                $total = EvaluationScore::where('evaluation_id', $evaluation->id)->sum('score');
                $evaluation->update(['total_score' => $total]);
            }

            return $evaluation->fresh();
        });
    }

    /**
     * جلب تقييمات الطالب لتدريب معين
     */
    public function getStudentEvaluations(int $trainingAssignmentId): array
    {
        $evaluations = Evaluation::with(['template', 'scores.item'])
            ->where('training_assignment_id', $trainingAssignmentId)
            ->get();

        $result = [
            'academic_supervisor' => null,
            'school_mentor' => null,
            'school_principal' => null,
            'psychologist' => null,
        ];

        foreach ($evaluations as $eval) {
            $role = $eval->evaluator->role->name;
            switch ($role) {
                case 'academic_supervisor':
                    $result['academic_supervisor'] = $eval;
                    break;
                case 'teacher':
                    $result['school_mentor'] = $eval;
                    break;
                case 'school_manager':
                    $result['school_principal'] = $eval;
                    break;
                case 'psychologist':
                    $result['psychologist'] = $eval;
                    break;
            }
        }
        return $result;
    }
}