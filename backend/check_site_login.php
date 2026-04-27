<?php

// Find the school manager for مدرسة ذكور الخليل الأساسية
$site = App\Models\TrainingSite::where('name', 'like', '%مدرسة ذكور الخليل الأساسية%')->first();

if ($site) {
    echo "Training Site: {$site->name} (ID: {$site->id})\n";
    echo "Location: {$site->location}\n";
    echo "Directorate: {$site->directorate}\n\n";
    
    $managers = App\Models\User::where('training_site_id', $site->id)
        ->whereHas('role', function($q) {
            $q->where('name', 'school_manager');
        })->get();
    
    foreach ($managers as $m) {
        echo "Manager: {$m->name}\n";
        echo "  Email: {$m->email}\n";
        echo "  ID: {$m->id}\n";
        echo "  Role: {$m->role?->name}\n";
    }
} else {
    echo "Site not found\n";
}
