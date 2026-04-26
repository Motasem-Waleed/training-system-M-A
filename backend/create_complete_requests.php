<?php

echo "Creating courses and test training requests...\n";

// Get some training sites
$sites = App\Models\TrainingSite::take(3)->get();
if ($sites->count() < 3) {
    echo "Not enough training sites found\n";
    exit;
}

// Get some students
$students = App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'student');
})->take(10)->get();

if ($students->count() < 5) {
    echo "Not enough students found\n";
    exit;
}

// Get a training period
$period = App\Models\TrainingPeriod::first();
if (!$period) {
    echo "No training period found\n";
    exit;
}

// Get a department for requests
$dept = App\Models\Department::first();
if (!$dept) {
    echo "No department found\n";
    exit;
}

// Create courses if they don't exist
$courses = App\Models\Course::all();
if ($courses->count() < 3) {
    echo "Creating courses...\n";
    
    $courseNames = ['أصول التربية', 'علم النفس', 'مناهج وطرق التدريس'];
    
    foreach ($courseNames as $name) {
        $course = App\Models\Course::create([
            'name' => $name,
            'code' => 'EDU' . rand(100, 999),
            'credit_hours' => 3,
            'description' => 'مادة تدريبية للطلبة',
            'type' => 'practical',
        ]);
        echo "Created course: {$course->name}\n";
    }
}

$coordinator = App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'training_coordinator');
})->first();

if (!$coordinator) {
    echo "No coordinator found\n";
    exit;
}

echo "Found " . $students->count() . " students\n";
echo "Found " . $sites->count() . " sites\n";
echo "Found " . $courses->count() . " courses\n";

// Create training requests with students
foreach ($sites as $index => $site) {
    // Create training request
    $request = App\Models\TrainingRequest::create([
        'training_site_id' => $site->id,
        'training_period_id' => $period->id,
        'requested_by' => $coordinator->id,
        'department_id' => $dept->id,
        'governing_body' => 'directorate_of_education',
        'book_status' => 'sent_to_school',
        'status' => 'pending',
        'sent_to_school_at' => now(),
        'coordinator_approval_at' => now(),
        'directorate_approval_at' => now(),
    ]);

    echo "Created request {$request->id} for site {$site->name}\n";

    // Add 2-3 students to each request
    $studentCount = min(3, $students->count() - ($index * 3));
    for ($i = 0; $i < $studentCount; $i++) {
        $studentIndex = ($index * 3) + $i;
        if ($studentIndex < $students->count()) {
            $student = $students[$studentIndex];
            $course = $courses[$i % $courses->count()];
            
            $trs = App\Models\TrainingRequestStudent::create([
                'training_request_id' => $request->id,
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'approved',
                'status_label' => 'موافق عليه',
                'start_date' => now(),
                'end_date' => now()->addMonths(3),
            ]);

            echo "  Added student: {$student->name} (Course: {$course->name})\n";
        }
    }
}

echo "\nDone! Created training requests with students for evaluation testing.\n";
