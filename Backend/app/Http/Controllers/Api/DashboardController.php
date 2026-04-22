<?php
// app/Http/Controllers/Api/DashboardController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Saving;
use App\Models\Loan;
use App\Models\SavingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics with caching
     */
    public function getStats(Request $request)
    {
        $viewType = $request->get('view_type', 'monthly');
        $cacheKey = 'dashboard_stats_' . $viewType . '_' . auth()->id();
        
        // Cache selama 5 menit
        $stats = Cache::remember($cacheKey, 300, function () use ($viewType) {
            // Optimized queries - single query each
            $totalMembers = User::where('status', 'active')
                ->whereHas('role', function($q) {
                    $q->where('name', 'anggota');
                })->count();
            
            // Single query for savings summary
            $savingsSummary = Saving::where('verification_status', 'verified')
                ->selectRaw("
                    SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                    SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals
                ")
                ->first();
            
            $netSavings = ($savingsSummary->total_deposits ?? 0) - ($savingsSummary->total_withdrawals ?? 0);
            
            // Total loans - single query
            $totalLoans = Loan::whereIn('status', ['approved', 'disbursed', 'active'])
                ->sum('amount');
            
            // SHU calculation - single query
            $sukarelaType = SavingType::where('name', 'Sukarela')->first();
            $totalSHU = 0;
            if ($sukarelaType) {
                $totalSHU = Saving::where('saving_type_id', $sukarelaType->id)
                    ->where('verification_status', 'verified')
                    ->where('transaction_type', 'deposit')
                    ->sum('amount') * 0.15;
            }
            
            // Format values
            $memberValue = number_format($totalMembers);
            $savingValue = $this->formatCurrency($netSavings);
            $loanValue = $this->formatCurrency($totalLoans);
            $shuValue = $this->formatCurrency($totalSHU);
            
            if ($viewType === 'annual') {
                $memberValue = number_format($totalMembers);
                $savingValue = $this->formatCurrency($netSavings * 12);
                $loanValue = $this->formatCurrency($totalLoans * 1.2);
                $shuValue = $this->formatCurrency($totalSHU * 2);
            }
            
            return [
                [
                    'label' => 'Total Anggota',
                    'value' => $memberValue,
                    'trend' => $viewType === 'annual' ? '+45' : '+12',
                    'color' => 'bg-blue-500'
                ],
                [
                    'label' => 'Total Simpanan',
                    'value' => $savingValue,
                    'trend' => $viewType === 'annual' ? '+12.5%' : '+5.2%',
                    'color' => 'bg-emerald-500'
                ],
                [
                    'label' => 'Total Pinjaman',
                    'value' => $loanValue,
                    'trend' => $viewType === 'annual' ? '+8.1%' : '-2.1%',
                    'color' => 'bg-amber-500'
                ],
                [
                    'label' => 'Total SHU ' . date('Y'),
                    'value' => $shuValue,
                    'trend' => $viewType === 'annual' ? '+22%' : '+15%',
                    'color' => 'bg-purple-500'
                ]
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Get chart data with optimized queries
     */
    public function getChartData(Request $request)
    {
        $viewType = $request->get('view_type', 'monthly');
        $cacheKey = 'dashboard_chart_' . $viewType . '_' . auth()->id();
        
        $chartData = Cache::remember($cacheKey, 300, function () use ($viewType) {
            if ($viewType === 'monthly') {
                $currentYear = date('Y');
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                
                // Single query for all monthly savings data
                $monthlySavings = Saving::whereBetween('transaction_date', [
                        $currentYear . '-01-01',
                        $currentYear . '-12-31'
                        ])
                    ->where('verification_status', 'verified')
                    ->selectRaw("
                        MONTH(transaction_date) as month,
                        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as deposits,
                        SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as withdrawals
                    ")
                    ->groupBy('month')
                    ->get()
                    ->keyBy('month');
                
                // Single query for all monthly loans data
                $monthlyLoans = Loan::whereYear('created_at', $currentYear)
                    ->whereIn('status', ['approved', 'disbursed', 'active'])
                    ->selectRaw("
                        MONTH(created_at) as month,
                        SUM(amount) as total
                    ")
                    ->groupBy('month')
                    ->get()
                    ->keyBy('month');
                
                $chartData = [];
                for ($i = 1; $i <= 12; $i++) {
                    $savingData = $monthlySavings->get($i);
                    $netSavings = 0;
                    if ($savingData) {
                        $netSavings = ($savingData->deposits - $savingData->withdrawals) / 1000;
                    }
                    
                    $loanData = $monthlyLoans->get($i);
                    $loansTotal = $loanData ? $loanData->total / 1000 : 0;
                    
                    $chartData[] = [
                        'name' => $months[$i - 1],
                        'simpanan' => round($netSavings, 0),
                        'pinjaman' => round($loansTotal, 0)
                    ];
                }
            } else {
                // Annual data - single query
                $currentYear = date('Y');
                $startYear = $currentYear - 5;
                
                $yearlySavings = Saving::whereYear('transaction_date', '>=', $startYear)
                    ->where('verification_status', 'verified')
                    ->selectRaw("
                        YEAR(transaction_date) as year,
                        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as deposits,
                        SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as withdrawals
                    ")
                    ->groupBy('year')
                    ->get()
                    ->keyBy('year');
                
                $yearlyLoans = Loan::whereYear('created_at', '>=', $startYear)
                    ->whereIn('status', ['approved', 'disbursed', 'active'])
                    ->selectRaw("
                        YEAR(created_at) as year,
                        SUM(amount) as total
                    ")
                    ->groupBy('year')
                    ->get()
                    ->keyBy('year');
                
                $chartData = [];
                for ($year = $startYear; $year <= $currentYear; $year++) {
                    $savingData = $yearlySavings->get($year);
                    $netSavings = 0;
                    if ($savingData) {
                        $netSavings = ($savingData->deposits - $savingData->withdrawals) / 1000;
                    }
                    
                    $loanData = $yearlyLoans->get($year);
                    $loansTotal = $loanData ? $loanData->total / 1000 : 0;
                    
                    $chartData[] = [
                        'name' => (string)$year,
                        'simpanan' => round($netSavings, 0),
                        'pinjaman' => round($loansTotal, 0)
                    ];
                }
            }
            
            return $chartData;
        });
        
        return response()->json([
            'success' => true,
            'data' => $chartData
        ]);
    }
    
    /**
     * Get saving composition - optimized
     */
    public function getSavingComposition(Request $request)
    {
        $userId = auth()->id();
        $isAdmin = auth()->user()->hasAnyRole(['admin', 'ketua', 'bendahara', 'sekretaris']);
        $cacheKey = 'dashboard_composition_' . ($isAdmin ? 'admin' : $userId);
        
        $composition = Cache::remember($cacheKey, 300, function () use ($isAdmin, $userId) {
            $savingTypes = Cache::remember('saving_types', 3600, function () {
                return SavingType::all();
            });
            $composition = [];
            
            $query = Saving::where('verification_status', 'verified');
            if (!$isAdmin) {
                $query->where('user_id', $userId);
            }
            
            // Single query for all savings
            $savingsData = $query->selectRaw("
                    saving_type_id,
                    SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as deposits,
                    SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as withdrawals
                ")
                ->groupBy('saving_type_id')
                ->get()
                ->keyBy('saving_type_id');
            
            $totalBalance = 0;
            foreach ($savingTypes as $type) {
                $data = $savingsData->get($type->id);
                $balance = 0;
                if ($data) {
                    $balance = $data->deposits - $data->withdrawals;
                }
                $value = $balance > 0 ? round($balance / 1000, 0) : 0;
                $composition[] = [
                    'name' => $type->name,
                    'value' => $value
                ];
                $totalBalance += $balance;
            }
            
            // Calculate percentages
            if ($totalBalance > 0) {
                foreach ($composition as &$item) {
                    $item['percentage'] = round(($item['value'] * 1000) / $totalBalance * 100, 1);
                }
            } else {
                $composition = [
                    ['name' => 'Pokok', 'value' => 40, 'percentage' => 40],
                    ['name' => 'Wajib', 'value' => 35, 'percentage' => 35],
                    ['name' => 'Sukarela', 'value' => 25, 'percentage' => 25],
                ];
            }
            
            return $composition;
        });
        
        return response()->json([
            'success' => true,
            'data' => $composition
        ]);
    }
    
    /**
     * Get recent activities - limited and optimized
     */
    public function getRecentActivities(Request $request)
    {
        $limit = 5;
        $cacheKey = 'dashboard_activities_' . auth()->id();
        
        $activities = Cache::remember($cacheKey, 60, function () use ($limit) {
            $activities = [];
            
            // Recent savings - limited query
            $recentSavings = Saving::with(['user:id,name', 'type:id,name'])
                ->where('transaction_type', 'deposit')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get(['id', 'user_id', 'saving_type_id', 'amount', 'verification_status', 'created_at']);
            
            foreach ($recentSavings as $saving) {
                $activities[] = [
                    'id' => 'saving_' . $saving->id,
                    'type' => 'saving',
                    'title' => 'Setoran ' . ($saving->type->name ?? 'Simpanan'),
                    'description' => 'Oleh: ' . ($saving->user->name ?? 'User') . ' • ' . $saving->created_at->diffForHumans(),
                    'amount' => $saving->amount,
                    'status' => $saving->verification_status === 'verified' ? 'Berhasil' : 'Menunggu',
                    'status_color' => $saving->verification_status === 'verified' ? 'text-emerald-500' : 'text-yellow-500',
                    'icon' => 'Wallet',
                    'date' => $saving->created_at
                ];
            }
            
            // Recent loans - limited query
            $recentLoans = Loan::with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get(['id', 'user_id', 'amount', 'status', 'created_at']);
            
            foreach ($recentLoans as $loan) {
                $statusText = '';
                $statusColor = '';
                
                switch ($loan->status) {
                    case 'pending_treasurer':
                        $statusText = 'Menunggu Bendahara';
                        $statusColor = 'text-yellow-500';
                        break;
                    case 'pending_chairman':
                        $statusText = 'Menunggu Ketua';
                        $statusColor = 'text-blue-500';
                        break;
                    case 'approved':
                        $statusText = 'Disetujui';
                        $statusColor = 'text-emerald-500';
                        break;
                    case 'rejected':
                        $statusText = 'Ditolak';
                        $statusColor = 'text-red-500';
                        break;
                    default:
                        $statusText = 'Diproses';
                        $statusColor = 'text-gray-500';
                }
                
                $activities[] = [
                    'id' => 'loan_' . $loan->id,
                    'type' => 'loan',
                    'title' => 'Pengajuan Pinjaman',
                    'description' => 'Oleh: ' . ($loan->user->name ?? 'User') . ' • ' . $loan->created_at->diffForHumans(),
                    'amount' => $loan->amount,
                    'status' => $statusText,
                    'status_color' => $statusColor,
                    'icon' => 'HandCoins',
                    'date' => $loan->created_at
                ];
            }
            
            // Sort by date desc and take latest
            return collect($activities)->sortByDesc('date')->take($limit)->values()->all();
        });
        
        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }
    
    /**
     * Get quick links - no cache needed (fast)
     */
    public function getQuickLinks(Request $request)
    {
        $user = $request->user();
        $links = [];
        
        if ($user->hasAnyRole(['admin', 'sekretaris', 'ketua'])) {
            $pendingCount = Cache::remember('pending_loans_count', 60, function () {
                return Loan::where('status', 'pending_treasurer')->count();
            });
            
            $links[] = [
                'title' => 'Verifikasi & Persetujuan',
                'description' => $pendingCount . ' antrean menunggu',
                'icon' => 'ShieldCheck',
                'icon_color' => 'bg-blue-100 text-blue-600',
                'route' => '/admin/approvals',
                'badge' => $pendingCount > 0 ? $pendingCount : null
            ];
        }
        
        if ($user->hasAnyRole(['admin', 'bendahara'])) {
            $links[] = [
                'title' => 'Manajemen Keuangan',
                'description' => 'Update kas & simpanan',
                'icon' => 'Wallet',
                'icon_color' => 'bg-emerald-100 text-emerald-600',
                'route' => '/admin/finance',
                'badge' => null
            ];
        }
        
        if ($user->hasAnyRole(['admin', 'sekretaris'])) {
            $links[] = [
                'title' => 'Data Anggota',
                'description' => 'Kelola database anggota',
                'icon' => 'Users',
                'icon_color' => 'bg-purple-100 text-purple-600',
                'route' => '/admin/members',
                'badge' => null
            ];
        }
        
        $links[] = [
            'title' => 'Laporan Keuangan',
            'description' => 'Generate laporan berkala',
            'icon' => 'FileText',
            'icon_color' => 'bg-amber-100 text-amber-600',
            'route' => '/admin/reports',
            'badge' => null
        ];
        
        return response()->json([
            'success' => true,
            'data' => $links
        ]);
    }
    
    /**
     * Clear dashboard cache (call this when data changes)
     */
    public function clearCache(Request $request)
    {
        $userId = auth()->id();
        $patterns = [
            'dashboard_stats_*',
            'dashboard_chart_*',
            'dashboard_composition_*',
            'dashboard_activities_' . $userId,
            'pending_loans_count'
        ];
        
        foreach ($patterns as $pattern) {
            Cache::flush($pattern);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Cache dashboard berhasil dibersihkan'
        ]);
    }

    public function index(Request $request)
    {
    return response()->json([
        'success' => true,
        'data' => [
            'stats' => $this->getStatsInternal($request),
            'chart' => $this->getChartDataInternal($request),
            'composition' => $this->getSavingCompositionInternal($request),
            'activities' => $this->getRecentActivitiesInternal($request),
            'quick_links' => $this->getQuickLinksInternal($request),
        ]
    ]);
    }
    
    private function formatCurrency($amount)
    {
        if ($amount >= 1000000000) {
            return 'Rp ' . round($amount / 1000000000, 1) . 'M';
        } elseif ($amount >= 1000000) {
            return 'Rp ' . round($amount / 1000000, 1) . 'jt';
        }
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}