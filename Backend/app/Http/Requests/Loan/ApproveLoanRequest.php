<?php
// app/Http/Requests/Loan/ApproveLoanRequest.php
namespace App\Http\Requests\Loan;

use Illuminate\Foundation\Http\FormRequest;

class ApproveLoanRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'notes' => 'nullable|string|max:500',
        ];
    }
}