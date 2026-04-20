<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanInstallmentController;

// PUBLIC ROUTES
Route::get('/test', function() {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString()
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

// PROTECTED ROUTES
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // LOAN ROUTES (semua user yang login)
    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::get('/loans/{id}', [LoanController::class, 'show']);
    Route::get('/loans/{id}/generate-agreement', [LoanController::class, 'generateAgreement']);
    Route::post('/loans/{id}/upload-document', [LoanController::class, 'uploadDocument']);
    Route::get('/loans/{id}/download-document', [LoanController::class, 'downloadDocument']);
    Route::get('/loans/{id}/document-info', [LoanController::class, 'getDocumentInfo']);
    
    // APPROVAL BERJENJANG
    Route::middleware(['role:bendahara,admin'])->group(function () {
        Route::put('/loans/{id}/treasurer-approve', [LoanController::class, 'treasurerApprove']);
        Route::put('/loans/{id}/disburse', [LoanController::class, 'disburse']);
    });
    
    Route::middleware(['role:ketua,admin'])->group(function () {
        Route::put('/loans/{id}/chairman-approve', [LoanController::class, 'chairmanApprove']);
    });
    
    Route::middleware(['role:bendahara,ketua,admin'])->group(function () {
        Route::put('/loans/{id}/reject', [LoanController::class, 'reject']);
    });
    
    // ADMIN ONLY ROUTES
    Route::middleware(['role:admin,ketua,bendahara,sekretaris'])->group(function () {
        // User Management
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);

        // Installment Management
        Route::post('/installments', [LoanInstallmentController::class, 'store']);
        Route::get('/loans/{loanId}/installments', [LoanInstallmentController::class, 'index']);
    });    
});