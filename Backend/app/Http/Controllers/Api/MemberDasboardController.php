<?php
// app/Http/Controllers/Api/MemberDashboardController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Saving;
use App\Models\Loan;
use App\Models\SavingType;
use App\Models\LoanInstallment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberDashboardController extends Controller
{
    /**
     * Get member dashboard statistics
     */
    public function getStats(Request $request)
    {
        try {
            $user = $request->user();
            $userId = $user->id;

            // Get savings summary (Pokok, Wajib, Sukarela)
            $savingBalances = Saving::select(
                'saving_type_id',
                DB::raw("
        SUM(
            CASE
                WHEN transaction_type = 'deposit'
                THEN amount
                ELSE -amount
            END
        ) as balance
    ")
            )
                ->with('type:id,name')
                ->where('user_id', $userId)
                ->where(function ($q) {
                    $q->where('verification_status', 'verified')
                        ->orWhere('transaction_type', 'withdrawal');
                })
                ->groupBy('saving_type_id')
                ->get();

            $pokokBalance = 0;
            $wajibBalance = 0;
            $sukarelaBalance = 0;

            foreach ($savingBalances as $saving) {

                $typeName = $saving->type?->name;
                $balance = (float) $saving->balance;

                if ($typeName === 'Pokok') {
                    $pokokBalance = $balance;
                }

                if ($typeName === 'Wajib') {
                    $wajibBalance = $balance;
                }

                if ($typeName === 'Sukarela') {
                    $sukarelaBalance = $balance;
                }
            }

            $totalSavings =
                $pokokBalance +
                $wajibBalance +
                $sukarelaBalance;

            // Get active loan
            $activeLoan = Loan::where('user_id', $userId)
                ->where('status', 'active')
                ->where('remaining_balance', '>', 0)
                ->first();

            $remainingLoan = $activeLoan ? $activeLoan->remaining_balance : 0;
            $monthlyInstallment = $activeLoan ? $activeLoan->monthly_installment : 0;
            $remainingTenor = 0;

            if ($activeLoan) {
                $paidInstallments = LoanInstallment::where('loan_id', $activeLoan->id)->count();
                $remainingTenor = $activeLoan->tenor_months - $paidInstallments;
                if ($remainingTenor < 0)
                    $remainingTenor = 0;
            }

            // Calculate estimated SHU (15% of Sukarela savings)
            $estimatedSHU = $sukarelaBalance * 0.15;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_savings' => $totalSavings,
                    'total_savings_formatted' => $this->formatCurrency($totalSavings),
                    'remaining_loan' => $remainingLoan,
                    'remaining_loan_formatted' => $this->formatCurrency($remainingLoan),
                    'monthly_installment' => $monthlyInstallment,
                    'monthly_installment_formatted' => $this->formatCurrency($monthlyInstallment),
                    'remaining_tenor' => $remainingTenor,
                    'estimated_shu' => $estimatedSHU,
                    'estimated_shu_formatted' => $this->formatCurrency($estimatedSHU),
                    'has_active_loan' => !is_null($activeLoan),
                    'member_status' => $user->status === 'active' ? 'Aktif' : 'Tidak Aktif',
                    'is_verified' => true,
                    'pokok' => $pokokBalance,
                    'wajib' => $wajibBalance,
                    'sukarela' => $sukarelaBalance
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Member dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data dashboard',
                'data' => [
                    'total_savings' => 0,
                    'total_savings_formatted' => 'Rp 0',
                    'remaining_loan' => 0,
                    'remaining_loan_formatted' => 'Rp 0',
                    'monthly_installment' => 0,
                    'monthly_installment_formatted' => 'Rp 0',
                    'remaining_tenor' => 0,
                    'estimated_shu' => 0,
                    'estimated_shu_formatted' => 'Rp 0',
                    'has_active_loan' => false,
                    'member_status' => 'Aktif',
                    'is_verified' => true,
                    'pokok' => 0,
                    'wajib' => 0,
                    'sukarela' => 0
                ]
            ]);
        }
    }

    /**
     * Get recent transactions for member
     */
    public function getRecentTransactions(Request $request)
    {
        try {
            $user = $request->user();
            $userId = $user->id;
            $limit = $request->input('limit', 5);

            $transactions = [];

            // Get savings transactions
            $savings = Saving::with(['type'])
                ->where('user_id', $userId)
                ->where(function ($q) {
                    $q->where('verification_status', 'verified')
                        ->orWhere('transaction_type', 'withdrawal');
                })
                ->orderBy('transaction_date', 'desc')
                ->limit($limit)
                ->get();

            foreach ($savings as $saving) {
                $isPayroll = ($saving->type && $saving->type->name === 'Wajib' &&
                    strpos($saving->description ?? '', 'gaji') !== false);
                $isWithdrawal = $saving->transaction_type === 'withdrawal';

                $transactions[] = [
                    'id' => 'saving_' . $saving->id,
                    'type' => $isWithdrawal ? 'withdrawal' : ($isPayroll ? 'payroll' : 'saving'),
                    'category' => $saving->type ? $saving->type->name : 'Simpanan',
                    'title' => $isWithdrawal ? 'Penarikan Sukarela' : ($isPayroll ? 'Potongan Payroll (Wajib)' : 'Setoran Sukarela'),
                    'description' => $saving->description ?? ($isWithdrawal ? 'Penarikan simpanan sukarela' : 'Setoran simpanan'),
                    'amount' => (float) $saving->amount,
                    'date' => $saving->transaction_date,
                    'status' => $saving->verification_status === 'verified' ? 'Berhasil' : 'Menunggu',
                    'status_color' => $saving->verification_status === 'verified' ? 'text-emerald-500' : 'text-yellow-500',
                    'icon' => $isWithdrawal ? 'ArrowDownRight' : 'ArrowUpRight'
                ];
            }

            // Sort by date
            usort($transactions, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

            // Take only $limit
            $transactions = array_slice($transactions, 0, $limit);

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (\Exception $e) {
            \Log::error('Member recent transactions error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat transaksi terbaru',
                'data' => []
            ]);
        }
    }

    /**
     * Get member profile data
     */
    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nip' => $user->nip,
                    'nik' => $user->nik,
                    'unit' => $user->unit,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'join_date' => $user->join_date,
                    'status' => $user->status === 'active' ? 'Aktif' : 'Tidak Aktif',
                    'role' => $user->role ? $user->role->name : 'anggota',
                    'avatar' => $user->avatar,
                    'bank_name' => $user->bank_name,
                    'account_number' => $user->account_number,
                    'account_name' => $user->account_name
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat profil',
                'data' => null
            ]);
        }
    }

    private function getSavingsBalance($userId, $savingTypeId = null)
    {
        $query = Saving::where('user_id', $userId);

        $query->where(function ($q) {
            $q->where('verification_status', 'verified')
                ->orWhere('transaction_type', 'withdrawal');
        });

        if ($savingTypeId) {
            $query->where('saving_type_id', $savingTypeId);
        }

        $savings = $query->get();

        $balance = 0;
        foreach ($savings as $saving) {
            if ($saving->transaction_type === 'deposit') {
                $balance += $saving->amount;
            } else {
                $balance -= $saving->amount;
            }
        }

        return $balance;
    }

    private function formatCurrency($amount)
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}