<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Word extends Model
{
    use HasFactory;

    protected $fillable = [
        'word',
        'definition',
        'example',
        'level',
        'part_of_speech',
    ];

    public function progress(): HasMany
    {
        return $this->hasMany(WordProgress::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(StudyAttempt::class);
    }

    public function exampleWithBlank(): string
    {
        return preg_replace('/\b'.preg_quote($this->word, '/').'\b/i', '_____', $this->example, 1)
            ?? $this->example;
    }
}
