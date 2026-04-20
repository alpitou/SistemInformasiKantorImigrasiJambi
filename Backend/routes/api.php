<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SavingController;
use App\Http\Controllers\Api\SavingTypeController;

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

// USER MANAGEMENT (ADMIN ONLY)
Route::middleware(['auth:sanctum', 'role:admin,ketua,sekretaris'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/restore', [UserController::class, 'restore']);
});

// SAVING TYPES (GENERAL)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/saving-types', [SavingTypeController::class, 'index']);
    Route::post('/saving-types', [SavingTypeController::class, 'store']);
    Route::put('/saving-types/{savingType}', [SavingTypeController::class, 'update']);
    
    // SAVINGS
    Route::get('/savings', [SavingController::class, 'index']);
    Route::post('/savings', [SavingController::class, 'store']);
    Route::get('/savings/{id}', [SavingController::class, 'show']);
    Route::get('/savings/user/{userId}', [SavingController::class, 'getUserSavings']);
    Route::get('/savings/summary/{userId}', [SavingController::class, 'getSummary']);
    Route::post('/savings/upload-proof', [SavingController::class, 'uploadProof']);
});