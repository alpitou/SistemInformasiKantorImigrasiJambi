<?php

namespace App\Helpers;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogger
{
    public static function log($action, $description, $properties = [])
    {
        try {
            if (Auth::check()) {
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => $action,
                    'description' => $description,
                    'properties' => $properties,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to log activity: ' . $e->getMessage());
        }
    }

    public static function login($user)
    {
        self::log('LOGIN', "User {$user->name} logged in", [
            'email' => $user->email,
            'ip' => request()->ip(),
        ]);
    }

    public static function logout($user)
    {
        self::log('LOGOUT', "User {$user->name} logged out", [
            'email' => $user->email,
        ]);
    }

    public static function createUser($user)
    {
        self::log('CREATE_USER', "User created: {$user->name}", [
            'user_id' => $user->id,
            'email' => $user->email,
            'role_id' => $user->role_id,
        ]);
    }

    public static function updateUser($user, $changes)
    {
        self::log('UPDATE_USER', "User updated: {$user->name}", [
            'user_id' => $user->id,
            'changes' => $changes,
        ]);
    }

    public static function deleteUser($user)
    {
        self::log('DELETE_USER', "User deleted: {$user->name}", [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);
    }

    public static function createLoan($loan)
    {
        self::log('CREATE_LOAN', "Loan application created #{$loan->id}", [
            'loan_id' => $loan->id,
            'amount' => $loan->amount,
            'user_id' => $loan->user_id,
        ]);
    }

    public static function updateLoanStatus($loan, $oldStatus, $newStatus, $approverRole = null)
    {
        $roleText = $approverRole ? " by {$approverRole}" : '';
        self::log('UPDATE_LOAN_STATUS', "Loan #{$loan->id} status changed from {$oldStatus} to {$newStatus}{$roleText}", [
            'loan_id' => $loan->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'amount' => $loan->amount,
        ]);
    }

    public static function paymentInstallment($installment, $loan)
    {
        self::log('PAYMENT_INSTALLMENT', "Installment payment for loan #{$loan->id}", [
            'loan_id' => $loan->id,
            'installment_number' => $installment->installment_number,
            'amount' => $installment->amount_paid,
        ]);
    }

    public static function savingTransaction($saving)
    {
        $typeText = $saving->transaction_type === 'deposit' ? 'deposit' : 'withdrawal';
        self::log('SAVING_TRANSACTION', "Saving {$typeText} of Rp " . number_format($saving->amount, 0, ',', '.'), [
            'saving_id' => $saving->id,
            'user_id' => $saving->user_id,
            'type' => $saving->transaction_type,
            'amount' => $saving->amount,
        ]);
    }

    public static function uploadFile($file)
    {
        self::log('UPLOAD_FILE', "File uploaded: {$file->file_name}", [
            'file_id' => $file->id,
            'category' => $file->file_category,
        ]);
    }

    public static function deleteFile($file)
    {
        self::log('DELETE_FILE', "File deleted: {$file->file_name}", [
            'file_id' => $file->id,
        ]);
    }
}