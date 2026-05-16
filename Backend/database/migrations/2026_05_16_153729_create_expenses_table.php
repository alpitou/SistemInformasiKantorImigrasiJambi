<?php
// database/migrations/2026_01_01_000001_create_expenses_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('expense_date');
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->string('category'); // operasional, gaji, perawatan, promosi, sosial, lainnya
            $table->enum('payment_method', ['cash', 'transfer']);
            $table->string('proof_image')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('expense_date');
            $table->index('category');
        });
    }

    public function down()
    {
        Schema::dropIfExists('expenses');
    }
};