// database/migrations/2026_04_14_084533_create_users_table.php
<?php
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
                $table->string('nip')->unique()->nullable();
                $table->string('nik')->unique()->nullable();
                $table->string('unit');
                $table->date('join_date');
                $table->string('phone')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                
                // Kolom baru
                $table->enum('employment_type', ['pppk', 'outsourcing', 'other'])->default('other');
                $table->string('cooperative_position')->nullable(); // Jabatan di Koperasi
                $table->enum('gender', ['male', 'female'])->nullable(); // Jenis Kelamin
                $table->string('bank_name')->nullable();
                $table->string('account_number')->nullable();
                $table->string('account_name')->nullable();
                $table->string('avatar_path')->nullable();
                
                $table->softDeletes();
                $table->timestamps();
            });
        } else {
            // Jika tabel sudah ada, tambahkan kolom baru
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'employment_type')) {
                    $table->enum('employment_type', ['pppk', 'outsourcing', 'other'])->default('other');
                }
                if (!Schema::hasColumn('users', 'cooperative_position')) {
                    $table->string('cooperative_position')->nullable();
                }
                if (!Schema::hasColumn('users', 'gender')) {
                    $table->enum('gender', ['male', 'female'])->nullable();
                }
                if (!Schema::hasColumn('users', 'bank_name')) {
                    $table->string('bank_name')->nullable();
                }
                if (!Schema::hasColumn('users', 'account_number')) {
                    $table->string('account_number')->nullable();
                }
                if (!Schema::hasColumn('users', 'account_name')) {
                    $table->string('account_name')->nullable();
                }
                if (!Schema::hasColumn('users', 'avatar_path')) {
                    $table->string('avatar_path')->nullable();
                }
                // Ubah nip dan nik menjadi nullable jika sebelumnya tidak
                if (Schema::hasColumn('users', 'nip')) {
                    $table->string('nip')->nullable()->change();
                }
                if (Schema::hasColumn('users', 'nik')) {
                    $table->string('nik')->nullable()->change();
                }
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};