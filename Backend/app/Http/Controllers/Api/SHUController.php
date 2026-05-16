<?php
// app/Http/Controllers/Api/SHUController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SHU;
use App\Models\Saving;
use App\Models\SavingType;
use App\Models\User;
use App\Models\Loan;
use App\Models\LoanInstallment;
use App\Models\KantinIncome;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class SHUController extends Controller
{
    // Persentase SHU default
    const PERCENTAGES = [
        'member' => 50,      // Anggota
        'reserve' => 10,     // Cadangan
        'capital' => 25,     // Modal Koperasi
        'social' => 5,       // Dana Sosial
        'management' => 5,   // Pengurus
        'supervisor' => 5    // Pengawas
    ];

    /**
     * Calculate SHU for a given year
     */
    public function calculate(Request $request)
    {
        try {
            $year = $request->query('year', date('Y'));

            // Calculate total loan interest
            $totalInterest = 0;
            $installments = LoanInstallment::with('loan')
                ->whereYear('payment_date', $year)
                ->get();

            foreach ($installments as $installment) {
                $loan = $installment->loan;
                if ($loan) {
                    $monthlyInterest = ($loan->amount * $loan->interest_rate) / 100;
                    $totalInterest += $monthlyInterest;
                }
            }

            // Calculate total kantin income
            $kantinTotal = 0;
            if (Schema::hasTable('kantin_incomes')) {
                $kantinTotal = KantinIncome::whereYear('income_date', $year)->sum('amount');
            }

            // Calculate total expenses
            $totalExpenses = 0;
            if (Schema::hasTable('expenses')) {
                $totalExpenses = Expense::whereYear('expense_date', $year)->sum('amount');
            }

            // Calculate SHU
            $totalIncome = $totalInterest + $kantinTotal;
            $totalSHU = max(0, $totalIncome - $totalExpenses);

            // Calculate distribution
            $memberAmount = $totalSHU * (self::PERCENTAGES['member'] / 100);
            $reserveAmount = $totalSHU * (self::PERCENTAGES['reserve'] / 100);
            $capitalAmount = $totalSHU * (self::PERCENTAGES['capital'] / 100);
            $socialAmount = $totalSHU * (self::PERCENTAGES['social'] / 100);
            $managementAmount = $totalSHU * (self::PERCENTAGES['management'] / 100);
            $supervisorAmount = $totalSHU * (self::PERCENTAGES['supervisor'] / 100);

            // Check if already processed
            $isProcessed = false;
            if (Schema::hasTable('shu')) {
                $existing = SHU::where('year', $year)->first();
                $isProcessed = !is_null($existing);
            }

            return response()->json([
                'success' => true,
                'message' => 'Perhitungan SHU berhasil',
                'data' => [
                    'year' => $year,
                    'total_shu' => $totalSHU,
                    'total_income' => $totalIncome,
                    'total_expense' => $totalExpenses,
                    'loan_interest_total' => $totalInterest,
                    'kantin_income_total' => $kantinTotal,
                    
                    'member_percentage' => self::PERCENTAGES['member'],
                    'member_amount' => $memberAmount,
                    
                    'reserve_percentage' => self::PERCENTAGES['reserve'],
                    'reserve_amount' => $reserveAmount,
                    
                    'capital_percentage' => self::PERCENTAGES['capital'],
                    'capital_amount' => $capitalAmount,
                    
                    'social_percentage' => self::PERCENTAGES['social'],
                    'social_amount' => $socialAmount,
                    
                    'management_percentage' => self::PERCENTAGES['management'],
                    'management_amount' => $managementAmount,
                    
                    'supervisor_percentage' => self::PERCENTAGES['supervisor'],
                    'supervisor_amount' => $supervisorAmount,
                    
                    'is_processed' => $isProcessed
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Calculate SHU error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung SHU: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Process SHU distribution
     */
    public function process(Request $request)
    {
        try {
            $user = $request->user();

            $request->validate([
                'year' => 'required|integer',
                'total_shu' => 'required|numeric|min:0',
                'member_percentage' => 'required|numeric|between:0,100',
                'reserve_percentage' => 'required|numeric|between:0,100',
                'capital_percentage' => 'required|numeric|between:0,100',
                'social_percentage' => 'required|numeric|between:0,100',
                'management_percentage' => 'required|numeric|between:0,100',
                'supervisor_percentage' => 'required|numeric|between:0,100',
                'notes' => 'nullable|string'
            ]);

            $year = $request->year;
            $totalSHU = $request->total_shu;

            // Check if already processed
            if (Schema::hasTable('shu')) {
                $existing = SHU::where('year', $year)->first();
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => "SHU tahun {$year} sudah pernah diproses",
                        'data' => null
                    ], 400);
                }
            }

            DB::beginTransaction();

            // Calculate amounts
            $memberAmount = ($totalSHU * $request->member_percentage) / 100;
            $reserveAmount = ($totalSHU * $request->reserve_percentage) / 100;
            $capitalAmount = ($totalSHU * $request->capital_percentage) / 100;
            $socialAmount = ($totalSHU * $request->social_percentage) / 100;
            $managementAmount = ($totalSHU * $request->management_percentage) / 100;
            $supervisorAmount = ($totalSHU * $request->supervisor_percentage) / 100;

            // Create SHU record
            $shu = SHU::create([
                'year' => $year,
                'total_shu' => $totalSHU,
                
                'member_percentage' => $request->member_percentage,
                'member_amount' => $memberAmount,
                
                'reserve_percentage' => $request->reserve_percentage,
                'reserve_amount' => $reserveAmount,
                
                'capital_percentage' => $request->capital_percentage,
                'capital_amount' => $capitalAmount,
                
                'social_percentage' => $request->social_percentage,
                'social_amount' => $socialAmount,
                
                'management_percentage' => $request->management_percentage,
                'management_amount' => $managementAmount,
                
                'supervisor_percentage' => $request->supervisor_percentage,
                'supervisor_amount' => $supervisorAmount,
                
                'total_income' => $request->total_income ?? 0,
                'total_expense' => $request->total_expense ?? 0,
                'kantin_income_total' => $request->kantin_income_total ?? 0,
                'loan_interest_total' => $request->loan_interest_total ?? 0,
                
                'processed_by' => $user->id,
                'processed_at' => now(),
                'notes' => $request->notes
            ]);

            // Distribute member share to all active members
            $memberShareAmount = $shu->member_amount;
            $sukarelaType = SavingType::where('name', 'Sukarela')->first();
            
            if ($sukarelaType && $memberShareAmount > 0) {
                $members = User::where('role_id', 5)->where('status', 'active')->get();
                
                // Calculate total savings for proportional distribution
                $totalSavings = 0;
                $memberSavings = [];
                
                foreach ($members as $member) {
                    $balance = $this->getSavingsBalance($member->id);
                    $totalSavings += $balance;
                    $memberSavings[$member->id] = $balance;
                }
                
                $distributedCount = 0;
                
                foreach ($members as $member) {
                    $memberSaving = $memberSavings[$member->id] ?? 0;
                    $memberShare = 0;
                    
                    if ($totalSavings > 0 && $memberShareAmount > 0) {
                        $memberShare = ($memberSaving / $totalSavings) * $memberShareAmount;
                    }
                    
                    if ($memberShare > 0.01) {
                        Saving::create([
                            'user_id' => $member->id,
                            'saving_type_id' => $sukarelaType->id,
                            'amount' => round($memberShare, 2),
                            'transaction_type' => 'deposit',
                            'description' => "Pembagian SHU tahun buku {$year} (Jasa Anggota)",
                            'transaction_date' => now(),
                            'created_by' => $user->id,
                            'verification_status' => 'verified',
                            'verified_at' => now(),
                            'verified_by' => $user->id
                        ]);
                        $distributedCount++;
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "SHU tahun {$year} sebesar Rp " . number_format($totalSHU, 0, ',', '.') . " berhasil diproses dan didistribusikan kepada {$distributedCount} anggota",
                'data' => $shu
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Process SHU error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses SHU: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Get SHU history
     */
    public function history(Request $request)
    {
        try {
            $history = SHU::with('processor')
                ->orderBy('year', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Riwayat SHU berhasil diambil',
                'data' => $history
            ]);

        } catch (\Exception $e) {
            Log::error('Get SHU history error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil riwayat SHU: ' . $e->getMessage(),
                'data' => []
            ]);
        }
    }

    /**
     * Get SHU by year
     */
    public function getByYear($year)
    {
        try {
            $shu = SHU::with('processor')
                ->where('year', $year)
                ->first();

            if (!$shu) {
                return response()->json([
                    'success' => false,
                    'message' => "Data SHU tahun {$year} tidak ditemukan",
                    'data' => null
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data SHU berhasil diambil',
                'data' => $shu
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Get savings balance for a user
     */
    private function getSavingsBalance($userId, $savingTypeId = null)
    {
        $query = Saving::where('user_id', $userId)
            ->where(function ($q) {
                $q->where('verification_status', 'verified')
                    ->orWhere('transaction_type', 'withdrawal');
            });

        if ($savingTypeId) {
            $query->where('saving_type_id', $savingTypeId);
        }

        $balance = $query->select(
            DB::raw("COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END), 0) as total")
        )->value('total');

        return max(0, (float) $balance);
    }
}