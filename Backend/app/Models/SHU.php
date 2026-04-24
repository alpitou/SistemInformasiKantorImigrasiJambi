<?php
// app/Models/SHU.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SHU extends Model
{
    protected $table = 'shu';
    
    protected $fillable = [
        'year',
        'total_shu',
        'member_share_percentage',
        'member_share_amount',
        'reserve_percentage',
        'reserve_amount',
        'kantin_contribution',
        'interest_income',
        'operational_cost',
        'processed_by',
        'processed_at',
        'notes'
    ];

    protected $casts = [
        'year' => 'integer',
        'total_shu' => 'decimal:2',
        'member_share_percentage' => 'decimal:2',
        'member_share_amount' => 'decimal:2',
        'reserve_percentage' => 'decimal:2',
        'reserve_amount' => 'decimal:2',
        'kantin_contribution' => 'decimal:2',
        'interest_income' => 'decimal:2',
        'operational_cost' => 'decimal:2',
        'processed_at' => 'datetime'
    ];

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}