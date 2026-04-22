<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('savings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('saving_type_id')->constrained('saving_types')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('transaction_type', ['deposit', 'withdrawal']);
            $table->text('description')->nullable();
            $table->date('transaction_date');
            $table->enum('verification_status', ['pending', 'verified', 'rejected']);
            $table->index(['verification_status', 'transaction_type']);
            $table->index('transaction_date');
            $table->index('saving_type_id');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('savings');
    }
};