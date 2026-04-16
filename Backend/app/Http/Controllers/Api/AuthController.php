<?php
// app/Http/Controllers/Api/AuthController.php
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
        Log::info('=== LOGIN ATTEMPT ===');
        Log::info('Request Data:', $request->all());
        
        try {
            $validator = validator($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string|min:4',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // PERBAIKAN: Load role dengan benar
            $user = User::with('role')->where('email', $request->email)->first();
            
            if (!$user) {
                Log::warning('User not found: ' . $request->email);
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak ditemukan'
                ], 401);
            }

            Log::info('User found:', [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->name : 'no role',
                'status' => $user->status
            ]);

            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Password mismatch for user: ' . $user->email);
                return response()->json([
                    'success' => false,
                    'message' => 'Password salah'
                ], 401);
            }

            if ($user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun tidak aktif. Silakan hubungi administrator.'
                ], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            // PERBAIKAN: Response dengan role yang benar
            $response = [
                'success' => true,
                'message' => 'Login berhasil',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ? [
                            'id' => $user->role->id,
                            'name' => $user->role->name
                        ] : ['id' => 5, 'name' => 'member'],
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

            Log::info('Login successful for: ' . $user->email);
            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Login exception: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil'
            ]);
        } catch (\Exception $e) {
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