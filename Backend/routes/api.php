<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanInstallmentController;
use App\Http\Controllers\Api\SavingController;
use App\Http\Controllers\Api\SavingTypeController;
use App\Http\Controllers\Api\FileController;

Route::get('/test', function() {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString()
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::get('/loans/{id}', [LoanController::class, 'show']);
    Route::get('/loans/{id}/generate-agreement', [LoanController::class, 'generateAgreement']);
    Route::post('/loans/{id}/upload-document', [LoanController::class, 'uploadDocument']);
    Route::get('/loans/{id}/download-document', [LoanController::class, 'downloadDocument']);
    Route::get('/loans/{id}/document-info', [LoanController::class, 'getDocumentInfo']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::put('/loans/{id}/treasurer-approve', [LoanController::class, 'treasurerApprove']);
        Route::put('/loans/{id}/disburse', [LoanController::class, 'disburse']);
        Route::put('/loans/{id}/chairman-approve', [LoanController::class, 'chairmanApprove']);
        Route::put('/loans/{id}/reject', [LoanController::class, 'reject']);
    });
    
    Route::get('/files', [FileController::class, 'index']);
    Route::get('/files/{file}', [FileController::class, 'show']);
    Route::get('/files/download/{file}', [FileController::class, 'download']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/files', [FileController::class, 'store']);
        Route::delete('/files/{file}', [FileController::class, 'destroy']);
    });
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
    });
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/installments', [LoanInstallmentController::class, 'store']);
        Route::get('/loans/{loanId}/installments', [LoanInstallmentController::class, 'index']);
    });
    
    Route::get('/saving-types', [SavingTypeController::class, 'index']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/saving-types', [SavingTypeController::class, 'store']);
        Route::put('/saving-types/{savingType}', [SavingTypeController::class, 'update']);
    });
    
    Route::get('/savings', [SavingController::class, 'index']);
    Route::post('/savings', [SavingController::class, 'store']);
    Route::get('/savings/{id}', [SavingController::class, 'show']);
    Route::get('/savings/user/{userId}', [SavingController::class, 'getUserSavings']);
    Route::get('/savings/summary/{userId}', [SavingController::class, 'getSummary']);
    Route::post('/savings/upload-proof', [SavingController::class, 'uploadProof']);
    Route::get('/savings/report/download', [SavingController::class, 'downloadReport']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::put('/savings/{id}/verify', [SavingController::class, 'verifyDeposit']);
    });
    
    // PAYROLL ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/savings/payroll/check-period', [SavingController::class, 'checkPayrollPeriod']);
        Route::get('/savings/payroll/members', [SavingController::class, 'getMembersForPayroll']);
        Route::get('/savings/payroll/history', [SavingController::class, 'getPayrollHistory']);
        Route::post('/savings/payroll/process', [SavingController::class, 'processPayrollDeductions']);
        Route::get('/savings/payroll/export', [SavingController::class, 'exportPayrollHistory']);
    });
});