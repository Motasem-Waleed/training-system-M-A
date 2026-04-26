<?php

echo "Checking training requests...\n";

$requests = App\Models\TrainingRequest::with([
    'trainingSite', 
    'trainingRequestStudents.user', 
    'trainingRequestStudents.course'
])
->where('book_status', 'sent_to_school')
->where('status', 'pending')
->get();

echo 'Found ' . $requests->count() . " requests\n";

foreach($requests as $req) {
    echo 'Request ' . $req->id . ': ' . $req->trainingSite->name . ' - ' . $req->trainingRequestStudents->count() . " students\n";
    
    foreach($req->trainingRequestStudents as $student) {
        echo '  - Student: ' . $student->user->name . ' (' . $student->user->university_id . ")\n";
    }
}

echo "\nChecking all training sites...\n";
$sites = App\Models\TrainingSite::all();
echo 'Found ' . $sites->count() . " training sites\n";

echo "\nChecking current user...\n";
$user = auth()->user();
if ($user) {
    echo 'Current user: ' . $user->name . ' (Role: ' . $user->role?->name . ")\n";
    echo 'Training site ID: ' . ($user->training_site_id ?? 'null') . "\n";
} else {
    echo "No authenticated user\n";
}
