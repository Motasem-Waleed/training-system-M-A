<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Models\AnnouncementTarget;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function __construct()
    {
       //$this->authorizeResource(Announcement::class, 'announcement');
    }

    public function index(Request $request)
    {
        $query = Announcement::with(['user', 'targets.role', 'targets.user', 'targets.department']);
        
        // إذا لم يكن أدمن، اعرض فقط الإعلانات المستهدفة له
        if ($request->user()->role?->name !== 'admin') {
            $userId = $request->user()->id;
            $roleId = $request->user()->role_id;
            $deptId = $request->user()->department_id;
            
            $query->whereHas('targets', function($q) use ($userId, $roleId, $deptId) {
                $q->where(function($sq) use ($userId, $roleId, $deptId) {
                    $sq->where('user_id', $userId)
                       ->orWhere('role_id', $roleId)
                       ->orWhere('department_id', $deptId);
                });
            })->orWhereDoesntHave('targets');
        }
        
        $announcements = $query->latest()->paginate($request->per_page ?? 15);
        return AnnouncementResource::collection($announcements);
    }

    public function store(StoreAnnouncementRequest $request)
    {
        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'user_id' => $request->user()->id,
        ]);
        
        // إضافة الأهداف
        if ($request->has('target_roles')) {
            foreach ($request->target_roles as $roleId) {
                AnnouncementTarget::create(['announcement_id' => $announcement->id, 'role_id' => $roleId]);
            }
        }
        if ($request->has('target_users')) {
            foreach ($request->target_users as $userId) {
                AnnouncementTarget::create(['announcement_id' => $announcement->id, 'user_id' => $userId]);
            }
        }
        if ($request->has('target_departments')) {
            foreach ($request->target_departments as $deptId) {
                AnnouncementTarget::create(['announcement_id' => $announcement->id, 'department_id' => $deptId]);
            }
        }
        
        return new AnnouncementResource($announcement->load('targets'));
    }

    public function show(Announcement $announcement)
    {
        return new AnnouncementResource($announcement->load(['user', 'targets']));
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement)
    {
        $announcement->update($request->only(['title', 'content']));

        if ($request->has('target_roles') || $request->has('target_users') || $request->has('target_departments')) {
            $announcement->targets()->delete();

            if ($request->has('target_roles')) {
                foreach ($request->target_roles as $roleId) {
                    AnnouncementTarget::create(['announcement_id' => $announcement->id, 'role_id' => $roleId]);
                }
            }
            if ($request->has('target_users')) {
                foreach ($request->target_users as $userId) {
                    AnnouncementTarget::create(['announcement_id' => $announcement->id, 'user_id' => $userId]);
                }
            }
            if ($request->has('target_departments')) {
                foreach ($request->target_departments as $deptId) {
                    AnnouncementTarget::create(['announcement_id' => $announcement->id, 'department_id' => $deptId]);
                }
            }
        }

        return new AnnouncementResource($announcement->load('targets'));
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'تم حذف الإعلان']);
    }
}