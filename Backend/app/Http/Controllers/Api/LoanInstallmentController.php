<?php
// app/Http/Controllers/Api/LoanInstallmentController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Loan\InstallmentRequest;
use App\Models\Loan;
use App\Models\LoanInstallment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LoanInstallmentController extends Controller
{
    public function index($loanId)
    {
        try {
            $loan = Loan::findOrFail($loanId);
            $user = request()->user();

            if (!in_array($user->role->name, ['admin', 'ketua', 'bendahara']) && $loan->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $installments = $loan->installments()->with('receiver')->orderBy('installment_number')->get();

            return response()->json([
                'success' => true,
                'message' => 'Installments retrieved successfully',
                'data' => $installments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve installments: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(InstallmentRequest $request)
    {
        try {
            $user = request()->user();
            $allowedRoles = ['admin', 'ketua', 'bendahara'];
            
            if (!in_array($user->role->name, $allowedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to record payments'
                ], 403);
            }

            DB::beginTransaction();

            $loan = Loan::findOrFail($request->loan_id);

            if (!in_array($loan->status, ['active', 'approved'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot make payment for this loan'
                ], 422);
            }

            if ($request->amount_paid > $loan->remaining_balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount exceeds remaining balance'
                ], 422);
            }

            $installmentNumber = $loan->installments()->count() + 1;

            $installment = LoanInstallment::create([
                'loan_id' => $loan->id,
                'installment_number' => $installmentNumber,
                'amount_paid' => $request->amount_paid,
                'payment_date' => $request->payment_date,
                'payment_method' => $request->payment_method,
                'received_by' => $user->id,
                'notes' => $request->notes
            ]);

            $loan->remaining_balance -= $request->amount_paid;
            
            if ($loan->remaining_balance <= 0) {
                $loan->status = 'completed';
                $loan->remaining_balance = 0;
            } elseif ($loan->status === 'approved') {
                $loan->status = 'active';
            }
            
            $loan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully',
                'data' => $installment->load('receiver')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error recording payment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage()
            ], 500);
        }
    }
}