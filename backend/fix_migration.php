<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Delete the problematic migration record
DB::statement("DELETE FROM migrations WHERE migration = '2026_04_23_185959_add_directorate_column_to_users_table'");

echo "Fixed migration issue\n";
