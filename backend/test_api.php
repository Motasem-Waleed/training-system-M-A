<?php

// Test the new API endpoint
$user = App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'school_manager');
})->first();

if (!$user) {
    echo "No school manager user found\n";
    exit;
}

// Set as current user
Auth::login($user);
echo "Logged in as: {$user->name} (Role: {$user->role?->name})\n";
echo "Training Site ID: {$user->training_site_id}\n\n";

// Test the endpoint logic
$trainingSiteId = $user->training_site_id;

if (!$trainingSiteId) {
    echo "No training site assigned to user\n";
    exit;
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

echo "Found " . $trainingRequests->count() . " training requests\n\n";

$students = [];
foreach ($trainingRequests as $request) {
    echo "Request #{$request->id} - {$request->trainingSite?->name}:\n";
    echo "  Status: {$request->status}, Book Status: {$request->book_status}\n";
    echo "  Students: " . $request->trainingRequestStudents->count() . "\n";
    
    foreach ($request->trainingRequestStudents as $student) {
        echo "    - {$student->user?->name} ({$student->user?->university_id})\n";
        $students[] = [
            'id' => $student->id,
            'name' => $student->user?->name,
        ];
    }
    echo "\n";
}

echo "Total students: " . count($students) . "\n";
