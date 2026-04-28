<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SettingController extends Controller
{
    /**
     * Get loan settings
     */
    public function getLoanSettings(Request $request)
    {
        try {
            // Get from cache or return default
            $settings = Cache::get('loan_settings', [
                'max_tenor_months' => 10,
                'default_interest_rate' => 1,
                'min_loan_amount' => 100000,
                'max_loan_amount' => 50000000
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Pengaturan pinjaman berhasil diambil',
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching loan settings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pengaturan pinjaman',
                'data' => [
                    'max_tenor_months' => 10,
                    'default_interest_rate' => 1,
                    'min_loan_amount' => 100000,
                    'max_loan_amount' => 50000000
                ]
            ]);
        }
    }

    /**
     * Update loan settings
     */
    public function updateLoanSettings(Request $request)
    {
        try {
            $validated = $request->validate([
                'max_tenor_months' => 'required|integer|min:1|max:60',
                'default_interest_rate' => 'required|numeric|min:0|max:100',
                'min_loan_amount' => 'required|numeric|min:0',
                'max_loan_amount' => 'required|numeric|min:0'
            ]);
            
            // Store in cache for 30 days
            Cache::put('loan_settings', $validated, 86400 * 30);
            
            return response()->json([
                'success' => true,
                'message' => 'Pengaturan pinjaman berhasil disimpan',
                'data' => $validated
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating loan settings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pengaturan pinjaman: ' . $e->getMessage()
            ], 500);
        }
    }
}