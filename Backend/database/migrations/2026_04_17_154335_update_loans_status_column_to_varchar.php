<?php
// database/migrations/2026_04_17_000004_update_loans_status_column_to_varchar.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->string('status', 50)->default('pending')->change();
        });
    }

    public function down()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'active', 'completed'])->default('pending')->change();
        });
    }
};