<?php
// app/Http/Controllers/Api/LoanController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $role = $user->role->name ?? 'anggota';
            
            Log::info('Fetching loans for user: ' . $user->id . ', role: ' . $role);
            
            $query = Loan::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser']);

            $isArchive = $request->get('archive', false);
            
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
            
            Log::info('Loans found: ' . $loans->total());

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

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            $request->validate([
                'amount' => 'required|numeric|min:100000|max:500000000',
                'tenor_months' => 'required|integer|min:3|max:60',
                'interest_rate' => 'nullable|numeric|min:0|max:100'
            ]);

            $amount = $request->amount;
            $tenorMonths = $request->tenor_months;
            $interestRate = $request->interest_rate ?? 1.0;
            
            $totalWithInterest = $amount + ($amount * $interestRate / 100);
            $monthlyInstallment = round($totalWithInterest / $tenorMonths, 2);

            DB::beginTransaction();

            $loan = Loan::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'interest_rate' => $interestRate,
                'tenor_months' => $tenorMonths,
                'monthly_installment' => $monthlyInstallment,
                'remaining_balance' => $totalWithInterest,
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

    public function show($id)
    {
        try {
            $loan = Loan::with(['user', 'treasurerApprover', 'chairmanApprover', 'disburser', 'installments.receiver'])->findOrFail($id);
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
            $loan->treasurer_approved_at = now();
            $loan->treasurer_notes = $request->notes;
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan approved by treasurer. Waiting for chairman approval.',
                'data' => $loan->load('user', 'treasurerApprover')
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
            $loan->chairman_approved_at = now();
            $loan->chairman_notes = $request->notes;
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan approved by chairman. Ready for disbursement.',
                'data' => $loan->load('user', 'treasurerApprover', 'chairmanApprover')
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
            $loan->disbursed_at = now();
            $loan->disbursement_notes = $request->notes;
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan funds disbursed successfully. Loan is now active.',
                'data' => $loan->load('user', 'treasurerApprover', 'chairmanApprover', 'disburser')
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

    public function generateAgreement($id)
    {
        try {
            $loan = Loan::with('user')->findOrFail($id);
            $user = request()->user();
            $role = $user->role->name ?? 'anggota';

            if ($loan->user_id !== $user->id && !in_array($role, ['admin', 'ketua', 'bendahara'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $data = [
                'loan' => $loan,
                'user' => $loan->user,
                'monthlyInstallment' => $loan->monthly_installment,
                'totalPayment' => $loan->amount + ($loan->amount * $loan->interest_rate / 100),
                'date' => now()->format('d F Y'),
            ];

            $pdf = Pdf::loadView('pdf.loan-agreement', $data);
            return $pdf->download('surat_perjanjian_pinjaman_' . $loan->id . '.pdf');

        } catch (\Exception $e) {
            Log::error('Error generating agreement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate agreement: ' . $e->getMessage()
            ], 500);
        }
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
            return Storage::disk('public')->download($loan->agreement_document, $fileName);

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
}