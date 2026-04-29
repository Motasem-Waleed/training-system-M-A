<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FormTemplateResource;
use App\Models\FormTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FormTemplateController extends Controller
{
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $query = FormTemplate::query()
            ->when($request->filled('owner_type'), fn ($q) => $q->where('owner_type', $request->owner_type))
            ->when($request->filled('form_type'), fn ($q) => $q->where('form_type', $request->form_type))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when(! $request->boolean('include_archived'), fn ($q) => $q->where('is_archived', false))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . str_replace(['%', '_'], ['\\%', '\\_'], trim((string) $request->search)) . '%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('title_ar', 'like', $term)
                        ->orWhere('title_en', 'like', $term)
                        ->orWhere('code', 'like', $term);
                });
            })
            ->orderBy('sort_order')
            ->latest('id');

        return FormTemplateResource::collection($query->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $template = FormTemplate::create($this->validated($request));

        return new FormTemplateResource($template);
    }

    public function show(Request $request, FormTemplate $formTemplate)
    {
        $this->ensureAdmin($request);

        return new FormTemplateResource($formTemplate);
    }

    public function update(Request $request, FormTemplate $formTemplate)
    {
        $this->ensureAdmin($request);

        $formTemplate->update($this->validated($request, $formTemplate));

        return new FormTemplateResource($formTemplate->fresh());
    }

    public function destroy(Request $request, FormTemplate $formTemplate)
    {
        $this->ensureAdmin($request);

        $formTemplate->update(['is_archived' => true, 'is_active' => false]);

        return response()->json(['message' => 'تم أرشفة قالب النموذج']);
    }

    public function duplicate(Request $request, FormTemplate $formTemplate)
    {
        $this->ensureAdmin($request);

        $copy = $formTemplate->replicate();
        $copy->code = $formTemplate->code . '_copy_' . now()->format('YmdHis');
        $copy->title_ar = $formTemplate->title_ar . ' - نسخة';
        $copy->is_active = false;
        $copy->is_archived = false;
        $copy->version = ((int) $formTemplate->version) + 1;
        $copy->save();

        return new FormTemplateResource($copy);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role?->name === 'admin', 403, 'هذه الخدمة متاحة للأدمن فقط.');
    }

    private function validated(Request $request, ?FormTemplate $template = null): array
    {
        $id = $template?->id;

        return $request->validate([
            'code' => ['required', 'string', 'max:120', Rule::unique('form_templates', 'code')->ignore($id)],
            'title_ar' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'form_type' => 'nullable|string|max:80',
            'owner_type' => ['required', Rule::in(['student', 'field_supervisor', 'academic_supervisor', 'institution_manager'])],
            'primary_actor_role' => 'nullable|string|max:80',
            'visible_to_roles' => 'nullable|array',
            'review_chain' => 'nullable|array',
            'department_scope' => 'nullable|array',
            'training_track_scope' => 'nullable|array',
            'site_type_scope' => 'nullable|array',
            'course_scope' => 'nullable|array',
            'frequency_type' => 'nullable|string|max:80',
            'due_rule_type' => 'nullable|string|max:80',
            'due_offset' => 'nullable|integer',
            'custom_due_config' => 'nullable|array',
            'requires_signature' => 'boolean',
            'signature_roles' => 'nullable|array',
            'requires_review' => 'boolean',
            'review_roles' => 'nullable|array',
            'can_be_returned' => 'boolean',
            'lock_after_submit' => 'boolean',
            'lock_after_approval' => 'boolean',
            'mandatory' => 'boolean',
            'contributes_to_portfolio' => 'boolean',
            'contributes_to_evaluation' => 'boolean',
            'grading_weight_optional' => 'nullable|numeric',
            'supports_attachments' => 'boolean',
            'allowed_file_types' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'is_archived' => 'boolean',
            'version' => 'nullable|integer|min:1',
            'schema_json' => 'nullable|array',
            'ui_config_json' => 'nullable|array',
            'workflow_config_json' => 'nullable|array',
        ]);
    }
}
