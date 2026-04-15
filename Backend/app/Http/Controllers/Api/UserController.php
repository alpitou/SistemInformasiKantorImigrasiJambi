<?php
// app/Http/Controllers/Api/UserController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with('role')->paginate($request->get('per_page', 15));
        
        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => $users
        ]);
    }

    public function store(CreateUserRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'role_id' => $request->role_id,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'nip' => $request->nip,
            'nik' => $request->nik,
            'unit' => $request->unit,
            'join_date' => $request->join_date,
            'phone' => $request->phone,
            'status' => $request->status ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user->load('role')
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => $user->load('role')
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->only(['name', 'role_id', 'email', 'nip', 'nik', 'unit', 'join_date', 'phone', 'status']);
        
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }
        
        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh('role')
        ]);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
            'data' => null
        ]);
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();

        return response()->json([
            'success' => true,
            'message' => 'User restored successfully',
            'data' => $user->load('role')
        ]);
    }
}