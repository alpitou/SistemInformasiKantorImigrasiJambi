<?php
// app/Http/Requests/Loan/LoanRequest.php
namespace App\Http\Requests\Loan;

use Illuminate\Foundation\Http\FormRequest;

class LoanRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'amount' => 'required|numeric|min:100000|max:500000000',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'tenor_months' => 'required|integer|min:3|max:60',
        ];
    }

    public function messages()
    {
        return [
            'amount.required' => 'Jumlah pinjaman wajib diisi',
            'amount.min' => 'Minimal pinjaman Rp 100.000',
            'amount.max' => 'Maksimal pinjaman Rp 500.000.000',
            'tenor_months.required' => 'Tenor wajib diisi',
            'tenor_months.min' => 'Minimal tenor 3 bulan',
            'tenor_months.max' => 'Maksimal tenor 60 bulan',
        ];
    }
}