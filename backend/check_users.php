<?php

// Check all users in database
$users = App\Models\User::with('role')->get();
echo "Total users: " . $users->count() . "\n\n";

// Group by role
$byRole = $users->groupBy(fn($u) => $u->role?->name ?? 'no_role');
foreach ($byRole as $role => $list) {
    echo "=== {$role} (" . $list->count() . ") ===\n";
    foreach ($list as $u) {
        echo "  ID:{$u->id} | {$u->email} | {$u->name}\n";
    }
    echo "\n";
}
