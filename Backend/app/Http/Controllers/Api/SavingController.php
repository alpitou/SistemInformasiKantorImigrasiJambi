<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use App\Models\SavingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SavingController extends Controller
{
    private function getBalance($userId, $savingTypeId = null)
    {
        $query = Saving::where('user_id', $userId);
        
        // Hanya hitung transaksi yang sudah diverifikasi
        $query->where(function($q) {
            $q->where('verification_status', 'verified')
              ->orWhere('transaction_type', 'withdrawal'); // withdrawal langsung verified
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

    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Saving::with(['user', 'type', 'creator']);
        
        if (!$user->hasRole('admin') && !$user->hasRole('bendahara')) {
            $query->where('user_id', $user->id);
        }
        
        $savings = $query->orderBy('transaction_date', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Data transaksi simpanan berhasil diambil',
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
            
            $saving = Saving::create([
                'user_id' => $request->user_id,
                'saving_type_id' => $request->saving_type_id,
                'amount' => $request->amount,
                'transaction_type' => $request->transaction_type,
                'description' => $request->description,
                'transaction_date' => $request->transaction_date,
                'created_by' => $request->user()->id,
                'proof_image' => $request->proof_image,
                'verification_status' => $request->transaction_type === 'deposit' ? 'pending' : 'verified'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => $request->transaction_type === 'deposit' ? 'Setoran berhasil' : 'Penarikan berhasil',
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

    public function getSummary($userId, Request $request)
    {
        $currentUser = $request->user();
        
        if (!$currentUser->hasRole('admin') && !$currentUser->hasRole('bendahara') && $currentUser->id != $userId) {
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
}