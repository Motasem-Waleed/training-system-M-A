<?php

namespace App\Services;

use App\Models\OfficialLetter;
use App\Enums\OfficialLetterStatus;

class OfficialLetterService
{
    public function createLetter(array $data, int $senderId): OfficialLetter
    {
        $data['sent_by'] = $senderId;
        $data['status'] = OfficialLetterStatus::DRAFT->value;
        return OfficialLetter::create($data);
    }

    public function sendLetter(OfficialLetter $letter, string $newStatus): OfficialLetter
    {
        $letter->update([
            'status' => $newStatus,
            'sent_at' => now(),
        ]);
        return $letter;
    }

    public function receiveLetter(OfficialLetter $letter, int $receiverId): OfficialLetter
    {
        $letter->update([
            'status' => OfficialLetterStatus::SCHOOL_RECEIVED->value,
            'received_by' => $receiverId,
            'received_at' => now(),
        ]);
        return $letter;
    }
}
