<?php
// app/Http/Controllers/Api/RoleController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::all();
        
        return response()->json([
            'success' => true,
            'message' => 'Roles retrieved successfully',
            'data' => $roles
        ]);
    }
}