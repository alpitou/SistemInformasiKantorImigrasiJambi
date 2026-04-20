<?php
// app/Models/Loan.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasFactory;

    protected $table = 'loans';
    
    protected $fillable = [
        'user_id', 'amount', 'interest_rate', 'tenor_months',
        'monthly_installment', 'remaining_balance', 'status',
        'treasurer_approved_by', 'treasurer_approved_at', 'treasurer_notes',
        'chairman_approved_by', 'chairman_approved_at', 'chairman_notes',
        'disbursed_by', 'disbursed_at', 'disbursement_notes',
        'agreement_document', 'agreement_original_name', 
        'document_uploaded_at', 'document_status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'monthly_installment' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'treasurer_approved_at' => 'datetime',
        'chairman_approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'document_uploaded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
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

    public function installments(): HasMany
    {
        return $this->hasMany(LoanInstallment::class, 'loan_id');
    }

    public function getDocumentUrlAttribute()
    {
        if ($this->agreement_document) {
            return asset('storage/' . $this->agreement_document);
        }
        return null;
    }
    
    public function canTreasurerApprove(): bool
    {
        return $this->status === 'pending_treasurer' && $this->document_status === 'uploaded';
    }
    
    public function canChairmanApprove(): bool
    {
        return $this->status === 'pending_chairman';
    }
    
    public function canDisburse(): bool
    {
        return $this->status === 'approved';
    }
}