<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        
        Log::channel('daily')->info('Role check:', [
            'user_id' => $user?->id,
            'user_role' => $user?->role?->name,
            'required_roles' => $roles
        ]);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        if (!in_array($user->role->name, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden - You don\'t have permission to access this resource'
            ], 403);
        }

        return $next($request);
    }
}