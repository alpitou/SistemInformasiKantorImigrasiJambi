<?php
// app/Http/Controllers/Api/FinancialReportController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\Loan;
use App\Models\LoanInstallment;
use App\Models\KantinIncome;
use App\Models\Expense;
use App\Models\SHU;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class FinancialReportController extends Controller
{
    /**
     * Get financial summary
     */
    public function summary(Request $request)
    {
        try {
            // Savings calculation
            $totalSavings = Saving::where('verification_status', 'verified')
                ->where('transaction_type', 'deposit')
                ->sum('amount');

            $totalWithdrawals = Saving::where('transaction_type', 'withdrawal')
                ->sum('amount');

            $totalSavingsBalance = $totalSavings - $totalWithdrawals;

            // Loans calculation
            $activeLoans = Loan::where('status', 'active')->get();
            $totalActiveLoans = $activeLoans->sum('remaining_balance');
            $totalLoanAmount = Loan::whereIn('status', ['active', 'approved'])->sum('amount');
            $totalInstallments = LoanInstallment::sum('amount_paid');

            // Interest calculation
            $totalInterest = 0;
            $installments = LoanInstallment::with('loan')->get();
            foreach ($installments as $installment) {
                $loan = $installment->loan;
                if ($loan) {
                    $monthlyInterest = ($loan->amount * $loan->interest_rate) / 100;
                    $totalInterest += $monthlyInterest;
                }
            }

            // Kantin income
            $currentYear = now()->format('Y');
            $kantinTotal = 0;
            if (Schema::hasTable('kantin_incomes')) {
                $kantinTotal = KantinIncome::whereYear('income_date', $currentYear)->sum('amount');
            }

            // Expenses
            $totalExpenses = 0;
            $expensesByCategory = [];
            if (Schema::hasTable('expenses')) {
                $totalExpenses = Expense::whereYear('expense_date', $currentYear)->sum('amount');
                $expensesByCategory = Expense::whereYear('expense_date', $currentYear)
                    ->select('category', DB::raw('SUM(amount) as total'))
                    ->groupBy('category')
                    ->get()
                    ->pluck('total', 'category')
                    ->toArray();
            }

            // SHU calculation
            $totalIncome = $totalInterest + $kantinTotal;
            $totalSHU = max(0, $totalIncome - $totalExpenses);

            $memberAmount = $totalSHU * (SHUController::PERCENTAGES['member'] / 100);
            $reserveAmount = $totalSHU * (SHUController::PERCENTAGES['reserve'] / 100);
            $capitalAmount = $totalSHU * (SHUController::PERCENTAGES['capital'] / 100);
            $socialAmount = $totalSHU * (SHUController::PERCENTAGES['social'] / 100);
            $managementAmount = $totalSHU * (SHUController::PERCENTAGES['management'] / 100);
            $supervisorAmount = $totalSHU * (SHUController::PERCENTAGES['supervisor'] / 100);

            return response()->json([
                'success' => true,
                'message' => 'Data keuangan berhasil diambil',
                'data' => [
                    'total_cash' => max(0, $totalSavingsBalance - $totalActiveLoans),
                    'total_savings' => $totalSavingsBalance,
                    'total_loans' => $totalActiveLoans,
                    'total_loan_amount' => $totalLoanAmount,
                    'total_installments' => $totalInstallments,
                    'total_interest_income' => $totalInterest,
                    'total_kantin_income' => $kantinTotal,
                    'total_expenses' => $totalExpenses,
                    'expenses_by_category' => $expensesByCategory,
                    'total_shu' => $totalSHU,
                    'shu_distribution' => [
                        'member' => ['percentage' => SHUController::PERCENTAGES['member'], 'amount' => $memberAmount],
                        'reserve' => ['percentage' => SHUController::PERCENTAGES['reserve'], 'amount' => $reserveAmount],
                        'capital' => ['percentage' => SHUController::PERCENTAGES['capital'], 'amount' => $capitalAmount],
                        'social' => ['percentage' => SHUController::PERCENTAGES['social'], 'amount' => $socialAmount],
                        'management' => ['percentage' => SHUController::PERCENTAGES['management'], 'amount' => $managementAmount],
                        'supervisor' => ['percentage' => SHUController::PERCENTAGES['supervisor'], 'amount' => $supervisorAmount]
                    ],
                    'active_loans_count' => $activeLoans->count(),
                    'total_members' => User::where('role_id', 5)->count(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Financial summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data keuangan: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Get transaction history
     */
    public function transactions(Request $request)
    {
        try {
            $user = $request->user();
            $type = $request->query('type', 'all');
            $month = $request->query('month');
            $limit = $request->query('limit', 50);

            $transactions = [];

            // Get savings transactions
            $savingsQuery = Saving::with(['type', 'user'])
                ->where('user_id', $user->id);

            if ($month && $month !== 'all') {
                $year = substr($month, 0, 4);
                $monthNum = substr($month, 5, 2);
                $savingsQuery->whereYear('transaction_date', $year)
                    ->whereMonth('transaction_date', $monthNum);
            }

            $savings = $savingsQuery->orderBy('transaction_date', 'desc')->limit($limit)->get();

            foreach ($savings as $saving) {
                $isWithdrawal = $saving->transaction_type === 'withdrawal';
                $typeName = $saving->type ? $saving->type->name : 'Simpanan';
                $isPayroll = ($typeName === 'Wajib' && strpos($saving->description ?? '', 'gaji') !== false);

                if ($type !== 'all') {
                    if ($type === 'withdrawal' && !$isWithdrawal) continue;
                    if ($type === 'saving' && ($isPayroll || $isWithdrawal)) continue;
                    if ($type === 'payroll' && !$isPayroll) continue;
                }

                $transactions[] = [
                    'id' => 'saving_' . $saving->id,
                    'original_id' => $saving->id,
                    'type' => $isWithdrawal ? 'withdrawal' : ($isPayroll ? 'payroll' : 'saving'),
                    'category' => $typeName,
                    'title' => $isWithdrawal ? 'Penarikan Sukarela' : ($isPayroll ? 'Potongan Payroll' : 'Setoran Sukarela'),
                    'description' => $saving->description ?? ($isWithdrawal ? 'Penarikan simpanan' : 'Setoran simpanan'),
                    'amount' => (float) $saving->amount,
                    'date' => $saving->transaction_date,
                    'user' => $saving->user ? $saving->user->name : 'System',
                    'status' => $saving->verification_status === 'verified' ? 'success' : 'pending',
                    'is_income' => !$isWithdrawal && !$isPayroll
                ];
            }

            // Get loan installments
            $installmentsQuery = LoanInstallment::with(['loan.user'])
                ->whereHas('loan', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });

            if ($month && $month !== 'all') {
                $year = substr($month, 0, 4);
                $monthNum = substr($month, 5, 2);
                $installmentsQuery->whereYear('payment_date', $year)
                    ->whereMonth('payment_date', $monthNum);
            }

            $installments = $installmentsQuery->orderBy('payment_date', 'desc')->get();

            foreach ($installments as $installment) {
                if ($type !== 'all' && $type !== 'loan_installment') continue;

                $paymentMethod = $installment->payment_method === 'potong_gaji' ? 'Potong Gaji' : 
                    ($installment->payment_method === 'transfer' ? 'Transfer' : 'Tunai');

                $transactions[] = [
                    'id' => 'installment_' . $installment->id,
                    'original_id' => $installment->id,
                    'type' => 'loan_installment',
                    'category' => 'Pinjaman',
                    'title' => 'Angsuran Pinjaman',
                    'description' => "Pembayaran angsuran ke-{$installment->installment_number} via {$paymentMethod}",
                    'amount' => (float) $installment->amount_paid,
                    'date' => $installment->payment_date,
                    'user' => $installment->loan && $installment->loan->user ? $installment->loan->user->name : 'System',
                    'status' => 'success',
                    'is_income' => false
                ];
            }

            // Sort by date
            usort($transactions, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Riwayat transaksi berhasil diambil',
                'data' => array_slice($transactions, 0, $limit)
            ]);

        } catch (\Exception $e) {
            Log::error('Transaction history error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil riwayat transaksi: ' . $e->getMessage(),
                'data' => []
            ]);
        }
    }

    /**
     * Export transaction history
     */
    public function exportTransactions(Request $request)
    {
        try {
            $user = $request->user();
            $month = $request->input('month', date('Y-m'));
            $type = $request->input('type', 'all');

            // Get transactions data
            $transactions = $this->getTransactionsData($user, $type, $month);

            if (empty($transactions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada data transaksi untuk periode yang dipilih'
                ], 404);
            }

            $monthNames = [
                '01' => 'Januari', '02' => 'Februari', '03' => 'Maret',
                '04' => 'April', '05' => 'Mei', '06' => 'Juni',
                '07' => 'Juli', '08' => 'Agustus', '09' => 'September',
                '10' => 'Oktober', '11' => 'November', '12' => 'Desember'
            ];
            $monthNum = date('m', strtotime($month . '-01'));
            $monthName = $monthNames[$monthNum] ?? $monthNum;
            $year = date('Y', strtotime($month . '-01'));

            $fileName = "riwayat_transaksi_{$user->name}_{$monthName}_{$year}.csv";

            $handle = fopen('php://temp', 'w+');
            fwrite($handle, "\xEF\xBB\xBF");
            
            fputcsv($handle, ['NO', 'TANGGAL', 'JENIS TRANSAKSI', 'KATEGORI', 'DESKRIPSI', 'JUMLAH (Rp)', 'STATUS']);
            
            $no = 1;
            foreach ($transactions as $trx) {
                fputcsv($handle, [
                    $no++,
                    date('d/m/Y', strtotime($trx['date'])),
                    $this->getTransactionTypeName($trx['type']),
                    $trx['category'] ?? '-',
                    $trx['description'] ?? '-',
                    number_format($trx['amount'], 0, ',', '.'),
                    $trx['status'] === 'success' ? 'BERHASIL' : 'PENDING'
                ]);
            }

            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);

            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            Log::error('Export transactions error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ]);
        }
    }

    private function getTransactionsData($user, $type, $month)
    {
        $transactions = [];

        $savingsQuery = Saving::with(['type', 'user'])
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('transaction_type', 'withdrawal')
                    ->orWhere('verification_status', 'verified');
            });

        if ($month && $month !== 'all') {
            $year = substr($month, 0, 4);
            $monthNum = substr($month, 5, 2);
            $savingsQuery->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $monthNum);
        }

        $savings = $savingsQuery->get();

        foreach ($savings as $saving) {
            $isPayroll = ($saving->type && $saving->type->name === 'Wajib' &&
                (strpos($saving->description ?? '', 'gaji') !== false ||
                 strpos($saving->description ?? '', 'payroll') !== false));
            $isWithdrawal = $saving->transaction_type === 'withdrawal';

            if ($type === 'withdrawal' && !$isWithdrawal) continue;
            if ($type === 'saving' && ($isPayroll || $isWithdrawal)) continue;
            if ($type === 'payroll' && !$isPayroll) continue;

            $transactions[] = [
                'type' => $isWithdrawal ? 'withdrawal' : ($isPayroll ? 'payroll' : 'saving'),
                'category' => $saving->type ? $saving->type->name : 'Simpanan',
                'description' => $saving->description ?? ($isWithdrawal ? 'Penarikan simpanan' : 'Setoran simpanan'),
                'amount' => (float) $saving->amount,
                'date' => $saving->transaction_date,
                'status' => $saving->verification_status === 'verified' ? 'success' : 'pending'
            ];
        }

        usort($transactions, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return $transactions;
    }

    private function getTransactionTypeName($type)
    {
        switch ($type) {
            case 'saving': return 'SETORAN SUKARELA';
            case 'withdrawal': return 'PENARIKAN SUKARELA';
            case 'payroll': return 'POTONGAN PAYROLL';
            case 'loan_installment': return 'ANGSURAN PINJAMAN';
            default: return 'TRANSAKSI LAINNYA';
        }
    }
}