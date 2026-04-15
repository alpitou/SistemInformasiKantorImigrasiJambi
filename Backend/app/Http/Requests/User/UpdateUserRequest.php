<?php
// app/Http/Requests/User/UpdateUserRequest.php
namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize()
    {
        $user = $this->user();
        return $user && in_array($user->role->name, ['admin', 'ketua', 'sekretaris']);
    }

    public function rules()
    {
        return [
            'name' => 'sometimes|string|max:255',
            'role_id' => 'sometimes|exists:roles,id',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($this->user)],
            'password' => 'sometimes|string|min:8',
            'nip' => ['sometimes', 'string', Rule::unique('users')->ignore($this->user)],
            'nik' => ['sometimes', 'string', Rule::unique('users')->ignore($this->user)],
            'unit' => 'sometimes|string|max:255',
            'join_date' => 'sometimes|date',
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}