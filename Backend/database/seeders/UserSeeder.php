<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserSeeder extends Seeder
{
    public function run()
    {
        $adminRole = Role::where('name', 'admin')->first();
        
        if (!$adminRole) {
            Log::error('Admin role not found! Run RoleSeeder first.');
            return;
        }
        
        User::firstOrCreate(
            ['email' => 'admin@koperasi.com'],
            [
                'name' => 'Super Admin',
                'role_id' => $adminRole->id,
                'email' => 'admin@koperasi.com',
                'password' => Hash::make('password123'),
                'nip' => '198001012010011001',
                'nik' => '1571010101800001',
                'unit' => 'Sekretariat',
                'join_date' => '2024-01-01',
                'phone' => '081234567890',
                'status' => 'active'
            ]
        );
        
        Log::info('Admin user created/checked');
    }
}