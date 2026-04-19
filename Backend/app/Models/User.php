<?php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'status'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'join_date' => 'date',
    ];

    // Relasi ke Role
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // Relasi ke Loan (pinjaman yang diajukan user)
    public function loans()
    {
        return $this->hasMany(Loan::class, 'user_id');
    }

    // Relasi ke Loan (pinjaman yang disetujui user)
    public function approvedLoans()
    {
        return $this->hasMany(Loan::class, 'approved_by');
    }

    // Relasi ke LoanInstallment (pembayaran yang diterima user)
    public function receivedInstallments()
    {
        return $this->hasMany(LoanInstallment::class, 'received_by');
    }

    // Cek apakah user memiliki role tertentu
    public function hasRole($roleName)
    {
        return $this->role && $this->role->name === $roleName;
    }

    // Cek apakah user memiliki salah satu dari beberapa role
    public function hasAnyRole($roles)
    {
        return $this->role && in_array($this->role->name, (array) $roles);
    }

    // Cek apakah user adalah admin atau pengurus
    public function isAdmin()
    {
        $adminRoles = ['admin', 'ketua', 'bendahara', 'sekretaris', 'pengawas'];
        return in_array($this->role->name, $adminRoles);
    }

    // Cek apakah user adalah anggota biasa
    public function isMember()
    {
        return $this->role && $this->role->name === 'anggota';
    }

    // Format nama role untuk tampilan
    public function getRoleLabelAttribute()
    {
        $roleMap = [
            'admin' => 'Admin',
            'ketua' => 'Ketua',
            'bendahara' => 'Bendahara',
            'sekretaris' => 'Sekretaris',
            'pengawas' => 'Pengawas',
            'anggota' => 'Anggota'
        ];
        return $roleMap[$this->role->name] ?? $this->role->name;
    }

    // Format status untuk tampilan
    public function getStatusLabelAttribute()
    {
        return $this->status === 'active' ? 'Aktif' : 'Tidak Aktif';
    }

    // Accessor untuk avatar
    public function getAvatarAttribute()
    {
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