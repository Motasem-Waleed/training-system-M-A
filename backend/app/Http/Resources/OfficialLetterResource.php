<?php

namespace App\Http\Resources;

use App\Enums\OfficialLetterStatus;
use App\Enums\OfficialLetterType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfficialLetterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'letter_number' => $this->letter_number,
            'letter_date' => $this->letter_date?->toDateString(),
            'type' => $this->type,
            'type_label' => OfficialLetterType::tryFrom($this->type)?->label() ?? $this->type,
            'content' => $this->content,
            'file_path' => $this->file_path,
            'status' => $this->status,
            'status_label' => OfficialLetterStatus::tryFrom($this->status)?->label() ?? $this->status,
            'rejection_reason' => $this->rejection_reason,
            'sent_at' => $this->sent_at?->toDateTimeString(),
            'received_at' => $this->received_at?->toDateTimeString(),
            'training_request' => new TrainingRequestResource($this->whenLoaded('trainingRequest')),
            'sent_by' => new UserResource($this->whenLoaded('sentBy')),
            'received_by' => new UserResource($this->whenLoaded('receivedBy')),
            'training_site' => new TrainingSiteResource($this->whenLoaded('trainingSite')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
