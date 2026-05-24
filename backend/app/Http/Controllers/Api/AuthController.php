<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use App\Support\SessionToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;

    private const LOGIN_DECAY_SECONDS = 60;

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'email:rfc', 'max:120'],
            'nationality' => ['required', 'string', 'min:2', 'max:80'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers(), 'max:120'],
        ]);

        $email = Str::lower($validated['email']);

        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['Este email ja esta cadastrado.'],
            ]);
        }

        $user = User::create([
            'public_id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'email' => $email,
            'nationality' => $validated['nationality'],
            'provider' => 'email',
            'password' => $validated['password'],
        ]);

        $this->syncProfile($user);
        $sessionToken = $this->rotateSessionToken($user);

        return response()->json([
            'data' => $this->sessionResource($user, $sessionToken),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:120'],
            'password' => ['required', 'string', 'max:120'],
        ]);

        $email = Str::lower($validated['email']);
        $throttleKey = $this->throttleKey($request, $email);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            return response()->json([
                'message' => 'Muitas tentativas. Tente novamente em '.RateLimiter::availableIn($throttleKey).' segundos.',
            ], 429);
        }

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

            throw ValidationException::withMessages([
                'email' => ['Email ou senha invalidos.'],
            ]);
        }

        RateLimiter::clear($throttleKey);
        $sessionToken = $this->rotateSessionToken($user);

        return response()->json([
            'data' => $this->sessionResource($user, $sessionToken),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if ($token) {
            User::where('session_token', SessionToken::hash($token))->update([
                'session_token' => null,
            ]);
        }

        return response()->json(['message' => 'Sessao encerrada.']);
    }

    public function googleUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nationality' => ['nullable', 'string', 'max:80'],
        ]);

        $url = $this->googleAuthorizationUrl($validated['nationality'] ?? null);

        if (! $url) {
            return response()->json([
                'configured' => false,
                'message' => 'Login com Google ainda nao esta configurado.',
            ]);
        }

        return response()->json([
            'configured' => true,
            'url' => $url,
        ]);
    }

    public function googleRedirect(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nationality' => ['nullable', 'string', 'max:80'],
        ]);

        $url = $this->googleAuthorizationUrl($validated['nationality'] ?? null);

        if (! $url) {
            return redirect()->away($this->frontendAuthUrl([
                'auth_error' => $this->base64UrlEncode('Login com Google ainda nao esta configurado.'),
            ]));
        }

        return redirect()->away($url);
    }

    public function googleCallback(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->filled('error')) {
            return $this->googleErrorResponse(
                $request,
                $request->string('error_description')->toString() ?: 'Login com Google cancelado.'
            );
        }

        if (! $request->filled('code') || ! $request->filled('state')) {
            return $this->googleErrorResponse($request, 'Nao foi possivel concluir o login com Google.', 422);
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect_uri');

        if (! $clientId || ! $clientSecret || ! $redirectUri) {
            return $this->googleErrorResponse($request, 'Login com Google ainda nao esta configurado.', 501);
        }

        $state = $this->decodeGoogleState($validated['state']);

        if (! $state) {
            return $this->googleErrorResponse($request, 'A sessao do login com Google expirou. Tente novamente.', 422);
        }

        /* $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $validated['code'],
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ]);

        if (! $tokenResponse->successful()) {
            return $this->googleErrorResponse($request, 'Nao foi possivel validar o login com Google.', 422);
        } */

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $validated['code'],
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ]);

        if (! $tokenResponse->successful()) {
            return response()->json([
                'error' => $tokenResponse->json(),
                'status' => $tokenResponse->status(),
                'redirect_uri_used' => $redirectUri,
            ], 422);
        }

        $accessToken = $tokenResponse->json('access_token');
        $profileResponse = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $profileResponse->successful()) {
            return $this->googleErrorResponse($request, 'Nao foi possivel buscar o perfil do Google.', 422);
        }

        if (! $profileResponse->json('email')) {
            return $this->googleErrorResponse($request, 'A conta Google nao retornou um email.', 422);
        }

        $user = $this->upsertUser(
            $profileResponse->json('name') ?? Str::before($profileResponse->json('email'), '@'),
            Str::lower($profileResponse->json('email')),
            $state['nationality'] ?? 'Not informed',
            'gmail',
            $profileResponse->json('sub'),
            $profileResponse->json('picture'),
            null,
            (bool) $profileResponse->json('email_verified')
        );
        $sessionToken = $this->rotateSessionToken($user);
        $session = $this->sessionResource($user, $sessionToken);

        if ($this->wantsJson($request)) {
            return response()->json([
                'data' => $session,
            ]);
        }

        return redirect()->away($this->frontendAuthUrl([
            'auth' => 'google',
            'session' => $this->base64UrlEncode(json_encode($session, JSON_THROW_ON_ERROR)),
        ]));
    }

    private function upsertUser(
        string $name,
        string $email,
        string $nationality,
        string $provider,
        ?string $googleId = null,
        ?string $avatarUrl = null,
        ?string $password = null,
        bool $emailVerified = false
    ): User {
        $user = User::firstOrNew(['email' => $email]);
        $isNewUser = ! $user->exists;

        if ($isNewUser) {
            $user->public_id = (string) Str::uuid();
            $user->password = $password ?? Str::random(32);
            $user->session_token = SessionToken::hash(SessionToken::generate());
        }

        $user->public_id ??= (string) Str::uuid();
        $user->session_token ??= SessionToken::hash(SessionToken::generate());

        $user->name = $name;
        $user->nationality = $isNewUser || ! $user->nationality ? $nationality : $user->nationality;
        $user->provider = $provider;
        $user->google_id = $googleId ?? $user->google_id;
        $user->avatar_url = $avatarUrl ?? $user->avatar_url;

        if ($provider === 'gmail') {
            $user->gmail_connected_at = now();
        }

        if ($emailVerified) {
            $user->email_verified_at ??= now();
        }

        $user->save();

        $this->syncProfile($user);

        return $user;
    }

    private function syncProfile(User $user): void
    {
        UserProfile::updateOrCreate(
            ['client_id' => $user->public_id],
            [
                'user_id' => $user->id,
                'display_name' => $user->name,
                'nationality' => $user->nationality,
            ]
        );
    }

    private function rotateSessionToken(User $user): string
    {
        $token = SessionToken::generate();
        $user->session_token = SessionToken::hash($token);
        $user->save();

        return $token;
    }

    private function throttleKey(Request $request, string $email): string
    {
        return Str::lower($email).'|'.$request->ip();
    }

    private function googleAuthorizationUrl(?string $nationality = null): ?string
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect_uri');

        if (! $clientId || ! $redirectUri) {
            return null;
        }

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'prompt' => 'select_account',
            'access_type' => 'online',
            'include_granted_scopes' => 'true',
            'state' => $this->encodeGoogleState($nationality),
        ], '', '&', PHP_QUERY_RFC3986);
    }

    private function encodeGoogleState(?string $nationality): string
    {
        $payload = $this->base64UrlEncode(json_encode([
            'nationality' => $nationality,
            'nonce' => Str::random(32),
            'issued_at' => now()->timestamp,
        ], JSON_THROW_ON_ERROR));

        return $payload.'.'.hash_hmac('sha256', $payload, $this->googleStateSigningKey());
    }

    /**
     * @return array{nationality?: string|null, nonce?: string, issued_at?: int}
     */
    private function decodeGoogleState(?string $state): array
    {
        if (! $state || ! str_contains($state, '.')) {
            return [];
        }

        [$payload, $signature] = explode('.', $state, 2);
        $expectedSignature = hash_hmac('sha256', $payload, $this->googleStateSigningKey());

        if (! hash_equals($expectedSignature, $signature)) {
            return [];
        }

        $json = $this->base64UrlDecode($payload);
        $decoded = $json ? json_decode($json, true) : null;

        if (! is_array($decoded)) {
            return [];
        }

        $issuedAt = (int) ($decoded['issued_at'] ?? 0);

        if ($issuedAt < now()->subMinutes(15)->timestamp) {
            return [];
        }

        return $decoded;
    }

    private function googleStateSigningKey(): string
    {
        return (string) config('app.key')
            ?: (string) config('services.google.client_secret')
            ?: 'guessword-local-google-state';
    }

    private function wantsJson(Request $request): bool
    {
        return $request->expectsJson() || $request->query('format') === 'json';
    }

    private function googleErrorResponse(Request $request, string $message, int $status = 422): JsonResponse|RedirectResponse
    {
        if ($this->wantsJson($request)) {
            return response()->json(['message' => $message], $status);
        }

        return redirect()->away($this->frontendAuthUrl([
            'auth_error' => $this->base64UrlEncode($message),
        ]));
    }

    private function frontendAuthUrl(array $params): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://127.0.0.1:3000'), '/');

        return $frontendUrl.'/#'.http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string|false
    {
        $padding = (4 - strlen($value) % 4) % 4;

        return base64_decode(strtr($value.str_repeat('=', $padding), '-_', '+/'), true);
    }

    private function sessionResource(User $user, ?string $sessionToken = null): array
    {
        $resource = [
            'client_id' => $user->public_id,
            'name' => $user->name,
            'email' => $user->email,
            'nationality' => $user->nationality,
            'provider' => $user->provider,
            'avatar_url' => $user->avatar_url,
            'gmail_connected' => (bool) $user->gmail_connected_at,
        ];

        if ($sessionToken) {
            $resource['session_token'] = $sessionToken;
        }

        return $resource;
    }
}
