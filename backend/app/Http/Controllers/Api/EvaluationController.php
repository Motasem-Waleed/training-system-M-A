<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEvaluationRequest;
use App\Http\Requests\UpdateEvaluationRequest;
use App\Http\Resources\EvaluationResource;
use App\Models\Evaluation;
use App\Models\TrainingAssignment;
use App\Services\EvaluationService;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    protected $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
        $this->authorizeResource(Evaluation::class, 'evaluation');
    }

    public function index(Request $request)
    {
        $query = Evaluation::with(['template', 'evaluator', 'trainingAssignment.enrollment.user']);
        
        if ($request->has('training_assignment_id')) {
            $query->where('training_assignment_id', $request->training_assignment_id);
        }
        if ($request->user()->role?->name === 'student') {
            $query->whereHas('trainingAssignment.enrollment', fn ($q) => $q->where('user_id', $request->user()->id));
        } elseif ($request->user()->role?->name === 'teacher') {
            $query->where('evaluator_id', $request->user()->id);
        } elseif ($request->user()->role?->name === 'school_manager' && $request->user()->training_site_id) {
            $query->whereHas('trainingAssignment', fn ($q) => $q->where('training_site_id', $request->user()->training_site_id));
        }
        
        $evaluations = $query->latest()->paginate($request->per_page ?? 15);
        return EvaluationResource::collection($evaluations);
    }

    public function store(StoreEvaluationRequest $request)
    {
        if ($request->user()->role?->name === 'school_manager' && $request->user()->training_site_id) {
            $assignment = TrainingAssignment::query()->findOrFail($request->input('training_assignment_id'));
            if ((int) $assignment->training_site_id !== (int) $request->user()->training_site_id) {
                abort(403, 'لا يمكن تقييم طالب خارج جهة التدريب التابعة لك.');
            }
        }

        $evaluation = $this->evaluationService->createEvaluation(
            $request->validated(),
            $request->user()->id
        );

        return new EvaluationResource($evaluation);
    }

    public function show(Evaluation $evaluation)
    {
        return new EvaluationResource($evaluation->load(['template.items', 'scores.item']));
    }

    public function update(UpdateEvaluationRequest $request, Evaluation $evaluation)
    {
        $evaluation = $this->evaluationService->updateEvaluation($evaluation, $request->validated());
        return new EvaluationResource($evaluation);
    }

    public function destroy(Evaluation $evaluation)
    {
        $evaluation->delete();
        return response()->json(['message' => 'تم حذف التقييم']);
    }
}