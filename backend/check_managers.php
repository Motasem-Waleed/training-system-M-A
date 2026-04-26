<?php

// Check all school managers and their training sites
$managers = App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'school_manager');
})->get();

echo "Found " . $managers->count() . " school managers\n\n";

foreach ($managers as $manager) {
    echo "Manager: {$manager->name} (ID: {$manager->id})\n";
    echo "  Training Site ID: " . ($manager->training_site_id ?? 'NULL') . "\n";
    
    if ($manager->training_site_id) {
        $site = App\Models\TrainingSite::find($manager->training_site_id);
        echo "  Site Name: " . ($site?->name ?? 'NOT FOUND') . "\n";
        
        $requests = App\Models\TrainingRequest::where('training_site_id', $manager->training_site_id)->get();
        echo "  Total requests for this site: " . $requests->count() . "\n";
        
        foreach ($requests as $req) {
            echo "    Request #{$req->id}: book_status={$req->book_status}, status={$req->status}\n";
        }
        
        $sentRequests = $requests->where('book_status', 'sent_to_school');
        echo "  Sent to school requests: " . $sentRequests->count() . "\n";
    }
    echo "\n";
}

// Also check principals
$principals = App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'principal');
})->get();

echo "Found " . $principals->count() . " principals\n\n";

foreach ($principals as $principal) {
    echo "Principal: {$principal->name} (ID: {$principal->id})\n";
    echo "  Training Site ID: " . ($principal->training_site_id ?? 'NULL') . "\n";
    echo "\n";
}
