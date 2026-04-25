<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'message' => $this->resolveMessage(),
            'data' => $this->data,
            'read_at' => $this->read_at?->toDateTimeString(),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }

    private function resolveMessage(): string
    {
        $msg = $this->message ?? '';

        // إذا كان النص عربياً مباشرة — أعده كما هو
        if (preg_match('/[\x{0600}-\x{06FF}]/u', $msg)) {
            return $msg;
        }

        // إذا كان JSON — حاول استخراج message منه
        if ($msg !== '') {
            $decoded = json_decode($msg, true);
            if (is_array($decoded)) {
                return $decoded['message'] ?? $decoded['body'] ?? $msg;
            }
        }

        // fallback على data['message'] إن وجد
        if (is_array($this->data) && isset($this->data['message'])) {
            return $this->data['message'];
        }

        return $msg ?: '—';
    }
}