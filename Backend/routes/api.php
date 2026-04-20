<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanInstallmentController;

 HEAD
// PUBLIC ROUTES

 804b92e6133e97d9b90e203c454bdf7fb3d02799
Route::get('/test', function() {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString()
    ]);
});

// AUTH ROUTES
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

 HEAD
// PROTECTED ROUTES
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ====== LOAN ROUTES (semua user yang login) ======
    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::get('/loans/{id}', [LoanController::class, 'show']);
    Route::get('/loans/{id}/generate-agreement', [LoanController::class, 'generateAgreement']);
    Route::post('/loans/{id}/upload-document', [LoanController::class, 'uploadDocument']);
    Route::get('/loans/{id}/download-document', [LoanController::class, 'downloadDocument']);
    Route::get('/loans/{id}/document-info', [LoanController::class, 'getDocumentInfo']);
    
    // ====== APPROVAL BERJENJANG ======
    // Tahap 1: Bendahara approve (setelah anggota upload dokumen)
    Route::middleware(['role:bendahara,admin'])->group(function () {
        Route::put('/loans/{id}/treasurer-approve', [LoanController::class, 'treasurerApprove']);
        Route::put('/loans/{id}/disburse', [LoanController::class, 'disburse']);
    });
    
    // Tahap 2: Ketua approve (setelah bendahara approve)
    Route::middleware(['role:ketua,admin'])->group(function () {
        Route::put('/loans/{id}/chairman-approve', [LoanController::class, 'chairmanApprove']);
    });
    
    // Reject loan (bendahara, ketua, atau admin bisa reject)
    Route::middleware(['role:bendahara,ketua,admin'])->group(function () {
        Route::put('/loans/{id}/reject', [LoanController::class, 'reject']);
    });
    
    // ====== ADMIN ONLY ROUTES ======
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

// USER MANAGEMENT (ADMIN ONLY)
Route::middleware(['auth:sanctum', 'role:admin,ketua,sekretaris'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/restore', [UserController::class, 'restore']);
 804b92e6133e97d9b90e203c454bdf7fb3d02799
});