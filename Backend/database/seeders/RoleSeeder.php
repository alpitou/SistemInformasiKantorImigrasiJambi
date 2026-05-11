<?php
// database/seeders/RoleSeeder.php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // Jangan truncate, gunakan updateOrCreate atau firstOrCreate
        // Ini akan menjaga data yang sudah ada dan foreign key constraints
        
        $roles = [
            ['name' => 'admin', 'guard_name' => 'sanctum'],
            ['name' => 'ketua', 'guard_name' => 'sanctum'],
            ['name' => 'bendahara', 'guard_name' => 'sanctum'],
            ['name' => 'sekretaris', 'guard_name' => 'sanctum'],
            ['name' => 'pengawas', 'guard_name' => 'sanctum'],
            ['name' => 'anggota', 'guard_name' => 'sanctum'],
        ];
        
        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                ['guard_name' => $role['guard_name']]
            );
            $this->command->info('Role checked/created: ' . $role['name']);
            Log::info('Role checked/created: ' . $role['name']);
        }
        
        $this->command->info('All roles seeded successfully!');
    }
}