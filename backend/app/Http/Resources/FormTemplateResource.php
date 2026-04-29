<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'description' => $this->description,
            'form_type' => $this->form_type,
            'owner_type' => $this->owner_type,
            'primary_actor_role' => $this->primary_actor_role,
            'visible_to_roles' => $this->visible_to_roles ?? [],
            'review_chain' => $this->review_chain ?? [],
            'department_scope' => $this->department_scope ?? [],
            'training_track_scope' => $this->training_track_scope ?? [],
            'site_type_scope' => $this->site_type_scope ?? [],
            'course_scope' => $this->course_scope ?? [],
            'frequency_type' => $this->frequency_type,
            'due_rule_type' => $this->due_rule_type,
            'due_offset' => $this->due_offset,
            'custom_due_config' => $this->custom_due_config,
            'requires_signature' => $this->requires_signature,
            'signature_roles' => $this->signature_roles ?? [],
            'requires_review' => $this->requires_review,
            'review_roles' => $this->review_roles ?? [],
            'can_be_returned' => $this->can_be_returned,
            'lock_after_submit' => $this->lock_after_submit,
            'lock_after_approval' => $this->lock_after_approval,
            'mandatory' => $this->mandatory,
            'contributes_to_portfolio' => $this->contributes_to_portfolio,
            'contributes_to_evaluation' => $this->contributes_to_evaluation,
            'grading_weight_optional' => $this->grading_weight_optional,
            'supports_attachments' => $this->supports_attachments,
            'allowed_file_types' => $this->allowed_file_types ?? [],
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'is_archived' => $this->is_archived,
            'version' => $this->version,
            'schema_json' => $this->schema_json ?? [],
            'ui_config_json' => $this->ui_config_json ?? [],
            'workflow_config_json' => $this->workflow_config_json ?? [],
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
