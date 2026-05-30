<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyAttempt;
use App\Models\UserProfile;
use App\Models\Word;
use App\Models\WordProgress;
use App\Support\SessionToken;
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

        if ($clientId && ! SessionToken::allows($request, $clientId)) {
            return $this->invalidSessionResponse();
        }

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

        if (! SessionToken::allows($request, $clientId)) {
            return $this->invalidSessionResponse();
        }

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
            $progress->learned = $progress->correct_attempts > 0;
        } else {
            $progress->incorrect_attempts++;
            $progress->streak_correct = 0;
            $progress->ease_factor = max(1.3, $progress->ease_factor - 0.25);
            $progress->interval_days = 0;
            $progress->next_review_at = $now->copy()->addMinutes(10);
            $progress->learned = $progress->correct_attempts > 0;
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

        if (! SessionToken::allows($request, $clientId)) {
            return $this->invalidSessionResponse();
        }

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
                ->where('level', $level)
                ->whereHas('progress', function ($query) use ($clientId): void {
                    $query->where('client_id', $clientId)
                        ->where('next_review_at', '<=', Carbon::now())
                        ->where('correct_attempts', 0);
                })
                ->get();

            if ($due->isNotEmpty()) {
                return $due;
            }
        }

        $query = Word::query()->where('level', $level);

        if ($clientId && $mode !== 'review' && $mode !== 'seen') {
            $guessedWordIds = WordProgress::query()
                ->where('client_id', $clientId)
                ->where('correct_attempts', '>', 0)
                ->pluck('word_id');
            $query->whereNotIn('id', $guessedWordIds);
        }

        return $query->get();
    }

    private function invalidSessionResponse(): JsonResponse
    {
        return response()->json(['message' => 'Sessao invalida ou expirada.'], 401);
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

        $wordProgressMap = WordProgress::where('client_id', $clientId)
            ->get()
            ->keyBy('word_id')
            ->map(fn (WordProgress $p): array => $this->wordProgressResource($p))
            ->toArray();

        return [
            'client_id' => $clientId,
            'display_name' => $profile->display_name ?? 'Player#' . $this->generateUniquePlayerNumber(),
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
            'word_progress' => $wordProgressMap,
        ];
    }

    private function generateUniquePlayerNumber(): string
    {
        do {
            $number = rand(1000, 9999); // ou rand(1, 999999) para mais variações
        } while (
            Profile::where('display_name', 'Player#' . $number)->exists()
        );

        return (string) $number;
    }

    private function wordResource(Word $word): array
    {
        return [
            'id' => $word->id,
            'word' => $word->word,
            'definition' => $word->definition,
            'definition_pt' => $this->portugueseDefinition($word),
            'example' => $word->example,
            'example_with_blank' => $word->exampleWithBlank(),
            'level' => $word->level,
            'part_of_speech' => $word->part_of_speech,
        ];
    }

    private function portugueseDefinition(Word $word): string
    {
        $definitions = [
            'apple' => 'Uma fruta redonda com casca vermelha, verde ou amarela.',
            'book' => 'Um conjunto de páginas escritas que você lê.',
            'city' => 'Uma cidade grande onde muitas pessoas vivem e trabalham.',
            'family' => 'Um grupo de pessoas relacionadas entre si.',
            'friend' => 'Uma pessoa que você gosta e conhece bem.',
            'happy' => 'Sentir-se bem ou satisfeito.',
            'listen' => 'Dar atenção a um som ou a alguém que fala.',
            'morning' => 'A parte cedo do dia.',
            'school' => 'Um lugar onde os alunos aprendem.',
            'water' => 'Um líquido claro que as pessoas bebem.',
            'chair' => 'Um assento para uma pessoa.',
            'door' => 'Uma coisa que você abre para entrar ou sair de um cômodo.',
            'food' => 'Coisas que pessoas ou animais comem.',
            'house' => 'Um prédio onde as pessoas moram.',
            'mother' => 'Uma parental feminina.',
            'music' => 'Sons feitos por vozes ou instrumentos.',
            'phone' => 'Um aparelho usado para ligar ou mandar mensagem.',
            'picture' => 'Uma imagem, desenho ou fotografia.',
            'table' => 'Um móvel com uma superfície plana.',
            'work' => 'Um trabalho ou atividade que exige esforço.',
            'borrow' => 'Usar algo e devolver depois.',
            'careful' => 'Tomar cuidado para evitar erros ou perigo.',
            'decide' => 'Escolher depois de pensar nas opções.',
            'explain' => 'Fazer algo claro ou fácil de entender.',
            'healthy' => 'Bom para o corpo ou não doente.',
            'improve' => 'Ficar melhor ou fazer algo melhor.',
            'mistake' => 'Algo que não está correto.',
            'simple' => 'Fácil de entender ou fazer.',
            'travel' => 'Ir de um lugar para outro.',
            'weather' => 'A temperatura, vento, chuva ou sol do lado de fora.',
            'arrive' => 'Chegar a um lugar.',
            'choose' => 'Selecionar uma coisa entre várias opções.',
            'describe' => 'Dizer como algo ou alguém é.',
            'favorite' => 'Gostado mais do que os outros.',
            'invite' => 'Pedir que alguém venha para um evento.',
            'journey' => 'Uma viagem de um lugar a outro.',
            'noisy' => 'Fazendo muito barulho.',
            'protect' => 'Manter alguém ou algo seguro.',
            'repair' => 'Consertar algo que está quebrado.',
            'useful' => 'Útil ou prático.',
            'achieve' => 'Conseguir fazer algo com esforço.',
            'benefit' => 'Um efeito bom ou vantagem.',
            'confident' => 'Sentir-se seguro sobre sua habilidade.',
            'manage' => 'Controlar ou organizar algo com sucesso.',
            'opinion' => 'O que alguém pensa ou acredita sobre algo.',
            'prevent' => 'Impedir que algo aconteça.',
            'reduce' => 'Tornar algo menor ou menos.',
            'reliable' => 'Capaz de ser confiável ou dependente.',
            'struggle' => 'Ter dificuldade para fazer algo.',
            'support' => 'Ajudar alguém ou concordar com uma ideia.',
            'approach' => 'Uma maneira de fazer ou pensar sobre algo.',
            'balance' => 'Um estado em que diferentes coisas têm a quantidade certa.',
            'compare' => 'Olhar duas coisas e ver semelhanças ou diferenças.',
            'develop' => 'Crescer ou tornar-se mais avançado.',
            'encourage' => 'Dar esperança ou confiança a alguém.',
            'focus' => 'Dar atenção a uma coisa.',
            'involve' => 'Incluir alguém ou algo.',
            'likely' => 'Esperado de acontecer ou ser verdade.',
            'recognize' => 'Conhecer alguém ou algo de antes.',
            'suggest' => 'Oferecer uma ideia ou plano.',
            'accomplish' => 'Completar algo com sucesso.',
            'challenge' => 'Uma tarefa difícil que testa habilidade.',
            'consequence' => 'Um resultado de uma ação ou situação.',
            'estimate' => 'Adivinhar um valor com base nas informações disponíveis.',
            'evidence' => 'Fatos ou sinais que mostram que algo é verdadeiro.',
            'maintain' => 'Manter algo no mesmo nível ou condição.',
            'negotiate' => 'Discutir para chegar a um acordo.',
            'prioritize' => 'Decidir o que é mais importante.',
            'remarkable' => 'Incomum ou impressionante de forma que as pessoas notam.',
            'sustainable' => 'Capaz de continuar por muito tempo sem causar dano.',
            'accurate' => 'Correto e sem erros.',
            'adapt' => 'Mudar para se ajustar a uma nova situação.',
            'convince' => 'Fazer alguém acreditar ou concordar.',
            'evaluate' => 'Julgar o valor ou qualidade de algo.',
            'framework' => 'Uma estrutura básica para ideias ou trabalho.',
            'generate' => 'Produzir ou criar algo.',
            'insight' => 'Uma compreensão clara de algo.',
            'objective' => 'Um objetivo ou propósito.',
            'resolve' => 'Resolver um problema ou dificuldade.',
            'tension' => 'Uma sensação de estresse ou pressão.',
            'ambiguous' => 'Tendo mais de um significado possível.',
            'coherent' => 'Claro, lógico e fácil de entender.',
            'compelling' => 'Muito interessante ou convincente.',
            'concise' => 'Usar poucas palavras mantendo clareza.',
            'deteriorate' => 'Ficar pior ao longo do tempo.',
            'implement' => 'Colocar um plano ou sistema em ação.',
            'leverage' => 'Usar algo de forma eficaz para obter um resultado.',
            'mitigate' => 'Tornar um problema menos grave.',
            'resilient' => 'Capaz de se recuperar rapidamente após dificuldade.',
            'substantial' => 'Grande em quantidade, valor ou importância.',
            'allocate' => 'Decidir como recursos ou tempo devem ser usados.',
            'articulate' => 'Expressar uma ideia claramente.',
            'constraint' => 'Um limite ou restrição.',
            'cultivate' => 'Desenvolver uma habilidade ou hábito com cuidado.',
            'diminish' => 'Ficar ou fazer algo menor.',
            'formulate' => 'Criar ou preparar algo cuidadosamente.',
            'inherent' => 'Existente como parte natural de algo.',
            'pragmatic' => 'Focado em resultados práticos.',
            'refine' => 'Melhorar algo fazendo pequenas mudanças.',
            'scrutiny' => 'Exame cuidadoso e detalhado.',
            'ephemeral' => 'Durar apenas por um curto período.',
            'exacerbate' => 'Tornar uma situação ruim pior.',
            'incongruous' => 'Estranho porque não se encaixa no ambiente.',
            'meticulous' => 'Muito cuidadoso e atento aos detalhes.',
            'nuance' => 'Uma pequena, mas importante diferença de significado.',
            'paradigm' => 'Um modelo típico ou maneira de pensar sobre algo.',
            'proliferation' => 'Um aumento rápido no número de algo.',
            'scrutinize' => 'Examinar algo com muita atenção.',
            'ubiquitous' => 'Presente ou encontrado em todos os lugares.',
            'unequivocal' => 'Claro e sem deixar dúvida.',
            'aberration' => 'Algo incomum que difere do normal.',
            'conflate' => 'Combinar duas ideias como se fossem a mesma.',
            'dissonance' => 'Falta de acordo ou harmonia.',
            'intractable' => 'Muito difícil de controlar ou resolver.',
            'labyrinthine' => 'Complicado e confuso como um labirinto.',
            'obfuscate' => 'Tornar algo pouco claro ou difícil de entender.',
            'perfunctory' => 'Feito rapidamente e sem cuidado real.',
            'quintessential' => 'Representando o exemplo mais típico.',
            'tacit' => 'Entendido sem ser dito diretamente.',
            'vindicate' => 'Provar que alguém ou algo estava certo.',
        ];

        return $definitions[$word->word] ?? $word->definition;
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
