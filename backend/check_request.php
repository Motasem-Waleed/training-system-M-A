<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$requestId = 10;
$tr = \App\Models\TrainingRequest::find($requestId);
if (!$tr) {
    echo "Training request {$requestId} NOT FOUND\n";
    exit;
}

echo "Training Request ID: {$tr->id}\n";
echo "Requested By: {$tr->requested_by}\n";
echo "Book Status: {$tr->book_status}\n";
echo "Training Site ID: {$tr->training_site_id}\n";
echo "Created At: {$tr->created_at}\n";

// Check if student exists
$student = \App\Models\User::find($tr->requested_by);
echo "\nStudent Info:\n";
echo "Name: " . ($student ? $student->name : 'NOT FOUND') . "\n";
echo "Role: " . ($student && $student->role ? $student->role->name : 'N/A') . "\n";
