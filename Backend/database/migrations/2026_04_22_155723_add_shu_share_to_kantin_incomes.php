<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kantin_incomes', function (Blueprint $table) {
            if (!Schema::hasColumn('kantin_incomes', 'shu_share_percentage')) {
                $table->decimal('shu_share_percentage', 5, 2)->default(30);
            }
            if (!Schema::hasColumn('kantin_incomes', 'shu_amount')) {
                $table->decimal('shu_amount', 15, 2)->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('kantin_incomes', function (Blueprint $table) {
            $table->dropColumn(['shu_share_percentage', 'shu_amount']);
        });
    }
};