<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('kantin_incomes')) {
            Schema::create('kantin_incomes', function (Blueprint $table) {
                $table->id();
                $table->date('income_date');
                $table->string('description');
                $table->decimal('amount', 15, 2);
                $table->enum('payment_method', ['cash', 'transfer'])->default('cash');
                $table->string('proof_image')->nullable();
                $table->unsignedBigInteger('created_by');
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                $table->index('income_date');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('kantin_incomes');
    }
};