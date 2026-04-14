<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePortfolioEntryRequest;
use App\Http\Requests\UpdatePortfolioEntryRequest;
use App\Http\Resources\PortfolioEntryResource;
use App\Models\PortfolioEntry;
use App\Models\StudentPortfolio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioEntryController extends Controller
{
    public function __construct()
    {
        // تطبيق سياسة الصلاحيات على جميع دوال الـ Resource
        $this->authorizeResource(PortfolioEntry::class, 'portfolio_entry');
    }

    /**
     * عرض جميع مدخلات ملف الإنجاز (يمكن تصفيتها حسب student_portfolio_id)
     */
    public function index(Request $request)
    {
        $query = PortfolioEntry::with('studentPortfolio');
        
        if ($request->has('student_portfolio_id')) {
            $query->where('student_portfolio_id', $request->student_portfolio_id);
        }
        
        $entries = $query->latest()->paginate($request->per_page ?? 15);
        return PortfolioEntryResource::collection($entries);
    }

    /**
     * إضافة مدخل جديد إلى ملف الإنجاز
     */
    public function store(StorePortfolioEntryRequest $request)
    {
        $data = $request->validated();
        
        // رفع الملف إذا وُجد
        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('portfolio', 'public');
        }
        
        $entry = PortfolioEntry::create($data);
        return new PortfolioEntryResource($entry);
    }

    /**
     * عرض مدخل معين
     */
    public function show(PortfolioEntry $portfolioEntry)
    {
        return new PortfolioEntryResource($portfolioEntry->load('studentPortfolio'));
    }

    /**
     * تحديث مدخل موجود
     */
    public function update(UpdatePortfolioEntryRequest $request, PortfolioEntry $portfolioEntry)
    {
        $data = $request->validated();
        
        // رفع ملف جديد إذا وُجد
        if ($request->hasFile('file')) {
            // حذف الملف القديم إن وجد
            if ($portfolioEntry->file_path) {
                Storage::disk('public')->delete($portfolioEntry->file_path);
            }
            $data['file_path'] = $request->file('file')->store('portfolio', 'public');
        }
        
        $portfolioEntry->update($data);
        return new PortfolioEntryResource($portfolioEntry);
    }

    /**
     * حذف مدخل
     */
    public function destroy(PortfolioEntry $portfolioEntry)
    {
        // حذف الملف المرتبط من التخزين
        if ($portfolioEntry->file_path) {
            Storage::disk('public')->delete($portfolioEntry->file_path);
        }
        
        $portfolioEntry->delete();
        return response()->json(['message' => 'تم حذف المدخل بنجاح']);
    }
}