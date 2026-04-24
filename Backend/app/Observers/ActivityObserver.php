<?php

namespace App\Observers;

use App\Helpers\ActivityLogger;
use App\Models\User;
use App\Models\Loan;
use App\Models\LoanInstallment;
use App\Models\Saving;
use App\Models\File;

class ActivityObserver
{
    // User Model Events
    public function created(User $user)
    {
        ActivityLogger::createUser($user);
    }

    public function updated(User $user)
    {
        $changes = [];
        foreach ($user->getChanges() as $key => $value) {
            if (!in_array($key, ['updated_at', 'remember_token'])) {
                $changes[$key] = [
                    'old' => $user->getOriginal($key),
                    'new' => $value
                ];
            }
        }
        if (!empty($changes)) {
            ActivityLogger::updateUser($user, $changes);
        }
    }

    public function deleted(User $user)
    {
        ActivityLogger::deleteUser($user);
    }

    // Loan Model Events
    public function created(Loan $loan)
    {
        ActivityLogger::createLoan($loan);
    }

    public function updated(Loan $loan)
    {
        if ($loan->isDirty('status')) {
            $oldStatus = $loan->getOriginal('status');
            $newStatus = $loan->status;
            
            $approverRole = null;
            if ($newStatus === 'pending_chairman') {
                $approverRole = 'Treasurer';
            } elseif ($newStatus === 'approved') {
                $approverRole = 'Chairman';
            } elseif ($newStatus === 'active') {
                $approverRole = 'Treasurer';
            } elseif ($newStatus === 'rejected') {
                $approverRole = auth()->user()->role->name ?? 'Admin';
            }
            
            ActivityLogger::updateLoanStatus($loan, $oldStatus, $newStatus, $approverRole);
        }
    }

    // LoanInstallment Model Events
    public function created(LoanInstallment $installment)
    {
        $loan = $installment->loan;
        ActivityLogger::paymentInstallment($installment, $loan);
    }

    // Saving Model Events
    public function created(Saving $saving)
    {
        ActivityLogger::savingTransaction($saving);
    }

    // File Model Events
    public function created(File $file)
    {
        ActivityLogger::uploadFile($file);
    }

    public function deleted(File $file)
    {
        ActivityLogger::deleteFile($file);
    }
}