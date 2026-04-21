<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\ChangeUserStatusRequest;
use App\Http\Requests\LoginRequest;
use App\Helpers\ActivityLogger;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
        $this->authorizeResource(User::class, 'user');
    }

  public function index(Request $request)
{
    $users = User::query();

    // مدير المدرسة يُسمح له بجلب المعلمين فقط لاستخدامهم في التعيين.
    if ($request->user()->role?->name === 'school_manager') {
        $users->whereHas('role', function ($q) {
            $q->where('name', 'teacher');
        });
    }

    // منسق التدريب والأخصائي النفسي يُسمح لهم بجلب الطلبة فقط (قائمة مرجعية).
    if (in_array($request->user()->role?->name, ['training_coordinator', 'coordinator', 'psychologist'], true)) {
        $users->whereHas('role', function ($q) {
            $q->where('name', 'student');
        });
    }
    
    $users->when($request->role_id, function ($q) use ($request) {
        $q->where('role_id', $request->role_id);
    });

    $users->when($request->status, function ($q) use ($request) {
        $q->where('status', $request->status);
    });

    $users->when($request->search, function ($q) use ($request) {
        $term = $request->search;
        $q->where(function ($qq) use ($term) {
            $qq->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('university_id', 'like', "%{$term}%");
        });
    });

    $perPage = min(max((int) $request->get('per_page', 15), 1), 200);

    return response()->json($users->with(['role', 'department'])->paginate($perPage));
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->createUser($request->validated());

        ActivityLogger::log(
            'user',
            'created',
            'تم إضافة مستخدم جديد',
            $user,
            ['email' => $user->email, 'role_id' => $user->role_id],
            $request->user()
        );

        return new UserResource($user->load(['role', 'department', 'trainingSite']));
    }

    public function show(User $user)
    {
        return new UserResource($user->load(['role', 'department', 'trainingSite']));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $oldData = $user->getOriginal();
        $user = $this->userService->updateUser($user, $request->validated());

        ActivityLogger::log(
            'user',
            'updated',
            'تم تحديث المستخدم',
            $user,
            ['old' => $oldData, 'new' => $user->getAttributes()],
            $request->user()
        );

        return new UserResource($user->fresh(['role', 'department', 'trainingSite']));
    }

    public function destroy(User $user)
    {
        $userName = $user->name;
        $userEmail = $user->email;

        ActivityLogger::log(
            'user',
            'deleted',
            'تم حذف المستخدم',
            $user,
            ['deleted_user' => $userName, 'email' => $userEmail],
            auth()->user()
        );

        $user->delete();
        return response()->json(['message' => 'تم حذف المستخدم']);
    }

    public function changeStatus(ChangeUserStatusRequest $request, User $user)
    {
        $oldStatus = $user->status;
        $user = $this->userService->changeStatus($user, $request->status);

        ActivityLogger::log(
            'user',
            'status_changed',
            'تم تغيير حالة المستخدم',
            $user,
            ['old_status' => $oldStatus, 'new_status' => $user->status],
            $request->user()
        );

        return new UserResource($user->fresh(['role', 'department', 'trainingSite']));
    }

    // ========== دوال تسجيل الدخول والخروج ==========

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            ActivityLogger::log(
                'auth',
                'login_failed',
                'فشل تسجيل الدخول',
                null,
                ['reason' => 'email_not_found', 'email' => $request->email, 'ip' => $request->ip()]
            );
            return response()->json(['message' => 'البريد الإلكتروني غير موجود'], 404);
        }

        if (!Hash::check($request->password, $user->password)) {
            ActivityLogger::log(
                'auth',
                'login_failed',
                'كلمة المرور خاطئة',
                $user,
                ['reason' => 'wrong_password', 'email' => $request->email, 'ip' => $request->ip()]
            );
            return response()->json(['message' => 'كلمة المرور غير صحيحة'], 401);
        }

        if ($user->status !== 'active') {
            ActivityLogger::log(
                'auth',
                'login_blocked',
                'حساب غير نشط',
                $user
            );
            return response()->json(['message' => 'الحساب غير نشط. يرجى التواصل مع المسؤول.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLogger::log(
            'auth',
            'login',
            'تم تسجيل الدخول',
            $user,
            ['ip' => $request->ip(), 'user_agent' => $request->userAgent()]
        );

        return response()->json([
            'user' => new UserResource($user->load(['role', 'department', 'trainingSite', 'fieldSupervisorProfile', 'enrollments.section.course'])),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function currentUser(Request $request)
{
        return new UserResource($request->user()->load(['role', 'department', 'trainingSite', 'enrollments.section.course']));
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            ActivityLogger::log(
                'auth',
                'logout',
                'تم تسجيل الخروج',
                $user,
                ['ip' => $request->ip(), 'user_agent' => $request->userAgent()]
            );
        }

        $user?->currentAccessToken()?->delete();

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح']);
    }

    public function bulkAdd(Request $request)
    {
        $request->validate(['users' => 'required|array']);

        $success = [];
        $failed = [];

        foreach ($request->users as $userData) {
            try {
                $user = $this->userService->createUser($userData);
                $success[] = $user;
                ActivityLogger::log(
                    'user',
                    'created_bulk',
                    'تم إضافة مستخدم',
                    $user,
                    [],
                    $request->user()
                );
            } catch (\Exception $e) {
                $failed[] = ['email' => $userData['email'] ?? '?', 'error' => $e->getMessage()];
            }
        }

        ActivityLogger::log(
            'user',
            'bulk_upload',
            'رفع جماعي للمستخدمين',
            null,
            ['success_count' => count($success), 'fail_count' => count($failed)],
            $request->user()
        );

        return response()->json(['success' => $success, 'failed' => $failed]);
    }
}