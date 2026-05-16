<?php
// database/migrations/2026_01_01_000002_update_shu_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('shu', function (Blueprint $table) {
            // Hapus kolom lama
            if (Schema::hasColumn('shu', 'member_share_percentage')) {
                $table->dropColumn('member_share_percentage');
            }
            if (Schema::hasColumn('shu', 'member_share_amount')) {
                $table->dropColumn('member_share_amount');
            }
            if (Schema::hasColumn('shu', 'reserve_percentage')) {
                $table->dropColumn('reserve_percentage');
            }
            if (Schema::hasColumn('shu', 'reserve_amount')) {
                $table->dropColumn('reserve_amount');
            }
            if (Schema::hasColumn('shu', 'kantin_contribution')) {
                $table->dropColumn('kantin_contribution');
            }
            if (Schema::hasColumn('shu', 'interest_income')) {
                $table->dropColumn('interest_income');
            }
            if (Schema::hasColumn('shu', 'operational_cost')) {
                $table->dropColumn('operational_cost');
            }

            // Tambah kolom baru sesuai persentase SHU
            $table->decimal('member_percentage', 5, 2)->default(50)->after('total_shu');
            $table->decimal('member_amount', 15, 2)->default(0)->after('member_percentage');
            
            $table->decimal('reserve_percentage', 5, 2)->default(10)->after('member_amount');
            $table->decimal('reserve_amount', 15, 2)->default(0)->after('reserve_percentage');
            
            $table->decimal('capital_percentage', 5, 2)->default(25)->after('reserve_amount');
            $table->decimal('capital_amount', 15, 2)->default(0)->after('capital_percentage');
            
            $table->decimal('social_percentage', 5, 2)->default(5)->after('capital_amount');
            $table->decimal('social_amount', 15, 2)->default(0)->after('social_percentage');
            
            $table->decimal('management_percentage', 5, 2)->default(5)->after('social_amount');
            $table->decimal('management_amount', 15, 2)->default(0)->after('management_percentage');
            
            $table->decimal('supervisor_percentage', 5, 2)->default(5)->after('management_amount');
            $table->decimal('supervisor_amount', 15, 2)->default(0)->after('supervisor_percentage');
            
            // Data pendukung
            $table->decimal('total_income', 15, 2)->default(0)->after('supervisor_amount');
            $table->decimal('total_expense', 15, 2)->default(0)->after('total_income');
            $table->decimal('kantin_income_total', 15, 2)->default(0)->after('total_expense');
            $table->decimal('loan_interest_total', 15, 2)->default(0)->after('kantin_income_total');
        });
    }

    public function down()
    {
        Schema::table('shu', function (Blueprint $table) {
            $table->dropColumn([
                'member_percentage',
                'member_amount',
                'reserve_percentage',
                'reserve_amount',
                'capital_percentage',
                'capital_amount',
                'social_percentage',
                'social_amount',
                'management_percentage',
                'management_amount',
                'supervisor_percentage',
                'supervisor_amount',
                'total_income',
                'total_expense',
                'kantin_income_total',
                'loan_interest_total'
            ]);
            
            // Kembalikan kolom lama
            $table->decimal('member_share_percentage', 5, 2)->default(60);
            $table->decimal('member_share_amount', 15, 2)->default(0);
            $table->decimal('reserve_percentage', 5, 2)->default(40);
            $table->decimal('reserve_amount', 15, 2)->default(0);
            $table->decimal('kantin_contribution', 15, 2)->default(0);
            $table->decimal('interest_income', 15, 2)->default(0);
            $table->decimal('operational_cost', 15, 2)->default(0);
        });
    }
};