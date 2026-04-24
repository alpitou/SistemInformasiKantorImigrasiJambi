<?php
// database/migrations/2026_01_01_000000_add_bank_fields_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('phone');
            $table->string('account_number')->nullable()->after('bank_name');
            $table->string('account_name')->nullable()->after('account_number');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'account_number', 'account_name']);
        });
    }
};