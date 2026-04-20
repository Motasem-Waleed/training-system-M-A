<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Enums\EvaluationFormType;

class EvaluationTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'form_type' => $this->form_type,
            'form_type_label' => EvaluationFormType::tryFrom($this->form_type)?->label() ?? $this->form_type,
            'target_role' => $this->target_role,
            'target_role_label' => $this->target_role_label,
            'items' => EvaluationItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}