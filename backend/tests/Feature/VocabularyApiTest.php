<?php

namespace Tests\Feature;

use App\Models\Word;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VocabularyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_words_by_level(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->getJson('/api/words?level=A1')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('data.0.level', 'A1');
    }

    public function test_it_records_attempts_and_updates_progress(): void
    {
        $this->seed(DatabaseSeeder::class);
        $word = Word::where('word', 'apple')->firstOrFail();

        $this->postJson('/api/attempts', [
            'client_id' => 'test-client',
            'word_id' => $word->id,
            'answer' => 'apple',
            'seconds_spent' => 4,
            'hints_used' => false,
            'mode' => 'level',
        ])
            ->assertOk()
            ->assertJsonPath('data.correct', true)
            ->assertJsonPath('data.correct_answer', 'apple')
            ->assertJsonPath('data.word_progress.correct_attempts', 1);

        $this->getJson('/api/progress?client_id=test-client')
            ->assertOk()
            ->assertJsonPath('data.accuracy', 100)
            ->assertJsonPath('data.words_seen', 1);
    }
}
