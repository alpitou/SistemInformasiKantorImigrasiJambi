<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('savings', function (Blueprint $table) {
            $table->id();

            // relasi ke user
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // relasi ke jenis simpanan
            $table->foreignId('saving_type_id')->constrained('saving_types')->cascadeOnDelete();

            $table->decimal('amount', 15, 2);

            // deposit / withdrawal
            $table->enum('transaction_type', ['deposit', 'withdrawal']);

            $table->text('description')->nullable();

            $table->date('transaction_date');

            // siapa yang input (admin/bendahara/user)
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('savings');
    }
};