<?php
// database/migrations/2026_04_17_000001_create_loans_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->decimal('interest_rate', 5, 2)->default(1.0);
            $table->integer('tenor_months');
            $table->decimal('monthly_installment', 15, 2);
            $table->decimal('remaining_balance', 15, 2);
            
            // Status: pending_treasurer, pending_chairman, approved, rejected, active, completed
            $table->enum('status', ['pending_treasurer', 'pending_chairman', 'approved', 'rejected', 'active', 'completed'])->default('pending_treasurer');
            
            // Approval tracking
            $table->foreignId('treasurer_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('treasurer_approved_at')->nullable();
            $table->text('treasurer_notes')->nullable();
            
            $table->foreignId('chairman_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('chairman_approved_at')->nullable();
            $table->text('chairman_notes')->nullable();
            
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('disbursed_at')->nullable();
            $table->text('disbursement_notes')->nullable();
            
            // Document
            $table->string('agreement_document')->nullable();
            $table->string('agreement_original_name')->nullable();
            $table->timestamp('document_uploaded_at')->nullable();
            $table->enum('document_status', ['pending', 'uploaded', 'verified'])->default('pending');
            
            $table->timestamps();
            
            $table->index('status');
            $table->index('user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('loans');
    }
};