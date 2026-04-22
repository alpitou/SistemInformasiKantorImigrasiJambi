<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('savings', function (Blueprint $table) {
            // Check and add verification_status if not exists
            if (!Schema::hasColumn('savings', 'verification_status')) {
                $table->enum('verification_status', ['pending', 'verified', 'rejected'])
                      ->default('pending')
                      ->after('proof_image');
            }
            
            // Check and add verified_at if not exists
            if (!Schema::hasColumn('savings', 'verified_at')) {
                $table->timestamp('verified_at')
                      ->nullable()
                      ->after('verification_status');
            }
            
            // Check and add verified_by if not exists
            if (!Schema::hasColumn('savings', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')
                      ->nullable()
                      ->after('verified_at');
            }
            
            // Add foreign key constraint for verified_by if not exists
            // Check if foreign key doesn't exist before adding
            $foreignKeys = $this->getForeignKeys('savings');
            if (!in_array('savings_verified_by_foreign', $foreignKeys)) {
                $table->foreign('verified_by')
                      ->references('id')
                      ->on('users')
                      ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('savings', function (Blueprint $table) {
            // Drop foreign key if exists
            $foreignKeys = $this->getForeignKeys('savings');
            if (in_array('savings_verified_by_foreign', $foreignKeys)) {
                $table->dropForeign(['verified_by']);
            }
            
            // Drop columns if they exist
            if (Schema::hasColumn('savings', 'verification_status')) {
                $table->dropColumn('verification_status');
            }
            
            if (Schema::hasColumn('savings', 'verified_at')) {
                $table->dropColumn('verified_at');
            }
            
            if (Schema::hasColumn('savings', 'verified_by')) {
                $table->dropColumn('verified_by');
            }
        });
    }

    /**
     * Get foreign keys for a table
     */
    private function getForeignKeys($table)
    {
        $conn = Schema::getConnection();
        $dbName = $conn->getDatabaseName();
        $tableName = $table;
        
        $result = $conn->select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND REFERENCED_COLUMN_NAME IS NOT NULL
        ", [$dbName, $tableName]);
        
        return array_map(function($item) {
            return $item->CONSTRAINT_NAME;
        }, $result);
    }
};