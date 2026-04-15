<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Debug log
        Log::channel('daily')->info('=== LOGIN ATTEMPT ===');
        Log::channel('daily')->info('Request URL: ' . $request->fullUrl());
        Log::channel('daily')->info('Request Method: ' . $request->method());
        Log::channel('daily')->info('Request Data:', $request->all());
        
        try {
            // Validate request
            $validator = validator($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string|min:4',
            ]);

            if ($validator->fails()) {
                Log::channel('daily')->warning('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find user
            Log::channel('daily')->info('Searching user with email: ' . $request->email);
            $user = User::with('role')->where('email', $request->email)->first();
            
            if (!$user) {
                Log::channel('daily')->warning('User not found: ' . $request->email);
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak ditemukan'
                ], 401);
            }

            Log::channel('daily')->info('User found:', [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->name ?? 'no role',
                'status' => $user->status
            ]);

            // Check password
            Log::channel('daily')->info('Checking password...');
            if (!Hash::check($request->password, $user->password)) {
                Log::channel('daily')->warning('Password mismatch for user: ' . $user->email);
                return response()->json([
                    'success' => false,
                    'message' => 'Password salah'
                ], 401);
            }

            Log::channel('daily')->info('Password matched!');

            // Check status
            if ($user->status !== 'active') {
                Log::channel('daily')->warning('User account inactive: ' . $user->email);
                return response()->json([
                    'success' => false,
                    'message' => 'Akun tidak aktif. Silakan hubungi administrator.'
                ], 403);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;
            Log::channel('daily')->info('Token created for user: ' . $user->email);

            // Return response
            $response = [
                'success' => true,
                'message' => 'Login berhasil',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => [
                            'id' => $user->role->id,
                            'name' => $user->role->name
                        ],
                        'nip' => $user->nip,
                        'nik' => $user->nik,
                        'unit' => $user->unit,
                        'phone' => $user->phone,
                        'status' => $user->status,
                        'join_date' => $user->join_date
                    ],
                    'access_token' => $token,
                    'token_type' => 'Bearer'
                ]
            ];

            Log::channel('daily')->info('Login successful for: ' . $user->email);
            return response()->json($response);

        } catch (\Exception $e) {
            Log::channel('daily')->error('Login exception: ' . $e->getMessage());
            Log::channel('daily')->error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            Log::channel('daily')->info('Logout attempt for user: ' . ($request->user()?->email ?? 'unknown'));
            
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil'
            ]);
        } catch (\Exception $e) {
            Log::channel('daily')->error('Logout error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Logout gagal'
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            $user = $request->user()->load('role');
            
            return response()->json([
                'success' => true,
                'message' => 'Data user ditemukan',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }
    }
}