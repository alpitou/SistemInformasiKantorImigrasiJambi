<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;

// PUBLIC ROUTES - Tidak perlu autentikasi
Route::get('/test', function() {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString()
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

// PROTECTED ROUTES - Perlu autentikasi
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // USER MANAGEMENT (ADMIN ONLY)
    Route::middleware(['role:admin,ketua,sekretaris'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
    });
});