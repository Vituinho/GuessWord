<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MultiplayerPlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'multiplayer_room_id',
        'client_id',
        'display_name',
        'nationality',
        'score',
        'combo',
        'attempts',
        'correct_attempts',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(MultiplayerRoom::class, 'multiplayer_room_id');
    }
}
