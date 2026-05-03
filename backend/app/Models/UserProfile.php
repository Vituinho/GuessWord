<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'display_name',
        'nationality',
        'xp',
        'level',
        'current_streak',
        'best_streak',
        'last_studied_on',
    ];

    protected function casts(): array
    {
        return [
            'last_studied_on' => 'date',
        ];
    }
}
