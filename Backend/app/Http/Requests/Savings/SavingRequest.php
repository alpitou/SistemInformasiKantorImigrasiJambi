<?php

namespace App\Http\Requests\Savings;

use Illuminate\Foundation\Http\FormRequest;

class SavingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        
        if ($this->route('user_id')) {
            return $user->hasAnyRole(['admin', 'bendahara']);
        }
        
        return $user->hasAnyRole(['admin', 'bendahara']) || $user->id == $this->user_id;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'saving_type_id' => 'required|exists:saving_types,id',
            'amount' => 'required|numeric|min:1',
            'transaction_type' => 'required|in:deposit,withdrawal',
            'description' => 'nullable|string|max:255',
            'transaction_date' => 'required|date|before_or_equal:today'
        ];
    }
}