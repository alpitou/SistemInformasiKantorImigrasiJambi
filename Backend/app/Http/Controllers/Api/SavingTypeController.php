<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SavingTypeController extends Controller
{
    /**
     * Display a listing of saving types
     */
    public function index(Request $request)
    {
        try {
            $savingTypes = SavingType::orderBy('id')->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Data jenis simpanan berhasil diambil',
                'data' => $savingTypes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching saving types: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jenis simpanan',
                'data' => []
            ], 500);
        }
    }

    /**
     * Store a newly created saving type
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:saving_types,name',
                'default_amount' => 'required|numeric|min:0'
            ]);

            DB::beginTransaction();

            $savingType = SavingType::create([
                'name' => $request->name,
                'default_amount' => $request->default_amount
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jenis simpanan berhasil ditambahkan',
                'data' => $savingType
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating saving type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jenis simpanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified saving type
     */
    public function show($id)
    {
        try {
            $savingType = SavingType::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Data jenis simpanan berhasil diambil',
                'data' => $savingType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis simpanan tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Update the specified saving type
     */
    public function update(Request $request, $id)
    {
        try {
            $savingType = SavingType::findOrFail($id);
            
            $request->validate([
                'name' => 'required|string|max:255|unique:saving_types,name,' . $id,
                'default_amount' => 'required|numeric|min:0'
            ]);

            DB::beginTransaction();

            $savingType->update([
                'name' => $request->name,
                'default_amount' => $request->default_amount
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jenis simpanan berhasil diupdate',
                'data' => $savingType
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating saving type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate jenis simpanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified saving type
     */
    public function destroy($id)
    {
        try {
            $savingType = SavingType::findOrFail($id);
            
            // Prevent deletion of default saving types
            $defaultTypes = ['Pokok', 'Wajib', 'Sukarela'];
            if (in_array($savingType->name, $defaultTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis simpanan default tidak dapat dihapus'
                ], 422);
            }
            
            // Check if there are any savings using this type
            if ($savingType->savings()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis simpanan tidak dapat dihapus karena masih memiliki data transaksi'
                ], 422);
            }

            DB::beginTransaction();

            $savingType->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jenis simpanan berhasil dihapus',
                'data' => null
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting saving type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jenis simpanan: ' . $e->getMessage()
            ], 500);
        }
    }
}