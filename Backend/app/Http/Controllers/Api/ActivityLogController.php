<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|exists:users,id',
            'action' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = ActivityLog::with('user');

        if ($request->has('user_id')) {
            $query->byUser($request->user_id);
        }

        if ($request->has('action')) {
            $query->byAction($request->action);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateBetween($request->start_date, $request->end_date);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 15);
        $logs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Activity logs retrieved successfully',
            'data' => $logs
        ], 200);
    }

    public function show($id)
    {
        $log = ActivityLog::with('user')->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Activity log not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Activity log retrieved successfully',
            'data' => $log
        ], 200);
    }

    public function getActions()
    {
        $actions = ActivityLog::distinct()->orderBy('action')->pluck('action');

        return response()->json([
            'success' => true,
            'message' => 'Actions retrieved successfully',
            'data' => $actions
        ], 200);
    }

    public function export(Request $request)
    {
        $query = ActivityLog::with('user');
        
        if ($request->has('user_id')) {
            $query->byUser($request->user_id);
        }
        if ($request->has('action')) {
            $query->byAction($request->action);
        }
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateBetween($request->start_date, $request->end_date);
        }
        
        $logs = $query->latest()->get();
        
        $csvFileName = 'activity_logs_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$csvFileName}",
        ];
        
        $callback = function() use ($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'User', 'Action', 'Description', 'Properties', 'Created At']);
            
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user->name ?? 'System',
                    $log->action,
                    $log->description,
                    json_encode($log->properties, JSON_UNESCAPED_UNICODE),
                    $log->created_at,
                ]);
            }
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}