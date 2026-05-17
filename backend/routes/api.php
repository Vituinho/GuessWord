<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MultiplayerController;
use App\Http\Controllers\Api\VocabularyController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [VocabularyController::class, 'health']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/google-url', [AuthController::class, 'googleUrl']);
Route::get('/auth/google-callback', [AuthController::class, 'googleCallback']);
Route::get('/words', [VocabularyController::class, 'words']);
Route::get('/challenge', [VocabularyController::class, 'challenge']);
Route::post('/attempts', [VocabularyController::class, 'submit']);
Route::get('/progress', [VocabularyController::class, 'progress']);
Route::get('/leaderboard', [VocabularyController::class, 'leaderboard']);
Route::post('/multiplayer/rooms', [MultiplayerController::class, 'create']);
Route::get('/multiplayer/rooms/{code}', [MultiplayerController::class, 'show']);
Route::post('/multiplayer/rooms/{code}/join', [MultiplayerController::class, 'join']);
Route::post('/multiplayer/rooms/{code}/attempts', [MultiplayerController::class, 'attempt']);
