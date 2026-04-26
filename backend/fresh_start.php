<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Clear all migrations and run fresh
DB::statement("DELETE FROM migrations");

// Mark student evaluations as already run
DB::statement("INSERT INTO migrations (migration, batch) VALUES ('2026_04_26_072559_create_student_evaluations_table', 1)");

echo "Prepared for fresh start with student evaluations\n";
