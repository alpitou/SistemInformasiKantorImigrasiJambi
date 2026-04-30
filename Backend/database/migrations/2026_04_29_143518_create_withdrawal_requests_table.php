<?php
// database/migrations/2024_01_01_000001_create_withdrawal_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('saving_id')->nullable()->constrained('savings')->onDelete('set null');
            $table->string('saving_type')->default('Sukarela');
            $table->decimal('amount', 15, 2);
            $table->text('reason');
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('account_name');
            $table->enum('status', [
                'pending_treasurer',
                'pending_chairman',
                'approved',
                'rejected',
                'disbursed'
            ])->default('pending_treasurer');
            
            // Treasurer approval
            $table->foreignId('treasurer_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('treasurer_approved_at')->nullable();
            $table->text('treasurer_notes')->nullable();
            
            // Chairman approval
            $table->foreignId('chairman_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('chairman_approved_at')->nullable();
            $table->text('chairman_notes')->nullable();
            
            // Disbursement
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('disbursed_at')->nullable();
            $table->text('disbursement_notes')->nullable();
            
            $table->timestamps();
            
            $table->index('status');
            $table->index('user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};