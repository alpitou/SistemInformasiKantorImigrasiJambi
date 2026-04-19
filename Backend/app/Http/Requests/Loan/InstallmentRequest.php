<?php
// app/Http/Requests/Loan/InstallmentRequest.php
namespace App\Http\Requests\Loan;

use Illuminate\Foundation\Http\FormRequest;

class InstallmentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'loan_id' => 'required|exists:loans,id',
            'amount_paid' => 'required|numeric|min:10000',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:transfer,cash,potong_gaji',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'loan_id.required' => 'ID pinjaman wajib diisi',
            'loan_id.exists' => 'Pinjaman tidak ditemukan',
            'amount_paid.required' => 'Jumlah pembayaran wajib diisi',
            'amount_paid.min' => 'Minimal pembayaran Rp 10.000',
            'payment_date.required' => 'Tanggal pembayaran wajib diisi',
            'payment_method.required' => 'Metode pembayaran wajib dipilih',
        ];
    }
}