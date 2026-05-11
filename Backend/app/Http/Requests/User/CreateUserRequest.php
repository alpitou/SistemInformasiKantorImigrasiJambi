<?php
namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
            'nip' => 'nullable|string|unique:users,nip',
            'nik' => 'nullable|string|unique:users,nik',
            'unit' => 'required|string',
            'phone' => 'nullable|string',
            'role_id' => 'required|exists:roles,id',
            'join_date' => 'required|date',
            'status' => 'required|in:active,inactive',
            'employment_type' => 'required|in:pppk,outsourcing,other',
            'cooperative_position' => 'nullable|string',
            'gender' => 'required|in:male,female',
            'bank_name' => 'nullable|string',
            'account_number' => 'nullable|string',
            'account_name' => 'nullable|string'
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Nama wajib diisi',
            'email.required' => 'Email wajib diisi',
            'email.unique' => 'Email sudah terdaftar',
            'password.required' => 'Password wajib diisi',
            'password.min' => 'Password minimal 4 karakter',
            'role_id.required' => 'Role wajib dipilih',
            'role_id.exists' => 'Role tidak valid',
            'unit.required' => 'Unit kerja wajib diisi',
            'join_date.required' => 'Tanggal bergabung wajib diisi',
            'employment_type.required' => 'Status kepegawaian wajib dipilih',
            'gender.required' => 'Jenis kelamin wajib dipilih'
        ];
    }
}