<?php
// app/Models/WithdrawalRequest.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalRequest extends Model
{
    protected $table = 'withdrawal_requests';
    
    protected $fillable = [
        'user_id',
        'saving_id',
        'saving_type',
        'amount',
        'reason',
        'bank_name',
        'account_number',
        'account_name',
        'status',
        'treasurer_approved_by',
        'treasurer_approved_at',
        'treasurer_notes',
        'chairman_approved_by',
        'chairman_approved_at',
        'chairman_notes',
        'disbursed_by',
        'disbursed_at',
        'disbursement_notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'treasurer_approved_at' => 'datetime',
        'chairman_approved_at' => 'datetime',
        'disbursed_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function relatedSaving(): BelongsTo
    {
        return $this->belongsTo(Saving::class, 'saving_id');
    }

    public function treasurerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'treasurer_approved_by');
    }

    public function chairmanApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chairman_approved_by');
    }

    public function disburser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }
}