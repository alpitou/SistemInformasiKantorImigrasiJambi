<?php
// database/migrations/2026_01_01_000003_update_kantin_incomes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('kantin_incomes', function (Blueprint $table) {
            if (Schema::hasColumn('kantin_incomes', 'shu_share_percentage')) {
                $table->dropColumn('shu_share_percentage');
            }
            if (Schema::hasColumn('kantin_incomes', 'shu_amount')) {
                $table->dropColumn('shu_amount');
            }
        });
    }

    public function down()
    {
        Schema::table('kantin_incomes', function (Blueprint $table) {
            $table->decimal('shu_share_percentage', 5, 2)->default(30)->after('amount');
            $table->decimal('shu_amount', 15, 2)->default(0)->after('shu_share_percentage');
        });
    }
};