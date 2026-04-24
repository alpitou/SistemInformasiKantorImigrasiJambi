// database/migrations/xxxx_add_payment_method_to_loan_installments.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loan_installments', function (Blueprint $table) {
            if (!Schema::hasColumn('loan_installments', 'payment_method')) {
                $table->enum('payment_method', ['transfer', 'cash', 'potong_gaji'])->default('transfer');
            }
            if (!Schema::hasColumn('loan_installments', 'received_by')) {
                $table->unsignedBigInteger('received_by')->nullable();
                $table->foreign('received_by')->references('id')->on('users')->onDelete('set null');
            }
        });
    }

    public function down()
    {
        Schema::table('loan_installments', function (Blueprint $table) {
            $table->dropForeign(['received_by']);
            $table->dropColumn(['payment_method', 'received_by']);
        });
    }
};