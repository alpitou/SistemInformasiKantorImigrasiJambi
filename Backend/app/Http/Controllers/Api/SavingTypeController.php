<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SavingTypeRequest;
use App\Models\SavingType;
use Illuminate\Http\Request;

class SavingTypeController extends Controller
{
    public function index()
    {
        $savingTypes = SavingType::all();
        
        return response()->json([
            'success' => true,
            'message' => 'Data jenis simpanan berhasil diambil',
            'data' => $savingTypes
        ]);
    }

    public function store(SavingTypeRequest $request)
    {
        $savingType = SavingType::create($request->validated());
        
        return response()->json([
            'success' => true,
            'message' => 'Jenis simpanan berhasil ditambahkan',
            'data' => $savingType
        ], 201);
    }

    public function update(SavingTypeRequest $request, SavingType $savingType)
    {
        $savingType->update($request->validated());
        
        return response()->json([
            'success' => true,
            'message' => 'Jenis simpanan berhasil diupdate',
            'data' => $savingType
        ]);
    }
}