<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use App\Models\User;
use App\Models\TrainingSite;
use App\Models\Evaluation;
use App\Models\TrainingRequest;
use App\Models\TrainingRequestBatch;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $stats = [
            'total_students' => User::whereHas('role', fn($q) => $q->where('name', 'student'))->count(),
            'active_trainings' => TrainingAssignment::where('status', 'ongoing')->count(),
            'completed_trainings' => TrainingAssignment::where('status', 'completed')->count(),
            'total_sites' => TrainingSite::count(),
            // Exclude archived evaluations from pending count
            'pending_evaluations' => Evaluation::whereNull('total_score')->whereNull('archived_at')->count(),
        ];
        
        // إحصائيات حسب المستخدم
        if ($request->user()->role?->name === 'teacher') {
            $stats['my_students'] = TrainingAssignment::where('teacher_id', $request->user()->id)
                ->with('enrollment.user')->get()->pluck('enrollment.user')->unique()->count();
        } elseif ($request->user()->role?->name === 'academic_supervisor') {
            $stats['my_students'] = TrainingAssignment::where('academic_supervisor_id', $request->user()->id)->count();
        } elseif ($request->user()->role?->name === 'student') {
            $stats['my_training'] = TrainingAssignment::whereHas('enrollment', fn($q) => $q->where('user_id', $request->user()->id))
                ->first();
        } elseif (in_array($request->user()->role?->name, ['training_coordinator', 'coordinator'], true)) {
            $stats['coordinator_pending_review'] = TrainingRequest::whereIn('book_status', [
                'sent_to_coordinator',
                'coordinator_under_review',
                'needs_edit',
            ])->count();
            $stats['coordinator_prelim_approved'] = TrainingRequest::where('book_status', 'prelim_approved')->count();
            $stats['coordinator_open_batches'] = TrainingRequestBatch::where('status', 'draft')->count();
        }

        return response()->json($stats);
    }
}