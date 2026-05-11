<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use ZipArchive;
use Carbon\Carbon;

class DatabaseBackupController extends Controller
{
    /**
     * Create a database backup and download it
     */
    public function backup(Request $request)
    {
        try {
            // Check permission - only admin or treasurer
            $user = $request->user();
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya admin dan bendahara yang dapat melakukan backup.',
                    'data' => null
                ], 403);
            }

            $backupType = $request->input('type', 'full'); // full, sql, or structure
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $backupDir = storage_path('app/backups');
            
            // Create backup directory if not exists
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            switch ($backupType) {
                case 'sql':
                    $filename = $this->exportSQL($timestamp);
                    break;
                case 'structure':
                    $filename = $this->exportStructure($timestamp);
                    break;
                default:
                    $filename = $this->exportFullBackup($timestamp);
                    break;
            }

            if (!$filename || !file_exists($filename)) {
                throw new \Exception('Gagal membuat file backup');
            }

            // Log backup activity
            Log::info('Database backup created', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'type' => $backupType,
                'filename' => basename($filename)
            ]);

            // Return file for download
            return response()->download($filename, basename($filename), [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . basename($filename) . '"'
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('Backup error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan backup: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Export full backup (SQL + structure + data in zip)
     */
    private function exportFullBackup($timestamp)
    {
        $backupDir = storage_path('app/backups');
        $sqlFile = $backupDir . "/backup_{$timestamp}.sql";
        $zipFile = $backupDir . "/backup_{$timestamp}.zip";
        
        // Export SQL
        $this->exportDatabaseToSQL($sqlFile);
        
        // Create ZIP
        $zip = new ZipArchive();
        if ($zip->open($zipFile, ZipArchive::CREATE) !== true) {
            throw new \Exception('Cannot create zip file');
        }
        
        // Add SQL file to zip
        $zip->addFile($sqlFile, 'database_backup.sql');
        
        // Add metadata file
        $metadata = [
            'backup_date' => Carbon::now()->toDateTimeString(),
            'database_name' => env('DB_DATABASE'),
            'tables_count' => $this->getTableCount(),
            'total_records' => $this->getTotalRecords()
        ];
        
        $zip->addFromString('backup_info.json', json_encode($metadata, JSON_PRETTY_PRINT));
        
        $zip->close();
        
        // Delete temporary SQL file
        if (file_exists($sqlFile)) {
            unlink($sqlFile);
        }
        
        return $zipFile;
    }

    /**
     * Export only SQL dump
     */
    private function exportSQL($timestamp)
    {
        $backupDir = storage_path('app/backups');
        $filename = $backupDir . "/database_backup_{$timestamp}.sql";
        
        $this->exportDatabaseToSQL($filename);
        
        return $filename;
    }

    /**
     * Export only database structure (without data)
     */
    private function exportStructure($timestamp)
    {
        $backupDir = storage_path('app/backups');
        $filename = $backupDir . "/database_structure_{$timestamp}.sql";
        
        $tables = $this->getAllTables();
        $output = "-- Database Structure Backup\n";
        $output .= "-- Generated: " . Carbon::now()->toDateTimeString() . "\n";
        $output .= "-- Database: " . env('DB_DATABASE') . "\n\n";
        
        foreach ($tables as $table) {
            // Get CREATE TABLE statement
            $result = DB::select("SHOW CREATE TABLE `{$table}`");
            if (!empty($result)) {
                $createTable = array_values((array) $result[0])[1];
                $output .= $createTable . ";\n\n";
            }
            
            // Get indexes
            $indexes = DB::select("SHOW INDEX FROM `{$table}`");
            if (!empty($indexes)) {
                $output .= "-- Indexes for `{$table}`\n";
            }
        }
        
        file_put_contents($filename, $output);
        
        return $filename;
    }

    /**
     * Export database to SQL file using mysqldump or manual method
     */
    private function exportDatabaseToSQL($filename)
    {
        $database = env('DB_DATABASE');
        $username = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        $host = env('DB_HOST', '127.0.0.1');
        $port = env('DB_PORT', '3306');

        // Try to use mysqldump command first
        $mysqldumpPath = $this->findMysqldump();
        
        if ($mysqldumpPath) {
            // Use mysqldump for better results
            $command = sprintf(
                '"%s" --host=%s --port=%s --user=%s --password=%s %s --routines --triggers --single-transaction > "%s" 2>&1',
                $mysqldumpPath,
                $host,
                $port,
                $username,
                $password,
                $database,
                $filename
            );
            
            // Execute command
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($filename) && filesize($filename) > 0) {
                return true;
            }
        }
        
        // Fallback: Manual export using PHP
        return $this->manualExportToSQL($filename);
    }

    /**
     * Find mysqldump executable path
     */
    private function findMysqldump()
    {
        $paths = [
            'mysqldump',
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
            '/usr/bin/mysqldump',
            '/usr/local/bin/mysqldump'
        ];
        
        foreach ($paths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        // Check if mysqldump is in PATH
        $output = shell_exec('where mysqldump 2>nul || which mysqldump 2>/dev/null');
        if ($output && trim($output) !== '') {
            return trim($output);
        }
        
        return null;
    }

    /**
     * Manual export to SQL using PHP (fallback)
     */
    private function manualExportToSQL($filename)
    {
        $tables = $this->getAllTables();
        $output = "-- Database Backup\n";
        $output .= "-- Generated: " . Carbon::now()->toDateTimeString() . "\n";
        $output .= "-- Database: " . env('DB_DATABASE') . "\n\n";
        
        // Disable foreign key checks
        $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
        
        foreach ($tables as $table) {
            // Get CREATE TABLE statement
            $result = DB::select("SHOW CREATE TABLE `{$table}`");
            if (!empty($result)) {
                $createTable = array_values((array) $result[0])[1];
                $output .= "DROP TABLE IF EXISTS `{$table}`;\n";
                $output .= $createTable . ";\n\n";
            }
            
            // Get table data
            $rows = DB::table($table)->get();
            if ($rows->count() > 0) {
                $columns = array_keys((array) $rows[0]);
                $columnNames = array_map(function($col) {
                    return "`{$col}`";
                }, $columns);
                
                $output .= "INSERT INTO `{$table}` (" . implode(', ', $columnNames) . ") VALUES\n";
                
                $values = [];
                foreach ($rows as $row) {
                    $rowValues = [];
                    foreach ($columns as $col) {
                        $value = $row->$col;
                        if (is_null($value)) {
                            $rowValues[] = 'NULL';
                        } elseif (is_numeric($value)) {
                            $rowValues[] = $value;
                        } else {
                            $escaped = addslashes($value);
                            $rowValues[] = "'" . $escaped . "'";
                        }
                    }
                    $values[] = "(" . implode(', ', $rowValues) . ")";
                }
                
                $output .= implode(",\n", $values) . ";\n\n";
            }
        }
        
        // Re-enable foreign key checks
        $output .= "SET FOREIGN_KEY_CHECKS=1;\n";
        
        file_put_contents($filename, $output);
        
        return true;
    }

    /**
     * Get all table names from the database
     */
    private function getAllTables()
    {
        $tables = DB::select('SHOW TABLES');
        $tableKey = 'Tables_in_' . env('DB_DATABASE');
        
        return array_map(function($table) use ($tableKey) {
            return $table->$tableKey;
        }, $tables);
    }

    /**
     * Get total number of tables
     */
    private function getTableCount()
    {
        return count($this->getAllTables());
    }

    /**
     * Get total records across all tables
     */
    private function getTotalRecords()
    {
        $total = 0;
        $tables = $this->getAllTables();
        
        foreach ($tables as $table) {
            $count = DB::table($table)->count();
            $total += $count;
        }
        
        return $total;
    }

    /**
     * Get list of available backups
     */
    public function listBackups(Request $request)
    {
        try {
            $user = $request->user();
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak',
                    'data' => null
                ], 403);
            }

            $backupDir = storage_path('app/backups');
            $backups = [];
            
            if (file_exists($backupDir)) {
                $files = scandir($backupDir);
                foreach ($files as $file) {
                    if ($file !== '.' && $file !== '..') {
                        $filePath = $backupDir . '/' . $file;
                        $backups[] = [
                            'filename' => $file,
                            'size' => filesize($filePath),
                            'size_formatted' => $this->formatBytes(filesize($filePath)),
                            'created_at' => date('Y-m-d H:i:s', filemtime($filePath)),
                            'type' => pathinfo($file, PATHINFO_EXTENSION)
                        ];
                    }
                }
            }
            
            // Sort by creation date descending
            usort($backups, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Daftar backup berhasil diambil',
                'data' => $backups
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar backup: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Download specific backup file
     */
    public function downloadBackup($filename, Request $request)
    {
        try {
            $user = $request->user();
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak',
                    'data' => null
                ], 403);
            }

            // Security: prevent directory traversal
            $filename = basename($filename);
            $filePath = storage_path('app/backups/' . $filename);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File backup tidak ditemukan',
                    'data' => null
                ], 404);
            }
            
            return response()->download($filePath, $filename, [
                'Content-Type' => 'application/octet-stream'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunduh backup: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Delete backup file
     */
    public function deleteBackup($filename, Request $request)
    {
        try {
            $user = $request->user();
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak',
                    'data' => null
                ], 403);
            }

            $filename = basename($filename);
            $filePath = storage_path('app/backups/' . $filename);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File backup tidak ditemukan',
                    'data' => null
                ], 404);
            }
            
            unlink($filePath);
            
            Log::info('Backup deleted', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'filename' => $filename
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'File backup berhasil dihapus',
                'data' => null
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus backup: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Clean old backups (keep only last N days)
     */
    public function cleanBackups(Request $request)
    {
        try {
            $user = $request->user();
            if (!in_array($user->role_id, [1, 3])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak',
                    'data' => null
                ], 403);
            }

            $daysToKeep = $request->get('days', 30);
            $backupDir = storage_path('app/backups');
            $deletedCount = 0;
            
            if (file_exists($backupDir)) {
                $files = scandir($backupDir);
                $cutoffDate = Carbon::now()->subDays($daysToKeep);
                
                foreach ($files as $file) {
                    if ($file !== '.' && $file !== '..') {
                        $filePath = $backupDir . '/' . $file;
                        $fileModified = Carbon::createFromTimestamp(filemtime($filePath));
                        
                        if ($fileModified->lt($cutoffDate)) {
                            unlink($filePath);
                            $deletedCount++;
                        }
                    }
                }
            }
            
            Log::info('Old backups cleaned', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'days_to_keep' => $daysToKeep,
                'deleted_count' => $deletedCount
            ]);
            
            return response()->json([
                'success' => true,
                'message' => "Berhasil menghapus {$deletedCount} file backup lama",
                'data' => ['deleted_count' => $deletedCount]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membersihkan backup: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}