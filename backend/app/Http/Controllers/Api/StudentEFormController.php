<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentEForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class StudentEFormController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role?->name !== 'student') {
            return response()->json(['message' => 'هذه الخدمة متاحة للطلاب فقط.'], 403);
        }

        if (! Schema::hasTable('student_eforms')) {
            return response()->json([
                'data' => [],
                'message' => 'جدول النماذج الإلكترونية غير مُنشأ بعد. نفّذ الترحيل (migrate).',
            ]);
        }

        $items = StudentEForm::query()
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role?->name !== 'student') {
            return response()->json(['message' => 'هذه الخدمة متاحة للطلاب فقط.'], 403);
        }

        if (! Schema::hasTable('student_eforms')) {
            return response()->json([
                'message' => 'جدول النماذج الإلكترونية غير مُنشأ بعد. نفّذ الترحيل (migrate).',
            ], 503);
        }

        $data = $request->validate([
            'form_key' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:255'],
            'payload' => ['nullable', 'array'],
        ]);

        $item = StudentEForm::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'form_key' => $data['form_key'],
            ],
            [
                'title' => $data['title'],
                'payload' => $data['payload'] ?? [],
                'status' => 'draft',
                'submitted_at' => null,
            ]
        );

        return response()->json($item);
    }

    public function submit(Request $request, StudentEForm $eform)
    {
        $user = $request->user();
        if ($user->role?->name !== 'student' || $eform->user_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح.'], 403);
        }

        if (! Schema::hasTable('student_eforms')) {
            return response()->json([
                'message' => 'جدول النماذج الإلكترونية غير مُنشأ بعد. نفّذ الترحيل (migrate).',
            ], 503);
        }

        $data = $request->validate([
            'payload' => ['nullable', 'array'],
        ]);

        $eform->update([
            'payload' => $data['payload'] ?? $eform->payload,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json($eform->fresh());
    }
}
