<?php
// database/migrations/2026_04_16_000003_make_nip_nik_nullable_in_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Ubah kolom nip dan nik menjadi nullable
            $table->string('nip')->nullable()->change();
            $table->string('nik')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nip')->nullable(false)->change();
            $table->string('nik')->nullable(false)->change();
        });
    }
};