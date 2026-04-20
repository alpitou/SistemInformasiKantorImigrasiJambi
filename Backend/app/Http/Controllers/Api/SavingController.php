<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SavingRequest;
use App\Models\Saving;
use App\Models\SavingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavingController extends Controller
{
    private function calculateBalance($userId, $savingTypeId = null)
    {
        $query = Saving::where('user_id', $userId);
        
        if ($savingTypeId) {
            $query->where('saving_type_id', $savingTypeId);
        }
        
        $savings = $query->get();
        
        return $savings->sum(function ($item) {
            return $item->transaction_type === 'deposit' 
                ? $item->amount 
                : -$item->amount;
        });
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Saving::with(['user', 'type', 'creator']);
        
        if (!$user->hasAnyRole(['admin', 'bendahara'])) {
            $query->where('user_id', $user->id);
        }
        
        $savings = $query->orderBy('transaction_date', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Data transaksi simpanan berhasil diambil',
            'data' => $savings
        ]);
    }

    public function store(SavingRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        
        if ($data['transaction_type'] === 'withdrawal') {
            $currentBalance = $this->calculateBalance($data['user_id'], $data['saving_type_id']);
            
            if ($data['amount'] > $currentBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo tidak mencukupi untuk penarikan',
                    'data' => null
                ], 400);
            }
        }
        
        try {
            DB::beginTransaction();
            
            $saving = Saving::create($data);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => $data['transaction_type'] === 'deposit' 
                    ? 'Setoran berhasil dicatat' 
                    : 'Penarikan berhasil dicatat',
                'data' => $saving->load(['user', 'type', 'creator'])
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mencatat transaksi: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    public function getUserSavings($userId, Request $request)
    {
        $currentUser = $request->user();
        
        if (!$currentUser->hasAnyRole(['admin', 'bendahara']) && $currentUser->id != $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini',
                'data' => null
            ], 403);
        }
        
        $savings = Saving::with(['type', 'creator'])
            ->where('user_id', $userId)
            ->orderBy('transaction_date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Riwayat simpanan user berhasil diambil',
            'data' => $savings
        ]);
    }

    public function getSummary($userId, Request $request)
    {
        $currentUser = $request->user();
        
        if (!$currentUser->hasAnyRole(['admin', 'bendahara']) && $currentUser->id != $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini',
                'data' => null
            ], 403);
        }
        
        $savingTypes = SavingType::all();
        $summary = [];
        $totalBalance = 0;
        
        foreach ($savingTypes as $type) {
            $balance = $this->calculateBalance($userId, $type->id);
            $summary[$type->name] = $balance;
            $totalBalance += $balance;
        }
        
        $summary['total'] = $totalBalance;
        
        return response()->json([
            'success' => true,
            'message' => 'Ringkasan saldo simpanan berhasil diambil',
            'data' => $summary
        ]);
    }
    
    public function show($id, Request $request)
    {
        $saving = Saving::with(['user', 'type', 'creator'])->findOrFail($id);
        
        $currentUser = $request->user();
        
        if (!$currentUser->hasAnyRole(['admin', 'bendahara']) && $currentUser->id != $saving->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini',
                'data' => null
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Detail transaksi berhasil diambil',
            'data' => $saving
        ]);
    }
}