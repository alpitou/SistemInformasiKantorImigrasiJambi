<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\SavingType;
use App\Models\User;
use App\Models\Loan;
use App\Models\LoanInstallment;
use App\Models\KantinIncome;
use App\Models\SHU;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Facades\Excel;

class SavingController extends Controller
{
    private function getBalance($userId, $savingTypeId = null)
    {
        $query = Saving::where('user_id', $userId);

        $query->where(function($q) {
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

        return max(0, $balance);
    }

    private function getActivePayrollPeriod()
    {
        $today = now();
        $day = (int) $today->format('d');
        $year = (int) $today->format('Y');
        $month = (int) $today->format('m');
        
        if ($day >= 25) {
            $nextMonth = $month + 1;
            $nextYear = $year;
            if ($nextMonth > 12) {
                $nextMonth = 1;
                $nextYear = $year + 1;
            }
            return [
                'month' => sprintf('%04d-%02d', $nextYear, $nextMonth),
                'name' => date('F Y', strtotime("{$nextYear}-{$nextMonth}-01"))
            ];
        } else {
            return [
                'month' => sprintf('%04d-%02d', $year, $month),
                'name' => date('F Y', strtotime("{$year}-{$month}-01"))
            ];
        }
    }

    private function getNextInstallmentNumber($loanId)
    {
        $lastInstallment = LoanInstallment::where('loan_id', $loanId)
            ->orderBy('installment_number', 'desc')
            ->first();
        
        return $lastInstallment ? $lastInstallment->installment_number + 1 : 1;
    }

    // ==================== BASIC CRUD ====================
    
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Saving::with(['user', 'type', 'creator', 'verifier']);
        
        if ($request->has('status') && $request->status === 'pending') {
            $query->where('verification_status', 'pending')
                  ->where('transaction_type', 'deposit');
        }
        
        if (!in_array($user->role_id, [1, 3])) {
            $query->where('user_id', $user->id);
        }
        
        $savings = $query->orderBy('transaction_date', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Data transaksi simpanan berhasil diambil',
            'data' => $savings
        ]);
    }

