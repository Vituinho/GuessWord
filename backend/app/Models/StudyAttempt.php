<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'word_id',
        'answer',
        'correct',
        'seconds_spent',
        'hints_used',
        'mode',
        'score_delta',
    ];

    protected function casts(): array
    {
        return [
            'correct' => 'boolean',
            'hints_used' => 'boolean',
        ];
    }

    public function word(): BelongsTo
    {
        return $this->belongsTo(Word::class);
    }
}
