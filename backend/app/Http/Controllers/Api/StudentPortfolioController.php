<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentPortfolioRequest;
use App\Http\Requests\UpdateStudentPortfolioRequest;
use App\Http\Requests\StorePortfolioEntryRequest;
use App\Http\Requests\UpdatePortfolioEntryRequest;
use App\Http\Resources\StudentPortfolioResource;
use App\Models\StudentPortfolio;
use App\Models\PortfolioEntry;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class StudentPortfolioController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(StudentPortfolio::class, 'student_portfolio');
    }

    /**
     * Get current user's portfolio (SAFE VERSION)
     * Route: /api/my-portfolio
     */
    public function getMyPortfolio(Request $request)
    {
        $user = $request->user();
        $portfolio = StudentPortfolio::with('entries')
            ->where('user_id', $user->id)
            ->first();

        if (! $portfolio) {
            $assignmentId = $user->currentTrainingAssignment()?->id;
            try {
                $portfolio = StudentPortfolio::create([
                    'user_id' => $user->id,
                    'training_assignment_id' => $assignmentId,
                ])->load('entries');
            } catch (QueryException $exception) {
                if ($assignmentId === null) {
                    return response()->json([
                        'data' => [
                            'id' => null,
                            'user' => null,
                            'training_assignment' => null,
                            'entries' => [],
                            'created_at' => null,
                            'updated_at' => null,
                        ],
                        'message' => 'لا يمكن إنشاء ملف الإنجاز قبل وجود تعيين تدريبي للطالب.',
                    ]);
                }

                throw $exception;
            }
        }

        $this->authorize('view', $portfolio);

        return new StudentPortfolioResource($portfolio->load('entries'));
    }

    /**
     * List portfolios (admin/general use)
     */
    public function index(Request $request)
    {
        $query = StudentPortfolio::with(['user', 'trainingAssignment']);

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        return StudentPortfolioResource::collection(
            $query->paginate($request->per_page ?? 15)
        );
    }

    /**
     * Show single portfolio
     */
    public function show(StudentPortfolio $studentPortfolio)
    {
        return new StudentPortfolioResource(
            $studentPortfolio->load(['user', 'trainingAssignment', 'entries'])
        );
    }

    /**
     * Store portfolio
     */
    public function store(StoreStudentPortfolioRequest $request)
    {
        $portfolio = StudentPortfolio::create($request->validated());

        return new StudentPortfolioResource($portfolio);
    }

    /**
     * Update portfolio (no direct fields)
     */
    public function update(UpdateStudentPortfolioRequest $request, StudentPortfolio $studentPortfolio)
    {
        return new StudentPortfolioResource($studentPortfolio);
    }

    /**
     * Delete portfolio
     */
    public function destroy(StudentPortfolio $studentPortfolio)
    {
        $studentPortfolio->delete();

        return response()->json([
            'message' => 'تم حذف ملف الإنجاز'
        ]);
    }

    // ================= Entries =================

    public function addEntry(StorePortfolioEntryRequest $request, StudentPortfolio $studentPortfolio)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('portfolio', 'public');
        }

        $data['student_portfolio_id'] = $studentPortfolio->id;

        $entry = PortfolioEntry::create($data);

        return response()->json($entry, 201);
    }

    public function updateEntry(UpdatePortfolioEntryRequest $request, PortfolioEntry $entry)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('portfolio', 'public');
        }

        $entry->update($data);

        return response()->json($entry);
    }

    public function deleteEntry(PortfolioEntry $entry)
    {
        $entry->delete();

        return response()->json([
            'message' => 'تم حذف الإدخال'
        ]);
    }
}