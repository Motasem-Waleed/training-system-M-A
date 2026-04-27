<?php

$columns = \Illuminate\Support\Facades\Schema::getColumnListing('enrollments');
echo "Enrollments columns:\n";
foreach ($columns as $col) {
    echo "  - $col\n";
}
echo "\nHas archived_at: " . (in_array('archived_at', $columns) ? 'YES' : 'NO') . "\n";
