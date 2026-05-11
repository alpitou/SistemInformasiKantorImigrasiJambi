<?php
// app/Http/Controllers/Api/UserController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
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
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:4',
                'nip' => 'nullable|string|unique:users,nip',
                'nik' => 'nullable|string|unique:users,nik',
                'unit' => 'required|string',
                'phone' => 'nullable|string',
                'role_id' => 'required|exists:roles,id',
                'join_date' => 'required|date',
                'status' => 'required|in:active,inactive',
                'bank_name' => 'nullable|string',
                'account_number' => 'nullable|string',
                'account_name' => 'nullable|string'
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
                'status' => $validated['status'],
                'bank_name' => $validated['bank_name'] ?? null,
                'account_number' => $validated['account_number'] ?? null,
                'account_name' => $validated['account_name'] ?? null
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

            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email',
                'unit' => 'required|string',
                'phone' => 'nullable|string',
                'role_id' => 'required|exists:roles,id',
                'join_date' => 'required|date',
                'status' => 'required|in:active,inactive',
                'nip' => 'nullable|string',
                'nik' => 'nullable|string',
                'bank_name' => 'nullable|string',
                'account_number' => 'nullable|string',
                'account_name' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Cek duplicate email secara manual
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
            $user->bank_name = $validated['bank_name'] ?? null;
            $user->account_number = $validated['account_number'] ?? null;
            $user->account_name = $validated['account_name'] ?? null;

            if ($request->has('nip')) {
                $user->nip = !empty($validated['nip']) ? $validated['nip'] : null;
            }

            if ($request->has('nik')) {
                $user->nik = !empty($validated['nik']) ? $validated['nik'] : null;
            }

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

    /**
     * Update profile for current authenticated user
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'unit' => 'nullable|string|max:255',
                'bank_name' => 'nullable|string|max:100',
                'account_number' => 'nullable|string|max:50',
                'account_name' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Update only the fields that are provided
            if (isset($validated['name'])) {
                $user->name = $validated['name'];
            }
            if (array_key_exists('phone', $validated)) {
                $user->phone = $validated['phone'];
            }
            if (array_key_exists('unit', $validated)) {
                $user->unit = $validated['unit'];
            }
            if (array_key_exists('bank_name', $validated)) {
                $user->bank_name = $validated['bank_name'];
            }
            if (array_key_exists('account_number', $validated)) {
                $user->account_number = $validated['account_number'];
            }
            if (array_key_exists('account_name', $validated)) {
                $user->account_name = $validated['account_name'];
            }

            $user->save();

            // Refresh user with role relation
            $user->load('role');

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadAvatar(Request $request)
    {
        try {
            $request->validate([
                'avatar' => 'required|file|mimes:jpg,jpeg,png,webp|max:2048'
            ]);

            $user = $request->user();
            $file = $request->file('avatar');

            // Hapus avatar lama jika ada
            if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');

            $user->avatar_path = $path;
            $user->save();
            $user->refresh();
            $user->load('role');
            \Log::info('Avatar uploaded successfully', [
                'user_id' => $user->id,
                'avatar_path' => $user->avatar_path,
                'avatar_url' => $user->avatar
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Foto profil berhasil diupdate',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            \Log::error('Upload avatar error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload foto: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Change password for current authenticated user
     */
    public function changePassword(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:4',
                'confirm_password' => 'required|string|same:new_password'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check current password
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            // Update password
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error changing password: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to change password: ' . $e->getMessage()
            ], 500);
        }
    }
}