<?php

// Check which school managers have students available
$managers = App\Models\User::whereHas('role', function($q) {
    $q->whereIn('name', ['school_manager', 'principal']);
})->get();

echo "Checking " . $managers->count() . " school managers/principals\n\n";

foreach ($managers as $manager) {
    $trainingSiteId = $manager->training_site_id;
    if (!$trainingSiteId) continue;
    
    $studentCount = App\Models\TrainingRequest::where('training_site_id', $trainingSiteId)
        ->whereIn('book_status', ['sent_to_school', 'school_approved', 'directorate_approved', 'completed'])
        ->withCount('trainingRequestStudents')
        ->get()
        ->sum('training_request_students_count');
    
    if ($studentCount > 0) {
        echo "✅ {$manager->name} (ID: {$manager->id}) - Site: {$manager->training_site_id} - Students: {$studentCount}\n";
    }
}

echo "\n--- All managers with training_site_id ---\n";
foreach ($managers as $manager) {
    if ($manager->training_site_id) {
        $site = App\Models\TrainingSite::find($manager->training_site_id);
        echo "  {$manager->name} (ID: {$manager->id}) => Site #{$manager->training_site_id}: {$site?->name}\n";
    } else {
        echo "  {$manager->name} (ID: {$manager->id}) => NO SITE ASSIGNED\n";
    }
}
