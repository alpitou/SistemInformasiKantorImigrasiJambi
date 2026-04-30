<?php
// app/Http/Controllers/Api/WithdrawalController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Models\Saving;
use App\Models\SavingType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WithdrawalController extends Controller
{
    /**
     * Get withdrawal requests based on user role
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $roleName = $user->role->name ?? 'anggota';
            
            $query = WithdrawalRequest::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser', 'relatedSaving']);
            
            if ($roleName === 'bendahara') {
                $query->whereIn('status', ['pending_treasurer', 'approved']);
            } elseif ($roleName === 'ketua') {
                $query->where('status', 'pending_chairman');
            } elseif ($roleName === 'admin') {
                // Admin can see all
            } else {
                $query->where('user_id', $user->id);
            }
            
            $requests = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Data penarikan berhasil diambil',
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawal requests: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get withdrawal statistics
     */
    public function getStats(Request $request)
    {
        try {
            $user = $request->user();
            $roleName = $user->role->name ?? 'anggota';
            
            $stats = [
                'pending_treasurer' => 0,
                'pending_chairman' => 0,
                'approved' => 0,
                'disbursed' => 0,
                'rejected' => 0,
                'total_amount_pending' => 0
            ];
            
            if (in_array($roleName, ['bendahara', 'ketua', 'admin'])) {
                $stats['pending_treasurer'] = WithdrawalRequest::where('status', 'pending_treasurer')->count();
                $stats['pending_chairman'] = WithdrawalRequest::where('status', 'pending_chairman')->count();
                $stats['approved'] = WithdrawalRequest::where('status', 'approved')->count();
                $stats['disbursed'] = WithdrawalRequest::where('status', 'disbursed')->count();
                $stats['rejected'] = WithdrawalRequest::where('status', 'rejected')->count();
                $stats['total_amount_pending'] = WithdrawalRequest::whereIn('status', ['pending_treasurer', 'pending_chairman'])->sum('amount');
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Statistik berhasil diambil',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawal stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage(),
                'data' => [
                    'pending_treasurer' => 0,
                    'pending_chairman' => 0,
                    'approved' => 0,
                    'disbursed' => 0,
                    'rejected' => 0,
                    'total_amount_pending' => 0
                ]
            ], 500);
        }
    }

    /**
     * Store a new withdrawal request
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'reason' => 'required|string',
                'saving_type' => 'required|string',
                'bank_name' => 'required|string',
                'account_number' => 'required|string',
                'account_name' => 'required|string'
            ]);
            
            $user = $request->user();
            $savingTypeName = ucfirst(strtolower($request->saving_type));
            
            // Get balance for the selected saving type
            $balance = $this->calculateBalance($user->id, $savingTypeName);
            
            if ($request->amount > $balance) {
                return response()->json([
                    'success' => false,
                    'message' => "Saldo {$savingTypeName} tidak mencukupi. Saldo saat ini: " . $this->formatCurrency($balance),
                    'data' => null
                ], 400);
            }
            
            DB::beginTransaction();
            
            $withdrawal = WithdrawalRequest::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'reason' => $request->reason,
                'saving_type' => $savingTypeName,
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'account_name' => $request->account_name,
                'status' => 'pending_treasurer'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan berhasil dikirim. Menunggu persetujuan Bendahara.',
                'data' => $withdrawal->load('user')
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating withdrawal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan penarikan: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Treasurer approve withdrawal request
     */
    public function treasurerApprove(Request $request, $id)
    {
        try {
            $user = $request->user();
            $roleName = $user->role->name ?? 'anggota';
            
            if (!in_array($roleName, ['bendahara', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Bendahara yang dapat melakukan approval tahap ini',
                    'data' => null
                ], 403);
            }
            
            DB::beginTransaction();
            
            $withdrawal = WithdrawalRequest::findOrFail($id);
            
            if ($withdrawal->status !== 'pending_treasurer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Status penarikan tidak valid untuk approval bendahara',
                    'data' => null
                ], 422);
            }
            
            $withdrawal->update([
                'status' => 'pending_chairman',
                'treasurer_approved_by' => $user->id,
                'treasurer_approved_at' => now(),
                'treasurer_notes' => $request->notes
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Penarikan disetujui oleh Bendahara. Menunggu persetujuan Ketua.',
                'data' => $withdrawal->load(['user', 'treasurerApprover'])
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in treasurer approval: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan approval: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Chairman approve withdrawal request
     */
    public function chairmanApprove(Request $request, $id)
    {
        try {
            $user = $request->user();
            $roleName = $user->role->name ?? 'anggota';
            
            if (!in_array($roleName, ['ketua', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Ketua yang dapat melakukan approval tahap ini',
                    'data' => null
                ], 403);
            }
            
            DB::beginTransaction();
            
            $withdrawal = WithdrawalRequest::findOrFail($id);
            
            if ($withdrawal->status !== 'pending_chairman') {
                return response()->json([
                    'success' => false,
                    'message' => 'Status penarikan tidak valid untuk approval ketua',
                    'data' => null
                ], 422);
            }
            
            $withdrawal->update([
                'status' => 'approved',
                'chairman_approved_by' => $user->id,
                'chairman_approved_at' => now(),
                'chairman_notes' => $request->notes
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Penarikan disetujui oleh Ketua. Menunggu proses pencairan oleh Bendahara.',
                'data' => $withdrawal->load(['user', 'treasurerApprover', 'chairmanApprover'])
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in chairman approval: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan approval: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Disburse withdrawal - ONLY BENDARA CAN DO THIS
     */
    public function disburse(Request $request, $id)
    {
        try {
            $user = $request->user();
            $roleName = $user->role->name ?? 'anggota';
            
            // ONLY BENDARA can disburse
            if ($roleName !== 'bendahara') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Bendahara yang dapat melakukan pencairan',
                    'data' => null
                ], 403);
            }
            
            DB::beginTransaction();
            
            $withdrawal = WithdrawalRequest::findOrFail($id);
            
            Log::info('=== DISBURSE PROCESS START ===', [
                'withdrawal_id' => $id,
                'current_status' => $withdrawal->status,
                'saving_type' => $withdrawal->saving_type,
                'amount' => $withdrawal->amount,
                'user_id' => $withdrawal->user_id
            ]);
            
            if ($withdrawal->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Penarikan belum disetujui oleh Ketua. Status saat ini: ' . $withdrawal->status,
                    'data' => null
                ], 422);
            }
            
            // Get the saving type
            $savingType = SavingType::where('name', $withdrawal->saving_type)->first();
            
            if (!$savingType) {
                Log::error('Saving type not found', [
                    'search' => $withdrawal->saving_type,
                    'available' => SavingType::pluck('name')->toArray()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis simpanan "' . $withdrawal->saving_type . '" tidak ditemukan.',
                    'data' => null
                ], 400);
            }
            
            // Calculate current balance for the member (Solihin)
            $totalDeposit = Saving::where('user_id', $withdrawal->user_id)
                ->where('saving_type_id', $savingType->id)
                ->where('transaction_type', 'deposit')
                ->where('verification_status', 'verified')
                ->sum('amount');
            
            $totalWithdrawal = Saving::where('user_id', $withdrawal->user_id)
                ->where('saving_type_id', $savingType->id)
                ->where('transaction_type', 'withdrawal')
                ->sum('amount');
            
            $currentBalance = $totalDeposit - $totalWithdrawal;
            
            Log::info('Balance check', [
                'member_user_id' => $withdrawal->user_id,
                'saving_type' => $savingType->name,
                'total_deposit' => $totalDeposit,
                'total_withdrawal_already' => $totalWithdrawal,
                'current_balance' => $currentBalance,
                'requested_amount' => $withdrawal->amount
            ]);
            
            if ($currentBalance < $withdrawal->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo tidak mencukupi. Saldo ' . $savingType->name . ' saat ini: ' . $this->formatCurrency($currentBalance),
                    'data' => [
                        'current_balance' => $currentBalance,
                        'requested_amount' => $withdrawal->amount
                    ]
                ], 400);
            }
            
            // CREATE WITHDRAWAL TRANSACTION
            $newSaving = Saving::create([
                'user_id' => $withdrawal->user_id,
                'saving_type_id' => $savingType->id,
                'amount' => $withdrawal->amount,
                'transaction_type' => 'withdrawal',
                'description' => "Penarikan simpanan {$savingType->name} - {$withdrawal->reason}",
                'transaction_date' => now(),
                'created_by' => $user->id,
                'verification_status' => 'verified',
                'verified_at' => now(),
                'verified_by' => $user->id
            ]);
            
            // Update withdrawal request
            $withdrawal->update([
                'status' => 'disbursed',
                'saving_id' => $newSaving->id,
                'disbursed_by' => $user->id,
                'disbursed_at' => now(),
                'disbursement_notes' => $request->notes
            ]);
            
            DB::commit();
            
            Log::info('=== DISBURSE PROCESS SUCCESS ===', [
                'withdrawal_id' => $id,
                'amount' => $withdrawal->amount,
                'new_saving_id' => $newSaving->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Dana berhasil dicairkan sebesar ' . $this->formatCurrency($withdrawal->amount) . ' dari Simpanan ' . $savingType->name,
                'data' => $withdrawal->load(['user', 'treasurerApprover', 'chairmanApprover', 'disburser', 'relatedSaving'])
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Disbursement Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan pencairan: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Reject withdrawal request
     */
    public function reject(Request $request, $id)
    {
        try {
            $user = $request->user();
            $roleName = $user->role->name ?? 'anggota';
            
            if (!in_array($roleName, ['bendahara', 'ketua', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk menolak',
                    'data' => null
                ], 403);
            }
            
            $request->validate([
                'reason' => 'required|string'
            ]);
            
            DB::beginTransaction();
            
            $withdrawal = WithdrawalRequest::findOrFail($id);
            
            if (!in_array($withdrawal->status, ['pending_treasurer', 'pending_chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Penarikan tidak dapat ditolak pada tahap ini',
                    'data' => null
                ], 422);
            }
            
            $updateData = ['status' => 'rejected'];
            
            if ($roleName === 'bendahara') {
                $updateData['treasurer_notes'] = $request->reason;
            } elseif ($roleName === 'ketua') {
                $updateData['chairman_notes'] = $request->reason;
            }
            
            $withdrawal->update($updateData);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan ditolak',
                'data' => $withdrawal
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error rejecting withdrawal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
    
    private function formatCurrency($amount)
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}