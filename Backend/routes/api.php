<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanInstallmentController;
use App\Http\Controllers\Api\SavingController;
use App\Http\Controllers\Api\SavingTypeController;
use App\Http\Controllers\FileController; // IMPORT FILE CONTROLLER

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
    
    // FILE MANAGEMENT ROUTES
    Route::get('/files', [FileController::class, 'index']);
    Route::get('/files/{id}', [FileController::class, 'show']);
    Route::get('/files/download/{id}', [FileController::class, 'download']);
});
    
// APPROVAL BERJENJANG
Route::middleware(['auth:sanctum', 'role:bendahara,admin'])->group(function () {
    Route::put('/loans/{id}/treasurer-approve', [LoanController::class, 'treasurerApprove']);
    Route::put('/loans/{id}/disburse', [LoanController::class, 'disburse']);
});

Route::middleware(['auth:sanctum', 'role:ketua,admin'])->group(function () {
    Route::put('/loans/{id}/chairman-approve', [LoanController::class, 'chairmanApprove']);
});

Route::middleware(['auth:sanctum', 'role:bendahara,ketua,admin'])->group(function () {
    Route::put('/loans/{id}/reject', [LoanController::class, 'reject']);
});

// FILE UPLOAD (KHUSUS ADMIN, KETUA, BENDAHARA)
Route::middleware(['auth:sanctum', 'role:admin,ketua,bendahara'])->group(function () {
    Route::post('/files', [FileController::class, 'store']);
    Route::delete('/files/{id}', [FileController::class, 'destroy']);
});

// USER MANAGEMENT (ADMIN, KETUA, SEKRETARIS, BENDAHARA)
Route::middleware(['auth:sanctum', 'role:admin,ketua,sekretaris,bendahara'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/restore', [UserController::class, 'restore']);
});

// INSTALLMENT MANAGEMENT (ADMIN, KETUA, BENDAHARA)
Route::middleware(['auth:sanctum', 'role:admin,ketua,bendahara'])->group(function () {
    Route::post('/installments', [LoanInstallmentController::class, 'store']);
    Route::get('/loans/{loanId}/installments', [LoanInstallmentController::class, 'index']);
});

// SAVING TYPES & SAVINGS (GENERAL)
Route::middleware(['auth:sanctum'])->group(function () {
    // Saving Types
    Route::get('/saving-types', [SavingTypeController::class, 'index']);
    Route::post('/saving-types', [SavingTypeController::class, 'store']);
    Route::put('/saving-types/{savingType}', [SavingTypeController::class, 'update']);
    
    // Savings
    Route::get('/savings', [SavingController::class, 'index']);
    Route::post('/savings', [SavingController::class, 'store']);
    Route::get('/savings/{id}', [SavingController::class, 'show']);
    Route::get('/savings/user/{userId}', [SavingController::class, 'getUserSavings']);
    Route::get('/savings/summary/{userId}', [SavingController::class, 'getSummary']);
});