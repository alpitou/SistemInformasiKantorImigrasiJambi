<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\SavingType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
        
        return $balance;
    }

    private function isPayrollPeriodActive()
    {
        $today = now();
        $day = (int) $today->format('d');
        return $day >= 20 || $day <= 5;
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
            // Ambil semua anggota (role_id = 5)
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
            
            $result = [];
            foreach ($members as $member) {
                $hasPaidPokok = false;
                $pokokType = $savingTypes->firstWhere('name', 'Pokok');
                if ($pokokType) {
                    $principalSavings = Saving::where('user_id', $member->id)
                        ->where('saving_type_id', $pokokType->id)
                        ->where('transaction_type', 'deposit')
                        ->where('verification_status', 'verified')
                        ->sum('amount');
                    $hasPaidPokok = $principalSavings >= ($pokokType->default_amount ?? 50000);
                }
                
                $alreadyProcessed = false;
                foreach ($savingTypes as $type) {
                    $existing = Saving::where('user_id', $member->id)
                        ->where('saving_type_id', $type->id)
                        ->where('description', 'like', '%' . $activePeriod['name'] . '%')
                        ->first();
                    if ($existing) {
                        $alreadyProcessed = true;
                        break;
                    }
                }
                
                $memberData = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'nip' => $member->nip ?? '-',
                    'unit' => $member->unit ?? '-',
                    'is_old_member' => $hasPaidPokok,
                    'already_processed' => $alreadyProcessed,
                    'savings' => []
                ];
                
                foreach ($savingTypes as $type) {
                    $defaultAmount = $type->default_amount ?? ($type->name === 'Pokok' ? 50000 : 100000);
                    $balance = $this->getBalance($member->id, $type->id);
                    
                    if ($type->name === 'Pokok' && $hasPaidPokok) {
                        $defaultAmount = 0;
                    }
                    
                    $isProcessed = Saving::where('user_id', $member->id)
                        ->where('saving_type_id', $type->id)
                        ->where('description', 'like', '%' . $activePeriod['name'] . '%')
                        ->exists();
                    
                    $memberData['savings'][] = [
                        'type_id' => $type->id,
                        'type_name' => $type->name,
                        'default_amount' => (float) $defaultAmount,
                        'current_balance' => (float) $balance,
                        'is_processed' => $isProcessed
                    ];
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
            $history = Saving::with(['user', 'type', 'creator'])
                ->where('description', 'like', 'Potongan payroll%')
                ->orderBy('created_at', 'desc')
                ->get()
                ->groupBy(function($item) {
                    return date('Y-m', strtotime($item->created_at));
                });
            
            $formattedHistory = [];
            foreach ($history as $month => $items) {
                $formattedHistory[$month] = [];
                foreach ($items as $item) {
                    $formattedHistory[$month][] = [
                        'id' => $item->id,
                        'user_id' => $item->user_id,
                        'user' => [
                            'id' => $item->user->id,
                            'name' => $item->user->name,
                            'nip' => $item->user->nip ?? '-',
                            'unit' => $item->user->unit ?? '-'
                        ],
                        'saving_type' => [
                            'id' => $item->type->id,
                            'name' => $item->type->name
                        ],
                        'amount' => $item->amount,
                        'month' => $month,
                        'processed_at' => $item->created_at,
                        'creator' => $item->creator ? $item->creator->name : null
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Riwayat potongan payroll berhasil diambil',
                'data' => $formattedHistory
            ]);
            
        } catch (\Exception $e) {
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
                'deductions' => 'required|array'
            ]);
            
            $activePeriod = $this->getActivePayrollPeriod();
            
            DB::beginTransaction();
            $processedCount = 0;
            $skippedCount = 0;
            
            foreach ($request->deductions as $deduction) {
                $savingType = SavingType::find($deduction['saving_type_id']);
                if (!$savingType) {
                    $skippedCount++;
                    continue;
                }
                
                $monthName = $activePeriod['name'];
                
                $existing = Saving::where('user_id', $deduction['user_id'])
                    ->where('saving_type_id', $deduction['saving_type_id'])
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
            
            DB::commit();
            
            $message = "{$processedCount} potongan payroll berhasil diproses untuk periode {$monthName}";
            if ($skippedCount > 0) {
                $message .= ", {$skippedCount} dilewati";
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'processed_count' => $processedCount,
                    'skipped_count' => $skippedCount,
                    'period' => $activePeriod
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
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
            
            $query = Saving::with(['user', 'type', 'creator'])
                ->where('description', 'like', 'Potongan payroll%');
            
            if ($month) {
                $monthName = date('F Y', strtotime($month));
                $query->where('description', 'like', "%{$monthName}%");
            }
            
            $history = $query->orderBy('created_at', 'desc')->get();
            
            $filename = 'riwayat_potongan_payroll_' . date('Y-m-d') . '.csv';
            if ($month) {
                $filename = 'riwayat_payroll_' . $month . '.csv';
            }
            
            $handle = fopen('php://temp', 'w+');
            fputs($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['No', 'Tanggal', 'Nama Anggota', 'NIP', 'Unit', 'Jenis Simpanan', 'Jumlah', 'Dibuat Oleh']);
            
            $no = 1;
            foreach ($history as $item) {
                fputcsv($handle, [
                    $no,
                    date('d/m/Y H:i', strtotime($item->created_at)),
                    $item->user->name ?? '-',
                    $item->user->nip ?? '-',
                    $item->user->unit ?? '-',
                    $item->type->name ?? '-',
                    'Rp ' . number_format($item->amount, 0, ',', '.'),
                    $item->creator->name ?? '-'
                ]);
                $no++;
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal export: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}