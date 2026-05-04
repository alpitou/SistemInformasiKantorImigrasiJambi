<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanInstallmentController;
use App\Http\Controllers\Api\SavingController;
use App\Http\Controllers\Api\SavingTypeController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\API\ActivityLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\MemberDashboardController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DatabaseBackupController;
use App\Http\Controllers\Api\SettingController; // <-- TAMBAHKAN INI
use App\Http\Controllers\Api\WithdrawalController;


Route::get('/test', function () {
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

    // LOAN ROUTES
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
    
    // FILES ROUTES
    Route::get('/files', [FileController::class, 'index']);
    Route::get('/files/{file}', [FileController::class, 'show']);
    Route::get('/files/download/{file}', [FileController::class, 'download']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/files', [FileController::class, 'store']);
        Route::delete('/files/{file}', [FileController::class, 'destroy']);
    });
    
    // USER ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
        
        // PROFILE ROUTES - update current user's profile
        Route::put('/users/profile/update', [UserController::class, 'updateProfile']);
        Route::post('/users/profile/change-password', [UserController::class, 'changePassword']);
    });
    
    // LOAN INSTALLMENT ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/installments', [LoanInstallmentController::class, 'store']);
        Route::get('/loans/{loanId}/installments', [LoanInstallmentController::class, 'index']);
    });
    
    // SAVING TYPES ROUTES
    Route::get('/saving-types', [SavingTypeController::class, 'index']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/saving-types', [SavingTypeController::class, 'store']);
        Route::put('/saving-types/{savingType}', [SavingTypeController::class, 'update']);
    });
    
    // SAVINGS ROUTES
    Route::get('/savings', [SavingController::class, 'index']);
    Route::post('/savings', [SavingController::class, 'store']);
    Route::get('/savings/{id}', [SavingController::class, 'show']);
    Route::get('/savings/user/{userId}', [SavingController::class, 'getUserSavings']);
    Route::get('/savings/summary/{userId}', [SavingController::class, 'getSummary']);
    Route::post('/savings/upload-proof', [SavingController::class, 'uploadProof']);
    Route::get('/savings/report/download', [SavingController::class, 'downloadReport']);

    // EXPORT TRANSACTION HISTORY
    Route::get('/savings/transactions/export', [SavingController::class, 'exportTransactionHistory']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::put('/savings/{id}/verify', [SavingController::class, 'verifyDeposit']);
    });
    
    // PAYROLL ROUTES - Perbaiki nama method yang dipanggil
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/savings/payroll/check-period', [SavingController::class, 'checkPayrollPeriod']);
        Route::get('/savings/payroll/members', [SavingController::class, 'getPayrollMembers']); // Ganti dari getMembersForPayroll
        Route::get('/savings/payroll/history', [SavingController::class, 'getPayrollHistory']);
        Route::post('/savings/payroll/process', [SavingController::class, 'processPayroll']); // Ganti dari processPayrollDeductions
        Route::get('/savings/payroll/export', [SavingController::class, 'exportPayroll']); // Ganti dari exportPayrollHistory
    });
    
    // SHU ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/savings/financial/shu/calculate', [SavingController::class, 'calculateSHU']);
        Route::post('/savings/financial/shu/process', [SavingController::class, 'processSHU']);
        Route::get('/savings/financial/shu/history', [SavingController::class, 'getSHUHistory']);
    });
    
    // KANTIN INCOME ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/savings/kantin/incomes', [SavingController::class, 'getKantinIncomes']);
        Route::post('/savings/kantin/incomes', [SavingController::class, 'storeKantinIncome']);
        Route::put('/savings/kantin/incomes/{id}', [SavingController::class, 'updateKantinIncome']);
        Route::delete('/savings/kantin/incomes/{id}', [SavingController::class, 'deleteKantinIncome']);
    });
    
    // FINANCIAL MANAGEMENT ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/savings/financial/summary', [SavingController::class, 'getFinancialSummary']);
        Route::get('/savings/financial/transactions', [SavingController::class, 'getTransactionHistory']);
        Route::get('/savings/financial', [SavingController::class, 'getFinancialSummary']);
    });
    
    // ==============================================
    // ACTIVITY LOG ROUTES (FIXED ORDER)
    // ==============================================
    Route::middleware(['role:admin,ketua,pengawas'])->prefix('activity-logs')->group(function () {
        Route::get('/actions', [ActivityLogController::class, 'getActions']);
        Route::get('/export', [ActivityLogController::class, 'export']);
        Route::get('/', [ActivityLogController::class, 'index']);
        Route::get('/{id}', [ActivityLogController::class, 'show']);
    });
    
    // REPORT ROUTES
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/report/rekening-koran/{userId}', [ReportController::class, 'generateRekeningKoran']);
    });

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
        Route::get('/dashboard/chart', [DashboardController::class, 'getChartData']);
        Route::get('/dashboard/saving-composition', [DashboardController::class, 'getSavingComposition']);
        Route::get('/dashboard/recent-activities', [DashboardController::class, 'getRecentActivities']);
        Route::get('/dashboard/quick-links', [DashboardController::class, 'getQuickLinks']);
        Route::post('/dashboard/clear-cache', [DashboardController::class, 'clearCache']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });
    
    // Database Backup Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('database')->group(function () {
            Route::get('/backup', [DatabaseBackupController::class, 'backup']);
            Route::get('/backups/list', [DatabaseBackupController::class, 'listBackups']);
            Route::get('/backup/download/{filename}', [DatabaseBackupController::class, 'downloadBackup']);
            Route::delete('/backup/delete/{filename}', [DatabaseBackupController::class, 'deleteBackup']);
            Route::delete('/backup/clean', [DatabaseBackupController::class, 'cleanBackups']);
        });
    });

    // Withdrawal Routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/withdrawals', [WithdrawalController::class, 'index']);
        Route::post('/withdrawals', [WithdrawalController::class, 'store']);
        Route::get('/withdrawals/stats', [WithdrawalController::class, 'getStats']);
        Route::post('/withdrawals/{id}/treasurer-approve', [WithdrawalController::class, 'treasurerApprove']);
        Route::post('/withdrawals/{id}/chairman-approve', [WithdrawalController::class, 'chairmanApprove']);
        Route::post('/withdrawals/{id}/disburse', [WithdrawalController::class, 'disburse']);
        Route::post('/withdrawals/{id}/reject', [WithdrawalController::class, 'reject']);
    });

    // ==================== MEMBER DASHBOARD ROUTES ====================
    Route::get('/member/dashboard/stats', [MemberDashboardController::class, 'getStats']);
    Route::get('/member/dashboard/transactions', [MemberDashboardController::class, 'getRecentTransactions']);
    Route::get('/member/profile', [MemberDashboardController::class, 'getProfile']);
});