<?php
// app/Policies/FilePolicy.php

namespace App\Policies;

use App\Models\File;
use App\Models\User;

class FilePolicy
{
    public function view(User $user, File $file): bool
    {
        if ($user->hasAnyRole(['admin', 'ketua', 'bendahara', 'pengawas', 'sekretaris'])) {
            return true;
        }

        if ($user->hasRole('anggota')) {
            return in_array($file->access_level, ['public', 'member']);
        }

        return $file->access_level === 'public';
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'ketua', 'sekretaris']);
    }

    public function delete(User $user, File $file): bool
    {
        return $user->hasAnyRole(['admin', 'ketua']) || $user->id === $file->uploaded_by;
    }
}