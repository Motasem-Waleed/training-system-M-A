<?php

// Test the new API endpoint logic manually
$user = App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'school_manager');
})->first();

if (!$user) {
    echo "No school manager user found\n";
    exit;
}

echo "School Manager: {$user->name}\n";
echo "Training Site ID: {$user->training_site_id}\n\n";

$trainingSiteId = $user->training_site_id;

if (!$trainingSiteId) {
    // Find a training site and assign it to the user
    $site = App\Models\TrainingSite::first();
    if ($site) {
        $user->training_site_id = $site->id;
        $user->save();
        $trainingSiteId = $site->id;
        echo "Assigned user to site: {$site->name}\n\n";
    } else {
        echo "No training sites available\n";
        exit;
    }
}

$trainingRequests = App\Models\TrainingRequest::with([
    'trainingSite',
    'trainingRequestStudents.user',
    'trainingRequestStudents.course',
    'trainingPeriod',
])
    ->where('training_site_id', $trainingSiteId)
    ->where('book_status', 'sent_to_school')
    ->get();

echo "Found " . $trainingRequests->count() . " training requests for site #{$trainingSiteId}\n\n";

$totalStudents = 0;
foreach ($trainingRequests as $request) {
    echo "Request #{$request->id} - {$request->trainingSite?->name}:\n";
    echo "  Status: {$request->status}, Book Status: {$request->book_status}\n";
    echo "  Students count: " . $request->trainingRequestStudents->count() . "\n";
    
    foreach ($request->trainingRequestStudents as $student) {
        echo "    - {$student->user?->name} ({$student->user?->university_id})\n";
        $totalStudents++;
    }
    echo "\n";
}

echo "Total students available for evaluation: {$totalStudents}\n";
