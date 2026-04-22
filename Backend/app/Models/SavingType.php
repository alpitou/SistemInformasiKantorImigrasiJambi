<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SavingType extends Model
{
    protected $table = 'saving_types';
    
    protected $fillable = ['name', 'default_amount'];

    protected $casts = [
        'default_amount' => 'decimal:2'
    ];

    public function savings(): HasMany
    {
        return $this->hasMany(Saving::class);
    }
}