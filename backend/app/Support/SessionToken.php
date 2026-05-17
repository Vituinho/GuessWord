<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class SessionToken
{
    public static function generate(): string
    {
        return Str::random(64);
    }

    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function allows(Request $request, string $clientId): bool
    {
        $user = User::where('public_id', $clientId)->first();

        if (! $user) {
            return true;
        }

        $token = $request->bearerToken();

        return $token !== null
            && $user->session_token !== null
            && hash_equals($user->session_token, self::hash($token));
    }
}
