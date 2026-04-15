<?php
// database/migrations/2026_04_14_000002_create_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->foreignId('role_id')->constrained('roles')->onDelete('restrict');
                $table->string('email')->unique();
                $table->string('password');
                $table->string('nip')->unique();
                $table->string('nik')->unique();
                $table->string('unit');
                $table->date('join_date');
                $table->string('phone')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->softDeletes();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};