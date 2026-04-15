<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            ['name' => 'admin', 'guard_name' => 'sanctum'],
            ['name' => 'ketua', 'guard_name' => 'sanctum'],
            ['name' => 'bendahara', 'guard_name' => 'sanctum'],
            ['name' => 'pengawas', 'guard_name' => 'sanctum'],
            ['name' => 'anggota', 'guard_name' => 'sanctum'],
        ];
        
        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name'], 'guard_name' => $role['guard_name']],
                $role
            );
            Log::info('Role created/checked: ' . $role['name']);
        }
    }
}