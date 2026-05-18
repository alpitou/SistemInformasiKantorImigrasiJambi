<?php
// app/Http/Controllers/Api/SavingController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\SavingType;
use App\Models\User;
use App\Models\Loan;
use App\Models\LoanInstallment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SavingController extends Controller
{
    /**
     * Get balance for a specific user and saving type
     */
    private function getBalance($userId, $savingTypeId = null)
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
            DB::raw("
                COALESCE(SUM(
                    CASE
                        WHEN transaction_type = 'deposit' THEN amount
                        ELSE -amount
                    END
                ), 0) as total
            ")
        )->value('total');

        return max(0, (float) $balance);
    }

    /**
     * Get next installment number for loan
     */
    private function getNextInstallmentNumber($loanId)
    {
        $lastInstallment = LoanInstallment::where('loan_id', $loanId)
            ->orderBy('installment_number', 'desc')
            ->first();

        return $lastInstallment ? $lastInstallment->installment_number + 1 : 1;
    }

    /**
     * Get active payroll period
     */
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

    /**
     * Check if payroll period is active
     */
    private function isPayrollPeriodActive()
    {
        $today = now();
        $day = (int) $today->format('d');
        return $day >= 25 || $day <= 5;
    }

    // ==================== SAVINGS CRUD ====================

    /**
     * Display a listing of savings
     */
    public function index(Request $request)
    {
        try {
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
                'message' => 'Data simpanan berhasil diambil',
                'data' => $savings
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching savings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data simpanan: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Store a newly created saving
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'saving_type_id' => 'required|exists:saving_types,id',
                'amount' => 'required|numeric|min:1',
                'transaction_type' => 'required|in:deposit,withdrawal',
                'description' => 'nullable|string',
                'transaction_date' => 'required|date',
                'proof_image' => 'nullable|string'
            ]);

            // Check balance for withdrawal
            if ($request->transaction_type === 'withdrawal') {
                $balance = $this->getBalance($request->user_id, $request->saving_type_id);

                if ($request->amount > $balance) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Saldo tidak mencukupi. Saldo tersedia: Rp ' . number_format($balance, 0, ',', '.'),
                        'data' => null
                    ], 400);
                }
            }

            DB::beginTransaction();

            $verificationStatus = 'verified';
            $savingType = SavingType::find($request->saving_type_id);

            // Set verification status based on saving type
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
            Log::error('Error creating saving: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses transaksi: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Display the specified saving
     */
    public function show($id, Request $request)
    {
        try {
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

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan',
                'data' => null
            ], 404);
        }
    }

    /**
     * Get user savings
     */
    public function getUserSavings($userId, Request $request)
    {
        try {
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

        } catch (\Exception $e) {
            Log::error('Error fetching user savings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data simpanan: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get savings summary for a user
     */
    public function getSummary($userId, Request $request)
    {
        try {
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

        } catch (\Exception $e) {
            Log::error('Error getting savings summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ringkasan: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Upload proof image for saving
     */
    public function uploadProof(Request $request)
    {
        try {
            $request->validate([
                'proof_image' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120'
            ]);

            $file = $request->file('proof_image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('savings-proofs', $filename, 'public');

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer berhasil diupload',
                'data' => ['path' => Storage::url($path)]
            ]);

        } catch (\Exception $e) {
            Log::error('Error uploading proof: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Verify deposit
     */
    public function verifyDeposit($id, Request $request)
    {
        try {
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
                'data' => $saving->load(['user', 'type', 'verifier'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error verifying deposit: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memverifikasi: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Download savings report
     */
    public function downloadReport(Request $request)
    {
        try {
            $userId = $request->query('user_id');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');

            $query = Saving::with(['user', 'type']);

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($startDate) {
                $query->whereDate('transaction_date', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('transaction_date', '<=', $endDate);
            }

            $savings = $query->orderBy('transaction_date', 'desc')->get();

            $fileName = 'laporan_simpanan_' . date('Y-m-d') . '.csv';

            $handle = fopen('php://temp', 'w+');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['NO', 'TANGGAL', 'NAMA ANGGOTA', 'JENIS', 'TIPE TRANSAKSI', 'JUMLAH (Rp)', 'STATUS', 'DIVERIFIKASI OLEH']);

            $no = 1;
            foreach ($savings as $saving) {
                fputcsv($handle, [
                    $no++,
                    date('d/m/Y', strtotime($saving->transaction_date)),
                    $saving->user->name ?? '-',
                    $saving->type->name ?? '-',
                    $saving->transaction_type === 'deposit' ? 'SETORAN' : 'PENARIKAN',
                    number_format($saving->amount, 0, ',', '.'),
                    $saving->verification_status === 'verified' ? 'TERVERIFIKASI' : 'MENUNGGU',
                    $saving->verifier->name ?? '-'
                ]);
            }

            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);

            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            Log::error('Error downloading report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendownload laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== PAYROLL METHODS ====================

    /**
     * Check if payroll period is active
     */
    public function checkPayrollPeriod(Request $request)
    {
        try {
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

        } catch (\Exception $e) {
            Log::error('Error checking payroll period: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengecek periode payroll: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get members for payroll
     */
    public function getPayrollMembers(Request $request)
    {
        try {
            $month = $request->query('month', now()->format('Y-m'));
            list($year, $monthNum) = explode('-', $month);

            $members = User::where('role_id', 5)->where('status', 'active')->get();
            $savingTypes = SavingType::all();

            $existingDeductions = Saving::where('transaction_type', 'deposit')
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $monthNum)
                ->where('description', 'like', '%Potongan Gaji%')
                ->get()
                ->groupBy('user_id');

            $existingLoanDeductions = LoanInstallment::where('payment_method', 'potong_gaji')
                ->whereYear('payment_date', $year)
                ->whereMonth('payment_date', $monthNum)
                ->get()
                ->groupBy('loan.user_id');

            $result = [];

            foreach ($members as $member) {
                $alreadyProcessed = $existingDeductions->has($member->id);
                $memberSavings = [];

                foreach ($savingTypes as $type) {
                    $balance = Saving::select(
                        'user_id',
                        'saving_type_id',
                        DB::raw("
            COALESCE(SUM(
                CASE
                    WHEN transaction_type = 'deposit' THEN amount
                    ELSE -amount
                END
            ),0) as balance
        ")
                    )
                        ->where(function ($q) {
                            $q->where('verification_status', 'verified')
                                ->orWhere('transaction_type', 'withdrawal');
                        })
                        ->groupBy('user_id', 'saving_type_id')
                        ->get()
                        ->groupBy('user_id');
                    $isProcessed = false;

                    if ($alreadyProcessed && $existingDeductions->has($member->id)) {
                        $isProcessed = $existingDeductions[$member->id]->contains(function ($s) use ($type) {
                            return $s->saving_type_id == $type->id;
                        });
                    }

                    $isApplicable = true;
                    $defaultAmount = $type->default_amount ?? 0;

                    if ($type->name === 'Pokok') {
                        $pokokPaidAmount = $this->getBalance($member->id, $type->id);
                        $isApplicable = $pokokPaidAmount < ($type->default_amount ?? 100000);
                        $defaultAmount = $isApplicable ? min($type->default_amount ?? 100000, ($type->default_amount ?? 100000) - $pokokPaidAmount) : 0;
                    }

                    if ($type->name === 'Sukarela') {
                        $isApplicable = false;
                        $defaultAmount = 0;
                    }

                    $memberSavings[] = [
                        'type_id' => $type->id,
                        'type_name' => $type->name,
                        'default_amount' => $defaultAmount,
                        'current_balance' => $balance,
                        'is_processed' => $isProcessed,
                        'is_applicable' => $isApplicable
                    ];
                }

                $activeLoan = Loan::where('user_id', $member->id)
                    ->where('status', 'active')
                    ->where('remaining_balance', '>', 0)
                    ->first();

                $hasActiveLoan = !is_null($activeLoan);
                $loanInstallment = $hasActiveLoan ? $activeLoan->monthly_installment : 0;
                $loanRemaining = $hasActiveLoan ? $activeLoan->remaining_balance : 0;
                $loanAlreadyProcessed = $hasActiveLoan && $existingLoanDeductions->has($member->id);

                $result[] = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'nip' => $member->nip ?? '-',
                    'nik' => $member->nik ?? '-',
                    'unit' => $member->unit ?? '-',
                    'join_date' => $member->join_date,
                    'already_processed_savings' => $alreadyProcessed,
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
            Log::error('Get payroll members error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data anggota: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get payroll history
     */
    public function getPayrollHistory(Request $request)
    {
        try {
            $history = [];

            $savingHistory = Saving::with(['user', 'type', 'creator'])
                ->where('description', 'like', 'Potongan Gaji%')
                ->orWhere('description', 'like', 'Potongan payroll%')
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
                    'saving_type' => $item->type ? $item->type->name : '-',
                    'amount' => (float) $item->amount,
                    'date' => $item->created_at,
                    'creator' => $item->creator ? $item->creator->name : null
                ];
            }

            krsort($history);

            return response()->json([
                'success' => true,
                'message' => 'Riwayat potongan payroll berhasil diambil',
                'data' => $history
            ]);

        } catch (\Exception $e) {
            Log::error('Payroll history error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'message' => 'Riwayat potongan payroll',
                'data' => []
            ]);
        }
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

            // Check permission
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya bendahara atau admin yang dapat memproses payroll.',
                    'data' => null
                ], 403);
            }

            DB::beginTransaction();

            $month = $request->month;
            $transactionDate = $month . '-25';
            $processLoan = $request->process_loan_installments ?? true;

            $processedSavings = 0;
            $processedLoans = 0;
            $totalAmount = 0;
            $monthName = date('F Y', strtotime($month . '-01'));

            // Process savings deductions
            foreach ($request->deductions as $deduction) {
                if ($deduction['amount'] <= 0) {
                    continue;
                }

                $exists = Saving::where('user_id', $deduction['user_id'])
                    ->where('saving_type_id', $deduction['saving_type_id'])
                    ->whereYear('transaction_date', substr($month, 0, 4))
                    ->whereMonth('transaction_date', substr($month, 5, 2))
                    ->where('description', 'like', '%Potongan Gaji%')
                    ->exists();

                if (!$exists) {
                    $savingType = SavingType::find($deduction['saving_type_id']);

                    Saving::create([
                        'user_id' => $deduction['user_id'],
                        'saving_type_id' => $deduction['saving_type_id'],
                        'amount' => $deduction['amount'],
                        'transaction_type' => 'deposit',
                        'description' => "Potongan Gaji Bulan {$monthName} - {$savingType->name}",
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
                $membersWithActiveLoan = User::where('role_id', 5)
                    ->where('status', 'active')
                    ->whereHas('loans', function ($q) {
                        $q->where('status', 'active')
                            ->where('remaining_balance', '>', 0);
                    })
                    ->get();

                foreach ($membersWithActiveLoan as $member) {
                    $activeLoan = Loan::where('user_id', $member->id)
                        ->where('status', 'active')
                        ->where('remaining_balance', '>', 0)
                        ->first();

                    if ($activeLoan) {
                        $exists = LoanInstallment::where('loan_id', $activeLoan->id)
                            ->whereYear('payment_date', substr($month, 0, 4))
                            ->whereMonth('payment_date', substr($month, 5, 2))
                            ->where('payment_method', 'potong_gaji')
                            ->exists();

                        if (!$exists) {
                            $installmentAmount = $activeLoan->monthly_installment;
                            $installmentNumber = $this->getNextInstallmentNumber($activeLoan->id);
                            $newRemainingBalance = $activeLoan->remaining_balance - $installmentAmount;

                            LoanInstallment::create([
                                'loan_id' => $activeLoan->id,
                                'installment_number' => $installmentNumber,
                                'amount_paid' => $installmentAmount,
                                'payment_method' => 'potong_gaji',
                                'payment_date' => $transactionDate,
                                'received_by' => $user->id,
                                'notes' => "Potongan Gaji Bulan {$monthName}"
                            ]);

                            if ($newRemainingBalance <= 0) {
                                $activeLoan->status = 'completed';
                                $activeLoan->remaining_balance = 0;
                            } else {
                                $activeLoan->remaining_balance = $newRemainingBalance;
                            }
                            $activeLoan->save();

                            $processedLoans++;
                            $totalAmount += $installmentAmount;
                        }
                    }
                }
            }

            DB::commit();

            $message = "Berhasil memproses payroll untuk periode {$monthName}: ";
            $message .= "{$processedSavings} potongan simpanan";
            if ($processedLoans > 0) {
                $message .= ", {$processedLoans} angsuran pinjaman";
            }
            $message .= ". Total: " . number_format($totalAmount, 0, ',', '.');

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'processed_savings' => $processedSavings,
                    'processed_loans' => $processedLoans,
                    'total_amount' => $totalAmount,
                    'month' => $month,
                    'month_name' => $monthName
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Process payroll error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses payroll: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Export payroll data
     */
    public function exportPayroll(Request $request)
    {
        try {
            $month = $request->query('month', date('Y-m'));
            list($year, $monthNum) = explode('-', $month);

            $members = User::where('role_id', 5)->where('status', 'active')->get();
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

                $activeLoan = Loan::where('user_id', $member->id)
                    ->where('status', 'active')
                    ->first();

                $loanAmount = $activeLoan ? $activeLoan->monthly_installment : 0;
                $total = $pokokAmount + $wajibAmount + $loanAmount;

                if ($total > 0) {
                    $deductions[] = [
                        'name' => $member->name,
                        'nip' => $member->nip ?? '-',
                        'nik' => $member->nik ?? '-',
                        'unit' => $member->unit ?? '-',
                        'pokok' => $pokokAmount,
                        'wajib' => $wajibAmount,
                        'loan' => $loanAmount,
                        'total' => $total
                    ];
                    $totalAll += $total;
                }
            }

            $monthNames = [
                '01' => 'Januari',
                '02' => 'Februari',
                '03' => 'Maret',
                '04' => 'April',
                '05' => 'Mei',
                '06' => 'Juni',
                '07' => 'Juli',
                '08' => 'Agustus',
                '09' => 'September',
                '10' => 'Oktober',
                '11' => 'November',
                '12' => 'Desember'
            ];

            $fileName = "payroll_{$monthNames[$monthNum]}_{$year}.csv";

            $handle = fopen('php://temp', 'w+');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['NO', 'NAMA', 'NIP/NIK', 'UNIT', 'POKOK', 'WAJIB', 'PINJAMAN', 'TOTAL']);

            $no = 1;
            foreach ($deductions as $item) {
                fputcsv($handle, [
                    $no++,
                    $item['name'],
                    $item['nip'] . '/' . $item['nik'],
                    $item['unit'],
                    number_format($item['pokok'], 0, ',', '.'),
                    number_format($item['wajib'], 0, ',', '.'),
                    number_format($item['loan'], 0, ',', '.'),
                    number_format($item['total'], 0, ',', '.')
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['TOTAL KESELURUHAN', '', '', '', '', '', '', number_format($totalAll, 0, ',', '.')]);

            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);

            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            Log::error('Export payroll error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ], 500);
        }
    }
}