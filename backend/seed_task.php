<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\TrainingAssignment;
use App\Models\Task;
use App\Models\User;

echo "=== Training Assignments ===" . PHP_EOL;
$assignments = TrainingAssignment::with(['enrollment.user', 'trainingSite', 'teacher'])->take(5)->get();
foreach ($assignments as $a) {
    echo "ID:{$a->id} | Student: " . ($a->enrollment?->user?->name ?? 'N/A') . " | TeacherID: " . ($a->teacher_id ?? 'N/A') . " | Site: " . ($a->trainingSite?->name ?? 'N/A') . PHP_EOL;
}

echo PHP_EOL . "=== Teachers ===" . PHP_EOL;
$teachers = User::whereHas('role', function ($q) { $q->where('name', 'teacher'); })->take(5)->get();
foreach ($teachers as $t) {
    echo "ID:{$t->id} | Name: {$t->name}" . PHP_EOL;
}

echo PHP_EOL . "=== Academic Supervisors ===" . PHP_EOL;
$supervisors = User::whereHas('role', function ($q) { $q->where('name', 'academic_supervisor'); })->take(5)->get();
foreach ($supervisors as $s) {
    echo "ID:{$s->id} | Name: {$s->name}" . PHP_EOL;
}

echo PHP_EOL . "=== Field Supervisors ===" . PHP_EOL;
$fieldSups = User::whereHas('role', function ($q) { $q->where('name', 'field_supervisor'); })->take(5)->get();
foreach ($fieldSups as $f) {
    echo "ID:{$f->id} | Name: {$f->name}" . PHP_EOL;
}

// Create a task if we have an assignment
if ($assignments->count() > 0) {
    $firstAssignment = $assignments->first();
    $assignedBy = $firstAssignment->teacher_id ?? ($teachers->first()?->id ?? 1);

    $task = Task::create([
        'title' => 'إعداد خطة درس نموذجية',
        'description' => 'قم بإعداد خطة درس كاملة لموضوع من اختيارك تتضمن: الأهداف، الأساليب، الأنشطة، والتقييم. يجب أن تكون الخطة مفصلة ومناسبة للصف الذي تتدرب عليه.',
        'training_assignment_id' => $firstAssignment->id,
        'assigned_by' => $assignedBy,
        'due_date' => now()->addDays(7)->toDateString(),
        'status' => 'pending',
    ]);

    echo PHP_EOL . "=== Task Created ===" . PHP_EOL;
    echo "Task ID: {$task->id} | Title: {$task->title} | AssignmentID: {$task->training_assignment_id} | AssignedBy: {$task->assigned_by}" . PHP_EOL;
} else {
    echo PHP_EOL . "No training assignments found! Cannot create task." . PHP_EOL;
}
