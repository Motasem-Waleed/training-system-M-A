<?php

// Check if email exists
$user = App\Models\User::where('email', 'fayes.sharaf@hebron.edu')->first();
if ($user) {
    echo "Found user: {$user->name} (ID: {$user->id}, Role: {$user->role?->name})\n";
} else {
    echo "Email fayes.sharaf@hebron.edu NOT found in database\n\n";
    
    // Show similar emails
    $similar = App\Models\User::where('email', 'like', '%fayes%')->orWhere('email', 'like', '%sharaf%')->get();
    echo "Similar emails found:\n";
    foreach ($similar as $u) {
        echo "  - {$u->email} => {$u->name} (ID: {$u->id}, Role: {$u->role?->name})\n";
    }
    
    // Show all school managers
    echo "\nAll school managers:\n";
    $managers = App\Models\User::whereHas('role', function($q) {
        $q->where('name', 'school_manager');
    })->get();
    foreach ($managers as $m) {
        echo "  - {$m->email} => {$m->name} (ID: {$m->id})\n";
    }
}
