<?php
// app/Http/Controllers/Api/LoanController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Barryvdh\DomPDF\Facade\Pdf;

class LoanController extends Controller
{
    /**
     * Get loan settings from cache or database
     */
    private function getLoanSettings()
    {
        $settings = Cache::get('loan_settings');
        
        if (!$settings) {
            // Default values
            $settings = [
                'max_tenor_months' => 10,
                'default_interest_rate' => 1,
                'min_loan_amount' => 100000,
                'max_loan_amount' => 10000000
            ];
        }
        
        return $settings;
    }

    /**
     * Calculate loan interest
     * Formula: (Amount × Interest Rate per month × Tenor) / 100
     */
    private function calculateInterest($amount, $interestRatePerMonth, $tenorMonths)
    {
        // Bunga total = (Pokok × Bunga per bulan × Tenor) / 100
        return ($amount * $interestRatePerMonth * $tenorMonths) / 100;
    }

    /**
     * Calculate monthly installment
     * Formula: (Amount + Total Interest) / Tenor
     */
    private function calculateMonthlyInstallment($amount, $totalInterest, $tenorMonths)
    {
        $totalPayment = $amount + $totalInterest;
        return ceil($totalPayment / $tenorMonths);
    }

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $role = $user->role->name ?? 'anggota';
            
            $query = Loan::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser']);

            $isArchive = $request->input('archive', false);
            
            if ($isArchive) {
                if (in_array($role, ['admin', 'ketua', 'bendahara', 'sekretaris'])) {
                    $query->whereIn('status', ['active', 'approved', 'completed', 'rejected']);
                } elseif ($role === 'anggota') {
                    $query->where('user_id', $user->id)
                          ->whereIn('status', ['active', 'completed', 'rejected']);
                }
            } else {
                if ($role === 'bendahara') {
                    $query->where(function($q) {
                        $q->where('status', 'pending_treasurer')
                          ->where('document_status', 'uploaded');
                    })->orWhere('status', 'approved');
                } 
                elseif ($role === 'ketua') {
                    $query->where('status', 'pending_chairman');
                } 
                elseif ($role === 'admin') {
                    $query->whereIn('status', ['pending_treasurer', 'pending_chairman', 'approved']);
                } 
                else {
                    $query->where('user_id', $user->id);
                }
            }

            $loans = $query->orderBy('created_at', 'desc')->paginate(15);

