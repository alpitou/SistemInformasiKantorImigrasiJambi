<?php
// database/migrations/2026_04_20_000001_add_verification_fields_to_savings_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('savings', function (Blueprint $table) {
            if (!Schema::hasColumn('savings', 'proof_image')) {
                $table->string('proof_image')->nullable()->after('description');
            }
            if (!Schema::hasColumn('savings', 'verification_status')) {
                $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('proof_image');
            }
        });
    }

    public function down(): void
    {
        Schema::table('savings', function (Blueprint $table) {
            $table->dropColumn(['proof_image', 'verification_status']);
        });
    }
};