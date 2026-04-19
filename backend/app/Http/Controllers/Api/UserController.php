<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\ChangeUserStatusRequest;
use App\Http\Requests\LoginRequest;
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

        return new UserResource($user->load(['role', 'department', 'trainingSite']));
    }

    public function show(User $user)
    {
        return new UserResource($user->load(['role', 'department', 'trainingSite']));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user = $this->userService->updateUser($user, $request->validated());

        return new UserResource($user->fresh(['role', 'department', 'trainingSite']));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'تم حذف المستخدم']);
    }

    public function changeStatus(ChangeUserStatusRequest $request, User $user)
    {
        $user = $this->userService->changeStatus($user, $request->status);

        return new UserResource($user->fresh(['role', 'department', 'trainingSite']));
    }

    // ========== دوال تسجيل الدخول والخروج ==========

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'بيانات الدخول غير صحيحة'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'الحساب غير نشط. يرجى التواصل مع المسؤول.'
            ], 403);
        }

        // حذف التوكنات القديمة (اختياري)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->load(['role', 'department', 'trainingSite'])),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function currentUser(Request $request)
{
        return new UserResource($request->user()->load(['role', 'department', 'trainingSite']));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح'
        ]);
    }
    
}