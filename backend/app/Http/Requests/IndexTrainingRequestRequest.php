<?php

namespace App\Http\Requests;

use App\Enums\BookStatus;
use App\Enums\TrainingRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexTrainingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // سيتم التحكم عبر Policy
    }

    public function rules(): array
    {
        return [
            'book_status' => [
                'nullable',
                Rule::in(array_map(static fn (BookStatus $c) => $c->value, BookStatus::cases())),
            ],
            'status' => [
                'nullable',
                Rule::in(array_map(static fn (TrainingRequestStatus $c) => $c->value, TrainingRequestStatus::cases())),
            ],
            'training_site_id' => 'nullable|exists:training_sites,id',
            'training_period_id' => 'nullable|exists:training_periods,id',
            'governing_body' => 'nullable|in:directorate_of_education,ministry_of_health',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:200',
            'page' => 'nullable|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'book_status.in' => 'حالة الكتاب غير صحيحة.',
            'status.in' => 'حالة الطلب غير صحيحة.',
        ];
    }
}