            return response()->json([
                'success' => true,
                'message' => 'Loans retrieved successfully',
                'data' => $loans
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching loans: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve loans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if member can apply for a new loan
     * Rule: Can top up if previous loan is >= 80% paid
     */
    private function canApplyForLoan($userId, $newAmount)
    {
        $settings = $this->getLoanSettings();
        $maxLoanAmount = $settings['max_loan_amount'];
        
        // Get active loan
        $activeLoan = Loan::where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if (!$activeLoan) {
            return ['allowed' => true, 'message' => null];
        }

        // Calculate total loan with interest (bunga total sudah termasuk dalam remaining_balance)
        $totalLoanWithInterest = $activeLoan->amount + $this->calculateInterest(
            $activeLoan->amount, 
            $activeLoan->interest_rate, 
            $activeLoan->tenor_months
        );
        $paidAmount = $totalLoanWithInterest - $activeLoan->remaining_balance;
        $paidPercentage = ($paidAmount / $totalLoanWithInterest) * 100;

        if ($paidPercentage < 80) {
            return [
                'allowed' => false, 
                'message' => 'Pinjaman sebelumnya harus dilunasi minimal 80% terlebih dahulu. Saat ini baru ' . round($paidPercentage) . '% lunas.'
            ];
        }

        // Check total loan amount including new application
        $existingLoansTotal = Loan::where('user_id', $userId)
            ->whereIn('status', ['active', 'approved', 'pending_treasurer', 'pending_chairman'])
            ->sum('amount');
            
        $totalWithNew = $existingLoansTotal + $newAmount;
        
        if ($totalWithNew > $maxLoanAmount) {
            return [
                'allowed' => false,
                'message' => 'Total pinjaman (termasuk pengajuan ini) melebihi batas maksimal Rp ' . number_format($maxLoanAmount, 0, ',', '.')
            ];
        }

        return ['allowed' => true, 'message' => null];
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            $settings = $this->getLoanSettings();
            
            $minLoanAmount = $settings['min_loan_amount'];
            $maxLoanAmount = $settings['max_loan_amount'];
            $maxTenor = $settings['max_tenor_months'];
            $defaultInterestRate = $settings['default_interest_rate'];

            $request->validate([
                'amount' => 'required|numeric|min:' . $minLoanAmount . '|max:' . $maxLoanAmount,
                'tenor_months' => 'required|integer|min:1|max:' . $maxTenor,
                'interest_rate' => 'nullable|numeric|min:0|max:100',
                'purpose' => 'nullable|string'
            ]);

            $amount = $request->amount;
            $tenorMonths = $request->tenor_months;
            $interestRatePerMonth = $request->interest_rate ?? $defaultInterestRate;

            // PERHITUNGAN BUNGA: (Pokok × Bunga per bulan × Tenor) / 100
            $totalInterest = $this->calculateInterest($amount, $interestRatePerMonth, $tenorMonths);
            $totalWithInterest = $amount + $totalInterest;
            $monthlyInstallment = $this->calculateMonthlyInstallment($amount, $totalInterest, $tenorMonths);

            DB::beginTransaction();

            $loan = Loan::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'interest_rate' => $interestRatePerMonth,
                'tenor_months' => $tenorMonths,
                'monthly_installment' => $monthlyInstallment,
                'remaining_balance' => $totalWithInterest,
                'purpose' => $request->purpose,
                'status' => 'pending_treasurer',
                'document_status' => 'pending'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan application submitted successfully',
                'data' => $loan->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating loan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit loan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate draft agreement WITHOUT saving to database
     */
    public function generateDraftAgreement(Request $request)
    {
        try {
            $settings = $this->getLoanSettings();
            $minLoanAmount = $settings['min_loan_amount'];
            $maxLoanAmount = $settings['max_loan_amount'];
            $maxTenor = $settings['max_tenor_months'];
            $defaultInterestRate = $settings['default_interest_rate'];

            $request->validate([
                'amount' => 'required|numeric|min:' . $minLoanAmount . '|max:' . $maxLoanAmount,
                'tenor_months' => 'required|integer|min:1|max:' . $maxTenor,
                'interest_rate' => 'required|numeric|min:0|max:100',
                'purpose' => 'nullable|string',
                'user_name' => 'required|string',
                'user_nip' => 'nullable|string',
                'user_nik' => 'nullable|string',
                'user_unit' => 'nullable|string'
            ]);

            $amount = $request->amount;
            $tenorMonths = $request->tenor_months;
            $interestRatePerMonth = $request->interest_rate;
            
            // PERHITUNGAN BUNGA: (Pokok × Bunga per bulan × Tenor) / 100
            $totalInterest = $this->calculateInterest($amount, $interestRatePerMonth, $tenorMonths);
            $totalPayment = $amount + $totalInterest;
            $monthlyInstallment = $this->calculateMonthlyInstallment($amount, $totalInterest, $tenorMonths);
            $pokokPerBulan = $amount / $tenorMonths;
            $bungaPerBulan = $totalInterest / $tenorMonths;

            // Create temporary user object for PDF
            $tempUser = new \stdClass();
            $tempUser->name = $request->user_name;
            $tempUser->nip = $request->user_nip;
            $tempUser->nik = $request->user_nik;
            $tempUser->unit = $request->user_unit;
            $tempUser->address = '-';
            $tempUser->phone = '-';
            $tempUser->birth_place = '-';
            $tempUser->birth_date = null;
            $tempUser->position = '-';

            $tempLoan = new \stdClass();
            $tempLoan->id = 'DRAFT';
            $tempLoan->amount = $amount;
            $tempLoan->interest_rate = $interestRatePerMonth;
            $tempLoan->tenor_months = $tenorMonths;
            $tempLoan->monthly_installment = $monthlyInstallment;
            $tempLoan->purpose = $request->purpose;

            $html = $this->generateAgreementHTML([
                'loan' => $tempLoan,
                'user' => $tempUser,
                'monthlyInstallment' => $monthlyInstallment,
                'totalPayment' => $totalPayment,
                'pokokPerBulan' => $pokokPerBulan,
                'bungaPerBulan' => $bungaPerBulan,
                'totalInterest' => $totalInterest,
                'date' => now()->format('d F Y'),
                'is_draft' => true,
                'max_loan_amount' => $maxLoanAmount
            ]);

            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download('draft_perjanjian_pinjaman.pdf');

        } catch (\Exception $e) {
            Log::error('Error generating draft: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate draft: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit loan application with signed document (SAVE TO DATABASE)
     */
    public function submitWithDocument(Request $request)
    {
        try {
            $user = $request->user();
            $settings = $this->getLoanSettings();
            
            $minLoanAmount = $settings['min_loan_amount'];
            $maxLoanAmount = $settings['max_loan_amount'];
            $maxTenor = $settings['max_tenor_months'];
            $defaultInterestRate = $settings['default_interest_rate'];
            
            $request->validate([
                'amount' => 'required|numeric|min:' . $minLoanAmount . '|max:' . $maxLoanAmount,
                'tenor_months' => 'required|integer|min:1|max:' . $maxTenor,
                'interest_rate' => 'required|numeric|min:0|max:100',
                'purpose' => 'nullable|string',
                'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120'
            ]);
    
            // Check if member can apply for top up
            $activeLoan = Loan::where('user_id', $user->id)
                ->where('status', 'active')
                ->first();
    
            if ($activeLoan) {
                $totalLoanWithInterest = $activeLoan->amount + $this->calculateInterest(
                    $activeLoan->amount,
                    $activeLoan->interest_rate,
                    $activeLoan->tenor_months
                );
                $paidAmount = $totalLoanWithInterest - $activeLoan->remaining_balance;
                $paidPercentage = ($paidAmount / $totalLoanWithInterest) * 100;
                
                if ($paidPercentage < 80) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pinjaman sebelumnya harus dilunasi minimal 80% terlebih dahulu. Saat ini baru ' . round($paidPercentage) . '% lunas.'
                    ], 422);
                }
                
                // Check total loan amount
                $totalExistingLoans = Loan::where('user_id', $user->id)
                    ->whereIn('status', ['active', 'approved', 'pending_treasurer', 'pending_chairman'])
                    ->sum('amount');
                    
                if ($totalExistingLoans + $request->amount > $maxLoanAmount) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Total pinjaman (termasuk pengajuan ini) melebihi batas maksimal Rp ' . number_format($maxLoanAmount, 0, ',', '.')
                    ], 422);
                }
            }
    
            $amount = $request->amount;
            $tenorMonths = $request->tenor_months;
            $interestRatePerMonth = $request->interest_rate;
            
            // PERHITUNGAN BUNGA: (Pokok × Bunga per bulan × Tenor) / 100
            $totalInterest = $this->calculateInterest($amount, $interestRatePerMonth, $tenorMonths);
            $totalWithInterest = $amount + $totalInterest;
            $monthlyInstallment = $this->calculateMonthlyInstallment($amount, $totalInterest, $tenorMonths);
    
            DB::beginTransaction();
    
            // Create loan record
            $loan = Loan::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'interest_rate' => $interestRatePerMonth,
                'tenor_months' => $tenorMonths,
                'monthly_installment' => $monthlyInstallment,
                'remaining_balance' => $totalWithInterest,
                'purpose' => $request->purpose,
                'status' => 'pending_treasurer',
                'document_status' => 'uploaded'
            ]);
    
