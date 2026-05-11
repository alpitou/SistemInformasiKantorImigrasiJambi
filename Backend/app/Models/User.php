<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';
    
    protected $fillable = [
        'name',
        'role_id',
        'email',
        'password',
        'nip',
        'nik',
        'unit',
        'join_date',
        'phone',
        'status',
        'employment_type',      // Baru
        'cooperative_position', // Baru
        'gender',               // Baru
        'bank_name',
        'account_number',
        'account_name',
        'avatar_path'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'join_date' => 'date',
    ];

    // Relasi ke Role
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // Accessor untuk employment type label
    public function getEmploymentTypeLabelAttribute()
    {
        $types = [
            'pppk' => 'PPPK',
            'outsourcing' => 'Outsourcing',
            'other' => 'Lain-lain'
        ];
        return $types[$this->employment_type] ?? $this->employment_type;
    }

    // Accessor untuk gender label
    public function getGenderLabelAttribute()
    {
        $genders = [
            'male' => 'Laki-laki',
            'female' => 'Perempuan'
        ];
        return $genders[$this->gender] ?? '-';
    }

    // Accessor untuk avatar
    public function getAvatarAttribute()
    {
        if ($this->avatar_path && Storage::disk('public')->exists($this->avatar_path)) {
            return asset('storage/' . $this->avatar_path);
        }
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($this->name);
    }

    // Scope untuk user aktif
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Scope untuk user berdasarkan role
    public function scopeByRole($query, $roleName)
    {
        return $query->whereHas('role', function($q) use ($roleName) {
            $q->where('name', $roleName);
        });
    }
}