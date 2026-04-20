<?php

namespace App\Http\Requests\Savings;

use Illuminate\Foundation\Http\FormRequest;

class SavingTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'bendahara']);
    }

    public function rules(): array
    {
        $rules = [
            'name' => 'required|string|unique:saving_types,name',
            'default_amount' => 'nullable|numeric|min:0'
        ];

        if ($this->isMethod('PUT')) {
            $rules['name'] = 'required|string|unique:saving_types,name,' . $this->saving_type;
        }

        return $rules;
    }
}