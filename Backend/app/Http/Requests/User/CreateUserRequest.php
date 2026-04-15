<?php
// app/Http/Requests/User/CreateUserRequest.php
namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    public function authorize()
    {
        $user = $this->user();
        return $user && in_array($user->role->name, ['admin', 'ketua', 'sekretaris']);
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'role_id' => 'required|exists:roles,id',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'nip' => 'required|string|unique:users,nip',
            'nik' => 'required|string|unique:users,nik',
            'unit' => 'required|string|max:255',
            'join_date' => 'required|date',
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}