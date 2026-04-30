<?php
// database/migrations/2024_04_30_000000_add_saving_type_to_withdrawal_requests.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('withdrawal_requests', 'saving_type')) {
                $table->string('saving_type')->default('Sukarela')->after('saving_id');
            }
        });
    }

    public function down()
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            if (Schema::hasColumn('withdrawal_requests', 'saving_type')) {
                $table->dropColumn('saving_type');
            }
        });
    }
};