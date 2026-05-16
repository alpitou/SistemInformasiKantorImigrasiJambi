<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanInstallmentController;
use App\Http\Controllers\Api\SavingController;
use App\Http\Controllers\Api\SavingTypeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\KantinIncomeController;
use App\Http\Controllers\Api\SHUController;
use App\Http\Controllers\Api\FinancialReportController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\API\ActivityLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\MemberDashboardController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DatabaseBackupController;
use App\Http\Controllers\Api\SettingController;
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

    Route::any('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me']);

    // ==================== LOAN SETTINGS ROUTES ====================
    Route::get('/settings/loan', [SettingController::class, 'getLoanSettings']);
    Route::post('/settings/loan', [SettingController::class, 'updateLoanSettings']);

    // ==================== LOAN ROUTES ====================
    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::post('/loans/generate-draft', [LoanController::class, 'generateDraftAgreement']);
    Route::post('/loans/submit-with-document', [LoanController::class, 'submitWithDocument']);
    Route::get('/loans/{id}', [LoanController::class, 'show']);
    Route::get('/loans/{id}/generate-agreement', [LoanController::class, 'generateAgreement']);
    Route::post('/loans/{id}/upload-document', [LoanController::class, 'uploadDocument']);
    Route::get('/loans/{id}/download-document', [LoanController::class, 'downloadDocument']);
    Route::get('/loans/{id}/document-info', [LoanController::class, 'getDocumentInfo']);
    Route::get('/loans/{id}/installments', [LoanController::class, 'getInstallments']);
    
    Route::put('/loans/{id}/treasurer-approve', [LoanController::class, 'treasurerApprove']);
    Route::put('/loans/{id}/disburse', [LoanController::class, 'disburse']);
    Route::put('/loans/{id}/chairman-approve', [LoanController::class, 'chairmanApprove']);
    Route::put('/loans/{id}/reject', [LoanController::class, 'reject']);

    // ==================== LOAN INSTALLMENT ROUTES ====================
    Route::post('/installments', [LoanInstallmentController::class, 'store']);
    Route::get('/loans/{loanId}/installments', [LoanInstallmentController::class, 'index']);

    // ==================== SAVING TYPES ROUTES ====================
    Route::get('/saving-types', [SavingTypeController::class, 'index']);
    Route::post('/saving-types', [SavingTypeController::class, 'store']);
    Route::put('/saving-types/{savingType}', [SavingTypeController::class, 'update']);
    Route::delete('/saving-types/{savingType}', [SavingTypeController::class, 'destroy']);

    // ==================== SAVINGS ROUTES ====================
    Route::get('/savings', [SavingController::class, 'index']);
    Route::post('/savings', [SavingController::class, 'store']);
    Route::get('/savings/{id}', [SavingController::class, 'show']);
    Route::get('/savings/user/{userId}', [SavingController::class, 'getUserSavings']);
    Route::get('/savings/summary/{userId}', [SavingController::class, 'getSummary']);
    Route::post('/savings/upload-proof', [SavingController::class, 'uploadProof']);
    Route::get('/savings/report/download', [SavingController::class, 'downloadReport']);
    Route::put('/savings/{id}/verify', [SavingController::class, 'verifyDeposit']);

    // ==================== PAYROLL ROUTES ====================
    Route::get('/savings/payroll/check-period', [SavingController::class, 'checkPayrollPeriod']);
    Route::get('/savings/payroll/members', [SavingController::class, 'getPayrollMembers']);
    Route::get('/savings/payroll/history', [SavingController::class, 'getPayrollHistory']);
    Route::post('/savings/payroll/process', [SavingController::class, 'processPayroll']);
    Route::get('/savings/payroll/export', [SavingController::class, 'exportPayroll']);

    // ==================== EXPENSE ROUTES ====================
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/summary', [ExpenseController::class, 'summary']);
    Route::get('/expenses/export', [ExpenseController::class, 'export']);
    Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // ==================== KANTIN INCOME ROUTES ====================
    Route::get('/kantin-incomes', [KantinIncomeController::class, 'index']);
    Route::post('/kantin-incomes', [KantinIncomeController::class, 'store']);
    Route::get('/kantin-incomes/export', [KantinIncomeController::class, 'export']);
    Route::get('/kantin-incomes/{id}', [KantinIncomeController::class, 'show']);
    Route::put('/kantin-incomes/{id}', [KantinIncomeController::class, 'update']);
    Route::delete('/kantin-incomes/{id}', [KantinIncomeController::class, 'destroy']);

    // ==================== SHU ROUTES ====================
    Route::get('/shu/calculate', [SHUController::class, 'calculate']);
    Route::post('/shu/process', [SHUController::class, 'process']);
    Route::get('/shu/history', [SHUController::class, 'history']);
    Route::get('/shu/year/{year}', [SHUController::class, 'getByYear']);

    // ==================== FINANCIAL REPORT ROUTES ====================
    Route::get('/financial/summary', [FinancialReportController::class, 'summary']);
    Route::get('/financial/transactions', [FinancialReportController::class, 'transactions']);
    Route::get('/financial/transactions/export', [FinancialReportController::class, 'exportTransactions']);

    // ==================== BACKWARD COMPATIBILITY ROUTES (Untuk frontend yang masih menggunakan endpoint lama) ====================
    Route::get('/savings/financial/summary', [FinancialReportController::class, 'summary']);
    Route::get('/savings/financial/transactions', [FinancialReportController::class, 'transactions']);
    Route::get('/savings/kantin/incomes', [KantinIncomeController::class, 'index']);
    Route::post('/savings/kantin/incomes', [KantinIncomeController::class, 'store']);
    Route::put('/savings/kantin/incomes/{id}', [KantinIncomeController::class, 'update']);
    Route::delete('/savings/kantin/incomes/{id}', [KantinIncomeController::class, 'destroy']);
    Route::get('/savings/expenses', [ExpenseController::class, 'index']);
    Route::post('/savings/expenses', [ExpenseController::class, 'store']);
    Route::put('/savings/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/savings/expenses/{id}', [ExpenseController::class, 'destroy']);
    Route::get('/savings/financial/shu/calculate', [SHUController::class, 'calculate']);
    Route::post('/savings/financial/shu/process', [SHUController::class, 'process']);
    Route::get('/savings/financial/shu/history', [SHUController::class, 'history']);
    Route::get('/savings/financial', [FinancialReportController::class, 'summary']);

    // ==================== FILES ROUTES ====================
    Route::get('/files', [FileController::class, 'index']);
    Route::get('/files/{file}', [FileController::class, 'show']);
    Route::get('/files/download/{file}', [FileController::class, 'download']);
    Route::post('/files', [FileController::class, 'store']);
    Route::delete('/files/{file}', [FileController::class, 'destroy']);

    // ==================== USER ROUTES ====================
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/restore', [UserController::class, 'restore']);
    Route::put('/users/profile/update', [UserController::class, 'updateProfile']);
    Route::post('/users/profile/change-password', [UserController::class, 'changePassword']);
    Route::post('/users/profile/upload-avatar', [UserController::class, 'uploadAvatar']);

    // ==================== ACTIVITY LOG ROUTES ====================
    Route::prefix('activity-logs')->middleware(['role:admin,ketua,pengawas'])->group(function () {
        Route::get('/actions', [ActivityLogController::class, 'getActions']);
        Route::get('/export', [ActivityLogController::class, 'export']);
        Route::get('/', [ActivityLogController::class, 'index']);
        Route::get('/{id}', [ActivityLogController::class, 'show']);
    });

    // ==================== REPORT ROUTES ====================
    Route::get('/report/rekening-koran/{userId}', [ReportController::class, 'generateRekeningKoran']);

    // ==================== DASHBOARD ROUTES ====================
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/dashboard/chart', [DashboardController::class, 'getChartData']);
    Route::get('/dashboard/saving-composition', [DashboardController::class, 'getSavingComposition']);
    Route::get('/dashboard/recent-activities', [DashboardController::class, 'getRecentActivities']);
    Route::get('/dashboard/quick-links', [DashboardController::class, 'getQuickLinks']);
    Route::post('/dashboard/clear-cache', [DashboardController::class, 'clearCache']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ==================== MEMBER DASHBOARD ROUTES ====================
    Route::get('/member/dashboard/stats', [MemberDashboardController::class, 'getStats']);
    Route::get('/member/dashboard/transactions', [MemberDashboardController::class, 'getRecentTransactions']);
    Route::get('/member/profile', [MemberDashboardController::class, 'getProfile']);

    // ==================== DATABASE BACKUP ROUTES ====================
    Route::prefix('database')->group(function () {
        Route::get('/backup', [DatabaseBackupController::class, 'backup']);
        Route::get('/backups/list', [DatabaseBackupController::class, 'listBackups']);
        Route::get('/backup/download/{filename}', [DatabaseBackupController::class, 'downloadBackup']);
        Route::delete('/backup/delete/{filename}', [DatabaseBackupController::class, 'deleteBackup']);
        Route::delete('/backup/clean', [DatabaseBackupController::class, 'cleanBackups']);
    });

    // ==================== WITHDRAWAL ROUTES ====================
    Route::get('/withdrawals', [WithdrawalController::class, 'index']);
    Route::get('/withdrawals/stats', [WithdrawalController::class, 'stats']);
    Route::post('/withdrawals', [WithdrawalController::class, 'store']);
    Route::get('/withdrawals/{id}', [WithdrawalController::class, 'show']);
    Route::post('/withdrawals/{id}/treasurer-approve', [WithdrawalController::class, 'approveTreasurer']);
    Route::post('/withdrawals/{id}/chairman-approve', [WithdrawalController::class, 'approveChairman']);
    Route::post('/withdrawals/{id}/reject', [WithdrawalController::class, 'reject']);
    Route::post('/withdrawals/{id}/disburse', [WithdrawalController::class, 'disburse']);
});