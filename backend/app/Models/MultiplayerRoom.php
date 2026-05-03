<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MultiplayerRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'host_client_id',
        'level',
        'status',
        'round_seconds',
        'current_word_id',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function currentWord(): BelongsTo
    {
        return $this->belongsTo(Word::class, 'current_word_id');
    }

    public function players(): HasMany
    {
        return $this->hasMany(MultiplayerPlayer::class);
    }
}
