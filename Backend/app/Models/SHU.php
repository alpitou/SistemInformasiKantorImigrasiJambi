<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SHU extends Model
{
    protected $table = 'shu';
    
    protected $fillable = [
        'year',
        'total_shu',
        // Persentase pembagian SHU
        'member_percentage',
        'member_amount',
        'reserve_percentage',
        'reserve_amount',
        'capital_percentage',
        'capital_amount',
        'social_percentage',
        'social_amount',
        'management_percentage',
        'management_amount',
        'supervisor_percentage',
        'supervisor_amount',
        // Data pendukung
        'total_income',
        'total_expense',
        'kantin_income_total',
        'loan_interest_total',
        'processed_by',
        'processed_at',
        'notes'
    ];

    protected $casts = [
        'year' => 'integer',
        'total_shu' => 'decimal:2',
        'member_percentage' => 'decimal:2',
        'member_amount' => 'decimal:2',
        'reserve_percentage' => 'decimal:2',
        'reserve_amount' => 'decimal:2',
        'capital_percentage' => 'decimal:2',
        'capital_amount' => 'decimal:2',
        'social_percentage' => 'decimal:2',
        'social_amount' => 'decimal:2',
        'management_percentage' => 'decimal:2',
        'management_amount' => 'decimal:2',
        'supervisor_percentage' => 'decimal:2',
        'supervisor_amount' => 'decimal:2',
        'total_income' => 'decimal:2',
        'total_expense' => 'decimal:2',
        'kantin_income_total' => 'decimal:2',
        'loan_interest_total' => 'decimal:2',
        'processed_at' => 'datetime'
    ];

    // Persentase default SHU
    const DEFAULT_PERCENTAGES = [
        'member' => 50,      // Anggota
        'reserve' => 10,     // Cadangan
        'capital' => 25,     // Modal Koperasi/Usaha
        'social' => 5,       // Dana Sosial
        'management' => 5,   // Pengurus
        'supervisor' => 5    // Pengawas
    ];

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}