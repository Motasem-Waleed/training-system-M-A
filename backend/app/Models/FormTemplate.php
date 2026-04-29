<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title_ar',
        'title_en',
        'description',
        'form_type',
        'owner_type',
        'primary_actor_role',
        'visible_to_roles',
        'review_chain',
        'department_scope',
        'training_track_scope',
        'site_type_scope',
        'course_scope',
        'frequency_type',
        'due_rule_type',
        'due_offset',
        'custom_due_config',
        'requires_signature',
        'signature_roles',
        'requires_review',
        'review_roles',
        'can_be_returned',
        'lock_after_submit',
        'lock_after_approval',
        'mandatory',
        'contributes_to_portfolio',
        'contributes_to_evaluation',
        'grading_weight_optional',
        'supports_attachments',
        'allowed_file_types',
        'sort_order',
        'is_active',
        'is_archived',
        'version',
        'schema_json',
        'ui_config_json',
        'workflow_config_json',
    ];

    protected $casts = [
        'visible_to_roles' => 'array',
        'review_chain' => 'array',
        'department_scope' => 'array',
        'training_track_scope' => 'array',
        'site_type_scope' => 'array',
        'course_scope' => 'array',
        'custom_due_config' => 'array',
        'requires_signature' => 'boolean',
        'signature_roles' => 'array',
        'requires_review' => 'boolean',
        'review_roles' => 'array',
        'can_be_returned' => 'boolean',
        'lock_after_submit' => 'boolean',
        'lock_after_approval' => 'boolean',
        'mandatory' => 'boolean',
        'contributes_to_portfolio' => 'boolean',
        'contributes_to_evaluation' => 'boolean',
        'supports_attachments' => 'boolean',
        'allowed_file_types' => 'array',
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
        'schema_json' => 'array',
        'ui_config_json' => 'array',
        'workflow_config_json' => 'array',
    ];

    public function instances()
    {
        return $this->hasMany(FormInstance::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('is_archived', false);
    }
}
