<?php
// database/migrations/2025_04_21_000001_create_files_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->enum('file_category', ['report', 'regulation', 'news']);
            $table->string('file_path');
            $table->enum('access_level', ['public', 'member', 'board']);
            $table->string('original_name');
            $table->string('mime_type');
            $table->string('file_size');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};