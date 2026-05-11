<?php
// database/migrations/2026_04_23_155319_add_bank_fields_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Bank name
            if (!Schema::hasColumn('users', 'bank_name')) {
                $table->string('bank_name')->nullable()->after('phone');
            }
            
            // Account number
            if (!Schema::hasColumn('users', 'account_number')) {
                $table->string('account_number')->nullable()->after('bank_name');
            }
            
            // Account name
            if (!Schema::hasColumn('users', 'account_name')) {
                $table->string('account_name')->nullable()->after('account_number');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['bank_name', 'account_number', 'account_name'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};