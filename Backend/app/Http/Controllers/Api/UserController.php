<?php
// app/Http/Controllers/Api/UserController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $users = User::with('role')->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = validator($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:4',
                'nip' => 'nullable|string|unique:users,nip',
                'nik' => 'nullable|string|unique:users,nik',
                'unit' => 'required|string',
                'phone' => 'nullable|string',
                'role_id' => 'required|exists:roles,id',
                'join_date' => 'required|date',
                'status' => 'required|in:active,inactive'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'unit' => $validated['unit'],
                'phone' => $validated['phone'] ?? null,
                'role_id' => $validated['role_id'],
                'join_date' => $validated['join_date'],
                'status' => $validated['status']
            ];

            if (!empty($validated['nip'])) {
                $userData['nip'] = $validated['nip'];
            }
            if (!empty($validated['nik'])) {
                $userData['nik'] = $validated['nik'];
            }

            $user = User::create($userData);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user->load('role')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with('role')->findOrFail($id);
            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            Log::info('Updating user ID: ' . $id);
            Log::info('Request data:', $request->all());

            // Cari user manual
            $user = User::findOrFail($id);
            
            Log::info('Current user email: ' . $user->email);

            // Validasi dasar - TANPA validasi unique!
            $validator = validator($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email',
                'unit' => 'required|string',
                'phone' => 'nullable|string',
                'role_id' => 'required|exists:roles,id',
                'join_date' => 'required|date',
                'status' => 'required|in:active,inactive',
                'nip' => 'nullable|string',
                'nik' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Cek duplicate email secara manual (abaikan user sendiri)
            if ($validated['email'] !== $user->email) {
                $existing = User::where('email', $validated['email'])->first();
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email sudah digunakan oleh user lain',
                        'errors' => ['email' => ['The email has already been taken.']]
                    ], 422);
                }
            }

            // Cek duplicate NIP secara manual
            if (isset($validated['nip']) && $validated['nip'] !== $user->nip && !empty($validated['nip'])) {
                $existing = User::where('nip', $validated['nip'])->first();
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'NIP sudah digunakan oleh user lain',
                        'errors' => ['nip' => ['The nip has already been taken.']]
                    ], 422);
                }
            }

            // Cek duplicate NIK secara manual
            if (isset($validated['nik']) && $validated['nik'] !== $user->nik && !empty($validated['nik'])) {
                $existing = User::where('nik', $validated['nik'])->first();
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'NIK sudah digunakan oleh user lain',
                        'errors' => ['nik' => ['The nik has already been taken.']]
                    ], 422);
                }
            }

            // Update data
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->unit = $validated['unit'];
            $user->phone = $validated['phone'] ?? null;
            $user->role_id = $validated['role_id'];
            $user->join_date = $validated['join_date'];
            $user->status = $validated['status'];
            
            // Handle NIP
            if ($request->has('nip')) {
                $user->nip = !empty($validated['nip']) ? $validated['nip'] : null;
            }
            
            // Handle NIK
            if ($request->has('nik')) {
                $user->nik = !empty($validated['nik']) ? $validated['nik'] : null;
            }
            
            // Handle password
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }
            
            $user->save();

            Log::info('User updated successfully');

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->load('role')
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();
            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->restore();
            return response()->json([
                'success' => true,
                'message' => 'User restored successfully',
                'data' => $user->load('role')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore user: ' . $e->getMessage()
            ], 500);
        }
    }
}