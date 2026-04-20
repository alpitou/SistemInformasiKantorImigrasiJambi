<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SavingType;
use Illuminate\Support\Facades\DB;

class SavingTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        SavingType::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Insert saving types
        $savingTypes = [
            [
                'name' => 'Pokok',
                'default_amount' => 500000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Wajib',
                'default_amount' => 100000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sukarela',
                'default_amount' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($savingTypes as $type) {
            SavingType::create($type);
        }

        $this->command->info('Saving types seeded successfully!');
    }
}