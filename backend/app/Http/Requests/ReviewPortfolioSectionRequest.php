<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewPortfolioSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entry_id' => 'required|exists:portfolio_entries,id',
            'status' => 'required|in:reviewed,needs_revision',
            'reviewer_note' => 'required|string|max:2000',
        ];
    }
}
