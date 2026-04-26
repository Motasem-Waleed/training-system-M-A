<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Delete all directorate-related migrations
DB::statement("DELETE FROM migrations WHERE migration LIKE '%directorate%'");

echo "Fixed all directorate migration issues\n";
