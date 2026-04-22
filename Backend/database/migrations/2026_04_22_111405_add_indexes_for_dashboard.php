<?php
// database/migrations/2026_04_22_111405_add_indexes_for_dashboard.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Index untuk tabel savings - dengan nama yang lebih pendek
        Schema::table('savings', function (Blueprint $table) {
            // Cek apakah index sudah ada sebelum membuat
            if (!Schema::hasIndex('savings', 'savings_v_status_t_type_t_date_idx')) {
                $table->index(['verification_status', 'transaction_type', 'transaction_date'], 'savings_v_status_t_type_t_date_idx');
            }
            
            if (!Schema::hasIndex('savings', 'savings_user_v_status_idx')) {
                $table->index(['user_id', 'verification_status'], 'savings_user_v_status_idx');
            }
            
            if (!Schema::hasIndex('savings', 'savings_type_v_status_idx')) {
                $table->index(['saving_type_id', 'verification_status'], 'savings_type_v_status_idx');
            }
            
            if (!Schema::hasIndex('savings', 'savings_created_at_idx')) {
                $table->index('created_at', 'savings_created_at_idx');
            }
        });
        
        // Index untuk tabel loans
        Schema::table('loans', function (Blueprint $table) {
            if (!Schema::hasIndex('loans', 'loans_status_created_at_idx')) {
                $table->index(['status', 'created_at'], 'loans_status_created_at_idx');
            }
            
            if (!Schema::hasIndex('loans', 'loans_user_id_idx')) {
                $table->index('user_id', 'loans_user_id_idx');
            }
            
            if (!Schema::hasIndex('loans', 'loans_created_at_idx')) {
                $table->index('created_at', 'loans_created_at_idx');
            }
        });
        
        // Index untuk tabel users
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasIndex('users', 'users_status_role_id_idx')) {
                $table->index(['status', 'role_id'], 'users_status_role_id_idx');
            }
        });
    }

    public function down(): void
    {
        // Drop indexes dari tabel savings
        Schema::table('savings', function (Blueprint $table) {
            if (Schema::hasIndex('savings', 'savings_v_status_t_type_t_date_idx')) {
                $table->dropIndex('savings_v_status_t_type_t_date_idx');
            }
            if (Schema::hasIndex('savings', 'savings_user_v_status_idx')) {
                $table->dropIndex('savings_user_v_status_idx');
            }
            if (Schema::hasIndex('savings', 'savings_type_v_status_idx')) {
                $table->dropIndex('savings_type_v_status_idx');
            }
            if (Schema::hasIndex('savings', 'savings_created_at_idx')) {
                $table->dropIndex('savings_created_at_idx');
            }
        });
        
        // Drop indexes dari tabel loans
        Schema::table('loans', function (Blueprint $table) {
            if (Schema::hasIndex('loans', 'loans_status_created_at_idx')) {
                $table->dropIndex('loans_status_created_at_idx');
            }
            if (Schema::hasIndex('loans', 'loans_user_id_idx')) {
                $table->dropIndex('loans_user_id_idx');
            }
            if (Schema::hasIndex('loans', 'loans_created_at_idx')) {
                $table->dropIndex('loans_created_at_idx');
            }
        });
        
        // Drop indexes dari tabel users
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasIndex('users', 'users_status_role_id_idx')) {
                $table->dropIndex('users_status_role_id_idx');
            }
        });
    }
};