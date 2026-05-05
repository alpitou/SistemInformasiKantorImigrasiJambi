<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('saving_type'); // Pokok, Wajib, Sukarela
            $table->decimal('amount', 15, 2);
            $table->string('reason');
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('account_name');
            $table->enum('status', ['pending_treasurer', 'pending_chairman', 'approved', 'rejected', 'completed'])->default('pending_treasurer');
            $table->foreignId('treasurer_approved_by')->nullable()->constrained('users');
            $table->timestamp('treasurer_approved_at')->nullable();
            $table->text('treasurer_notes')->nullable();
            $table->foreignId('chairman_approved_by')->nullable()->constrained('users');
            $table->timestamp('chairman_approved_at')->nullable();
            $table->text('chairman_notes')->nullable();
            $table->foreignId('disbursed_by')->nullable()->constrained('users');
            $table->timestamp('disbursed_at')->nullable();
            $table->text('disbursement_notes')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};