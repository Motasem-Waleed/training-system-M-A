<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\TrainingAssignment;
use App\Models\Task;

$assignment = TrainingAssignment::find(2); // محمد أحمد النجار
if ($assignment) {
    $task = Task::create([
        'title' => 'تقرير زيارة ميدانية',
        'description' => 'اكتب تقريراً مفصلاً عن الزيارة الميدانية يتضمن: وصف الموقف التعليمي، تحليل أداء المعلم، والملاحظات والتصورات المستقبلية. يجب ألا يقل التقرير عن 500 كلمة.',
        'training_assignment_id' => $assignment->id,
        'assigned_by' => 3, // د. أحمد المشرف (academic_supervisor)
        'due_date' => now()->addDays(10)->toDateString(),
        'status' => 'pending',
    ]);
    echo "Task Created: ID={$task->id} | Title: {$task->title} | AssignedBy: {$task->assigned_by}" . PHP_EOL;
}

// Also create one for the first student from a different teacher
$assignment3 = TrainingAssignment::find(3);
if ($assignment3) {
    $task = Task::create([
        'title' => 'تحليل موقف تدريسي',
        'description' => 'اختر موقفاً تدريسياً من حصصك واقوم بتحليله وفقاً لخطوات التفكير التأملي: الوصف، التحليل، والتخطيط للتحسين.',
        'training_assignment_id' => $assignment3->id,
        'assigned_by' => 66, // فاطمة المرشدة
        'due_date' => now()->addDays(5)->toDateString(),
        'status' => 'pending',
    ]);
    echo "Task Created: ID={$task->id} | Title: {$task->title} | AssignedBy: {$task->assigned_by}" . PHP_EOL;
}

echo PHP_EOL . "All tasks now:" . PHP_EOL;
$tasks = Task::with(['assignedBy', 'trainingAssignment.enrollment.user'])->get();
foreach ($tasks as $t) {
    echo "ID:{$t->id} | {$t->title} | Student: " . ($t->trainingAssignment?->enrollment?->user?->name ?? 'N/A') . " | AssignedBy: " . ($t->assignedBy?->name ?? 'N/A') . " | Status: {$t->status}" . PHP_EOL;
}
