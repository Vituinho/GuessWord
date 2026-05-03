<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WordProgress extends Model
{
    use HasFactory;

    protected $table = 'word_progress';

    protected $fillable = [
        'client_id',
        'word_id',
        'attempts',
        'correct_attempts',
        'incorrect_attempts',
        'streak_correct',
        'interval_days',
        'ease_factor',
        'learned',
        'last_answered_at',
        'next_review_at',
    ];

    protected function casts(): array
    {
        return [
            'ease_factor' => 'float',
            'learned' => 'boolean',
            'last_answered_at' => 'datetime',
            'next_review_at' => 'datetime',
        ];
    }

    public function word(): BelongsTo
    {
        return $this->belongsTo(Word::class);
    }
}
