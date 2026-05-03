<?php

namespace Tests\Feature;

use App\Models\Word;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndMultiplayerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_nationality(): void
    {
        $this->postJson('/api/auth/login', [
            'name' => 'Ana Silva',
            'email' => 'ana@example.com',
            'nationality' => 'Brazil',
            'provider' => 'gmail',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Ana Silva')
            ->assertJsonPath('data.nationality', 'Brazil')
            ->assertJsonPath('data.gmail_connected', true);
    }

    public function test_email_login_requires_password(): void
    {
        $this->postJson('/api/auth/login', [
            'name' => 'Leo',
            'email' => 'leo@example.com',
            'nationality' => 'Brazil',
            'provider' => 'email',
            'password' => 'secret123',
        ])
            ->assertOk()
            ->assertJsonPath('data.email', 'leo@example.com');
    }

    public function test_players_can_create_join_and_score_in_a_room(): void
    {
        $this->seed(DatabaseSeeder::class);
        $word = Word::where('word', 'apple')->firstOrFail();

        $roomCode = $this->postJson('/api/multiplayer/rooms', [
            'client_id' => 'host',
            'display_name' => 'Host',
            'nationality' => 'Brazil',
            'level' => 'A1',
        ])
            ->assertCreated()
            ->json('data.code');

        $this->postJson("/api/multiplayer/rooms/{$roomCode}/join", [
            'client_id' => 'guest',
            'display_name' => 'Guest',
            'nationality' => 'Canada',
        ])->assertOk();

        $this->postJson("/api/multiplayer/rooms/{$roomCode}/attempts", [
            'client_id' => 'guest',
            'display_name' => 'Guest',
            'nationality' => 'Canada',
            'word_id' => $word->id,
            'answer' => 'apple',
            'seconds_spent' => 3,
            'hints_used' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.correct', true)
            ->assertJsonPath('data.room.players.0.display_name', 'Guest');
    }
}
