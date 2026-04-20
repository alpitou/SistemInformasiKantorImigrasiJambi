<?php
// database/migrations/2026_04_17_000002_create_loan_installments_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('loan_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->integer('installment_number');
            $table->decimal('amount_paid', 15, 2);
            $table->date('payment_date');
            $table->enum('payment_method', ['transfer', 'cash', 'potong_gaji'])->default('potong_gaji');
            $table->foreignId('received_by')->constrained('users')->onDelete('restrict');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['loan_id', 'installment_number']);
            $table->index('payment_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('loan_installments');
    }
};