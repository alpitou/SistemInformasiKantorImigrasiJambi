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
            if (!$currentUser->hasRole('admin') && !$currentUser->hasRole('bendahara') && $currentUser->id != $userId) {
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
            
            // Calculate savings
            $pokokBalance = 0;
            $wajibBalance = 0;
            
            if ($pokokType) {
                $pokokBalance = Saving::where('user_id', $member->id)
                    ->where('saving_type_id', $pokokType->id)
                    ->where('transaction_type', 'deposit')
                    ->where('verification_status', 'verified')
                    ->sum('amount');
            }
            
            if ($wajibType) {
                $wajibBalance = Saving::where('user_id', $member->id)
                    ->where('saving_type_id', $wajibType->id)
                    ->where('transaction_type', 'deposit')
                    ->where('verification_status', 'verified')
                    ->sum('amount');
            }
            
            $totalSavings = $pokokBalance + $wajibBalance;
            
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
            
            $data = [
                'member' => $member,
                'month' => $month,
                'pokok_balance' => $pokokBalance,
                'wajib_balance' => $wajibBalance,
                'total_savings' => $totalSavings,
                'shu_total' => $shuTotal,
                'has_loan' => !is_null($activeLoan),
                'loan_amount' => $loanAmount,
                'monthly_installment' => $monthlyInstallment,
                'remaining_balance' => $remainingBalance,
                'tenor' => $tenor,
                'generated_at' => now()
            ];
            
            // Load view dan generate PDF
            $pdf = Pdf::loadView('reports.rekening-koran', $data);
            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true
            ]);
            
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
}