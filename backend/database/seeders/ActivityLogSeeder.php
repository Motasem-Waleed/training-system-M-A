<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::take(3)->get();
        $actions = ['login', 'logout', 'create', 'update', 'delete'];
        
        foreach ($users as $user) {
            foreach ($actions as $action) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => $action,
                    'description' => "قام المستخدم {$user->name} بـ {$action}",
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Mozilla/5.0',
                ]);
            }
        }
    }
}
