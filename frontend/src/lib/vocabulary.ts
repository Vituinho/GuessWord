export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type PracticeMode = "auto" | "level" | "review" | "seen";

export type VocabWord = {
  id: number;
  word: string;
  definition: string;
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

type RawWord = [string, string, string, Level, string];

export const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const modeLabels: Record<PracticeMode, string> = {
  auto: "Progressao",
  level: "Nivel",
  review: "Revisao",
  seen: "Ja vistas",
};

const rawWords: RawWord[] = [
  ["apple", "A round fruit with red, green, or yellow skin.", "She packed an apple for lunch.", "A1", "noun"],
  ["book", "A set of written pages that you read.", "He opened the book before class.", "A1", "noun"],
  ["city", "A large town where many people live and work.", "The city is busy in the morning.", "A1", "noun"],
  ["family", "A group of people related to each other.", "My family eats dinner together.", "A1", "noun"],
  ["friend", "A person you like and know well.", "Her friend helped with the homework.", "A1", "noun"],
  ["happy", "Feeling good or pleased.", "The children were happy at the party.", "A1", "adjective"],
  ["listen", "To give attention to a sound or speaker.", "Please listen to the question carefully.", "A1", "verb"],
  ["morning", "The early part of the day.", "I drink water every morning.", "A1", "noun"],
  ["school", "A place where students learn.", "They walk to school at eight.", "A1", "noun"],
  ["water", "A clear liquid that people drink.", "She drinks water after running.", "A1", "noun"],
  ["borrow", "To use something and give it back later.", "Can I borrow your pen for a minute?", "A2", "verb"],
  ["careful", "Taking time to avoid mistakes or danger.", "Be careful when you cross the street.", "A2", "adjective"],
  ["decide", "To choose after thinking about options.", "We need to decide where to eat.", "A2", "verb"],
  ["explain", "To make something clear or easy to understand.", "The teacher will explain the rule again.", "A2", "verb"],
  ["healthy", "Good for your body or not sick.", "A healthy breakfast gives you energy.", "A2", "adjective"],
  ["improve", "To become better or make something better.", "Daily practice can improve your English.", "A2", "verb"],
  ["mistake", "Something that is not correct.", "I made a mistake in the last sentence.", "A2", "noun"],
  ["simple", "Easy to understand or do.", "The instructions are simple and clear.", "A2", "adjective"],
  ["travel", "To go from one place to another.", "They travel by train on weekends.", "A2", "verb"],
  ["weather", "The temperature, wind, rain, or sun outside.", "The weather is colder today.", "A2", "noun"],
  ["achieve", "To succeed in doing something after effort.", "She worked hard to achieve her goal.", "B1", "verb"],
  ["benefit", "A good effect or advantage.", "One benefit of reading is a larger vocabulary.", "B1", "noun"],
  ["confident", "Feeling sure about your ability.", "He felt confident before the interview.", "B1", "adjective"],
  ["manage", "To control or organize something successfully.", "They manage the project with a small team.", "B1", "verb"],
  ["opinion", "What someone thinks or believes about something.", "In my opinion, the plan is realistic.", "B1", "noun"],
  ["prevent", "To stop something from happening.", "A helmet can prevent serious injury.", "B1", "verb"],
  ["reduce", "To make something smaller or less.", "We should reduce the amount of waste.", "B1", "verb"],
  ["reliable", "Able to be trusted or depended on.", "This is a reliable source of information.", "B1", "adjective"],
  ["struggle", "To have difficulty doing something.", "Many students struggle with pronunciation.", "B1", "verb"],
  ["support", "To help someone or agree with an idea.", "Her parents support her decision.", "B1", "verb"],
  ["accomplish", "To complete something successfully.", "The team hopes to accomplish the task today.", "B2", "verb"],
  ["challenge", "A difficult task that tests ability.", "Learning ten new words a day is a challenge.", "B2", "noun"],
  ["consequence", "A result of an action or situation.", "The consequence of missing practice was clear.", "B2", "noun"],
  ["estimate", "To guess an amount based on available information.", "We estimate the lesson will take twenty minutes.", "B2", "verb"],
  ["evidence", "Facts or signs that show something is true.", "The report provides evidence for the claim.", "B2", "noun"],
  ["maintain", "To keep something at the same level or condition.", "You need regular practice to maintain fluency.", "B2", "verb"],
  ["negotiate", "To discuss in order to reach an agreement.", "They negotiate the price before signing.", "B2", "verb"],
  ["prioritize", "To decide what is most important.", "Students should prioritize the words they often miss.", "B2", "verb"],
  ["remarkable", "Unusual or impressive in a way people notice.", "Her progress this month was remarkable.", "B2", "adjective"],
  ["sustainable", "Able to continue for a long time without harm.", "A sustainable study routine is better than cramming.", "B2", "adjective"],
  ["ambiguous", "Having more than one possible meaning.", "The ambiguous sentence confused the class.", "C1", "adjective"],
  ["coherent", "Clear, logical, and easy to understand.", "Her argument was coherent and persuasive.", "C1", "adjective"],
  ["compelling", "Very interesting or convincing.", "The speaker gave a compelling reason to continue.", "C1", "adjective"],
  ["concise", "Using few words while staying clear.", "A concise answer is often more effective.", "C1", "adjective"],
  ["deteriorate", "To become worse over time.", "Without practice, pronunciation can deteriorate.", "C1", "verb"],
  ["implement", "To put a plan or system into action.", "The school will implement a new study plan.", "C1", "verb"],
  ["leverage", "To use something effectively to get a result.", "You can leverage daily habits to learn faster.", "C1", "verb"],
  ["mitigate", "To make a problem less serious.", "Short reviews can mitigate forgetting.", "C1", "verb"],
  ["resilient", "Able to recover quickly after difficulty.", "A resilient learner keeps going after mistakes.", "C1", "adjective"],
  ["substantial", "Large in amount, value, or importance.", "She made substantial progress in six weeks.", "C1", "adjective"],
  ["ephemeral", "Lasting for only a short time.", "Motivation can be ephemeral without a clear routine.", "C2", "adjective"],
  ["exacerbate", "To make a bad situation worse.", "Skipping review can exacerbate memory gaps.", "C2", "verb"],
  ["incongruous", "Strange because it does not fit with its surroundings.", "The formal phrase felt incongruous in casual speech.", "C2", "adjective"],
  ["meticulous", "Very careful and attentive to detail.", "A meticulous learner checks each pronunciation.", "C2", "adjective"],
  ["nuance", "A small but important difference in meaning.", "The nuance between the two verbs is subtle.", "C2", "noun"],
  ["paradigm", "A typical model or way of thinking about something.", "Spaced repetition changed the paradigm of memorization.", "C2", "noun"],
  ["proliferation", "A rapid increase in the number of something.", "The proliferation of apps gives learners many choices.", "C2", "noun"],
  ["scrutinize", "To examine something very carefully.", "Advanced students scrutinize word choice in essays.", "C2", "verb"],
  ["ubiquitous", "Present or found everywhere.", "English words are ubiquitous in technology.", "C2", "adjective"],
  ["unequivocal", "Clear and leaving no doubt.", "The feedback was unequivocal after the wrong answer.", "C2", "adjective"],
];

export const fallbackWords: VocabWord[] = rawWords.map(
  ([word, definition, example, level, partOfSpeech], index) => ({
    id: index + 1,
    word,
    definition,
    example,
    example_with_blank: blankExample(example, word),
    level,
    part_of_speech: partOfSpeech,
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
  const sameLevel = words.filter((word) => word.level === level);
  const due = words.filter((word) => isDue(progress[word.id]));
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
    candidates = sameLevel.length > 0 ? sameLevel : words;
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
