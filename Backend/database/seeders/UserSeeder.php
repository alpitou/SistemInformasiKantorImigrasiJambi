<?php
// database/seeders/UserSeeder.php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Get all roles
        $adminRole = Role::where('name', 'admin')->first();
        $ketuaRole = Role::where('name', 'ketua')->first();
        $bendaharaRole = Role::where('name', 'bendahara')->first();
        $sekretarisRole = Role::where('name', 'sekretaris')->first();
        $pengawasRole = Role::where('name', 'pengawas')->first();
        $anggotaRole = Role::where('name', 'anggota')->first();

        if (!$adminRole) {
            Log::error('Roles not found! Run RoleSeeder first.');
            $this->command->error('Roles not found! Run RoleSeeder first.');
            return;
        }

        // Hapus users yang ada (gunakan delete, bukan truncate karena foreign key)
        User::query()->delete();
        
        // Reset auto increment
        DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

        // Define users data
        $users = [
            // Admin
            [
                'name' => 'Administrator Koperasi',
                'email' => 'admin@koperasi.com',
                'role_id' => $adminRole->id,
                'password' => Hash::make('password123'),
                'nip' => '198001012010011001',
                'nik' => '1571010101800001',
                'unit' => 'Sekretariat',
                'join_date' => '2024-01-01',
                'phone' => '081234567890',
                'status' => 'active',
                'employment_type' => 'pppk',
                'cooperative_position' => 'Admin Koperasi',
                'gender' => 'male',
                'bank_name' => 'Bank Mandiri',
                'account_number' => '1234567890',
                'account_name' => 'Administrator Koperasi'
            ],
            
            // Ketua Koperasi
            [
                'name' => 'Dr. Ahmad Hidayat, S.H.',
                'email' => 'ketua@koperasi.com',
                'role_id' => $ketuaRole->id,
                'password' => Hash::make('password123'),
                'nip' => '197505152005011002',
                'nik' => '1571011505750002',
                'unit' => 'Sekretariat',
                'join_date' => '2024-01-01',
                'phone' => '081234567891',
                'status' => 'active',
                'employment_type' => 'pppk',
                'cooperative_position' => 'Ketua Koperasi',
                'gender' => 'male',
                'bank_name' => 'BCA',
                'account_number' => '1234567891',
                'account_name' => 'Dr. Ahmad Hidayat'
            ],
            
            // Bendahara
            [
                'name' => 'Siti Nurjanah, S.E.',
                'email' => 'bendahara@koperasi.com',
                'role_id' => $bendaharaRole->id,
                'password' => Hash::make('password123'),
                'nip' => '198203102008012003',
                'nik' => '1571011003820003',
                'unit' => 'Sekretariat',
                'join_date' => '2024-01-01',
                'phone' => '081234567892',
                'status' => 'active',
                'employment_type' => 'pppk',
                'cooperative_position' => 'Bendahara Koperasi',
                'gender' => 'female',
                'bank_name' => 'Bank Mandiri',
                'account_number' => '1234567892',
                'account_name' => 'Siti Nurjanah'
            ],
            
            // Sekretaris
            [
                'name' => 'Budi Santoso, S.Kom.',
                'email' => 'sekretaris@koperasi.com',
                'role_id' => $sekretarisRole->id,
                'password' => Hash::make('password123'),
                'nip' => '198512202009011004',
                'nik' => '1571012012850004',
                'unit' => 'Sekretariat',
                'join_date' => '2024-01-01',
                'phone' => '081234567893',
                'status' => 'active',
                'employment_type' => 'pppk',
                'cooperative_position' => 'Sekretaris Koperasi',
                'gender' => 'male',
                'bank_name' => 'BRI',
                'account_number' => '1234567893',
                'account_name' => 'Budi Santoso'
            ],
            
            // Pengawas
            [
                'name' => 'Dewi Lestari, S.H.',
                'email' => 'pengawas@koperasi.com',
                'role_id' => $pengawasRole->id,
                'password' => Hash::make('password123'),
                'nip' => '197803152006012005',
                'nik' => '1571011503780005',
                'unit' => 'Sekretariat',
                'join_date' => '2024-01-01',
                'phone' => '081234567894',
                'status' => 'active',
                'employment_type' => 'pppk',
                'cooperative_position' => 'Pengawas Koperasi',
                'gender' => 'female',
                'bank_name' => 'BCA',
                'account_number' => '1234567894',
                'account_name' => 'Dewi Lestari'
            ],
        ];

        // Tambahkan anggota biasa
        for ($i = 1; $i <= 9; $i++) {
            $employmentType = $i <= 4 ? 'pppk' : ($i <= 7 ? 'outsourcing' : 'other');
            $gender = $i % 2 == 0 ? 'female' : 'male';
            $unit = ['Seksi Izin Tinggal', 'Seksi Lalu Lintas', 'Seksi Intelijen', 'Seksi TIKIM', 'Sekretariat'][$i % 5];
            
            $users[] = [
                'name' => "Anggota {$i}",
                'email' => "anggota{$i}@koperasi.com",
                'role_id' => $anggotaRole->id,
                'password' => Hash::make('password123'),
                'nip' => $i <= 4 ? "19900{$i}15201401100{$i}" : null,
                'nik' => "15710115019{$i}000{$i}",
                'unit' => $unit,
                'join_date' => '2024-02-01',
                'phone' => "08123456789{$i}",
                'status' => $i == 9 ? 'inactive' : 'active',
                'employment_type' => $employmentType,
                'cooperative_position' => 'Anggota Biasa',
                'gender' => $gender,
                'bank_name' => ['Bank Mandiri', 'BCA', 'BRI'][$i % 3],
                'account_number' => "12345678{$i}",
                'account_name' => "Anggota {$i}"
            ];
        }

        // Create users
        foreach ($users as $userData) {
            User::create($userData);
            $this->command->info('User created: ' . $userData['name'] . ' (' . $userData['email'] . ')');
        }

        $this->command->info('All users seeded successfully!');
        $this->command->info('Total users: ' . count($users));
        
        Log::info('User seeder completed successfully. Total users: ' . count($users));
    }
}