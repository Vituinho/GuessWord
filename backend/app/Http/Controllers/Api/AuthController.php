<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'email', 'max:120'],
            'nationality' => ['required', 'string', 'min:2', 'max:80'],
            'provider' => ['nullable', 'in:email,gmail'],
            'password' => ['nullable', 'string', 'min:4', 'max:120'],
        ]);

        $provider = $validated['provider'] ?? 'email';
        $email = Str::lower($validated['email']);
        $existingUser = User::where('email', $email)->first();

        if ($provider === 'email' && empty($validated['password'])) {
            return response()->json(['message' => 'Password is required.'], 422);
        }

        if ($provider === 'email' && $existingUser && ! Hash::check($validated['password'], $existingUser->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 422);
        }

        $user = $this->upsertUser(
            $validated['name'],
            $email,
            $validated['nationality'],
            $provider,
            password: $validated['password'] ?? null
        );

        return response()->json([
            'data' => $this->sessionResource($user),
        ]);
    }

    public function googleUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nationality' => ['nullable', 'string', 'max:80'],
        ]);

        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect_uri');

        if (! $clientId || ! $redirectUri) {
            return response()->json([
                'configured' => false,
                'message' => 'Google OAuth is not configured.',
            ]);
        }

        $state = base64_encode(json_encode([
            'nationality' => $validated['nationality'] ?? null,
            'nonce' => Str::random(16),
        ]));

        $url = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'prompt' => 'select_account',
            'state' => $state,
        ]);

        return response()->json([
            'configured' => true,
            'url' => $url,
        ]);
    }

    public function googleCallback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'state' => ['nullable', 'string'],
        ]);

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect_uri');

        if (! $clientId || ! $clientSecret || ! $redirectUri) {
            return response()->json(['message' => 'Google OAuth is not configured.'], 501);
        }

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $validated['code'],
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ]);

        if (! $tokenResponse->successful()) {
            return response()->json(['message' => 'Google token exchange failed.'], 422);
        }

        $accessToken = $tokenResponse->json('access_token');
        $profileResponse = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $profileResponse->successful()) {
            return response()->json(['message' => 'Google profile fetch failed.'], 422);
        }

        $state = json_decode(base64_decode($validated['state'] ?? '') ?: '{}', true) ?: [];
        $user = $this->upsertUser(
            $profileResponse->json('name') ?? Str::before($profileResponse->json('email'), '@'),
            Str::lower($profileResponse->json('email')),
            $state['nationality'] ?? 'Not informed',
            'gmail',
            $profileResponse->json('sub'),
            $profileResponse->json('picture')
        );

        return response()->json([
            'data' => $this->sessionResource($user),
        ]);
    }

    private function upsertUser(
        string $name,
        string $email,
        string $nationality,
        string $provider,
        ?string $googleId = null,
        ?string $avatarUrl = null,
        ?string $password = null
    ): User {
        $user = User::firstOrNew(['email' => $email]);

        if (! $user->exists) {
            $user->public_id = (string) Str::uuid();
            $user->password = $password ?? Str::random(32);
            $user->session_token = Str::random(48);
        }

        $user->public_id ??= (string) Str::uuid();
        $user->session_token ??= Str::random(48);

        $user->name = $name;
        $user->nationality = $nationality;
        $user->provider = $provider;
        $user->google_id = $googleId ?? $user->google_id;
        $user->avatar_url = $avatarUrl ?? $user->avatar_url;

        if ($provider === 'gmail') {
            $user->gmail_connected_at = now();
        }

        $user->save();

        UserProfile::updateOrCreate(
            ['client_id' => $user->public_id],
            [
                'user_id' => $user->id,
                'display_name' => $user->name,
                'nationality' => $user->nationality,
            ]
        );

        return $user;
    }

    private function sessionResource(User $user): array
    {
        return [
            'client_id' => $user->public_id,
            'name' => $user->name,
            'email' => $user->email,
            'nationality' => $user->nationality,
            'provider' => $user->provider,
            'avatar_url' => $user->avatar_url,
            'gmail_connected' => (bool) $user->gmail_connected_at,
        ];
    }
}
