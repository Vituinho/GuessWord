<?php

namespace Tests\Feature;

use App\Models\Word;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthAndMultiplayerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_strong_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Ana Silva',
            'email' => 'ana@example.com',
            'nationality' => 'Brazil',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Ana Silva')
            ->assertJsonPath('data.nationality', 'Brazil')
            ->assertJsonPath('data.gmail_connected', false)
            ->assertJsonStructure(['data' => ['client_id', 'session_token']]);
    }

    public function test_email_login_requires_valid_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Leo',
            'email' => 'leo@example.com',
            'nationality' => 'Brazil',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
        ])
            ->assertCreated();

        $this->postJson('/api/auth/login', [
            'email' => 'leo@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();

        $this->postJson('/api/auth/login', [
            'email' => 'leo@example.com',
            'password' => 'Secret123',
        ])
            ->assertOk()
            ->assertJsonPath('data.email', 'leo@example.com');
    }

    public function test_google_redirect_sends_user_to_google_accounts(): void
    {
        config([
            'services.google.client_id' => 'google-client-id',
            'services.google.client_secret' => 'google-secret',
            'services.google.redirect_uri' => 'http://127.0.0.1:8000/api/auth/google-callback',
        ]);

        $response = $this->get('/api/auth/google/redirect?nationality=Brazil');

        $response->assertRedirect();

        $location = $response->headers->get('Location');
        $this->assertIsString($location);
        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/v2/auth?', $location);

        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        $this->assertSame('google-client-id', $query['client_id']);
        $this->assertSame('http://127.0.0.1:8000/api/auth/google-callback', $query['redirect_uri']);
        $this->assertSame('code', $query['response_type']);
        $this->assertSame('openid email profile', $query['scope']);
        $this->assertSame('select_account', $query['prompt']);
        $this->assertNotEmpty($query['state']);
    }

    public function test_google_callback_redirects_to_frontend_with_session(): void
    {
        config([
            'app.frontend_url' => 'http://127.0.0.1:3000',
            'services.google.client_id' => 'google-client-id',
            'services.google.client_secret' => 'google-secret',
            'services.google.redirect_uri' => 'http://127.0.0.1:8000/api/auth/google-callback',
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'google-access-token',
            ]),
            'https://www.googleapis.com/oauth2/v3/userinfo' => Http::response([
                'sub' => 'google-user-123',
                'name' => 'Ana Google',
                'email' => 'ana.google@example.com',
                'email_verified' => true,
                'picture' => 'https://example.com/avatar.png',
            ]),
        ]);

        $googleRedirect = $this->get('/api/auth/google/redirect?nationality=Canada')
            ->assertRedirect()
            ->headers
            ->get('Location');

        parse_str((string) parse_url((string) $googleRedirect, PHP_URL_QUERY), $query);

        $response = $this->get('/api/auth/google-callback?code=google-code&state='.urlencode($query['state']));

        $response->assertRedirect();

        $location = $response->headers->get('Location');
        $this->assertIsString($location);
        $this->assertStringStartsWith('http://127.0.0.1:3000/#auth=google&session=', $location);
        $this->assertDatabaseHas('users', [
            'name' => 'Ana Google',
            'email' => 'ana.google@example.com',
            'nationality' => 'Canada',
            'provider' => 'gmail',
            'google_id' => 'google-user-123',
        ]);
    }

    public function test_registered_client_requires_session_token_for_attempts(): void
    {
        $this->seed(DatabaseSeeder::class);
        $word = Word::where('word', 'apple')->firstOrFail();

        $session = $this->postJson('/api/auth/register', [
            'name' => 'Mia',
            'email' => 'mia@example.com',
            'nationality' => 'Brazil',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
        ])->assertCreated()->json('data');

        $payload = [
            'client_id' => $session['client_id'],
            'word_id' => $word->id,
            'answer' => 'apple',
            'seconds_spent' => 4,
            'hints_used' => false,
            'mode' => 'level',
        ];

        $this->postJson('/api/attempts', $payload)->assertUnauthorized();

        $this->withHeader('Authorization', 'Bearer '.$session['session_token'])
            ->postJson('/api/attempts', $payload)
            ->assertOk()
            ->assertJsonPath('data.correct', true);
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
