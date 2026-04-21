<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$old = \App\Models\User::where('email', 'edudirectorate@hebron.edu')->first();
if ($old) {
    $id = $old->id;
    \DB::table('official_letters')->where('received_by', $id)->delete();
    $old->delete();
    echo "DELETED: ID {$id} | edudirectorate@hebron.edu\n";
} else {
    echo "Not found.\n";
}

echo "\n=== Remaining Education Directorate Users ===\n";
$all = \App\Models\User::whereHas('role', function($q) {
    $q->where('name', 'education_directorate');
})->orderBy('id')->get();

foreach ($all as $m) {
    echo "ID: {$m->id} | {$m->name} | Email: {$m->email} | Directorate: {$m->directorate} | Password: 123456\n";
}
