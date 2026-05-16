<?php
// app/Http/Controllers/Api/ExpenseController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class ExpenseController extends Controller
{
    /**
     * Get all expenses with optional month filter
     */
    public function index(Request $request)
    {
        try {
            $month = $request->query('month');
            
            if (!Schema::hasTable('expenses')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tabel expenses belum dibuat',
                    'data' => [],
                    'total' => 0,
                    'by_category' => []
                ]);
            }

            $query = Expense::with('creator')
                ->orderBy('expense_date', 'desc');

            if ($month && $month !== 'all') {
                $year = substr($month, 0, 4);
                $monthNum = substr($month, 5, 2);
                $query->whereYear('expense_date', $year)
                    ->whereMonth('expense_date', $monthNum);
            }

            $expenses = $query->get();
            $total = $expenses->sum('amount');
            
            $byCategory = $expenses->groupBy('category')->map(function ($item) {
                return $item->sum('amount');
            });

            return response()->json([
                'success' => true,
                'message' => 'Data pengeluaran berhasil diambil',
                'data' => $expenses,
                'total' => $total,
                'by_category' => $byCategory
            ]);

        } catch (\Exception $e) {
            Log::error('Get Expenses error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pengeluaran: ' . $e->getMessage(),
                'data' => [],
                'total' => 0,
                'by_category' => []
            ]);
        }
    }

    /**
     * Store a new expense
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'expense_date' => 'required|date',
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:1',
                'category' => 'required|string|in:operasional,gaji,perawatan,promosi,sosial,lainnya',
                'payment_method' => 'required|in:cash,transfer',
                'notes' => 'nullable|string'
            ]);

            DB::beginTransaction();

            $expense = Expense::create([
                'expense_date' => $request->expense_date,
                'description' => $request->description,
                'amount' => $request->amount,
                'category' => $request->category,
                'payment_method' => $request->payment_method,
                'created_by' => $request->user()->id,
                'notes' => $request->notes
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengeluaran berhasil ditambahkan',
                'data' => $expense->load('creator')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store Expense error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan pengeluaran: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Show a single expense
     */
    public function show($id)
    {
        try {
            $expense = Expense::with('creator')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Data pengeluaran berhasil diambil',
                'data' => $expense
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pengeluaran tidak ditemukan',
                'data' => null
            ], 404);
        }
    }

    /**
     * Update an expense
     */
    public function update(Request $request, $id)
    {
        try {
            $expense = Expense::findOrFail($id);

            $request->validate([
                'expense_date' => 'required|date',
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:1',
                'category' => 'required|string|in:operasional,gaji,perawatan,promosi,sosial,lainnya',
                'payment_method' => 'required|in:cash,transfer',
                'notes' => 'nullable|string'
            ]);

            DB::beginTransaction();

            $expense->update([
                'expense_date' => $request->expense_date,
                'description' => $request->description,
                'amount' => $request->amount,
                'category' => $request->category,
                'payment_method' => $request->payment_method,
                'notes' => $request->notes
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengeluaran berhasil diupdate',
                'data' => $expense->load('creator')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update Expense error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate pengeluaran: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Delete an expense
     */
    public function destroy($id)
    {
        try {
            $expense = Expense::findOrFail($id);
            
            DB::beginTransaction();
            $expense->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengeluaran berhasil dihapus',
                'data' => null
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete Expense error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus pengeluaran: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Get expense summary by category
     */
    public function summary(Request $request)
    {
        try {
            $year = $request->query('year', date('Y'));
            $month = $request->query('month');

            $query = Expense::select('category', DB::raw('SUM(amount) as total'))
                ->whereYear('expense_date', $year);

            if ($month) {
                $query->whereMonth('expense_date', $month);
            }

            $summary = $query->groupBy('category')->get();

            $totalAll = $summary->sum('total');

            return response()->json([
                'success' => true,
                'message' => 'Ringkasan pengeluaran berhasil diambil',
                'data' => [
                    'summary' => $summary,
                    'total' => $totalAll,
                    'year' => $year,
                    'month' => $month
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Expense summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ringkasan: ' . $e->getMessage(),
                'data' => null
            ]);
        }
    }

    /**
     * Export expenses to CSV
     */
    public function export(Request $request)
    {
        try {
            $month = $request->query('month', date('Y-m'));
            $year = substr($month, 0, 4);
            $monthNum = substr($month, 5, 2);

            $expenses = Expense::with('creator')
                ->whereYear('expense_date', $year)
                ->whereMonth('expense_date', $monthNum)
                ->orderBy('expense_date', 'desc')
                ->get();

            $monthNames = [
                '01' => 'Januari', '02' => 'Februari', '03' => 'Maret',
                '04' => 'April', '05' => 'Mei', '06' => 'Juni',
                '07' => 'Juli', '08' => 'Agustus', '09' => 'September',
                '10' => 'Oktober', '11' => 'November', '12' => 'Desember'
            ];

            $fileName = "pengeluaran_{$monthNames[$monthNum]}_{$year}.csv";

            $handle = fopen('php://temp', 'w+');
            fwrite($handle, "\xEF\xBB\xBF");
            
            fputcsv($handle, ['NO', 'TANGGAL', 'DESKRIPSI', 'KATEGORI', 'METODE', 'JUMLAH (Rp)', 'DIBUAT OLEH', 'CATATAN']);
            
            $no = 1;
            $total = 0;
            
            foreach ($expenses as $expense) {
                $categories = Expense::CATEGORIES;
                $categoryLabel = $categories[$expense->category] ?? $expense->category;
                
                fputcsv($handle, [
                    $no++,
                    date('d/m/Y', strtotime($expense->expense_date)),
                    $expense->description,
                    $categoryLabel,
                    $expense->payment_method === 'cash' ? 'Tunai' : 'Transfer',
                    number_format($expense->amount, 0, ',', '.'),
                    $expense->creator?->name ?? '-',
                    $expense->notes ?? '-'
                ]);
                $total += $expense->amount;
            }
            
            fputcsv($handle, []);
            fputcsv($handle, ['TOTAL', '', '', '', '', number_format($total, 0, ',', '.'), '', '']);

            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);

            return response($csvContent, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            Log::error('Export expenses error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ]);
        }
    }
}