<?php

echo "Table exists: " . (\Illuminate\Support\Facades\Schema::hasTable('enrollments') ? 'YES' : 'NO') . "\n";

if (\Illuminate\Support\Facades\Schema::hasTable('enrollments')) {
    $columns = \Illuminate\Support\Facades\Schema::getColumnListing('enrollments');
    echo "Columns count: " . count($columns) . "\n";
    foreach ($columns as $col) {
        echo "  - $col\n";
    }
}

// Find the Enrollment model to check where archived_at is referenced
echo "\nChecking Enrollment model...\n";
$model = new \App\Models\Enrollment();
echo "Table: " . $model->getTable() . "\n";
