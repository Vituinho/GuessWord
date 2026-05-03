<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyAttempt;
use App\Models\UserProfile;
use App\Models\Word;
use App\Models\WordProgress;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class VocabularyController extends Controller
{
    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'words' => Word::count(),
        ]);
    }

    public function words(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'level' => ['nullable', 'in:'.implode(',', self::LEVELS)],
        ]);

        $query = Word::query()->orderBy('level')->orderBy('word');

        if (! empty($validated['level'])) {
            $query->where('level', $validated['level']);
        }

        return response()->json([
            'data' => $query->get()->map(fn (Word $word): array => $this->wordResource($word))->values(),
        ]);
    }

    public function challenge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['nullable', 'string', 'max:120'],
            'level' => ['nullable', 'in:'.implode(',', self::LEVELS)],
            'mode' => ['nullable', 'in:level,review,seen,auto'],
        ]);

        $clientId = $validated['client_id'] ?? null;
        $level = $validated['level'] ?? 'A1';
        $mode = $validated['mode'] ?? 'level';
        $candidates = $this->candidateWords($clientId, $level, $mode);

        if ($candidates->isEmpty()) {
            $candidates = $this->candidateWords($clientId, $level, 'level');
        }

        if ($candidates->isEmpty()) {
            return response()->json(['message' => 'No vocabulary words are available.'], 404);
        }

        $progress = $this->progressMap($clientId, $candidates);
        $word = $this->pickWeightedWord($candidates, $progress, $mode);

        return response()->json([
            'data' => $this->challengeResource($word, $progress->get($word->id)),
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:120'],
            'word_id' => ['required', 'integer', 'exists:words,id'],
            'answer' => ['nullable', 'string', 'max:120'],
            'seconds_spent' => ['nullable', 'integer', 'min:0', 'max:900'],
            'hints_used' => ['nullable', 'boolean'],
            'mode' => ['nullable', 'in:level,review,seen,auto'],
        ]);

        $word = Word::findOrFail($validated['word_id']);
        $answer = $validated['answer'] ?? '';
        $correct = $this->normalizeAnswer($answer) === $this->normalizeAnswer($word->word);
        $seconds = (int) ($validated['seconds_spent'] ?? 0);
        $hintsUsed = (bool) ($validated['hints_used'] ?? false);
        $mode = $validated['mode'] ?? 'level';
        $clientId = $validated['client_id'];
        $now = Carbon::now();

        $progress = WordProgress::firstOrCreate(
            ['client_id' => $clientId, 'word_id' => $word->id],
            ['ease_factor' => 2.5]
        );

        $progress->attempts++;
        $progress->last_answered_at = $now;

        if ($correct) {
            $progress->correct_attempts++;
            $progress->streak_correct++;
            $progress->ease_factor = min(3.2, $progress->ease_factor + ($progress->streak_correct >= 2 ? 0.15 : 0.05));
            $progress->interval_days = $this->nextIntervalDays($progress);
            $progress->next_review_at = $now->copy()->addDays($progress->interval_days);
            $progress->learned = $progress->correct_attempts >= 3 && $progress->streak_correct >= 2;
        } else {
            $progress->incorrect_attempts++;
            $progress->streak_correct = 0;
            $progress->ease_factor = max(1.3, $progress->ease_factor - 0.25);
            $progress->interval_days = 0;
            $progress->next_review_at = $now->copy()->addMinutes(10);
            $progress->learned = false;
        }

        $progress->save();

        $scoreDelta = $correct ? $this->scoreFor($word, $seconds, $hintsUsed) : 0;
        $profile = UserProfile::firstOrCreate(['client_id' => $clientId]);
        $this->updateProfile($profile, $scoreDelta);

        StudyAttempt::create([
            'client_id' => $clientId,
            'word_id' => $word->id,
            'answer' => $answer,
            'correct' => $correct,
            'seconds_spent' => $seconds,
            'hints_used' => $hintsUsed,
            'mode' => $mode,
            'score_delta' => $scoreDelta,
        ]);

        return response()->json([
            'data' => [
                'correct' => $correct,
                'correct_answer' => $word->word,
                'score_delta' => $scoreDelta,
                'word' => $this->wordResource($word),
                'word_progress' => $this->wordProgressResource($progress),
                'user_progress' => $this->profileStats($clientId, $profile),
            ],
        ]);
    }

    public function progress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:120'],
        ]);

        $clientId = $validated['client_id'];
        $profile = UserProfile::firstOrCreate(['client_id' => $clientId]);

        return response()->json([
            'data' => $this->profileStats($clientId, $profile),
        ]);
    }

    public function leaderboard(): JsonResponse
    {
        $leaders = UserProfile::query()
            ->orderByDesc('xp')
            ->orderByDesc('best_streak')
            ->limit(10)
            ->get()
            ->map(fn (UserProfile $profile, int $index): array => [
                'rank' => $index + 1,
                'client_id' => $profile->client_id,
                'display_name' => $profile->display_name ?? 'Player',
                'nationality' => $profile->nationality,
                'xp' => $profile->xp,
                'level' => $profile->level,
                'streak' => $profile->current_streak,
                'best_streak' => $profile->best_streak,
            ]);

        return response()->json(['data' => $leaders]);
    }

    private function candidateWords(?string $clientId, string $level, string $mode): EloquentCollection
    {
        if ($mode === 'review' && $clientId) {
            $review = Word::query()
                ->where('level', $level)
                ->whereHas('progress', function ($query) use ($clientId): void {
                    $query->where('client_id', $clientId)
                        ->where(function ($nested): void {
                            $nested->where('next_review_at', '<=', Carbon::now())
                                ->orWhereColumn('incorrect_attempts', '>', 'correct_attempts');
                        });
                })
                ->get();

            if ($review->isNotEmpty()) {
                return $review;
            }
        }

        if ($mode === 'seen' && $clientId) {
            $seen = Word::query()
                ->where('level', $level)
                ->whereHas('progress', fn ($query) => $query->where('client_id', $clientId)->where('attempts', '>', 0))
                ->get();

            if ($seen->isNotEmpty()) {
                return $seen;
            }
        }

        if ($mode === 'auto' && $clientId) {
            $due = Word::query()
                ->whereHas('progress', fn ($query) => $query
                    ->where('client_id', $clientId)
                    ->where('next_review_at', '<=', Carbon::now()))
                ->get();

            if ($due->isNotEmpty()) {
                return $due;
            }
        }

        return Word::query()->where('level', $level)->get();
    }

    /**
     * @param  EloquentCollection<int, Word>  $words
     * @return Collection<int, WordProgress>
     */
    private function progressMap(?string $clientId, EloquentCollection $words): Collection
    {
        if (! $clientId || $words->isEmpty()) {
            return collect();
        }

        return WordProgress::query()
            ->where('client_id', $clientId)
            ->whereIn('word_id', $words->pluck('id'))
            ->get()
            ->keyBy('word_id');
    }

    /**
     * Words with more mistakes or due reviews receive more weight.
     *
     * @param  EloquentCollection<int, Word>  $words
     * @param  Collection<int, WordProgress>  $progress
     */
    private function pickWeightedWord(EloquentCollection $words, Collection $progress, string $mode): Word
    {
        $weighted = $words->map(function (Word $word) use ($progress, $mode): array {
            $wordProgress = $progress->get($word->id);
            $weight = 2;

            if (! $wordProgress) {
                $weight += $mode === 'review' ? 0 : 2;
            } else {
                $weight += min(12, $wordProgress->incorrect_attempts * 3);
                $weight += max(0, 3 - $wordProgress->streak_correct);

                if ($wordProgress->next_review_at && $wordProgress->next_review_at->lte(Carbon::now())) {
                    $weight += 8;
                }
            }

            return ['word' => $word, 'weight' => max(1, $weight)];
        });

        $roll = random_int(1, $weighted->sum('weight'));
        $running = 0;

        foreach ($weighted as $item) {
            $running += $item['weight'];

            if ($roll <= $running) {
                return $item['word'];
            }
        }

        return $words->first();
    }

    private function normalizeAnswer(string $answer): string
    {
        return Str::of($answer)
            ->lower()
            ->trim()
            ->replaceMatches('/[^a-z]/', '')
            ->toString();
    }

    private function nextIntervalDays(WordProgress $progress): int
    {
        if ($progress->streak_correct <= 1) {
            return 1;
        }

        if ($progress->streak_correct === 2) {
            return 3;
        }

        return min(30, max(4, (int) ceil(max(1, $progress->interval_days) * $progress->ease_factor)));
    }

    private function scoreFor(Word $word, int $seconds, bool $hintsUsed): int
    {
        $baseByLevel = [
            'A1' => 8,
            'A2' => 10,
            'B1' => 12,
            'B2' => 15,
            'C1' => 18,
            'C2' => 22,
        ];

        $speedBonus = max(0, 20 - min(20, $seconds));
        $score = ($baseByLevel[$word->level] ?? 10) + $speedBonus;

        return $hintsUsed ? (int) ceil($score * 0.7) : $score;
    }

    private function updateProfile(UserProfile $profile, int $scoreDelta): void
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        if (! $profile->last_studied_on) {
            $profile->current_streak = 1;
        } elseif ($profile->last_studied_on->isSameDay($today)) {
            $profile->current_streak = max(1, $profile->current_streak);
        } elseif ($profile->last_studied_on->isSameDay($yesterday)) {
            $profile->current_streak++;
        } else {
            $profile->current_streak = 1;
        }

        $profile->best_streak = max($profile->best_streak, $profile->current_streak);
        $profile->last_studied_on = $today;
        $profile->xp += $scoreDelta;
        $profile->level = intdiv($profile->xp, 200) + 1;
        $profile->save();
    }

    private function profileStats(string $clientId, UserProfile $profile): array
    {
        $attempts = StudyAttempt::where('client_id', $clientId)->count();
        $correct = StudyAttempt::where('client_id', $clientId)->where('correct', true)->count();
        $seen = WordProgress::where('client_id', $clientId)->where('attempts', '>', 0)->count();
        $learned = WordProgress::where('client_id', $clientId)->where('learned', true)->count();
        $due = WordProgress::where('client_id', $clientId)->where('next_review_at', '<=', Carbon::now())->count();

        $history = StudyAttempt::query()
            ->with('word')
            ->where('client_id', $clientId)
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (StudyAttempt $attempt): array => [
                'id' => $attempt->id,
                'word' => $attempt->word->word,
                'level' => $attempt->word->level,
                'answer' => $attempt->answer,
                'correct' => $attempt->correct,
                'score_delta' => $attempt->score_delta,
                'studied_at' => $attempt->created_at?->toIso8601String(),
            ]);

        $levels = collect(self::LEVELS)->mapWithKeys(function (string $level) use ($clientId): array {
            $wordIds = Word::where('level', $level)->pluck('id');

            return [$level => [
                'total' => $wordIds->count(),
                'seen' => WordProgress::where('client_id', $clientId)->whereIn('word_id', $wordIds)->where('attempts', '>', 0)->count(),
                'learned' => WordProgress::where('client_id', $clientId)->whereIn('word_id', $wordIds)->where('learned', true)->count(),
            ]];
        });

        return [
            'client_id' => $clientId,
            'display_name' => $profile->display_name ?? 'Player',
            'nationality' => $profile->nationality,
            'accuracy' => $attempts > 0 ? round(($correct / $attempts) * 100, 1) : 0,
            'attempts' => $attempts,
            'correct_attempts' => $correct,
            'words_seen' => $seen,
            'words_learned' => $learned,
            'due_reviews' => $due,
            'xp' => $profile->xp,
            'level' => $profile->level,
            'current_streak' => $profile->current_streak,
            'best_streak' => $profile->best_streak,
            'history' => $history,
            'levels' => $levels,
        ];
    }

    private function wordResource(Word $word): array
    {
        return [
            'id' => $word->id,
            'word' => $word->word,
            'definition' => $word->definition,
            'example' => $word->example,
            'example_with_blank' => $word->exampleWithBlank(),
            'level' => $word->level,
            'part_of_speech' => $word->part_of_speech,
        ];
    }

    private function challengeResource(Word $word, ?WordProgress $progress): array
    {
        return [
            ...$this->wordResource($word),
            'progress' => $progress ? $this->wordProgressResource($progress) : null,
        ];
    }

    private function wordProgressResource(WordProgress $progress): array
    {
        return [
            'attempts' => $progress->attempts,
            'correct_attempts' => $progress->correct_attempts,
            'incorrect_attempts' => $progress->incorrect_attempts,
            'streak_correct' => $progress->streak_correct,
            'interval_days' => $progress->interval_days,
            'ease_factor' => $progress->ease_factor,
            'learned' => $progress->learned,
            'last_answered_at' => $progress->last_answered_at?->toIso8601String(),
            'next_review_at' => $progress->next_review_at?->toIso8601String(),
        ];
    }
}
