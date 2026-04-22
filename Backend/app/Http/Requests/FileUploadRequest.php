<?php
// app/Http/Requests/FileUploadRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FileUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'ketua', 'sekretaris']);
    }

    public function rules(): array
    {
        return [
            'file_name' => 'required|string|max:255',
            'file_category' => 'required|in:report,regulation,news',
            'access_level' => 'required|in:public,member,board',
            'file' => 'required|file|max:5120|mimes:pdf,doc,docx,xls,xlsx',
        ];
    }

    public function messages(): array
    {
        return [
            'file.max' => 'File maksimal 5MB',
            'file.mimes' => 'Format file harus: pdf, doc, docx, xls, xlsx',
        ];
    }
}