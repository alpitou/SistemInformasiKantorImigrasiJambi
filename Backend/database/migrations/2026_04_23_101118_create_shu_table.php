<?php
// database/migrations/2026_04_23_000001_create_shu_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shu', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            $table->decimal('total_shu', 15, 2);
            $table->decimal('member_share_percentage', 5, 2);
            $table->decimal('member_share_amount', 15, 2);
            $table->decimal('reserve_percentage', 5, 2);
            $table->decimal('reserve_amount', 15, 2);
            $table->decimal('kantin_contribution', 15, 2)->default(0);
            $table->decimal('interest_income', 15, 2)->default(0);
            $table->decimal('operational_cost', 15, 2)->default(0);
            $table->unsignedBigInteger('processed_by');
            $table->timestamp('processed_at');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('processed_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shu');
    }
};