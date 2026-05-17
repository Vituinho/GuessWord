<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MultiplayerPlayer;
use App\Models\MultiplayerRoom;
use App\Models\Word;
use App\Support\SessionToken;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MultiplayerController extends Controller
{
    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:120'],
            'display_name' => ['required', 'string', 'max:80'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'level' => ['required', 'in:'.implode(',', self::LEVELS)],
        ]);

        if (! SessionToken::allows($request, $validated['client_id'])) {
            return $this->invalidSessionResponse();
        }

        $room = MultiplayerRoom::create([
            'code' => $this->uniqueCode(),
            'host_client_id' => $validated['client_id'],
            'level' => $validated['level'],
            'status' => 'active',
            'round_seconds' => 30,
            'current_word_id' => Word::where('level', $validated['level'])->inRandomOrder()->value('id'),
            'expires_at' => Carbon::now()->addHours(2),
        ]);

        $this->touchPlayer($room, $validated);

        return response()->json(['data' => $this->roomResource($room->fresh(['players', 'currentWord']))], 201);
    }

    public function join(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:120'],
            'display_name' => ['required', 'string', 'max:80'],
            'nationality' => ['nullable', 'string', 'max:80'],
        ]);

        if (! SessionToken::allows($request, $validated['client_id'])) {
            return $this->invalidSessionResponse();
        }

        $room = $this->findRoom($code);
        $this->touchPlayer($room, $validated);

        return response()->json(['data' => $this->roomResource($room->fresh(['players', 'currentWord']))]);
    }

    public function show(string $code): JsonResponse
    {
        return response()->json(['data' => $this->roomResource($this->findRoom($code)->load(['players', 'currentWord']))]);
    }

    public function attempt(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:120'],
            'display_name' => ['required', 'string', 'max:80'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'word_id' => ['required', 'integer', 'exists:words,id'],
            'answer' => ['nullable', 'string', 'max:120'],
            'seconds_spent' => ['nullable', 'integer', 'min:0', 'max:900'],
            'hints_used' => ['nullable', 'boolean'],
        ]);

        if (! SessionToken::allows($request, $validated['client_id'])) {
            return $this->invalidSessionResponse();
        }

        $room = $this->findRoom($code);
        $player = $this->touchPlayer($room, $validated);
        $word = Word::findOrFail($validated['word_id']);
        $correct = $this->normalizeAnswer($validated['answer'] ?? '') === $this->normalizeAnswer($word->word);
        $player->attempts++;

        if ($correct) {
            $player->correct_attempts++;
            $player->combo++;
            $player->score += $this->scoreFor($word, (int) ($validated['seconds_spent'] ?? 0), (bool) ($validated['hints_used'] ?? false), $player->combo);
        } else {
            $player->combo = 0;
        }

        $player->last_seen_at = now();
        $player->save();

        return response()->json([
            'data' => [
                'correct' => $correct,
                'correct_answer' => $word->word,
                'room' => $this->roomResource($room->fresh(['players', 'currentWord'])),
            ],
        ]);
    }

    private function findRoom(string $code): MultiplayerRoom
    {
        return MultiplayerRoom::query()
            ->where('code', Str::upper($code))
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();
    }

    private function touchPlayer(MultiplayerRoom $room, array $data): MultiplayerPlayer
    {
        return MultiplayerPlayer::updateOrCreate(
            [
                'multiplayer_room_id' => $room->id,
                'client_id' => $data['client_id'],
            ],
            [
                'display_name' => $data['display_name'],
                'nationality' => $data['nationality'] ?? null,
                'last_seen_at' => now(),
            ]
        );
    }

    private function roomResource(MultiplayerRoom $room): array
    {
        return [
            'code' => $room->code,
            'level' => $room->level,
            'status' => $room->status,
            'round_seconds' => $room->round_seconds,
            'current_word_id' => $room->current_word_id,
            'players' => $room->players
                ->sortByDesc('score')
                ->values()
                ->map(fn (MultiplayerPlayer $player, int $index): array => [
                    'rank' => $index + 1,
                    'client_id' => $player->client_id,
                    'display_name' => $player->display_name,
                    'nationality' => $player->nationality,
                    'score' => $player->score,
                    'combo' => $player->combo,
                    'attempts' => $player->attempts,
                    'correct_attempts' => $player->correct_attempts,
                    'last_seen_at' => $player->last_seen_at?->toIso8601String(),
                ]),
        ];
    }

    private function uniqueCode(): string
    {
        do {
            $code = Str::upper(Str::random(6));
        } while (MultiplayerRoom::where('code', $code)->exists());

        return $code;
    }

    private function invalidSessionResponse(): JsonResponse
    {
        return response()->json(['message' => 'Sessao invalida ou expirada.'], 401);
    }

    private function normalizeAnswer(string $answer): string
    {
        return Str::of($answer)->lower()->trim()->replaceMatches('/[^a-z]/', '')->toString();
    }

    private function scoreFor(Word $word, int $seconds, bool $hintsUsed, int $combo): int
    {
        $baseByLevel = [
            'A1' => 8,
            'A2' => 10,
            'B1' => 12,
            'B2' => 15,
            'C1' => 18,
            'C2' => 22,
        ];

        $score = ($baseByLevel[$word->level] ?? 10) + max(0, 20 - min(20, $seconds)) + min(20, $combo * 2);

        return $hintsUsed ? (int) ceil($score * 0.7) : $score;
    }
}
