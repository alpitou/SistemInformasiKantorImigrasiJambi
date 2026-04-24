<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KantinIncome extends Model
{
    protected $table = 'kantin_incomes';
    
    protected $fillable = [
        'income_date',
        'description',
        'amount',
        'shu_share_percentage',
        'shu_amount',
        'payment_method',
        'proof_image',
        'created_by',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'shu_share_percentage' => 'decimal:2',
        'shu_amount' => 'decimal:2',
        'income_date' => 'date'
    ];

    protected $attributes = [
        'shu_share_percentage' => 30,
        'shu_amount' => 0
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}