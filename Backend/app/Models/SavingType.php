<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SavingType extends Model
{
    protected $fillable = ['name', 'default_amount'];

    public function savings(): HasMany
    {
        return $this->hasMany(Saving::class);
    }
}