<?php
// app/Http/Controllers/Api/KantinIncomeController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KantinIncome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class KantinIncomeController extends Controller
{
    /**
     * Get all kantin incomes
     */
    public function index(Request $request)
    {
        try {
            $month = $request->query('month');

            if (!Schema::hasTable('kantin_incomes')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tabel kantin_incomes belum dibuat',
                    'data' => [],
                    'total' => 0
                ]);
            }

            $query = KantinIncome::with('creator')
                ->orderBy('income_date', 'desc');

            if ($month && $month !== 'all') {
                $year = substr($month, 0, 4);
                $monthNum = substr($month, 5, 2);
                $query->whereYear('income_date', $year)
                    ->whereMonth('income_date', $monthNum);
            }

            $incomes = $query->get();
            $total = $incomes->sum('amount');

            return response()->json([
                'success' => true,
                'message' => 'Data pemasukan kantin berhasil diambil',
                'data' => $incomes,
                'total' => $total
            ]);

        } catch (\Exception $e) {
            Log::error('Get Kantin Incomes error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $e->getMessage(),
                'data' => [],
                'total' => 0
            ]);
        }
    }

    /**
     * Store new kantin income
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'income_date' => 'required|date',
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:1',
                'payment_method' => 'required|in:cash,transfer',
                'notes' => 'nullable|string'
            ]);

            DB::beginTransaction();

            $income = KantinIncome::create([
                'income_date' => $request->income_date,
                'description' => $request->description,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'created_by' => $request->user()->id,
                'notes' => $request->notes
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pemasukan kantin berhasil ditambahkan',
                'data' => $income->load('creator')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store Kantin Income error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Show single kantin income
     */
    public function show($id)
    {
        try {
            $income = KantinIncome::with('creator')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Data pemasukan kantin berhasil diambil',
                'data' => $income
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
     * Update kantin income
     */
    public function update(Request $request, $id)
    {
        try {
            $income = KantinIncome::findOrFail($id);

            $request->validate([
                'income_date' => 'required|date',
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:1',
                'payment_method' => 'required|in:cash,transfer',
                'notes' => 'nullable|string'
            ]);

            DB::beginTransaction();

            $income->update([
                'income_date' => $request->income_date,
                'description' => $request->description,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'notes' => $request->notes
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pemasukan kantin berhasil diupdate',
                'data' => $income->load('creator')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update Kantin Income error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Delete kantin income
     */
    public function destroy($id)
    {
        try {
            $income = KantinIncome::findOrFail($id);
            
            DB::beginTransaction();
            $income->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pemasukan kantin berhasil dihapus',
                'data' => null
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete Kantin Income error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Export kantin incomes to CSV
     */
    public function export(Request $request)
    {
        try {
            $month = $request->query('month', date('Y-m'));
            $year = substr($month, 0, 4);
            $monthNum = substr($month, 5, 2);

            $incomes = KantinIncome::with('creator')
                ->whereYear('income_date', $year)
                ->whereMonth('income_date', $monthNum)
                ->orderBy('income_date', 'desc')
                ->get();

            $monthNames = [
                '01' => 'Januari', '02' => 'Februari', '03' => 'Maret',
                '04' => 'April', '05' => 'Mei', '06' => 'Juni',
                '07' => 'Juli', '08' => 'Agustus', '09' => 'September',
                '10' => 'Oktober', '11' => 'November', '12' => 'Desember'
            ];

            $fileName = "pemasukan_kantin_{$monthNames[$monthNum]}_{$year}.csv";

            $handle = fopen('php://temp', 'w+');
            fwrite($handle, "\xEF\xBB\xBF");
            
            fputcsv($handle, ['NO', 'TANGGAL', 'DESKRIPSI', 'METODE', 'JUMLAH (Rp)', 'DIBUAT OLEH', 'CATATAN']);
            
            $no = 1;
            $total = 0;
            
            foreach ($incomes as $income) {
                fputcsv($handle, [
                    $no++,
                    date('d/m/Y', strtotime($income->income_date)),
                    $income->description,
                    $income->payment_method === 'cash' ? 'Tunai' : 'Transfer',
                    number_format($income->amount, 0, ',', '.'),
                    $income->creator?->name ?? '-',
                    $income->notes ?? '-'
                ]);
                $total += $income->amount;
            }
            
            fputcsv($handle, []);
            fputcsv($handle, ['TOTAL', '', '', '', number_format($total, 0, ',', '.'), '', '']);

            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);

            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            Log::error('Export kantin incomes error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ]);
        }
    }
}