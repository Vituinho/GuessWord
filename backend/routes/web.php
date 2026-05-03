<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'GuessWord API',
        'status' => 'ok',
    ]);
});
