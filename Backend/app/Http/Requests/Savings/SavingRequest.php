<?php
// app/Http/Requests/SavingRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavingRequest extends FormRequest
{
   public function authorize(): bool
{
    $user = $this->user();

    return $user && (
        $user->hasAnyRole(['admin', 'bendahara']) ||
        $user->id == $this->input('user_id')
    );
}

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'saving_type_id' => 'required|exists:saving_types,id',
            'amount' => 'required|numeric|min:1',
            'transaction_type' => 'required|in:deposit,withdrawal',
            'description' => 'nullable|string|max:255',
            'transaction_date' => 'required|date|before_or_equal:today',
            'proof_image' => 'nullable|string',
            'verification_status' => 'nullable|string'
        ];
    }
}