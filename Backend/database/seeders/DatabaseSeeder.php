<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Starting database seeding...');
        $this->command->newLine();

        // Matikan foreign key checks sementara
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Seed in correct order (due to foreign key constraints)
        $this->call([
            RoleSeeder::class,
            SavingTypeSeeder::class,
            UserSeeder::class,
        ]);

        // Aktifkan kembali foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->newLine();
        $this->command->info('Database seeding completed successfully!');
    }
}