<?php
// تحقق من الطلبات التي يجب أن يراها كل مدير
$managers = App\Models\User::whereHas('role', fn($q) => $q->whereIn('name', ['school_manager', 'principal']))
    ->whereNotNull('training_site_id')
    ->get();

echo "=== مدراء المدارس ===\n";
foreach ($managers as $m) {
    echo "ID: {$m->id}, Name: {$m->name}, Email: {$m->email}, Site: {$m->training_site_id}\n";
}

echo "\n=== الطلبات المرسلة للمدارس (sent_to_school) ===\n";
$requests = App\Models\TrainingRequest::where('book_status', 'sent_to_school')
    ->where('status', 'pending')
    ->with('trainingSite')
    ->get();

foreach ($requests as $r) {
    echo "Request #{$r->id} -> Site: {$r->training_site_id} ({$r->trainingSite?->name})\n";
    $manager = $managers->firstWhere('training_site_id', $r->training_site_id);
    if ($manager) {
        echo "   يجب أن يراها: {$manager->name} ({$manager->email})\n";
    } else {
        echo "   ⚠️ لا يوجد مدير لهذا الموقع!\n";
    }
}