            // Upload document
            $file = $request->file('document');
            $originalName = $file->getClientOriginalName();
            $path = $file->store('loan_documents/' . $loan->id, 'public');
    
            $loan->agreement_document = $path;
            $loan->agreement_original_name = $originalName;
            $loan->document_uploaded_at = now();
            $loan->save();
    
            DB::commit();
    
            return response()->json([
                'success' => true,
                'message' => 'Loan application submitted successfully',
                'data' => $loan
            ], 201);
    
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error submitting loan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit loan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get loan settings API endpoint
     */
    public function getSettings()
    {
        $settings = $this->getLoanSettings();
        
        return response()->json([
            'success' => true,
            'message' => 'Loan settings retrieved successfully',
            'data' => $settings
        ]);
    }

    /**
     * Generate PDF Agreement for existing loan
     */
    public function generateAgreement($id)
    {
        try {
            $loan = Loan::with('user')->findOrFail($id);
            $user = request()->user();
            $role = $user->role->name ?? 'anggota';

            if ($loan->user_id !== $user->id && !in_array($role, ['admin', 'ketua', 'bendahara', 'sekretaris'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            if (!$loan->user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User data not found'
                ], 404);
            }

            $settings = $this->getLoanSettings();
            $totalInterest = $this->calculateInterest($loan->amount, $loan->interest_rate, $loan->tenor_months);
            $totalPayment = $loan->amount + $totalInterest;
            $pokokPerBulan = $loan->amount / $loan->tenor_months;
            $bungaPerBulan = $totalInterest / $loan->tenor_months;
            $monthlyInstallment = $loan->monthly_installment;

            $html = $this->generateAgreementHTML([
                'loan' => $loan,
                'user' => $loan->user,
                'monthlyInstallment' => $monthlyInstallment,
                'totalPayment' => $totalPayment,
                'pokokPerBulan' => $pokokPerBulan,
                'bungaPerBulan' => $bungaPerBulan,
                'totalInterest' => $totalInterest,
                'date' => now()->format('d F Y'),
                'max_loan_amount' => $settings['max_loan_amount']
            ]);

            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'portrait');
            
            return $pdf->download('surat_perjanjian_pinjaman_' . $loan->id . '.pdf');
            
        } catch (\Exception $e) {
            Log::error('Error generating agreement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate agreement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Agreement HTML
     */
    private function generateAgreementHTML($data)
    {
        $loan = $data['loan'];
        $user = $data['user'];
        $monthlyInstallment = $data['monthlyInstallment'];
        $totalPayment = $data['totalPayment'];
        $pokokPerBulan = $data['pokokPerBulan'];
        $bungaPerBulan = $data['bungaPerBulan'];
        $totalInterest = $data['totalInterest'];
        $date = $data['date'];
        $maxLoanAmount = $data['max_loan_amount'] ?? 10000000;
        $loanId = sprintf('PJ/%03d/KOP-IM/JP/%s', $loan->id, date('Y'));

        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Surat Perjanjian Pinjaman</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000000; background: #fff; padding: 40px 50px; }
                .letterhead { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #000; }
                .letterhead .institution { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
                .letterhead .address { font-size: 10pt; margin-top: 4px; }
                .document-title { text-align: center; margin: 20px 0; }
                .document-title .title { font-size: 14pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
                .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .data-table td { padding: 6px 8px; vertical-align: top; }
                .data-table td:first-child { width: 35%; }
                .clause { margin: 15px 0; text-align: justify; }
                .clause-title { font-weight: bold; margin-bottom: 5px; }
                .detail-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .detail-table th, .detail-table td { border: 1px solid #000; padding: 8px 10px; text-align: left; }
                .detail-table th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
                .detail-table td:last-child, .detail-table th:last-child { text-align: right; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
                .signature-wrapper { margin-top: 50px; display: flex; justify-content: flex-end; }
                .signature-container { text-align: center; width: 280px; }
                .signature-date { font-size: 11pt; margin-bottom: 15px; }
                .stamp-box { width: 120px; height: 100px; border: 2px dashed #999; margin: 0 auto 15px auto; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fafafa; }
                .stamp-box span { font-size: 11pt; font-weight: bold; color: #333; }
                .stamp-box small { font-size: 8pt; color: #666; }
                .signature-line { margin-top: 20px; padding-top: 5px; border-top: 1px solid #000; }
                .signature-name { font-weight: bold; margin-top: 5px; }
                .signature-title { font-size: 10pt; margin-top: 3px; }
                .footer { margin-top: 40px; font-size: 9pt; text-align: left; border-top: 1px solid #ccc; padding-top: 15px; color: #666; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
            </style>
        </head>
        <body>
            <div class="letterhead">
                <div class="institution">KOPERASI KANTOR IMIGRASI KELAS I TPI JAMBI</div>
                <div class="address">Jalan HOS Cokroaminoto No. 79, Telanaipura, Kota Jambi - 36122<br>Telp: (0741) 12345 | Email: koperasi@imigrasi.go.id</div>
            </div>

            <div class="document-title">
                <div class="title">SURAT PERJANJIAN PINJAMAN</div>
                <div>Nomor: ' . $loanId . '</div>
            </div>

            <div class="clause">Pada hari ini, <strong>' . date('l, d F Y') . '</strong>, kami yang bertanda tangan di bawah ini:</div>

            <table class="data-table">
                <tr><td><strong>Nama Lengkap</strong></td><td>: ' . htmlspecialchars($user->name) . '</td></tr>
                <tr><td><strong>NIP / NIK</strong></td><td>: ' . htmlspecialchars($user->nip ?? $user->nik ?? '-') . '</td></tr>
                <tr><td><strong>Unit Kerja</strong></td><td>: ' . htmlspecialchars($user->unit ?? '-') . '</td></tr>
                <tr><td><strong>Alamat</strong></td><td>: ' . htmlspecialchars($user->address ?? '-') . '</td></tr>
              </table>

            <div class="clause">Selanjutnya disebut sebagai <strong>PIHAK KESATU / PEMINJAM</strong>.</div>
            <div class="clause">Dengan ini mengajukan pinjaman kepada Koperasi Kantor Imigrasi Kelas I TPI Jambi, selanjutnya disebut sebagai <strong>PIHAK KEDUA / KOPERASI</strong>.</div>

            <div class="clause-title">Pasal 1: BESARAN PINJAMAN</div>
            <div class="clause">PIHAK KEDUA memberikan pinjaman kepada PIHAK KESATU sebesar <strong>Rp ' . number_format($loan->amount, 0, ',', '.') . '</strong> ( ' . $this->terbilang($loan->amount) . ' Rupiah ).</div>

            <div class="clause-title">Pasal 2: JANGKA WAKTU</div>
            <div class="clause">Pinjaman ini diberikan untuk jangka waktu selama <strong>' . $loan->tenor_months . ' ( ' . $this->terbilang($loan->tenor_months) . ' ) bulan</strong>.</div>

            <div class="clause-title">Pasal 3: BUNGA DAN ANGSURAN</div>
            <div class="clause">Atas pinjaman ini dikenakan bunga sebesar <strong>' . $loan->interest_rate . '% ( ' . $this->terbilang($loan->interest_rate) . ' persen ) per bulan</strong> dari jumlah pinjaman.</div>

            <table class="detail-table">
                <thead>
                    <tr><th class="text-center">No</th><th>Keterangan</th><th class="text-center">Per Bulan</th><th class="text-center">Total (' . $loan->tenor_months . ' Bulan)</th></tr>
                </thead>
                <tbody>
                    <tr><td class="text-center">1</td><td>Pokok Pinjaman</td><td class="text-right">Rp ' . number_format($pokokPerBulan, 0, ',', '.') . '</td><td class="text-right">Rp ' . number_format($loan->amount, 0, ',', '.') . '</td></tr>
                    <tr><td class="text-center">2</td><td>Bunga Pinjaman (' . $loan->interest_rate . '% per bulan)</td><td class="text-right">Rp ' . number_format($bungaPerBulan, 0, ',', '.') . '</td><td class="text-right">Rp ' . number_format($totalInterest, 0, ',', '.') . '</td></tr>
                    <tr class="total-row"><td colspan="2" class="text-center"><strong>JUMLAH ANGSURAN</strong></td><td class="text-right"><strong>Rp ' . number_format($monthlyInstallment, 0, ',', '.') . '</strong></td><td class="text-right"><strong>Rp ' . number_format($totalPayment, 0, ',', '.') . '</strong></td></tr>
                </tbody>
            </table>

            <div class="clause">PIHAK KESATU wajib membayar angsuran setiap bulan sebesar <strong>Rp ' . number_format($monthlyInstallment, 0, ',', '.') . '</strong> yang dibayarkan paling lambat setiap tanggal <strong>25</strong> setiap bulannya melalui pemotongan gaji.</div>

            <div class="clause-title">Pasal 4: KETENTUAN TOP UP PINJAMAN</div>
            <div class="clause">Peminjaman kembali (top up) dapat dilakukan apabila pinjaman sebelumnya telah dilunasi sedikitnya <strong>80% (delapan puluh persen)</strong> dari total pinjaman (termasuk bunga), dengan total pinjaman tidak melebihi batas maksimal peminjaman yakni <strong>Rp ' . number_format($maxLoanAmount, 0, ',', '.') . '</strong>.</div>

            <div class="clause-title">Pasal 5: PENUTUP</div>
            <div class="clause">Demikian surat perjanjian ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan sehat jasmani dan rohani serta tanpa paksaan dari pihak manapun.</div>

            <div class="signature-wrapper">
                <div class="signature-container">
                    <div class="signature-date">Jambi, ' . date('d F Y') . '</div>
                    <div class="stamp-box"><span>Rp 10.000</span><small>(Materai)</small></div>
                    <div class="signature-line"></div>
                    <div class="signature-name">' . htmlspecialchars($user->name) . '</div>
                    <div class="signature-title">(Peminjam)</div>
                </div>
            </div>

            <div class="footer">
                <div>Mengetahui,</div>
                <div>Ketua Koperasi Kantor Imigrasi Kelas I TPI Jambi</div>
                <br><br>
                <div>_________________________</div>
            </div>
        </body>
        </html>';
    }

    public function uploadDocument(Request $request, $id)
    {
        try {
            $loan = Loan::findOrFail($id);
            $user = $request->user();

            if ($loan->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            if ($loan->status !== 'pending_treasurer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot upload document at this stage'
                ], 422);
            }

            $request->validate([
                'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($loan->agreement_document && Storage::disk('public')->exists($loan->agreement_document)) {
                Storage::disk('public')->delete($loan->agreement_document);
            }

            $file = $request->file('document');
            $originalName = $file->getClientOriginalName();
            $path = $file->store('loan_documents/' . $loan->id, 'public');

            $loan->agreement_document = $path;
            $loan->agreement_original_name = $originalName;
            $loan->document_uploaded_at = now();
            $loan->document_status = 'uploaded';
            $loan->save();

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => [
                    'document_url' => $loan->document_url,
                    'original_name' => $originalName,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error uploading document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadDocument($id)
    {
        try {
            $loan = Loan::findOrFail($id);
            $user = request()->user();
            $role = $user->role->name ?? 'anggota';

            if (!in_array($role, ['admin', 'ketua', 'bendahara']) && $loan->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            if (!$loan->agreement_document || !Storage::disk('public')->exists($loan->agreement_document)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $fileName = $loan->agreement_original_name ?? 'surat_perjanjian_pinjaman.pdf';
            $filePath = Storage::disk('public')->path($loan->agreement_document);
            return response()->download($filePath, $fileName);

        } catch (\Exception $e) {
            Log::error('Error downloading document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download document: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getDocumentInfo($id)
    {
        try {
            $loan = Loan::findOrFail($id);
            $user = request()->user();
            $role = $user->role->name ?? 'anggota';

            if (!in_array($role, ['admin', 'ketua', 'bendahara']) && $loan->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document info retrieved successfully',
                'data' => [
                    'has_document' => !is_null($loan->agreement_document),
                    'document_url' => $loan->document_url,
                    'original_name' => $loan->agreement_original_name,
                    'uploaded_at' => $loan->document_uploaded_at,
                    'document_status' => $loan->document_status
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get document info: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getInstallments($id)
    {
        try {
            $loan = Loan::findOrFail($id);
            $user = request()->user();
            $role = $user->role->name ?? 'anggota';

            if ($loan->user_id !== $user->id && !in_array($role, ['admin', 'ketua', 'bendahara'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $installments = $loan->installments()->orderBy('installment_number', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Installments retrieved successfully',
                'data' => $installments
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching installments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch installments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper function untuk terbilang
     */
    private function terbilang($angka)
    {
        $angka = abs($angka);
        $baca = array('', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas');
        $terbilang = '';
        
        if ($angka < 12) {
            $terbilang = ' ' . $baca[$angka];
        } elseif ($angka < 20) {
            $terbilang = $this->terbilang($angka - 10) . ' belas';
        } elseif ($angka < 100) {
            $terbilang = $this->terbilang($angka / 10) . ' puluh' . $this->terbilang($angka % 10);
        } elseif ($angka < 200) {
            $terbilang = ' seratus' . $this->terbilang($angka - 100);
        } elseif ($angka < 1000) {
            $terbilang = $this->terbilang($angka / 100) . ' ratus' . $this->terbilang($angka % 100);
        } elseif ($angka < 2000) {
            $terbilang = ' seribu' . $this->terbilang($angka - 1000);
        } elseif ($angka < 1000000) {
            $terbilang = $this->terbilang($angka / 1000) . ' ribu' . $this->terbilang($angka % 1000);
        } elseif ($angka < 1000000000) {
            $terbilang = $this->terbilang($angka / 1000000) . ' juta' . $this->terbilang($angka % 1000000);
        }
        
        return trim($terbilang);
    }

    // ========== METHODS UNTUK ADMIN ==========
    
    public function treasurerApprove(Request $request, $id)
    {
        try {
            $user = request()->user();
            
            if ($user->role->name !== 'bendahara' && $user->role->name !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only treasurer can approve at this stage'
                ], 403);
            }

            DB::beginTransaction();

            $loan = Loan::findOrFail($id);

            if ($loan->status !== 'pending_treasurer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan cannot be approved by treasurer at this stage'
                ], 422);
            }

            if ($loan->document_status !== 'uploaded') {
                return response()->json([
                    'success' => false,
                    'message' => 'Please upload the signed agreement document first'
                ], 422);
            }

            $loan->status = 'pending_chairman';
            $loan->treasurer_approved_by = $user->id;
            $loan->treasurer_approved_at = \Illuminate\Support\Carbon::now();
            $loan->treasurer_notes = $request->notes;
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan approved by treasurer. Waiting for chairman approval.',
                'data' => $loan
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in treasurer approval: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve loan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function chairmanApprove(Request $request, $id)
    {
        try {
            $user = request()->user();
            
            if ($user->role->name !== 'ketua' && $user->role->name !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only chairman can approve at this stage'
                ], 403);
            }

            DB::beginTransaction();

            $loan = Loan::findOrFail($id);

            if ($loan->status !== 'pending_chairman') {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan cannot be approved by chairman at this stage'
                ], 422);
            }

            $loan->status = 'approved';
            $loan->chairman_approved_by = $user->id;
            $loan->chairman_approved_at = \Illuminate\Support\Carbon::now();
            $loan->chairman_notes = $request->notes;
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan approved by chairman. Ready for disbursement.',
                'data' => $loan
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in chairman approval: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve loan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function disburse(Request $request, $id)
    {
        try {
            $user = request()->user();
            
            if ($user->role->name !== 'bendahara' && $user->role->name !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only treasurer can disburse funds'
                ], 403);
            }

            DB::beginTransaction();

            $loan = Loan::findOrFail($id);

            if ($loan->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan cannot be disbursed at this stage'
                ], 422);
            }

            $loan->status = 'active';
            $loan->disbursed_by = $user->id;
            $loan->disbursed_at = \Illuminate\Support\Carbon::now();
            $loan->disbursement_notes = $request->notes;
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan funds disbursed successfully. Loan is now active.',
                'data' => $loan
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in disbursement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to disburse funds: ' . $e->getMessage()
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        try {
            $user = request()->user();
            $allowedRoles = ['admin', 'ketua', 'bendahara'];
            
            if (!in_array($user->role->name, $allowedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to reject loans'
                ], 403);
            }

            DB::beginTransaction();

            $loan = Loan::findOrFail($id);

            if (!in_array($loan->status, ['pending_treasurer', 'pending_chairman'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan cannot be rejected at this stage'
                ], 422);
            }

            $loan->status = 'rejected';
            
            if ($user->role->name === 'bendahara') {
                $loan->treasurer_approved_by = $user->id;
                $loan->treasurer_approved_at = now();
                $loan->treasurer_notes = $request->notes;
            } elseif ($user->role->name === 'ketua') {
                $loan->chairman_approved_by = $user->id;
                $loan->chairman_approved_at = now();
                $loan->chairman_notes = $request->notes;
            }
            
            $loan->save();

            if ($loan->agreement_document && Storage::disk('public')->exists($loan->agreement_document)) {
                Storage::disk('public')->delete($loan->agreement_document);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan rejected successfully',
                'data' => $loan
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error rejecting loan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject loan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $loan = Loan::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser', 'installments'])->findOrFail($id);
            $user = request()->user();
            $role = $user->role->name ?? 'anggota';

            if (!in_array($role, ['admin', 'ketua', 'bendahara']) && $loan->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'Loan retrieved successfully',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Loan not found'
            ], 404);
        }
    }
}