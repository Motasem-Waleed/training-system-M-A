<?php

echo "Enrollments columns: " . collect(\Illuminate\Support\Facades\Schema::getColumnListing('enrollments'))->join(', ') . "\n";
