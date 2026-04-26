<?php

echo "Adding students to existing training requests...\n";

// Get existing training requests that need students
$requests = App\Models\TrainingRequest::with(['trainingSite'])
    ->where('book_status', 'sent_to_school')
    ->where('status', 'pending')
    ->whereDoesntHave('trainingRequestStudents')
    ->get();

echo "Found " . $requests->count() . " requests without students\n";

// Get students from Students2Seeder
$students = [
    ['name' => 'محمود رائد التميمي', 'email' => 'students2.usool01@hebron.edu', 'university_id' => 'S2U2001', 'phone' => '0592200001'],
    ['name' => 'جودي سامر الشرباتي', 'email' => 'students2.usool02@hebron.edu', 'university_id' => 'S2U2002', 'phone' => '0592200002'],
    ['name' => 'ليان عادل جعبري', 'email' => 'students2.usool03@hebron.edu', 'university_id' => 'S2U2003', 'phone' => '0592200003'],
    ['name' => 'سيف ياسر المحتسب', 'email' => 'students2.usool04@hebron.edu', 'university_id' => 'S2U2004', 'phone' => '0592200004'],
    ['name' => 'رغد ناصر الطروة', 'email' => 'students2.usool05@hebron.edu', 'university_id' => 'S2U2005', 'phone' => '0592200005'],
    ['name' => 'عمر خالد الشلالدة', 'email' => 'students2.usool06@hebron.edu', 'university_id' => 'S2U2006', 'phone' => '0592200006'],
    ['name' => 'هالة محمود الزغاري', 'email' => 'students2.usool07@hebron.edu', 'university_id' => 'S2U2007', 'phone' => '0592200007'],
    ['name' => 'بلال طه النتشة', 'email' => 'students2.usool08@hebron.edu', 'university_id' => 'S2U2008', 'phone' => '0592200008'],
    ['name' => 'سارة عصام الرجبي', 'email' => 'students2.usool09@hebron.edu', 'university_id' => 'S2U2009', 'phone' => '0592200009'],
    ['name' => 'يوسف إبراهيم الحروب', 'email' => 'students2.usool10@hebron.edu', 'university_id' => 'S2U2010', 'phone' => '0592200010'],
    ['name' => 'دينا حسام القاسمي', 'email' => 'students2.usool11@hebron.edu', 'university_id' => 'S2U2011', 'phone' => '0592200011'],
    ['name' => 'معاذ راشد العويوي', 'email' => 'students2.usool12@hebron.edu', 'university_id' => 'S2U2012', 'phone' => '0592200012'],
    ['name' => 'لمى طارق الأطرش', 'email' => 'students2.usool13@hebron.edu', 'university_id' => 'S2U2013', 'phone' => '0592200013'],
    ['name' => 'كرم ماجد الشنار', 'email' => 'students2.usool14@hebron.edu', 'university_id' => 'S2U2014', 'phone' => '0592200014'],
    ['name' => 'روان سمير الدبك', 'email' => 'students2.usool15@hebron.edu', 'university_id' => 'S2U2015', 'phone' => '0592200015'],
    ['name' => 'أحمد تيسير دعنا', 'email' => 'students2.psy01@hebron.edu', 'university_id' => 'S2P3001', 'phone' => '0592300001'],
    ['name' => 'نور فادي القواسمي', 'email' => 'students2.psy02@hebron.edu', 'university_id' => 'S2P3002', 'phone' => '0592300002'],
];

// Get or create student users
$studentUsers = [];
foreach ($students as $studentData) {
    $user = App\Models\User::where('email', $studentData['email'])->first();
    if (!$user) {
        $studentRole = App\Models\Role::where('name', 'student')->first();
        $user = App\Models\User::create([
            'name' => $studentData['name'],
            'email' => $studentData['email'],
            'university_id' => $studentData['university_id'],
            'phone' => $studentData['phone'],
            'password' => bcrypt('password123'),
            'role_id' => $studentRole->id,
        ]);
        echo "Created student: {$user->name}\n";
    }
    $studentUsers[] = $user;
}

// Get courses
$courses = App\Models\Course::all();
if ($courses->count() === 0) {
    echo "No courses found, creating basic courses...\n";
    $courses = collect([
        ['name' => 'أصول التربية', 'code' => 'EDU201', 'credit_hours' => 3],
        ['name' => 'علم النفس', 'code' => 'PSY301', 'credit_hours' => 3],
        ['name' => 'مناهج وطرق التدريس', 'code' => 'EDU202', 'credit_hours' => 3],
    ])->map(function ($courseData) {
        return App\Models\Course::create([
            'name' => $courseData['name'],
            'code' => $courseData['code'],
            'credit_hours' => $courseData['credit_hours'],
            'type' => 'practical',
        ]);
    });
}

// Add students to requests
$studentIndex = 0;
foreach ($requests as $request) {
    echo "Processing request {$request->id} for {$request->trainingSite->name}\n";
    
    // Add 1-2 students to each request
    $studentsToAdd = min(2, count($studentUsers) - $studentIndex);
    
    for ($i = 0; $i < $studentsToAdd && $studentIndex < count($studentUsers); $i++) {
        $student = $studentUsers[$studentIndex];
        $course = $courses[$studentIndex % $courses->count()];
        
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
        $studentIndex++;
    }
}

echo "\nDone! Added original students to existing training requests.\n";
