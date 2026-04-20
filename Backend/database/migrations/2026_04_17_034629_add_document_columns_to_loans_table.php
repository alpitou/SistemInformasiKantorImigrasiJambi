<?php
// database/migrations/2026_04_17_000003_add_document_columns_to_loans_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->string('agreement_document')->nullable()->after('notes');
            $table->string('agreement_original_name')->nullable()->after('agreement_document');
            $table->timestamp('document_uploaded_at')->nullable()->after('agreement_original_name');
            $table->enum('document_status', ['pending', 'uploaded', 'verified'])->default('pending')->after('document_uploaded_at');
        });
    }

    public function down()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['agreement_document', 'agreement_original_name', 'document_uploaded_at', 'document_status']);
        });
    }
};