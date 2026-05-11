<?php
// backend/app/Http/Controllers/Api/FileController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = File::with('uploader');
        $userRole = $user->role->name ?? $user->role ?? 'anggota';
        
        if ($userRole === 'anggota') {
            $query->whereIn('access_level', ['public', 'member']);
        } elseif (!in_array($userRole, ['admin', 'ketua', 'bendahara', 'sekretaris', 'pengawas'])) {
            $query->where('access_level', 'public');
        }
        if ($request->has('category') && $request->category) {
            $query->where('file_category', $request->category);
        }

        $files = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data' => $files
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $userRole = $user->role->name ?? $user->role ?? 'anggota';
        
        if (!in_array($userRole, ['admin', 'ketua', 'sekretaris'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk upload dokumen',
                'data' => null
            ], 403);
        }

        $request->validate([
            'file_name' => 'required|string|max:255',
            'file_category' => 'required|in:report,regulation,news',
            'access_level' => 'required|in:public,member,board',
            'file' => 'required|file|max:5120|mimes:pdf,doc,docx,xls,xlsx',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $fileName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '_' . time() . '.' . $extension;
        
        $path = $file->storeAs('files', $fileName, 'public');

        $fileRecord = File::create([
            'file_name' => $request->file_name,
            'file_category' => $request->file_category,
            'file_path' => $path,
            'access_level' => $request->access_level,
            'original_name' => $originalName,
            'mime_type' => $file->getMimeType(),
            'file_size' => $this->formatBytes($file->getSize()),
            'uploaded_by' => Auth::id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => $fileRecord->load('uploader')
        ], 201);
    }

    public function show(File $file)
    {
        $user = Auth::user();
        $userRole = $user->role->name ?? $user->role ?? 'anggota';
        
        // Checking access
        if ($userRole === 'anggota') {
            if (!in_array($file->access_level, ['public', 'member'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke file ini',
                    'data' => null
                ], 403);
            }
        } elseif (!in_array($userRole, ['admin', 'ketua', 'bendahara', 'sekretaris', 'pengawas'])) {
            if ($file->access_level !== 'public') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke file ini',
                    'data' => null
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data' => $file->load('uploader')
        ]);
    }

    public function destroy(File $file)
    {
        $user = Auth::user();
        $userRole = $user->role->name ?? $user->role ?? 'anggota';
        
        if (!in_array($userRole, ['admin', 'ketua', 'sekretaris'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk menghapus file ini',
                'data' => null
            ], 403);
        }

        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return response()->json([
            'success' => true,
            'message' => 'File deleted',
            'data' => null
        ]);
    }

    public function download(File $file)
    {
        $user = Auth::user();
        $userRole = $user->role->name ?? $user->role ?? 'anggota';
        
        // Checking access
        if ($userRole === 'anggota') {
            if (!in_array($file->access_level, ['public', 'member'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke file ini',
                    'data' => null
                ], 403);
            }
        } elseif (!in_array($userRole, ['admin', 'ketua', 'bendahara', 'sekretaris', 'pengawas'])) {
            if ($file->access_level !== 'public') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke file ini',
                    'data' => null
                ], 403);
            }
        }

        $filePath = Storage::disk('public')->path($file->file_path);
        
        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
                'data' => null
            ], 404);
        }

        return response()->download($filePath, $file->original_name);
    }

    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}