    public function show($id, Request $request)
    {
        $user = $request->user();
        $saving = Saving::with(['user', 'type', 'creator', 'verifier'])->findOrFail($id);
        
        if (!in_array($user->role_id, [1, 3]) && $saving->user_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak',
                'data' => null
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Data transaksi simpanan berhasil diambil',
            'data' => $saving
        ]);
    }

    public function getUserSavings($userId, Request $request)
    {
        $currentUser = $request->user();
        
        if (!in_array($currentUser->role_id, [1, 3]) && $currentUser->id != $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak',
                'data' => null
            ], 403);
        }
        
        $savings = Saving::with(['type', 'creator', 'verifier'])
            ->where('user_id', $userId)
            ->orderBy('transaction_date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Data simpanan anggota berhasil diambil',
            'data' => $savings
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'saving_type_id' => 'required|exists:saving_types,id',
            'amount' => 'required|numeric|min:1',
            'transaction_type' => 'required|in:deposit,withdrawal',
            'description' => 'nullable|string',
            'transaction_date' => 'required|date',
            'proof_image' => 'nullable|string'
        ]);
        
        if ($request->transaction_type === 'withdrawal') {
            $balance = $this->getBalance($request->user_id, $request->saving_type_id);
            
            if ($request->amount > $balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo tidak mencukupi',
                    'data' => null
                ], 400);
            }
        }
        
        try {
            DB::beginTransaction();
            
            $verificationStatus = 'verified';
            $savingType = SavingType::find($request->saving_type_id);
            
            if ($request->transaction_type === 'deposit') {
                if ($savingType && strtolower($savingType->name) === 'sukarela') {
                    $verificationStatus = 'pending';
                }
            }
            
            $saving = Saving::create([
                'user_id' => $request->user_id,
                'saving_type_id' => $request->saving_type_id,
                'amount' => $request->amount,
                'transaction_type' => $request->transaction_type,
                'description' => $request->description,
                'transaction_date' => $request->transaction_date,
                'created_by' => $request->user()->id,
                'proof_image' => $request->proof_image,
                'verification_status' => $verificationStatus
            ]);
            
            if ($verificationStatus === 'verified') {
                $saving->update([
                    'verified_at' => now(),
                    'verified_by' => $request->user()->id
                ]);
            }
            
            DB::commit();
            
            $message = $request->transaction_type === 'deposit' 
                ? ($verificationStatus === 'pending' ? 'Setoran diajukan, menunggu verifikasi' : 'Setoran berhasil')
                : 'Penarikan berhasil';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $saving->load(['user', 'type', 'creator'])
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses transaksi: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    public function uploadProof(Request $request)
    {
        $request->validate([
            'proof_image' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120'
        ]);

        try {
            $file = $request->file('proof_image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('savings-proofs', $filename, 'public');

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer berhasil diupload',
                'data' => ['path' => Storage::url($path)]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    public function verifyDeposit($id, Request $request)
    {
        $user = $request->user();
        
        if (!in_array($user->role_id, [1, 3])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya bendahara atau admin yang dapat memverifikasi.',
                'data' => null
            ], 403);
        }
        
        $saving = Saving::findOrFail($id);
        
        if ($saving->transaction_type !== 'deposit') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya transaksi setoran yang dapat diverifikasi',
                'data' => null
            ], 400);
        }
        
        if ($saving->verification_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah diverifikasi',
                'data' => null
            ], 400);
        }
        
        try {
            DB::beginTransaction();
            
            $saving->update([
                'verification_status' => 'verified',
                'verified_at' => now(),
                'verified_by' => $user->id
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Setoran berhasil diverifikasi',
                'data' => $saving
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memverifikasi: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    public function getSummary($userId, Request $request)
    {
        $currentUser = $request->user();
        
        if (!in_array($currentUser->role_id, [1, 3]) && $currentUser->id != $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak',
                'data' => null
            ], 403);
        }
        
        $savingTypes = SavingType::all();
        $summary = [];
        $total = 0;
        
        foreach ($savingTypes as $type) {
            $balance = $this->getBalance($userId, $type->id);
            $summary[$type->name] = $balance;
            $total += $balance;
        }
        
        $summary['total'] = $total;
        
        return response()->json([
            'success' => true,
            'message' => 'Ringkasan saldo berhasil diambil',
            'data' => $summary
        ]);
    }

    public function downloadReport(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Fitur dalam pengembangan',
            'data' => null
        ]);
    }

    // ==================== PAYROLL METHODS ====================
    
    public function checkPayrollPeriod(Request $request)
    {
        $isActive = $this->isPayrollPeriodActive();
        $activePeriod = $this->getActivePayrollPeriod();
        
        return response()->json([
            'success' => true,
            'message' => $isActive ? 'Periode payroll aktif' : 'Periode payroll tidak aktif',
            'data' => [
                'is_active' => $isActive,
                'active_period' => $activePeriod,
                'current_date' => now()->format('d-m-Y'),
                'info' => 'Payroll hanya dapat diproses pada tanggal 25 sampai 5 bulan berikutnya'
            ]
        ]);
    }
    
    public function getMembersForPayroll(Request $request)
    {
        try {
            $members = User::where('role_id', 5)->where('status', 'active')->get();
            
            if ($members->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada anggota ditemukan',
                    'data' => []
                ]);
            }
            
            $savingTypes = SavingType::whereIn('name', ['Pokok', 'Wajib'])->get();
            $activePeriod = $this->getActivePayrollPeriod();
            $selectedMonth = $request->query('month', now()->format('Y-m'));
            $selectedYear = substr($selectedMonth, 0, 4);
            $selectedMonthNum = substr($selectedMonth, 5, 2);
            
            $result = [];
            foreach ($members as $member) {
                $hasPaidPokok = false;
                $pokokType = $savingTypes->firstWhere('name', 'Pokok');
                $pokokAmount = $pokokType->default_amount ?? 50000;
                
                if ($pokokType) {
                    $principalSavings = Saving::where('user_id', $member->id)
                        ->where('saving_type_id', $pokokType->id)
                        ->where('transaction_type', 'deposit')
                        ->where('verification_status', 'verified')
                        ->sum('amount');
                    $hasPaidPokok = $principalSavings >= $pokokAmount;
                }
                
                $alreadyProcessed = false;
                $wajibType = $savingTypes->firstWhere('name', 'Wajib');
                $monthName = date('F Y', strtotime($selectedMonth . '-01'));
                
                if ($wajibType) {
                    $existingWajib = Saving::where('user_id', $member->id)
                        ->where('saving_type_id', $wajibType->id)
                        ->whereYear('created_at', $selectedYear)
                        ->whereMonth('created_at', $selectedMonthNum)
                        ->where('description', 'like', '%' . $monthName . '%')
                        ->exists();
                    $alreadyProcessed = $existingWajib;
                }
                
                $memberData = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'nip' => $member->nip ?? '-',
                    'unit' => $member->unit ?? '-',
                    'join_date' => $member->join_date,
                    'is_old_member' => $hasPaidPokok,
                    'already_processed' => $alreadyProcessed,
                    'has_active_loan' => false,
                    'loan_installment' => 0,
                    'loan_remaining' => 0,
                    'loan_already_processed' => false,
                    'savings' => []
                ];
                
                foreach ($savingTypes as $type) {
                    $defaultAmount = $type->default_amount ?? ($type->name === 'Pokok' ? 50000 : 100000);
                    $balance = $this->getBalance($member->id, $type->id);
                    
                    if ($type->name === 'Pokok' && $hasPaidPokok) {
                        $defaultAmount = 0;
                    }
                    
                    if ($type->name === 'Wajib' && $alreadyProcessed) {
                        $defaultAmount = 0;
                    }
                    
                    $isProcessed = false;
                    if ($type->name === 'Wajib') {
                        $isProcessed = $alreadyProcessed;
                    } elseif ($type->name === 'Pokok') {
                        $isProcessed = $hasPaidPokok;
                    }
                    
                    $memberData['savings'][] = [
                        'type_id' => $type->id,
                        'type_name' => $type->name,
                        'default_amount' => (float) $defaultAmount,
                        'current_balance' => (float) $balance,
                        'is_processed' => $isProcessed
                    ];
                }
                
                $activeLoan = Loan::where('user_id', $member->id)
                    ->where('status', 'active')
                    ->where('remaining_balance', '>', 0)
                    ->first();
                
                if ($activeLoan) {
                    $memberData['has_active_loan'] = true;
                    $memberData['loan_installment'] = (float) $activeLoan->monthly_installment;
                    $memberData['loan_remaining'] = (float) $activeLoan->remaining_balance;
                    
                    $loanAlreadyProcessed = LoanInstallment::where('loan_id', $activeLoan->id)
                        ->where('payment_method', 'potong_gaji')
                        ->whereYear('payment_date', $selectedYear)
                        ->whereMonth('payment_date', $selectedMonthNum)
                        ->exists();
                    $memberData['loan_already_processed'] = $loanAlreadyProcessed;
                    
                    if ($loanAlreadyProcessed) {
                        $memberData['loan_installment'] = 0;
                    }
                }
                
                $result[] = $memberData;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Data anggota berhasil diambil',
                'data' => $result,
                'payroll_period' => [
                    'is_active' => $this->isPayrollPeriodActive(),
                    'period' => $activePeriod,
                    'info' => 'Payroll hanya dapat diproses pada tanggal 25 sampai 5 bulan berikutnya'
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Payroll members error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => []
            ]);
        }
    }

    public function getPayrollHistory(Request $request)
    {
        try {
            $history = [];
            
            $savingHistory = Saving::with(['user', 'type', 'creator'])
                ->where('description', 'like', 'Potongan payroll%')
                ->orderBy('created_at', 'desc')
                ->get();
            
            foreach ($savingHistory as $item) {
                $month = date('Y-m', strtotime($item->created_at));
                $monthName = date('F Y', strtotime($item->created_at));
                
                if (!isset($history[$month])) {
                    $history[$month] = [
                        'name' => $monthName,
                        'items' => []
                    ];
                }
                
                $history[$month]['items'][] = [
                    'id' => $item->id,
                    'type' => 'saving',
                    'user_id' => $item->user_id,
                    'user_name' => $item->user ? $item->user->name : 'System',
                    'user_nip' => $item->user ? ($item->user->nip ?? '-') : '-',
                    'user_unit' => $item->user ? ($item->user->unit ?? '-') : '-',
                    'saving_type' => $item->type ? $item->type->name : '-',
                    'amount' => (float) $item->amount,
                    'date' => $item->created_at,
                    'creator' => $item->creator ? $item->creator->name : null
                ];
            }
            
            krsort($history);
            
            foreach ($history as $month => $data) {
                usort($history[$month]['items'], function($a, $b) {
                    return strtotime($b['date']) - strtotime($a['date']);
                });
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Riwayat potongan payroll berhasil diambil',
                'data' => $history
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Payroll history error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'message' => 'Riwayat potongan payroll',
                'data' => []
            ]);
        }
    }

    public function processPayrollDeductions(Request $request)
    {
        try {
            $user = $request->user();
            
            $request->validate([
                'month' => 'required|string',
                'deductions' => 'array',
                'process_loan_installments' => 'boolean'
            ]);
            
            $activePeriod = $this->getActivePayrollPeriod();
            $monthName = $activePeriod['name'];
            $processLoanInstallments = $request->process_loan_installments ?? true;
            $selectedMonth = $request->month;
            $selectedYear = substr($selectedMonth, 0, 4);
            $selectedMonthNum = substr($selectedMonth, 5, 2);
            
            DB::beginTransaction();
            $processedCount = 0;
            $skippedCount = 0;
            $loanProcessedCount = 0;
            
            if (!empty($request->deductions) && is_array($request->deductions)) {
                foreach ($request->deductions as $deduction) {
                    $savingType = SavingType::find($deduction['saving_type_id']);
                    if (!$savingType) {
                        $skippedCount++;
                        continue;
                    }
                    
                    $existing = Saving::where('user_id', $deduction['user_id'])
                        ->where('saving_type_id', $deduction['saving_type_id'])
                        ->whereYear('created_at', $selectedYear)
                        ->whereMonth('created_at', $selectedMonthNum)
                        ->where('description', 'like', "%{$monthName}%")
                        ->first();
                    
                    if ($existing) {
                        $skippedCount++;
                        continue;
                    }
                    
                    if ($deduction['amount'] <= 0) {
                        $skippedCount++;
                        continue;
                    }
                    
                    Saving::create([
                        'user_id' => $deduction['user_id'],
                        'saving_type_id' => $deduction['saving_type_id'],
                        'amount' => $deduction['amount'],
                        'transaction_type' => 'deposit',
                        'description' => "Potongan payroll {$savingType->name} {$monthName}",
                        'transaction_date' => now(),
                        'created_by' => $user->id,
                        'verification_status' => 'verified',
                        'verified_at' => now(),
                        'verified_by' => $user->id
                    ]);
                    $processedCount++;
                }
            }
            
            if ($processLoanInstallments) {
                $activeLoans = Loan::where('status', 'active')
                    ->where('remaining_balance', '>', 0)
                    ->get();
                
                foreach ($activeLoans as $activeLoan) {
                    $member = User::find($activeLoan->user_id);
                    if (!$member || $member->status !== 'active') {
                        continue;
                    }
                    
                    $existingLoanPayment = LoanInstallment::where('loan_id', $activeLoan->id)
                        ->where('payment_method', 'potong_gaji')
                        ->whereYear('payment_date', $selectedYear)
                        ->whereMonth('payment_date', $selectedMonthNum)
                        ->first();
                    
                    if ($existingLoanPayment) {
                        continue;
                    }
                    
                    $installmentAmount = $activeLoan->monthly_installment;
                    $nextInstallmentNumber = $this->getNextInstallmentNumber($activeLoan->id);
                    
                    LoanInstallment::create([
                        'loan_id' => $activeLoan->id,
                        'installment_number' => $nextInstallmentNumber,
                        'amount_paid' => $installmentAmount,
                        'payment_date' => now(),
                        'payment_method' => 'potong_gaji',
                        'received_by' => $user->id,
                        'notes' => "Pembayaran angsuran ke-{$nextInstallmentNumber} melalui payroll {$monthName}"
                    ]);
                    
                    $newRemainingBalance = $activeLoan->remaining_balance - $installmentAmount;
                    
                    if ($newRemainingBalance <= 0) {
                        $activeLoan->status = 'completed';
                        $activeLoan->remaining_balance = 0;
                    } else {
                        $activeLoan->remaining_balance = $newRemainingBalance;
                    }
                    $activeLoan->save();
                    
                    $loanProcessedCount++;
                }
            }
            
            DB::commit();
            
            $message = "";
            if ($processedCount > 0) {
                $message .= "{$processedCount} potongan simpanan berhasil diproses";
            }
            if ($loanProcessedCount > 0) {
                if ($message) $message .= ", ";
                $message .= "{$loanProcessedCount} angsuran pinjaman dipotong";
            }
            if ($skippedCount > 0) {
                if ($message) $message .= ", ";
                $message .= "{$skippedCount} dilewati";
            }
            if (empty($message)) {
                $message = "Tidak ada data yang diproses";
            }
            $message .= " untuk periode {$monthName}";
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'processed_count' => $processedCount,
                    'skipped_count' => $skippedCount,
                    'loan_processed_count' => $loanProcessedCount,
                    'period' => $activePeriod
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Payroll process error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    public function exportPayrollHistory(Request $request)
    {
        try {
            $month = $request->query('month');
            $allTransactions = [];
            
            $savingQuery = Saving::with(['user', 'type', 'creator'])
                ->where('description', 'like', 'Potongan payroll%');
            
            if ($month) {
                $savingQuery->whereYear('created_at', substr($month, 0, 4))
                            ->whereMonth('created_at', substr($month, 5, 2));
            }
            
            $savingHistory = $savingQuery->orderBy('created_at', 'desc')->get();
            
            foreach ($savingHistory as $item) {
                $allTransactions[] = [
                    'date' => $item->created_at,
                    'type' => 'Simpanan ' . ($item->type ? $item->type->name : '-'),
                    'user_name' => $item->user ? $item->user->name : '-',
                    'user_nip' => $item->user ? ($item->user->nip ?? '-') : '-',
                    'user_unit' => $item->user ? ($item->user->unit ?? '-') : '-',
                    'amount' => $item->amount,
                    'creator' => $item->creator ? $item->creator->name : '-'
                ];
            }
            
            usort($allTransactions, function($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });
            
            $filename = 'riwayat_potongan_payroll_' . date('Y-m-d') . '.csv';
            if ($month) {
                $filename = 'riwayat_payroll_' . $month . '.csv';
            }
            
            $handle = fopen('php://temp', 'w+');
            if ($handle === false) {
                throw new \Exception('Cannot create temp file');
            }
            
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['No', 'Tanggal', 'Jenis Transaksi', 'Nama Anggota', 'NIP', 'Unit', 'Jumlah (Rp)', 'Dibuat Oleh']);
            
            $no = 1;
            foreach ($allTransactions as $item) {
                fputcsv($handle, [
                    $no,
                    date('d/m/Y H:i:s', strtotime($item['date'])),
                    $item['type'],
                    $item['user_name'],
                    $item['user_nip'],
                    $item['user_unit'],
                    number_format($item['amount'], 0, ',', '.'),
                    $item['creator']
                ]);
                $no++;
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            if ($csvContent === false) {
                throw new \Exception('Cannot read CSV content');
            }
            
            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'private, max-age=0, must-revalidate')
                ->header('Pragma', 'public');
            
        } catch (\Exception $e) {
            \Log::error('Export error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal export: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    // ==================== KANTIN INCOME METHODS ====================
    
    public function getKantinIncomes(Request $request)
    {
        try {
            $month = $request->query('month');
            
            if (!Schema::hasTable('kantin_incomes')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tabel kantin_incomes belum dibuat',
                    'data' => [],
                    'total' => 0,
                    'total_shu' => 0
                ]);
            }
            
            $query = KantinIncome::with('creator')
                ->orderBy('income_date', 'desc');
            
            if ($month) {
                $query->whereYear('income_date', substr($month, 0, 4))
                      ->whereMonth('income_date', substr($month, 5, 2));
            }
            
            $incomes = $query->get();
            $total = $incomes->sum('amount');
            $totalShu = $incomes->sum('shu_amount');
            
            return response()->json([
                'success' => true,
                'message' => 'Data pemasukan kantin berhasil diambil',
                'data' => $incomes,
                'total' => $total,
                'total_shu' => $totalShu
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Get Kantin Incomes error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [],
                'total' => 0,
                'total_shu' => 0
            ]);
        }
    }
    
    public function storeKantinIncome(Request $request)
    {
        try {
            $request->validate([
                'income_date' => 'required|date',
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:1',
                'shu_share_percentage' => 'nullable|numeric|min:0|max:100',
                'payment_method' => 'required|in:cash,transfer',
                'notes' => 'nullable|string'
            ]);
            
            $percentage = $request->shu_share_percentage ?? 30;
            $shuAmount = ($request->amount * $percentage) / 100;
            
            $income = KantinIncome::create([
                'income_date' => $request->income_date,
                'description' => $request->description,
                'amount' => $request->amount,
                'shu_share_percentage' => $percentage,
                'shu_amount' => $shuAmount,
                'payment_method' => $request->payment_method,
                'created_by' => $request->user()->id,
                'notes' => $request->notes
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Pemasukan kantin berhasil ditambahkan',
                'data' => $income->load('creator')
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Store Kantin Income error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
    
    public function updateKantinIncome($id, Request $request)
    {
        try {
            $income = KantinIncome::findOrFail($id);
            
            $request->validate([
                'income_date' => 'required|date',
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:1',
                'shu_share_percentage' => 'nullable|numeric|min:0|max:100',
                'payment_method' => 'required|in:cash,transfer',
                'notes' => 'nullable|string'
            ]);
            
            $percentage = $request->shu_share_percentage ?? 30;
            $shuAmount = ($request->amount * $percentage) / 100;
            
            $income->update([
                'income_date' => $request->income_date,
                'description' => $request->description,
                'amount' => $request->amount,
                'shu_share_percentage' => $percentage,
                'shu_amount' => $shuAmount,
                'payment_method' => $request->payment_method,
                'notes' => $request->notes
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Pemasukan kantin berhasil diupdate',
                'data' => $income->load('creator')
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Update Kantin Income error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
    
    public function deleteKantinIncome($id, Request $request)
    {
        try {
            $income = KantinIncome::findOrFail($id);
            $income->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Pemasukan kantin berhasil dihapus',
                'data' => null
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Delete Kantin Income error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    // ==================== SHU METHODS ====================
    
    public function calculateSHU(Request $request)
    {
        try {
            $year = $request->query('year', date('Y'));

            $totalBunga = 0;

            $installments = LoanInstallment::with('loan')
                ->whereYear('payment_date', $year)
                ->get();

            foreach ($installments as $installment) {
                $loan = $installment->loan;
                if ($loan) {
                    $monthlyInterest = ($loan->amount * $loan->interest_rate) / 100;
                    $totalBunga += $monthlyInterest;
                }
            }

            $kantinShu = 0;
            if (Schema::hasTable('kantin_incomes')) {
                $kantinShu = KantinIncome::whereYear('income_date', $year)->sum('shu_amount');
            }

            $biayaOperasional = $totalBunga * 0.20;
            $totalSHU = ($totalBunga - $biayaOperasional) + $kantinShu;

            if ($totalSHU < 0) $totalSHU = 0;

            $memberShareAmount = $totalSHU * 0.6;
            $reserveAmount = $totalSHU * 0.4;

            $existingSHU = null;
            if (Schema::hasTable('shu')) {
                $existingSHU = SHU::where('year', $year)->first();
            }

            return response()->json([
                'success' => true,
                'message' => 'Perhitungan SHU berhasil',
                'data' => [
                    'year' => $year,
                    'total_shu' => $totalSHU,
                    'interest_income' => $totalBunga,
                    'operational_cost' => $biayaOperasional,
                    'kantin_contribution' => $kantinShu,
                    'member_share_percentage' => 60,
                    'reserve_percentage' => 40,
                    'member_share_amount' => $memberShareAmount,
                    'reserve_amount' => $reserveAmount,
                    'is_processed' => !is_null($existingSHU)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Calculate SHU error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung SHU: ' . $e->getMessage(),
                'data' => [
                    'year' => date('Y'),
                    'total_shu' => 0,
                    'interest_income' => 0,
                    'operational_cost' => 0,
                    'kantin_contribution' => 0,
                    'member_share_percentage' => 60,
                    'reserve_percentage' => 40,
                    'member_share_amount' => 0,
                    'reserve_amount' => 0,
                    'is_processed' => false
                ]
            ], 200);
        }
    }
    
    public function processSHU(Request $request)
    {
        try {
            $user = $request->user();

            $request->validate([
                'year' => 'required|integer',
                'total_shu' => 'required|numeric|min:0',
                'member_share_percentage' => 'required|numeric|between:0,100',
                'reserve_percentage' => 'required|numeric|between:0,100',
                'notes' => 'nullable|string'
            ]);

            $year = $request->year;
            $totalSHU = $request->total_shu;
            $memberPercentage = $request->member_share_percentage;
            $reservePercentage = $request->reserve_percentage;

            if (Schema::hasTable('shu')) {
                $existing = SHU::where('year', $year)->first();
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'SHU tahun ' . $year . ' sudah pernah diproses',
                        'data' => null
                    ], 400);
                }
            }

            $memberShareAmount = ($totalSHU * $memberPercentage) / 100;
            $reserveAmount = ($totalSHU * $reservePercentage) / 100;

            if (Schema::hasTable('shu')) {
                SHU::create([
                    'year' => $year,
                    'total_shu' => $totalSHU,
                    'member_share_percentage' => $memberPercentage,
                    'member_share_amount' => $memberShareAmount,
                    'reserve_percentage' => $reservePercentage,
                    'reserve_amount' => $reserveAmount,
                    'kantin_contribution' => $request->kantin_contribution ?? 0,
                    'interest_income' => $request->interest_income ?? 0,
                    'operational_cost' => $request->operational_cost ?? 0,
                    'processed_by' => $user->id,
                    'processed_at' => now(),
                    'notes' => $request->notes
                ]);
            }

            $members = User::where('role_id', 5)->where('status', 'active')->get();
            $totalSavings = 0;
            $memberSavings = [];

            foreach ($members as $member) {
                $savingBalance = $this->getBalance($member->id);
                $totalSavings += $savingBalance;
                $memberSavings[$member->id] = $savingBalance;
            }

            $sukarelaType = SavingType::where('name', 'Sukarela')->first();
            $distributedCount = 0;

            DB::beginTransaction();

            foreach ($members as $member) {
                $memberSaving = $memberSavings[$member->id] ?? 0;
                $memberSHU = 0;

                if ($totalSavings > 0 && $memberShareAmount > 0) {
                    $memberSHU = ($memberSaving / $totalSavings) * $memberShareAmount;
                }

                if ($memberSHU > 0.01) {
                    Saving::create([
                        'user_id' => $member->id,
                        'saving_type_id' => $sukarelaType->id,
                        'amount' => round($memberSHU, 2),
                        'transaction_type' => 'deposit',
                        'description' => "Pembagian SHU tahun buku {$year}",
                        'transaction_date' => now(),
                        'created_by' => $user->id,
                        'verification_status' => 'verified',
                        'verified_at' => now(),
                        'verified_by' => $user->id
                    ]);
                    $distributedCount++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "SHU tahun {$year} sebesar Rp " . number_format($totalSHU, 0, ',', '.') . " berhasil didistribusikan kepada {$distributedCount} anggota",
                'data' => [
                    'year' => $year,
                    'total_shu' => $totalSHU,
                    'distributed_to' => $distributedCount
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Process SHU error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses SHU: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
    
    public function getSHUHistory(Request $request)
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
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    // ==================== FINANCIAL MANAGEMENT METHODS ====================

    public function getFinancialSummary(Request $request)
    {
        try {
            $totalSavings = Saving::where('verification_status', 'verified')
                ->where('transaction_type', 'deposit')
                ->sum('amount');

            $totalWithdrawals = Saving::where('transaction_type', 'withdrawal')
                ->sum('amount');

            $totalSavingsBalance = $totalSavings - $totalWithdrawals;

            $activeLoans = Loan::where('status', 'active')->get();
            $totalActiveLoans = $activeLoans->sum('remaining_balance');
            $totalLoanAmount = Loan::whereIn('status', ['active', 'approved'])->sum('amount');
            $totalInstallments = LoanInstallment::sum('amount_paid');

            $totalBunga = 0;
            $installments = LoanInstallment::with('loan')->get();
            foreach ($installments as $installment) {
                $loan = $installment->loan;
                if ($loan) {
                    $monthlyInterest = ($loan->amount * $loan->interest_rate) / 100;
                    $totalBunga += $monthlyInterest;
                }
            }

            $biayaOperasional = $totalBunga * 0.20;

            $currentMonth = now()->format('Y-m');
            $kantinTotal = 0;
            $kantinTotalShu = 0;

            if (Schema::hasTable('kantin_incomes')) {
                $kantinTotal = KantinIncome::whereYear('income_date', substr($currentMonth, 0, 4))
                    ->whereMonth('income_date', substr($currentMonth, 5, 2))
                    ->sum('amount');
                $kantinTotalShu = KantinIncome::whereYear('income_date', substr($currentMonth, 0, 4))
                    ->whereMonth('income_date', substr($currentMonth, 5, 2))
                    ->sum('shu_amount');
            }

            $totalSHU = ($totalBunga - $biayaOperasional) + $kantinTotalShu;
            if ($totalSHU < 0) $totalSHU = 0;

            return response()->json([
                'success' => true,
                'message' => 'Data keuangan berhasil diambil',
                'data' => [
                    'total_cash' => $totalSavingsBalance - $totalActiveLoans,
                    'total_savings' => $totalSavingsBalance,
                    'total_loans' => $totalActiveLoans,
                    'total_loan_amount' => $totalLoanAmount,
                    'total_installments' => $totalInstallments,
                    'total_shu' => $totalSHU,
                    'active_loans_count' => $activeLoans->count(),
                    'total_members' => User::where('role_id', 5)->count(),
                    'total_interest_income' => $totalBunga,
                    'operational_cost' => $biayaOperasional,
                    'kantin_income' => $kantinTotal,
                    'kantin_shu' => $kantinTotalShu
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Financial summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [
                    'total_cash' => 0,
                    'total_savings' => 0,
                    'total_loans' => 0,
                    'total_loan_amount' => 0,
                    'total_installments' => 0,
                    'total_shu' => 0,
                    'active_loans_count' => 0,
                    'total_members' => 0,
                    'total_interest_income' => 0,
                    'operational_cost' => 0,
                    'kantin_income' => 0,
                    'kantin_shu' => 0
                ]
            ]);
        }
    }

    // ==================== TRANSACTION HISTORY (FIXED) ====================

    /**
     * Get transaction history for the authenticated user
     * Includes: savings, loan installments, and loan applications
     */
    public function getTransactionHistory(Request $request)
    {
        try {
            $user = $request->user();
            $type = $request->query('type', 'all');
            $month = $request->query('month');
            
            $transactions = [];
    
            // =============================================
            // 1. GET DATA FROM SAVINGS TABLE (Simpanan)
            // =============================================
            $savingsQuery = Saving::with(['type', 'user'])
                ->where('user_id', $user->id);
            
            if ($month && $month !== 'all') {
                $year = substr($month, 0, 4);
                $monthNum = substr($month, 5, 2);
                $savingsQuery->whereYear('transaction_date', $year)
                            ->whereMonth('transaction_date', $monthNum);
            }
            
            $savings = $savingsQuery->orderBy('transaction_date', 'desc')->get();
            
            foreach ($savings as $saving) {
                $isWithdrawal = $saving->transaction_type === 'withdrawal';
                $typeName = $saving->type ? $saving->type->name : 'Simpanan';
                $isPayroll = ($typeName === 'Wajib' && strpos($saving->description ?? '', 'gaji') !== false);
                
                // Filter by type
                if ($type !== 'all') {
                    if ($type === 'withdrawal' && !$isWithdrawal) continue;
                    if ($type === 'saving' && ($isPayroll || $isWithdrawal)) continue;
                    if ($type === 'payroll' && !$isPayroll) continue;
                    if ($type === 'loan_installment' || $type === 'loan') continue;
                }
                
                $transactions[] = [
                    'id' => 'saving_' . $saving->id,
                    'original_id' => $saving->id,
                    'type' => $isWithdrawal ? 'withdrawal' : ($isPayroll ? 'payroll' : 'saving'),
                    'category' => $typeName,
                    'title' => $isWithdrawal ? 'Penarikan Sukarela' : ($isPayroll ? 'Potongan Payroll (Wajib)' : 'Setoran Sukarela'),
                    'description' => $saving->description ?? ($isWithdrawal ? 'Penarikan simpanan sukarela' : 'Setoran simpanan'),
                    'amount' => (float) $saving->amount,
                    'date' => $saving->transaction_date,
                    'user' => $saving->user ? $saving->user->name : 'System',
                    'status' => $saving->verification_status === 'verified' ? 'success' : 'pending',
                    'is_income' => !$isWithdrawal && !$isPayroll,
                    'transaction_type' => $saving->transaction_type,
                    'verification_status' => $saving->verification_status
                ];
            }
            
            // =============================================
            // 2. GET DATA FROM LOAN INSTALLMENTS TABLE (Angsuran Pinjaman)
            // =============================================
            $installmentsQuery = LoanInstallment::with(['loan.user'])
                ->whereHas('loan', function($q) use ($user) {
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
                $amount = (float) $installment->amount_paid;
                $paymentMethod = $installment->payment_method === 'potong_gaji' ? 'Potong Gaji' : ($installment->payment_method === 'transfer' ? 'Transfer' : 'Tunai');
                
                // Filter by type
                if ($type !== 'all' && $type !== 'loan_installment') continue;
                
                $transactions[] = [
                    'id' => 'installment_' . $installment->id,
                    'original_id' => $installment->id,
                    'type' => 'loan_installment',
                    'category' => 'Pinjaman',
                    'title' => 'Angsuran Pinjaman',
                    'description' => "Pembayaran angsuran ke-{$installment->installment_number} via {$paymentMethod}",
                    'amount' => $amount,
                    'date' => $installment->payment_date,
                    'user' => $installment->loan && $installment->loan->user ? $installment->loan->user->name : 'System',
                    'status' => 'success',
                    'is_income' => false,
                    'transaction_type' => 'installment',
                    'verification_status' => 'verified',
                    'payment_method' => $installment->payment_method,
                    'installment_number' => $installment->installment_number
                ];
            }
            
            // =============================================
            // 3. GET DATA FROM LOANS TABLE (Pengajuan Pinjaman)
            // =============================================
            $loansQuery = Loan::with(['user'])
                ->where('user_id', $user->id);
            
            if ($month && $month !== 'all') {
                $year = substr($month, 0, 4);
                $monthNum = substr($month, 5, 2);
                $loansQuery->whereYear('created_at', $year)
                           ->whereMonth('created_at', $monthNum);
            }
            
            $loans = $loansQuery->orderBy('created_at', 'desc')->get();
            
            foreach ($loans as $loan) {
                // Filter by type
                if ($type !== 'all' && $type !== 'loan') continue;
                
                $statusText = '';
                $statusColor = '';
                switch($loan->status) {
                    case 'pending': 
                        $statusText = 'Menunggu Verifikasi'; 
                        break;
                    case 'approved': 
                        $statusText = 'Disetujui'; 
                        break;
                    case 'active': 
                        $statusText = 'Aktif'; 
                        break;
                    case 'rejected': 
                        $statusText = 'Ditolak'; 
                        break;
                    case 'completed': 
                        $statusText = 'Lunas'; 
                        break;
                    default: 
                        $statusText = $loan->status;
                }
                    
                $transactions[] = [
                    'id' => 'loan_' . $loan->id,
                    'original_id' => $loan->id,
                    'type' => 'loan',
                    'category' => 'Pinjaman',
                    'title' => 'Pengajuan Pinjaman',
                    'description' => "Pengajuan pinjaman Rp " . number_format($loan->amount, 0, ',', '.') . " - {$statusText}",
                    'amount' => (float) $loan->amount,
                    'date' => $loan->created_at,
                    'user' => $loan->user ? $loan->user->name : 'System',
                    'status' => $loan->status,
                    'is_income' => false,
                    'transaction_type' => 'loan',
                    'verification_status' => $loan->status === 'active' ? 'verified' : 'pending'
                ];
            }
                    
            // Sort by date (newest first)
            usort($transactions, function($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });
                    
            return response()->json([
                'success' => true,
                'message' => 'Riwayat transaksi berhasil diambil',
                'data' => $transactions,
                'debug' => [
                    'savings_count' => $savings->count(),
                    'installments_count' => $installments->count(),
                    'loans_count' => $loans->count(),
                    'total' => count($transactions)
                ]
            ]);
                    
        } catch (\Exception $e) {
            \Log::error('Transaction history error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil riwayat transaksi: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    // ==================== EXPORT METHODS ====================

    public function exportTransactionHistory(Request $request)
    {
        try {
            $user = $request->user();
            $month = $request->get('month', date('Y-m'));
            $type = $request->get('type', 'all');
            
            // Get transactions data
            $transactions = $this->getTransactionsData($user, $type, $month);
            
            if (empty($transactions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada data transaksi untuk periode yang dipilih'
                ], 404);
            }
            
            // Generate filename
            $monthNames = [
                '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
                '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
                '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'
            ];
            $monthNum = date('m', strtotime($month . '-01'));
            $monthName = $monthNames[$monthNum] ?? $monthNum;
            $year = date('Y', strtotime($month . '-01'));
            
            $fileName = "riwayat_transaksi_" . str_replace(' ', '_', $user->name) . "_" . $monthName . "_" . $year . ".xlsx";
            
            // Export to Excel (create simple CSV if Excel not available)
            $handle = fopen('php://temp', 'w+');
            fwrite($handle, "\xEF\xBB\xBF");
            
            // Headers
            fputcsv($handle, ['NO', 'TANGGAL', 'JENIS TRANSAKSI', 'KATEGORI', 'DESKRIPSI', 'JUMLAH (Rp)', 'STATUS']);
            
            $no = 1;
            foreach ($transactions as $trx) {
                $jumlah = $trx['amount'];
                if (in_array($trx['type'], ['loan_installment', 'withdrawal'])) {
                    $jumlah = -$trx['amount'];
                }
                
                fputcsv($handle, [
                    $no++,
                    date('d/m/Y', strtotime($trx['date'])),
                    $this->getTransactionTypeName($trx['type']),
                    $trx['category'] ?? '-',
                    $trx['description'] ?? '-',
                    number_format($jumlah, 0, ',', '.'),
                    $trx['verification_status'] === 'verified' ? 'BERHASIL' : 'PENDING'
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . str_replace('.xlsx', '.csv', $fileName) . '"');
            
        } catch (\Exception $e) {
            \Log::error('Export error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function getTransactionTypeName($type)
    {
        switch($type) {
            case 'saving': return 'SETORAN SUKARELA';
            case 'withdrawal': return 'PENARIKAN SUKARELA';
            case 'payroll': return 'POTONGAN PAYROLL';
            case 'loan_installment': return 'ANGSURAN PINJAMAN';
            default: return 'TRANSAKSI LAINNYA';
        }
    }
    
    private function getTransactionsData($user, $type, $month)
    {
        $transactions = [];

        // Get savings data
        $savingsQuery = Saving::with(['type', 'user'])
            ->where('user_id', $user->id)
            ->where(function($q) {
                $q->where('transaction_type', 'withdrawal')
                  ->orWhere('verification_status', 'verified');
            });

        if ($month) {
            $savingsQuery->whereYear('transaction_date', substr($month, 0, 4))
                        ->whereMonth('transaction_date', substr($month, 5, 2));
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
                'user' => $saving->user ? $saving->user->name : 'System',
                'verification_status' => $saving->verification_status
            ];
        }

        // Sort by date
        usort($transactions, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return $transactions;
    }

    // ==================== PAYROLL DEDUCTION METHODS ====================

    /**
     * Get members with their savings and loan data for payroll deduction
     */
    public function getPayrollMembers(Request $request)
    {
        try {
            $month = $request->query('month', now()->format('Y-m'));
            [$year, $monthNum] = explode('-', $month);
                        
            // Get all active members (role_id = 5 = Anggota)
            $members = User::where('role_id', 5)
                ->where('status', 'active')
                ->get();
                        
            // Get saving types
            $savingTypes = SavingType::all();
                        
            // Get existing deductions for this month
            $existingDeductions = Saving::where('transaction_type', 'deposit')
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $monthNum)
                ->whereNotNull('created_by')
                ->where('description', 'like', '%gaji%')
                ->get()
                ->groupBy('user_id');
                        
            // Get existing loan installments for this month
            $existingLoanDeductions = LoanInstallment::where('payment_method', 'potong_gaji')
                ->whereYear('payment_date', $year)
                ->whereMonth('payment_date', $monthNum)
                ->get()
                ->groupBy('loan.user_id');
                        
            $result = [];
                        
            foreach ($members as $member) {
                // Check if member already processed this month
                $alreadyProcessed = $existingDeductions->has($member->id);
                        
                // Get member's savings data
                $memberSavings = [];
                foreach ($savingTypes as $type) {
                    $balance = $this->getBalance($member->id, $type->id);
                    $defaultAmount = $this->getDefaultSavingsAmount($member, $type);
                    $isProcessed = false;
                        
                    if ($alreadyProcessed && $existingDeductions->has($member->id)) {
                        $isProcessed = $existingDeductions[$member->id]->contains(function($s) use ($type) {
                            return $s->saving_type_id == $type->id;
                        });
                    }
                        
                    $memberSavings[] = [
                        'type_id' => $type->id,
                        'type_name' => $type->name,
                        'default_amount' => $defaultAmount,
                        'current_balance' => $balance,
                        'is_processed' => $isProcessed
                    ];
                }
                        
                // Check for active loan
                $activeLoan = Loan::where('user_id', $member->id)
                    ->where('status', 'active')
                    ->first();
                        
                $hasActiveLoan = !is_null($activeLoan);
                $loanInstallment = 0;
                $loanRemaining = 0;
                $loanAlreadyProcessed = false;
                        
                if ($hasActiveLoan) {
                    $loanInstallment = $activeLoan->installment_amount;
                    $loanRemaining = $activeLoan->remaining_balance;
                    $loanAlreadyProcessed = $existingLoanDeductions->has($member->id);
                }
                        
                // Check if member is old member (Pokok saving is considered "paid" if balance >= 100000)
                $pokokSaving = SavingType::where('name', 'Pokok')->first();
                $pokokBalance = $pokokSaving ? $this->getBalance($member->id, $pokokSaving->id) : 0;
                $isOldMember = $pokokBalance >= 100000;
                        
                $result[] = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'nip' => $member->nip ?? '-',
                    'unit' => $member->unit ?? '-',
                    'is_old_member' => $isOldMember,
                    'already_processed' => $alreadyProcessed,
                    'has_active_loan' => $hasActiveLoan,
                    'loan_installment' => $loanInstallment,
                    'loan_remaining' => $loanRemaining,
                    'loan_already_processed' => $loanAlreadyProcessed,
                    'savings' => $memberSavings
                ];
            }
                        
            return response()->json([
                'success' => true,
                'message' => 'Data anggota berhasil diambil',
                'data' => $result
            ]);
                        
        } catch (\Exception $e) {
            \Log::error('Get payroll members error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data anggota: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get default saving amount based on member type and saving type
     */
    private function getDefaultSavingsAmount($member, $savingType)
    {
        // Default amounts configuration
        $defaults = [
            'Pokok' => 100000,
            'Wajib' => 50000,
            'Sukarela' => 0
        ];
                        
        $amount = $defaults[$savingType->name] ?? 0;
                        
        // Old members (pokok sudah lunas) don't need to pay Pokok
        if ($savingType->name === 'Pokok') {
            $pokokBalance = $this->getBalance($member->id, $savingType->id);
            if ($pokokBalance >= 100000) {
                return 0; // Already paid
            }
        }
                        
        return $amount;
    }

    /**
     * Process payroll deductions
     */
    public function processPayroll(Request $request)
    {
        try {
            $request->validate([
                'month' => 'required|date_format:Y-m',
                'deductions' => 'required|array',
                'deductions.*.user_id' => 'required|exists:users,id',
                'deductions.*.saving_type_id' => 'required|exists:saving_types,id',
                'deductions.*.amount' => 'required|numeric|min:0',
                'process_loan_installments' => 'boolean'
            ]);
                        
            $user = $request->user();
                        
            // Check permission - hanya bendahara atau admin
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya bendahara atau admin yang dapat memproses payroll.',
                    'data' => null
                ], 403);
            }
                        
            DB::beginTransaction();
                        
            $month = $request->month;
            $transactionDate = $month . '-25'; // Use 25th of the month
            $processLoan = $request->process_loan_installments ?? true;
                        
            $processedSavings = 0;
            $processedLoans = 0;
            $totalAmount = 0;
                        
            // Process savings deductions
            foreach ($request->deductions as $deduction) {
                // Check if already processed for this month
                $exists = Saving::where('user_id', $deduction['user_id'])
                    ->where('saving_type_id', $deduction['saving_type_id'])
                    ->whereYear('transaction_date', substr($month, 0, 4))
                    ->whereMonth('transaction_date', substr($month, 5, 2))
                    ->where('description', 'like', '%Potongan Gaji%')
                    ->exists();
                        
                if (!$exists && $deduction['amount'] > 0) {
                    Saving::create([
                        'user_id' => $deduction['user_id'],
                        'saving_type_id' => $deduction['saving_type_id'],
                        'amount' => $deduction['amount'],
                        'transaction_type' => 'deposit',
                        'description' => "Potongan Gaji Bulan " . date('F Y', strtotime($month . '-01')),
                        'transaction_date' => $transactionDate,
                        'created_by' => $user->id,
                        'verification_status' => 'verified',
                        'verified_at' => now(),
                        'verified_by' => $user->id
                    ]);
                    $processedSavings++;
                    $totalAmount += $deduction['amount'];
                }
            }
                        
            // Process loan installments if enabled
            if ($processLoan) {
                $membersWithLoan = User::where('role_id', 5)
                    ->whereHas('loans', function($q) {
                        $q->where('status', 'active');
                    })
                    ->get();
                        
                foreach ($membersWithLoan as $member) {
                    $activeLoan = Loan::where('user_id', $member->id)
                        ->where('status', 'active')
                        ->first();
                        
                    if ($activeLoan) {
                        // Check if already processed this month
                        $exists = LoanInstallment::where('loan_id', $activeLoan->id)
                            ->whereYear('payment_date', substr($month, 0, 4))
                            ->whereMonth('payment_date', substr($month, 5, 2))
                            ->exists();
                        
                        if (!$exists) {
                            $installmentNumber = $this->getNextInstallmentNumber($activeLoan->id);
                            $newRemainingBalance = $activeLoan->remaining_balance - $activeLoan->installment_amount;

                            LoanInstallment::create([
                                'loan_id' => $activeLoan->id,
                                'installment_number' => $installmentNumber,
                                'amount_paid' => $activeLoan->installment_amount,
                                'payment_method' => 'potong_gaji',
                                'payment_date' => $transactionDate,
                                'notes' => "Potongan Gaji Bulan " . date('F Y', strtotime($month . '-01')),
                                'verified_by' => $user->id
                            ]);

                            $activeLoan->update([
                                'remaining_balance' => max(0, $newRemainingBalance),
                                'status' => $newRemainingBalance <= 0 ? 'completed' : 'active'
                            ]);

                            $processedLoans++;
                        }
                    }
                }
            }
                        
            DB::commit();
                        
            return response()->json([
                'success' => true,
                'message' => "Berhasil memproses {$processedSavings} potongan simpanan dan {$processedLoans} angsuran pinjaman. Total: Rp " . number_format($totalAmount, 0, ',', '.'),
                'data' => [
                    'processed_savings' => $processedSavings,
                    'processed_loans' => $processedLoans,
                    'total_amount' => $totalAmount
                ]
            ]);
                        
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Process payroll error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses payroll: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get payroll history
     */

    /**
     * Export payroll data for bank format
     */
    public function exportPayroll(Request $request)
    {
        try {
            $month = $request->query('month', date('Y-m'));
            [$year, $monthNum] = explode('-', $month);
                        
            // Get members with their deduction amounts
            $members = User::where('role_id', 5)
                ->where('status', 'active')
                ->get();
                        
            $pokokType = SavingType::where('name', 'Pokok')->first();
            $wajibType = SavingType::where('name', 'Wajib')->first();
                        
            $deductions = [];
            $totalAll = 0;
                        
            foreach ($members as $member) {
                $pokokAmount = 0;
                $wajibAmount = 0;
                        
                if ($pokokType) {
                    $pokokBalance = $this->getBalance($member->id, $pokokType->id);
                    if ($pokokBalance < 100000) {
                        $pokokAmount = 100000;
                    }
                }
                        
                if ($wajibType) {
                    $wajibAmount = 50000;
                }
                        
                // Check for active loan
                $activeLoan = Loan::where('user_id', $member->id)
                    ->where('status', 'active')
                    ->first();
                        
                $loanAmount = $activeLoan ? $activeLoan->installment_amount : 0;
                        
                $total = $pokokAmount + $wajibAmount + $loanAmount;
                        
                if ($total > 0) {
                    $deductions[] = [
                        'name' => $member->name,
                        'nip' => $member->nip ?? '-',
                        'unit' => $member->unit ?? '-',
                        'pokok' => $pokokAmount,
                        'wajib' => $wajibAmount,
                        'loan' => $loanAmount,
                        'total' => $total
                    ];
                    $totalAll += $total;
                }
            }
                        
            // Generate CSV for bank format
            $csvRows = [];
            $csvRows[] = ['REKENINGKREDIT', 'NAMA REKENING', 'REMARKS', 'JUMLAH AMOUNT', 'JUMLAH CHARGE', 'JUMLAH RECORD', 'TANGGAL', 'CABANG', 'CORPORATE/CUSTOMER', 'CORPORATE CHARGE'];
            $csvRows[] = [
                '9203902930293',
                'REKENING PENAMPUNGAN',
                'POT INSTANSI',
                $totalAll,
                '0',
                count($deductions),
                '',
                '0020',
                '',
                ''
            ];
            $csvRows[] = [];
            $csvRows[] = ['REKENINGDEBET', 'NAMA REKENING', 'REMARKS', 'AMOUNT', 'CHARGE', '', '', '', '', ''];
                        
            $transactionDate = str_replace('-', '', $month) . '25';
                        
            foreach ($deductions as $item) {
                $csvRows[] = [
                    '182032093029',
                    $item['name'],
                    'POTONGAN BULANAN',
                    $item['total'],
                    '1000',
                    '1',
                    $transactionDate,
                    '0020',
                    '',
                    ''
                ];
            }
                        
            $filename = "payroll_{$month}.csv";
                        
            $handle = fopen('php://temp', 'w+');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
                        
            foreach ($csvRows as $row) {
                fputcsv($handle, $row);
            }
                        
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
                        
            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
                        
        } catch (\Exception $e) {
            \Log::error('Export payroll error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ], 500);
        }
    }
}