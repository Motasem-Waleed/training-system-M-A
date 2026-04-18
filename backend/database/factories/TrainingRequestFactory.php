<?php

namespace Database\Factories;

use App\Enums\BookStatus;
use App\Models\TrainingRequest;
use App\Models\TrainingSite;
use App\Models\TrainingPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrainingRequestFactory extends Factory
{
    protected $model = TrainingRequest::class;

    public function definition(): array
    {
        return [
            'letter_number' => 'LET-' . $this->faker->unique()->numberBetween(1000, 9999),
            'letter_date' => $this->faker->date(),
            'book_status' => $this->faker->randomElement(array_map(static fn (BookStatus $c) => $c->value, BookStatus::cases())),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'sent_to_directorate_at' => $this->faker->optional()->dateTime(),
            'directorate_approved_at' => $this->faker->optional()->dateTime(),
            'sent_to_school_at' => $this->faker->optional()->dateTime(),
            'school_approved_at' => $this->faker->optional()->dateTime(),
            'requested_at' => $this->faker->dateTime(),
            'rejection_reason' => $this->faker->optional()->sentence(),
            'training_site_id' => TrainingSite::factory(),
            'training_period_id' => TrainingPeriod::factory(),
        ];
    }
}