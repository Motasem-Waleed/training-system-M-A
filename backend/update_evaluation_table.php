<?php

echo "Updating student_evaluations table with new fields...\n";

// Add new columns
$columns = [
    'supervisor' => 'tinyInteger',
    'cooperation_with_staff' => 'tinyInteger',
    'professionalism' => 'tinyInteger',
    'dealing_with_students' => 'tinyInteger',
    'manners' => 'tinyInteger',
    'participation_in_activities' => 'tinyInteger',
    'school' => 'tinyInteger',
    'comfort' => 'tinyInteger',
    'professional_ethics' => 'tinyInteger',
    'general_notes' => 'text',
];

$existingColumns = \Illuminate\Support\Facades\Schema::getColumnListing('student_evaluations');

foreach ($columns as $column => $type) {
    if (!in_array($column, $existingColumns)) {
        \Illuminate\Support\Facades\Schema::table('student_evaluations', function ($table) use ($column, $type) {
            if ($type === 'tinyInteger') {
                $table->tinyInteger($column)->nullable();
            } else {
                $table->text($column)->nullable();
            }
        });
        echo "  Added column: {$column}\n";
    } else {
        echo "  Column already exists: {$column}\n";
    }
}

// Mark old columns as nullable (don't delete data)
$oldColumns = [
    'punctuality',
    'commitment',
    'initiative',
    'cooperation',
    'communication',
    'professional_conduct',
    'knowledge_application',
    'skills_development',
    'overall_performance',
    'strengths',
    'weaknesses',
    'recommendations',
    'additional_notes',
];

echo "\nOld columns kept for compatibility:\n";
foreach ($oldColumns as $column) {
    if (in_array($column, $existingColumns)) {
        echo "  - {$column}\n";
    }
}

echo "\nTable updated successfully!\n";
