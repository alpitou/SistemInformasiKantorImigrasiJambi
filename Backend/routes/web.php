<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return 'API is running';
});

Route::get('/api/test', function() {
    return response()->json(['message' => 'API working via web.php']);
});


require __DIR__.'/settings.php';
