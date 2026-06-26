import vocabularyData from "./vocabulary-data.json";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type PracticeMode = "auto" | "level" | "review" | "seen";

export type VocabWord = {
  id: number;
  word: string;
  definition: string;
  definition_pt?: string;
  example: string;
  example_with_blank: string;
  level: Level;
  part_of_speech?: string | null;
};

export type WordProgress = {
  attempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  streakCorrect: number;
  intervalDays: number;
  easeFactor: number;
  learned: boolean;
  lastAnsweredAt: string | null;
  nextReviewAt: string | null;
};

export type HistoryItem = {
  id: string;
  word: string;
  level: Level;
  answer: string;
  correct: boolean;
  score: number;
  mode: PracticeMode;
  studiedAt: string;
};

export type StudyState = {
  clientId: string;
  wordProgress: Record<string, WordProgress>;
  history: HistoryItem[];
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  totalAttempts: number;
  correctAttempts: number;
};

type RawWordRecord = {
  word: string;
  definition: string;
  definition_pt: string;
  example: string;
  level: Level;
  part_of_speech?: string | null;
};

export const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const modeLabels: Record<PracticeMode, string> = {
  auto: "Progressao",
  level: "Nivel",
  review: "Revisao",
  seen: "Ja vistas",
};

const rawWords = vocabularyData as RawWordRecord[];
const portugueseDefinitionsByWord = new Map(rawWords.map((entry) => [entry.word.toLowerCase(), entry.definition_pt]));

function validateVocabularyTranslations(words: RawWordRecord[]): void {
  const duplicated = new Set<string>();
  const seen = new Set<string>();
  const missingPortuguese = words.filter((entry) => {
    const key = entry.word.toLowerCase();
    if (seen.has(key)) {
      duplicated.add(entry.word);
    }
    seen.add(key);

    const translated = entry.definition_pt?.trim();
    return !translated || translated === entry.definition;
  });

  if (duplicated.size > 0 || missingPortuguese.length > 0) {
    throw new Error(
      [
        duplicated.size > 0 ? `Duplicate vocabulary words: ${Array.from(duplicated).join(", ")}` : null,
        missingPortuguese.length > 0
          ? `Missing Portuguese definitions: ${missingPortuguese.map((entry) => entry.word).join(", ")}`
          : null,
      ].filter(Boolean).join("; "),
    );
  }
}

validateVocabularyTranslations(rawWords);

export function getPortugueseDefinition(word: string, englishDefinition?: string | null): string | null {
  const translated = portugueseDefinitionsByWord.get(word.toLowerCase())?.trim();

  if (!translated || translated === englishDefinition) {
    return null;
  }

  return translated;
}

export const fallbackWords: VocabWord[] = rawWords.map(
  (entry, index) => ({
    id: index + 1,
    word: entry.word,
    definition: entry.definition,
    definition_pt: entry.definition_pt,
    example: entry.example,
    example_with_blank: blankExample(entry.example, entry.word),
    level: entry.level,
    part_of_speech: entry.part_of_speech ?? null,
  }),
);

export function createEmptyStudyState(clientId = ""): StudyState {
  return {
    clientId,
    wordProgress: {},
    history: [],
    xp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    lastStudyDate: null,
    totalAttempts: 0,
    correctAttempts: 0,
  };
}

export function blankExample(example: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return example.replace(new RegExp(`\\b${escaped}\\b`, "i"), "_____");
}

export function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim().replace(/[^a-z]/g, "");
}

export function scrambleWord(word: string): string[] {
  const letters = word.split("");

  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  if (letters.join("") === word && letters.length > 2) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }

  return letters;
}

export function isDue(progress?: WordProgress, now = new Date()): boolean {
  if (!progress?.nextReviewAt) {
    return false;
  }

  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function selectNextWord(
  words: VocabWord[],
  level: Level,
  mode: PracticeMode,
  progress: Record<string, WordProgress>,
  avoidWordId?: number | null,
): VocabWord | null {
  const sameLevel = mode === "review" || mode === "seen"
    ? words.filter((word) => word.level === level)
    : words.filter((word) => word.level === level && !(progress[word.id]?.correctAttempts > 0));

  const due = mode === "review" || mode === "seen"
    ? words.filter((word) => isDue(progress[word.id]))
    : words.filter((word) => isDue(progress[word.id]) && !(progress[word.id]?.correctAttempts > 0));

  let candidates = sameLevel;

  if (mode === "review") {
    candidates = sameLevel.filter((word) => {
      const item = progress[word.id];
      return isDue(item) || (item?.incorrectAttempts ?? 0) > (item?.correctAttempts ?? 0);
    });
  }

  if (mode === "seen") {
    candidates = sameLevel.filter((word) => (progress[word.id]?.attempts ?? 0) > 0);
  }

  if (mode === "auto") {
    candidates = due.length > 0 ? due : sameLevel.filter((word) => !progress[word.id]?.learned);
  }

  if (candidates.length === 0) {
    const fallbackSameLevel = words.filter((word) => word.level === level);
    candidates = sameLevel.length > 0 
      ? sameLevel 
      : (mode === "review" || mode === "seen" ? fallbackSameLevel : fallbackSameLevel.filter((word) => !(progress[word.id]?.correctAttempts > 0)));
  }

  if (candidates.length === 0) {
    return null;
  }

  const filtered = candidates.length > 1 ? candidates.filter((word) => word.id !== avoidWordId) : candidates;
  const weighted = filtered.map((word) => {
    const item = progress[word.id];
    let weight = 2;

    if (!item) {
      weight += mode === "review" ? 0 : 3;
    } else {
      weight += Math.min(12, item.incorrectAttempts * 3);
      weight += Math.max(0, 3 - item.streakCorrect);
      weight += isDue(item) ? 8 : 0;
      weight -= item.learned ? 1 : 0;
    }

    return { word, weight: Math.max(1, weight) };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of weighted) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.word;
    }
  }

  return weighted[0]?.word ?? null;
}

export function calculateScore(level: Level, seconds: number, hintsUsed: boolean, combo: number): number {
  const baseByLevel: Record<Level, number> = {
    A1: 8,
    A2: 10,
    B1: 12,
    B2: 15,
    C1: 18,
    C2: 22,
  };
  const speedBonus = Math.max(0, 20 - Math.min(20, seconds));
  const comboBonus = Math.min(20, combo * 2);
  const score = baseByLevel[level] + speedBonus + comboBonus;

  return hintsUsed ? Math.ceil(score * 0.7) : score;
}

export function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function yesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return dateKey(yesterday);
}

export function addMinutes(date: Date, minutes: number): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);

  return copy.toISOString();
}

export function addDays(date: Date, days: number): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);

  return copy.toISOString();
}
