<?php
// app/Http/Controllers/Api/ReportController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Saving;
use App\Models\Loan;
use App\Models\LoanInstallment;
use App\Models\SavingType;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function generateRekeningKoran(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();
            
            // Check authorization
            $roleName = $currentUser->role->name ?? 'anggota';
            if (!in_array($roleName, ['admin', 'bendahara', 'ketua']) && $currentUser->id != $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak',
                    'data' => null
                ], 403);
            }
            
            $member = User::findOrFail($userId);
            $month = $request->query('month', date('F Y'));
            
            // Get saving types
            $pokokType = SavingType::where('name', 'Pokok')->first();
            $wajibType = SavingType::where('name', 'Wajib')->first();
            $sukarelaType = SavingType::where('name', 'Sukarela')->first();
            
            // Calculate savings balance (deposits - withdrawals)
            $pokokBalance = $this->calculateSavingBalance($member->id, $pokokType);
            $wajibBalance = $this->calculateSavingBalance($member->id, $wajibType);
            $sukarelaBalance = $this->calculateSavingBalance($member->id, $sukarelaType);
            
            $totalSavings = $pokokBalance + $wajibBalance + $sukarelaBalance;
            
            // Get all transactions for history (include withdrawals)
            $allSavings = Saving::with('type')
                ->where('user_id', $member->id)
                ->where(function($q) {
                    $q->where('verification_status', 'verified')
                      ->orWhere('transaction_type', 'withdrawal');
                })
                ->orderBy('transaction_date', 'desc')
                ->get();
            
            // Get active loans
            $activeLoan = Loan::where('user_id', $member->id)
                ->where('status', 'active')
                ->first();
            
            $loanAmount = 0;
            $monthlyInstallment = 0;
            $remainingBalance = 0;
            $tenor = 0;
            
            if ($activeLoan) {
                $loanAmount = $activeLoan->amount;
                $monthlyInstallment = $activeLoan->monthly_installment;
                $remainingBalance = $activeLoan->remaining_balance;
                $tenor = $activeLoan->tenor_months;
            }
            
            // Get SHU history
            $shuTotal = Saving::where('user_id', $member->id)
                ->where('description', 'like', 'Pembagian SHU%')
                ->sum('amount');
            
            // Calculate total deposits and withdrawals
            $totalDeposits = $allSavings->where('transaction_type', 'deposit')->sum('amount');
            $totalWithdrawals = $allSavings->where('transaction_type', 'withdrawal')->sum('amount');
            
            $data = [
                'member' => $member,
                'month' => $month,
                'pokok_balance' => $pokokBalance,
                'wajib_balance' => $wajibBalance,
                'sukarela_balance' => $sukarelaBalance,
                'total_savings' => $totalSavings,
                'total_deposits' => $totalDeposits,
                'total_withdrawals' => $totalWithdrawals,
                'shu_total' => $shuTotal,
                'has_loan' => !is_null($activeLoan),
                'loan_amount' => $loanAmount,
                'monthly_installment' => $monthlyInstallment,
                'remaining_balance' => $remainingBalance,
                'tenor' => $tenor,
                'transactions' => $allSavings,
                'formatCurrency' => function($amount) {
                    return 'Rp ' . number_format($amount, 0, ',', '.');
                },
                'generated_at' => now()
            ];
            
            $pdf = Pdf::loadView('reports.rekening-koran', $data);
            $pdf->setPaper('A4', 'portrait');
            
            $filename = 'rekening_koran_' . preg_replace('/[^a-zA-Z0-9]/', '_', $member->name) . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate PDF: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
    
    private function calculateSavingBalance($userId, $savingType)
    {
        if (!$savingType) return 0;
        
        $savings = Saving::where('user_id', $userId)
            ->where('saving_type_id', $savingType->id)
            ->where(function($q) {
                $q->where('verification_status', 'verified')
                  ->orWhere('transaction_type', 'withdrawal');
            })
            ->get();
        
        $balance = 0;
        foreach ($savings as $saving) {
            if ($saving->transaction_type === 'deposit') {
                $balance += $saving->amount;
            } else {
                $balance -= $saving->amount;
            }
        }
        
        return max(0, $balance);
    }
}