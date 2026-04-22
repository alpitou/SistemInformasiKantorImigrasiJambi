<?php
// backend/app/Models/File.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class File extends Model
{
    protected $fillable = [
        'file_name',
        'file_category',
        'file_path',
        'access_level',
        'original_name',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];
    
    protected $appends = ['url'];
    
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}