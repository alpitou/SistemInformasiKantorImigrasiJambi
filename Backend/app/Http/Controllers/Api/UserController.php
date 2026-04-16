<?php
// app/Http/Controllers/Api/UserController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

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
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('Store user request:', $request->all());

            // Validasi - NIP dan NIK tidak wajib, tapi salah satu bisa diisi
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

            // NIP dan NIK bisa kosong, tidak wajib diisi salah satu
            // Karena bisa jadi karyawan (pakai NIP) atau outsourching (pakai NIK)

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

            // Tambahkan NIP jika ada
            if (!empty($validated['nip'])) {
                $userData['nip'] = $validated['nip'];
            }

            // Tambahkan NIK jika ada
            if (!empty($validated['nik'])) {
                $userData['nik'] = $validated['nik'];
            }

            $user = User::create($userData);

            Log::info('User created successfully:', ['id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user->load('role')
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, User $user)
    {
        try {
            $rules = [
                'name' => 'required|string|max:255',
                'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
                'nip' => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
                'nik' => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
                'unit' => 'required|string',
                'phone' => 'nullable|string',
                'role_id' => 'required|exists:roles,id',
                'join_date' => 'required|date',
                'status' => 'required|in:active,inactive'
            ];

            if ($request->filled('password')) {
                $rules['password'] = 'required|string|min:4';
            }

            $validator = validator($request->all(), $rules);

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
                'unit' => $validated['unit'],
                'phone' => $validated['phone'] ?? null,
                'role_id' => $validated['role_id'],
                'join_date' => $validated['join_date'],
                'status' => $validated['status']
            ];

            // Update NIP jika ada
            if (isset($validated['nip'])) {
                $userData['nip'] = !empty($validated['nip']) ? $validated['nip'] : null;
            }

            // Update NIK jika ada
            if (isset($validated['nik'])) {
                $userData['nik'] = !empty($validated['nik']) ? $validated['nik'] : null;
            }

            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }

            $user->update($userData);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->fresh('role')
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(User $user)
    {
        try {
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