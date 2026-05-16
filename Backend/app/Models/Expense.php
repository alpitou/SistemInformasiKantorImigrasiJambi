<?php
// app/Models/Expense.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $table = 'expenses';
    
    protected $fillable = [
        'expense_date',
        'description',
        'amount',
        'category',
        'payment_method',
        'proof_image',
        'created_by',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date'
    ];

    const CATEGORIES = [
        'operasional' => 'Operasional Kantor',
        'gaji' => 'Gaji Karyawan',
        'perawatan' => 'Perawatan & Perbaikan',
        'promosi' => 'Promosi & Marketing',
        'sosial' => 'Dana Sosial',
        'lainnya' => 'Lainnya'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}