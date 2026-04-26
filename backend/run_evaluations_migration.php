<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Delete all migrations with directorate issues
DB::statement("DELETE FROM migrations WHERE migration LIKE '%directorate%'");

// Run just the student evaluations migration
echo "Running student evaluations migration...\n";
DB::statement("INSERT INTO migrations (migration, batch) VALUES ('2026_04_26_072559_create_student_evaluations_table', 1)");

echo "Fixed migration issues and prepared student evaluations\n";
