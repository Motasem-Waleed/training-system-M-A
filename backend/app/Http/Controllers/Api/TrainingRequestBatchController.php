<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTrainingRequestBatchRequest;
use App\Http\Requests\SendTrainingRequestBatchRequest;
use App\Http\Resources\TrainingRequestBatchResource;
use App\Models\TrainingRequest;
use App\Models\TrainingRequestBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrainingRequestBatchController extends Controller
{
    public function index(Request $request)
    {
        $query = TrainingRequestBatch::query()->with(['createdBy']);

        if ($request->filled('governing_body')) {
            $query->where('governing_body', $request->governing_body);
        }
        if ($request->filled('directorate')) {
            $query->where('directorate', $request->directorate);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $batches = $query
            ->withCount('trainingRequests')
            ->latest()
            ->paginate($request->per_page ?? 15);

        return TrainingRequestBatchResource::collection($batches);
    }

    public function show(TrainingRequestBatch $trainingRequestBatch)
    {
        $batch = $trainingRequestBatch->load([
            'createdBy',
            'trainingRequests.trainingSite',
            'trainingRequests.trainingRequestStudents.user',
            'trainingRequests.trainingRequestStudents.course',
            'trainingRequests.trainingPeriod',
            'trainingRequests.requestedBy.role',
        ])->loadCount('trainingRequests');

        return new TrainingRequestBatchResource($batch);
    }

    public function store(CreateTrainingRequestBatchRequest $request)
    {
        $data = $request->validated();

        $batch = DB::transaction(function () use ($data, $request) {
            $batch = TrainingRequestBatch::create([
                'governing_body' => $data['governing_body'],
                'directorate' => $data['directorate'] ?? null,
                'status' => 'draft',
                'created_by' => $request->user()->id,
            ]);

            $requests = TrainingRequest::query()
                ->whereIn('id', $data['training_request_ids'])
                ->with('trainingSite')
                ->get();

            $attached = 0;

            foreach ($requests as $tr) {
                if (DB::table('training_request_batch_items')->where('training_request_id', $tr->id)->exists()) {
                    continue;
                }

                if ($tr->book_status !== 'prelim_approved') {
                    continue;
                }

                if ($tr->governing_body && $tr->governing_body !== $data['governing_body']) {
                    continue;
                }

                if (($data['governing_body'] === 'directorate_of_education') && ($data['directorate'] ?? null)) {
                    $siteDir = $tr->trainingSite?->directorate;
                    if ($siteDir !== ($data['directorate'] ?? null)) {
                        continue;
                    }
                }

                $batch->trainingRequests()->attach($tr->id);
                $tr->update([
                    'book_status' => 'batched_pending_send',
                    'batched_at' => now(),
                ]);
                $attached++;
            }

            if ($attached === 0) {
                throw ValidationException::withMessages([
                    'training_request_ids' => ['لم يُضف أي طلب إلى الدفعة. تأكد أن الطلبات معتمدة مبدئيًا، غير مربوطة بدفعة أخرى، وتطابق المديرية/الجهة المختارة.'],
                ]);
            }

            return $batch;
        });

        return new TrainingRequestBatchResource($batch->load('createdBy')->loadCount('trainingRequests'));
    }

    public function send(SendTrainingRequestBatchRequest $request, TrainingRequestBatch $trainingRequestBatch)
    {
        if ($trainingRequestBatch->status !== 'draft') {
            return response()->json(['message' => 'لا يمكن إرسال هذه الدفعة.'], 422);
        }

        $data = $request->validated();

        $batch = DB::transaction(function () use ($trainingRequestBatch, $data) {
            $trainingRequestBatch->update([
                'status' => 'sent',
                'letter_number' => $data['letter_number'],
                'letter_date' => $data['letter_date'],
                'content' => $data['content'],
                'sent_at' => now(),
            ]);

            $nextStatus = $trainingRequestBatch->governing_body === 'ministry_of_health'
                ? 'sent_to_health_ministry'
                : 'sent_to_directorate';

            foreach ($trainingRequestBatch->trainingRequests as $tr) {
                $tr->update([
                    'book_status' => $nextStatus,
                    'sent_to_directorate_at' => now(),
                ]);
            }

            return $trainingRequestBatch;
        });

        return new TrainingRequestBatchResource($batch->load('createdBy')->loadCount('trainingRequests'));
    }
}

