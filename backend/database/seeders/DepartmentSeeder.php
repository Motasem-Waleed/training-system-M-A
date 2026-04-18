<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run()
    {
        foreach (['psychology', 'usool_tarbiah', 'administration'] as $name) {
            Department::query()->firstOrCreate(['name' => $name]);
        }
    }
}