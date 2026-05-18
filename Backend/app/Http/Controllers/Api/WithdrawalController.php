<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Models\Saving;
use App\Models\SavingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WithdrawalController extends Controller
{
    /**
     * Get balance for a specific saving type
     */
    private function getBalance($userId, $savingTypeName)
    {
        $savingType = SavingType::where('name', $savingTypeName)->first();
        if (!$savingType) {
            return 0;
        }

        $savings = Saving::where('user_id', $userId)
            ->where('saving_type_id', $savingType->id)
            ->where(function ($q) {
                $q->where('verification_status', 'verified')
                    ->orWhere('transaction_type', 'withdrawal');
            })->get();

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

    /**
     * Get all withdrawal requests
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = WithdrawalRequest::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser']);

            // If member, only show their own requests
            if ($user->role->name === 'anggota') {
                $query->where('user_id', $user->id);
            }

            $withdrawals = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Data pengajuan penarikan berhasil diambil',
                'data' => $withdrawals
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawals: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get withdrawal statistics for dashboard
     */
    public function stats(Request $request)
    {
        try {
            $stats = [
                'pending_treasurer' => WithdrawalRequest::where('status', 'pending_treasurer')->count(),
                'pending_chairman' => WithdrawalRequest::where('status', 'pending_chairman')->count(),
                'approved' => WithdrawalRequest::where('status', 'approved')->count(),
                'disbursed' => WithdrawalRequest::where('status', 'disbursed')->count(),
                'rejected' => WithdrawalRequest::where('status', 'rejected')->count(),
                'total_amount_pending' => WithdrawalRequest::whereIn('status', ['pending_treasurer', 'pending_chairman'])->sum('amount')
            ];

            return response()->json([
                'success' => true,
                'message' => 'Stats retrieved successfully',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawal stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stats: ' . $e->getMessage(),
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
     * Create a new withdrawal request
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            if (!in_array($user->role->name, ['ketua', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Ketua atau Admin yang dapat membuat pengajuan penarikan.',
                    'data' => null
                ], 403);
            }

            $request->validate([
                'user_id' => 'required|exists:users,id',
                'amount' => 'required|numeric|min:1',
                'reason' => 'required|string',
                'saving_type' => 'required|in:Pokok,Wajib,Sukarela',
                'bank_name' => 'required|string',
                'account_number' => 'required|string',
                'account_name' => 'required|string'
            ]);

            $balance = $this->getBalance($request->user_id, $request->saving_type);
            if ($request->amount > $balance) {
                return response()->json([
                    'success' => false,
                    'message' => "Saldo Simpanan {$request->saving_type} anggota tidak mencukupi. Tersedia: Rp " . number_format($balance, 0, ',', '.'),
                    'data' => null
                ], 400);
            }

            DB::beginTransaction();

            $withdrawal = WithdrawalRequest::create([
                'user_id' => $request->user_id,
                'saving_type' => $request->saving_type,
                'amount' => $request->amount,
                'reason' => $request->reason,
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'account_name' => $request->account_name,
                'status' => 'approved'   // langsung siap cair
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan berhasil dibuat. Silakan bendahara melakukan pencairan.',
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
     * Get single withdrawal request details
     */
    public function show($id)
    {
        try {
            $withdrawal = WithdrawalRequest::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser'])
                ->findOrFail($id);
            $user = request()->user();

            if ($user->role->name === 'anggota' && $withdrawal->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                    'data' => null
                ], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data pengajuan penarikan berhasil diambil',
                'data' => $withdrawal
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan',
                'data' => null
            ], 404);
        }
    }

    /**
     * Treasurer approves withdrawal request
     */
    public function approveTreasurer(Request $request, $id)
    {
        try {
            $user = request()->user();

            if (!in_array($user->role->name, ['bendahara', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya bendahara yang dapat menyetujui tahap ini',
                    'data' => null
                ], 403);
            }

            DB::beginTransaction();

            $withdrawal = WithdrawalRequest::findOrFail($id);

            if ($withdrawal->status !== 'pending_treasurer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengajuan tidak dapat disetujui pada tahap ini',
                    'data' => null
                ], 422);
            }

            $withdrawal->status = 'pending_chairman';
            $withdrawal->treasurer_approved_by = $user->id;
            $withdrawal->treasurer_approved_at = now();
            $withdrawal->treasurer_notes = $request->notes;
            $withdrawal->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan disetujui bendahara. Menunggu persetujuan ketua.',
                'data' => $withdrawal
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in treasurer approval: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Chairman approves withdrawal request
     */
    public function approveChairman(Request $request, $id)
    {
        try {
            $user = request()->user();

            if (!in_array($user->role->name, ['ketua', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya ketua yang dapat menyetujui tahap ini',
                    'data' => null
                ], 403);
            }

            DB::beginTransaction();

            $withdrawal = WithdrawalRequest::findOrFail($id);

            if ($withdrawal->status !== 'pending_chairman') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengajuan tidak dapat disetujui pada tahap ini',
                    'data' => null
                ], 422);
            }

            // Process withdrawal - deduct from savings
            $savingType = SavingType::where('name', $withdrawal->saving_type)->first();

            if ($savingType) {
                Saving::create([
                    'user_id' => $withdrawal->user_id,
                    'saving_type_id' => $savingType->id,
                    'amount' => $withdrawal->amount,
                    'transaction_type' => 'withdrawal',
                    'description' => "Penarikan simpanan {$withdrawal->saving_type} - {$withdrawal->reason}",
                    'transaction_date' => now(),
                    'created_by' => $user->id,
                    'verification_status' => 'verified',
                    'verified_at' => now(),
                    'verified_by' => $user->id
                ]);
            }

            $withdrawal->status = 'approved';
            $withdrawal->chairman_approved_by = $user->id;
            $withdrawal->chairman_approved_at = now();
            $withdrawal->chairman_notes = $request->notes;
            $withdrawal->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan disetujui. Dana siap dicairkan.',
                'data' => $withdrawal
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in chairman approval: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui: ' . $e->getMessage(),
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
            $user = request()->user();
            $allowedRoles = ['admin', 'ketua', 'bendahara'];

            if (!in_array($user->role->name, $allowedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki wewenang untuk menolak pengajuan ini',
                    'data' => null
                ], 403);
            }

            DB::beginTransaction();

            $withdrawal = WithdrawalRequest::findOrFail($id);

            if (!in_array($withdrawal->status, ['pending_treasurer', 'pending_chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengajuan tidak dapat ditolak pada tahap ini',
                    'data' => null
                ], 422);
            }

            $withdrawal->status = 'rejected';
            $withdrawal->rejection_reason = $request->reason;
            $withdrawal->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan ditolak.',
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

    /**
     * Disburse funds for approved withdrawal
     */
    public function disburse(Request $request, $id)
    {
        try {
            $user = request()->user();
            Log::info('Disburse attempt', ['user_id' => $user->id, 'withdrawal_id' => $id]);

            if (!in_array($user->role->name, ['bendahara', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya bendahara yang dapat melakukan pencairan dana',
                    'data' => null
                ], 403);
            }

            DB::beginTransaction();

            $withdrawal = WithdrawalRequest::findOrFail($id);

            Log::info('Withdrawal found', ['status' => $withdrawal->status]);

            if ($withdrawal->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengajuan tidak dapat dicairkan. Status saat ini: ' . $withdrawal->status,
                    'data' => null
                ], 422);
            }

            $withdrawal->status = 'disbursed';
            $withdrawal->disbursed_by = $user->id;
            $withdrawal->disbursed_at = now();
            $withdrawal->disbursement_notes = $request->notes;
            $withdrawal->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dana penarikan telah dicairkan ke rekening anggota.',
                'data' => $withdrawal
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error disbursing funds: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mencairkan dana: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}