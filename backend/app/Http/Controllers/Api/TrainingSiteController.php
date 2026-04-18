<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTrainingSiteRequest;
use App\Http\Requests\UpdateTrainingSiteRequest;
use App\Http\Resources\TrainingSiteResource;
use App\Models\TrainingSite;
use Illuminate\Http\Request;

class TrainingSiteController extends Controller
{
    public function __construct()
    {
       // $this->authorizeResource(TrainingSite::class, 'training_site');
    }

    public function index(Request $request)
    {
        $query = TrainingSite::query();
        if ($request->has('site_type')) $query->where('site_type', $request->site_type);
        if ($request->has('governing_body')) $query->where('governing_body', $request->governing_body);
        if ($request->has('directorate')) {
            $query->where('directorate', $request->directorate);
        }
        // منطقة / بلدة / نص يطابق عمود الموقع فقط
        if ($request->filled('location')) {
            $loc = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->location) . '%';
            $query->where('location', 'like', $loc);
        }
        // بحث في اسم جهة التدريب (يُدمج مع location بـ AND عند استخدامهما معاً)
        if ($request->filled('search')) {
            $term = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->search) . '%';
            $query->where('name', 'like', $term);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        
        $sites = $query->latest()->paginate($request->per_page ?? 15);
        return TrainingSiteResource::collection($sites);
    }

    public function store(StoreTrainingSiteRequest $request)
    {
        $site = TrainingSite::create($request->validated());
        return new TrainingSiteResource($site);
    }

    public function show(TrainingSite $trainingSite)
    {
        return new TrainingSiteResource($trainingSite);
    }

    public function update(UpdateTrainingSiteRequest $request, TrainingSite $trainingSite)
    {
        $trainingSite->update($request->validated());
        return new TrainingSiteResource($trainingSite);
    }

    public function destroy(TrainingSite $trainingSite)
    {
        $trainingSite->delete();
        return response()->json(['message' => 'تم حذف موقع التدريب']);
    }
}