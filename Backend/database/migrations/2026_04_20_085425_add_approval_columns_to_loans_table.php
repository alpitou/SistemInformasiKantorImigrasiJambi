<?php
// database/migrations/2026_04_20_000001_add_approval_columns_to_loans_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loans', function (Blueprint $table) {
            // Cek apakah kolom sudah ada sebelum menambah
            if (!Schema::hasColumn('loans', 'treasurer_approved_by')) {
                $table->foreignId('treasurer_approved_by')->nullable()->after('approved_by')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('loans', 'treasurer_approved_at')) {
                $table->timestamp('treasurer_approved_at')->nullable()->after('treasurer_approved_by');
            }
            if (!Schema::hasColumn('loans', 'treasurer_notes')) {
                $table->text('treasurer_notes')->nullable()->after('treasurer_approved_at');
            }
            if (!Schema::hasColumn('loans', 'chairman_approved_by')) {
                $table->foreignId('chairman_approved_by')->nullable()->after('treasurer_notes')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('loans', 'chairman_approved_at')) {
                $table->timestamp('chairman_approved_at')->nullable()->after('chairman_approved_by');
            }
            if (!Schema::hasColumn('loans', 'chairman_notes')) {
                $table->text('chairman_notes')->nullable()->after('chairman_approved_at');
            }
            if (!Schema::hasColumn('loans', 'disbursed_by')) {
                $table->foreignId('disbursed_by')->nullable()->after('chairman_notes')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('loans', 'disbursed_at')) {
                $table->timestamp('disbursed_at')->nullable()->after('disbursed_by');
            }
            if (!Schema::hasColumn('loans', 'disbursement_notes')) {
                $table->text('disbursement_notes')->nullable()->after('disbursed_at');
            }
        });
    }

    public function down()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropForeign(['treasurer_approved_by']);
            $table->dropForeign(['chairman_approved_by']);
            $table->dropForeign(['disbursed_by']);
            
            $table->dropColumn([
                'treasurer_approved_by',
                'treasurer_approved_at',
                'treasurer_notes',
                'chairman_approved_by',
                'chairman_approved_at',
                'chairman_notes',
                'disbursed_by',
                'disbursed_at',
                'disbursement_notes'
            ]);
        });
    }
};