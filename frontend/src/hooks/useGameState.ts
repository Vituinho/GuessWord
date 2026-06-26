import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  addDays,
  addMinutes,
  blankExample,
  calculateScore,
  createEmptyStudyState,
  dateKey,
  fallbackWords,
  isDue,
  levels,
  normalizeAnswer,
  scrambleWord,
  selectNextWord,
  yesterdayKey,
} from "@/lib/vocabulary";
import type { HistoryItem, Level, PracticeMode, StudyState, VocabWord, WordProgress } from "@/lib/vocabulary";

import type {
  ApiWordsResponse,
  AuthMode,
  AuthResponse,
  Feedback,
  Language,
  Leader,
  MultiplayerRoom,
  UserSession,
} from "@/lib/types";
import { apiClient } from "@/services/apiClient";
import { useLocalMode } from "@/store/LocalModeContext";

const CLIENT_ID_KEY = "guessword-client-id";

const SESSION_KEY = "guessword-session-v1";
const STORAGE_KEY = "guessword-study-state-v1";
const ROUND_SECONDS = 30;

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function safeStudyState(clientId: string): StudyState {
  if (typeof window === "undefined") return createEmptyStudyState(clientId);
  try {
    const saved = window.localStorage.getItem(`${STORAGE_KEY}-${clientId}`);
    if (!saved) return createEmptyStudyState(clientId);
    const parsed = JSON.parse(saved) as Partial<StudyState>;
    return {
      ...createEmptyStudyState(clientId),
      ...parsed,
      clientId,
      wordProgress: parsed.wordProgress ?? {},
      history: parsed.history ?? [],
    };
  } catch {
    return createEmptyStudyState(clientId);
  }
}

function safeSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as UserSession) : null;
  } catch {
    return null;
  }
}

interface ProgressPayloadItem {
  attempts: number;
  correct_attempts: number;
  incorrect_attempts: number;
  streak_correct: number;
  ease_factor: number;
  interval_days: number;
  learned: boolean;
  last_answered_at: string | null;
  next_review_at: string | null;
}

interface HistoryPayloadItem {
  id: string | number;
  word: string;
  level: Level;
  answer?: string;
  correct: boolean;
  score_delta?: number;
  mode?: string;
  studied_at: string;
}

function hydrateWord(word: ApiWordsResponse["data"][number]): VocabWord {
  return {
    id: word.id,
    word: word.word,
    definition: word.definition,
    definition_pt: (word as { definition_pt?: string }).definition_pt,
    example: word.example,
    example_with_blank: word.example_with_blank ?? blankExample(word.example, word.word),
    level: word.level,
    part_of_speech: word.part_of_speech ?? null,
  };
}


function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const binary = window.atob(`${normalized}${"=".repeat(padding)}`);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function authPayloadToSession(payload: AuthResponse["data"]): UserSession {
  return {
    clientId: payload.client_id,
    name: payload.name,
    email: payload.email,
    nationality: payload.nationality,
    provider: payload.provider,
    gmailConnected: payload.gmail_connected,
    sessionToken: payload.session_token ?? null,
    avatarUrl: payload.avatar_url,
  };
}

function consumeGoogleAuthResult(): { session?: UserSession; error?: string } | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const sessionValue = params.get("session");
  const errorValue = params.get("auth_error");
  if (!sessionValue && !errorValue) return null;
  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  if (sessionValue) {
    try {
      return { session: authPayloadToSession(JSON.parse(decodeBase64Url(sessionValue)) as AuthResponse["data"]) };
    } catch {
      return { error: "Não foi possível concluir o login com Google." };
    }
  }
  try {
    return { error: errorValue ? decodeBase64Url(errorValue) : "Login com Google cancelado." };
  } catch {
    return { error: "Login com Google cancelado." };
  }
}

function defaultProgress(): WordProgress {
  return {
    attempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    streakCorrect: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    learned: false,
    lastAnsweredAt: null,
    nextReviewAt: null,
  };
}

function nextInterval(progress: WordProgress): number {
  if (progress.streakCorrect <= 1) return 1;
  if (progress.streakCorrect === 2) return 3;
  return Math.min(30, Math.max(4, Math.ceil(Math.max(1, progress.intervalDays) * progress.easeFactor)));
}

function applyAttempt(
  state: StudyState,
  word: VocabWord,
  answer: string,
  correct: boolean,
  score: number,
  mode: PracticeMode,
): StudyState {
  const now = new Date();
  const current = state.wordProgress[word.id] ?? defaultProgress();
  const progress: WordProgress = {
    ...current,
    attempts: current.attempts + 1,
    lastAnsweredAt: now.toISOString(),
  };

  if (correct) {
    progress.correctAttempts += 1;
    progress.streakCorrect += 1;
    progress.easeFactor = Math.min(3.2, progress.easeFactor + (progress.streakCorrect >= 2 ? 0.15 : 0.05));
    progress.intervalDays = nextInterval(progress);
    progress.nextReviewAt = addDays(now, progress.intervalDays);
    progress.learned = progress.correctAttempts > 0;
  } else {
    progress.incorrectAttempts += 1;
    progress.streakCorrect = 0;
    progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.25);
    progress.intervalDays = 0;
    progress.nextReviewAt = addMinutes(now, 10);
    progress.learned = progress.correctAttempts > 0;
  }

  const today = dateKey(now);
  const currentStreak =
    state.lastStudyDate === today
      ? Math.max(1, state.currentStreak)
      : state.lastStudyDate === yesterdayKey()
        ? state.currentStreak + 1
        : 1;
  const nextXp = state.xp + score;
  const historyItem: HistoryItem = {
    id: `${word.id}-${now.getTime()}`,
    word: word.word,
    level: word.level,
    answer,
    correct,
    score,
    mode,
    studiedAt: now.toISOString(),
  };

  return {
    ...state,
    wordProgress: { ...state.wordProgress, [word.id]: progress },
    history: [historyItem, ...state.history].slice(0, 24),
    xp: nextXp,
    level: Math.floor(nextXp / 200) + 1,
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    lastStudyDate: today,
    totalAttempts: state.totalAttempts + 1,
    correctAttempts: state.correctAttempts + (correct ? 1 : 0),
  };
}

export function useGameState() {
  const { isLocalMode } = useLocalMode();
  const [gameStarted, setGameStarted] = useState(false);
  const [clueMode, setClueMode] = useState<"hint" | "no-hint">("hint");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [tiles, setTiles] = useState<Array<{ id: number; letter: string; used: boolean }>>([]);
  const [submitAnimation, setSubmitAnimation] = useState<"correct" | "incorrect" | null>(null);
  const [guessedLettersTileMap, setGuessedLettersTileMap] = useState<Record<number, number>>({});
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("guessword-lang");
      if (saved === "pt" || saved === "en") return saved;
    }
    return "pt";
  });

  const toggleLanguage = () => {
    const nextLang = lang === "pt" ? "en" : "pt";
    setLang(nextLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("guessword-lang", nextLang);
    }
  };

  const [words, setWords] = useState<VocabWord[]>(fallbackWords);
  const [selectedLevel, setSelectedLevel] = useState<Level>("A1");
  const [mode, setMode] = useState<PracticeMode>("auto");
  const [studyState, setStudyState] = useState<StudyState>(() => {
    if (typeof window === "undefined") return createEmptyStudyState();
    const savedClientId = window.localStorage.getItem(CLIENT_ID_KEY);
    if (savedClientId) return safeStudyState(savedClientId);
    return createEmptyStudyState();
  });
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [hintVisible, setHintVisible] = useState(false);
  const [combo, setCombo] = useState(0);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [multiplayerRoom, setMultiplayerRoom] = useState<MultiplayerRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPasswordConfirmation, setLoginPasswordConfirmation] = useState("");
  const [loginNationality, setLoginNationality] = useState("Brazil");
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const studyStateRef = useRef(studyState);
  const wordsRef = useRef(words);
  const userRef = useRef(currentUser);
  const roomRef = useRef(multiplayerRoom);
  const lastWordIdRef = useRef<number | null>(null);

  const initializeTilesAndBoxes = useCallback((word: string, currentClueMode: "hint" | "no-hint") => {
    const len = word.length;
    const wordLower = word.toLowerCase();
    setGuessedLettersTileMap({});

    if (currentClueMode === "hint") {
      const initialGuessed = Array(len).fill("");
      initialGuessed[0] = wordLower[0];
      setGuessedLetters(initialGuessed);
      setAnswer(wordLower[0]);

      const remainingLetters = wordLower.slice(1).split("");
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      const decoys: string[] = [];
      while (decoys.length < 5) {
        const randChar = alphabet[Math.floor(Math.random() * 26)];
        if (!wordLower.includes(randChar) && !decoys.includes(randChar)) {
          decoys.push(randChar);
        }
      }

      const combined = [...remainingLetters, ...decoys];
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }

      setTiles(combined.map((letter, index) => ({ id: index, letter, used: false })));
    } else {
      setGuessedLetters(Array(len).fill(""));
      setAnswer("");

      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      const randomLetters: string[] = [];
      const tileCount = Math.max(8, Math.min(14, len + 4));
      for (let i = 0; i < tileCount; i++) {
        const randChar = alphabet[Math.floor(Math.random() * 26)];
        randomLetters.push(randChar);
      }

      setTiles(randomLetters.map((letter, index) => ({ id: index, letter, used: false })));
    }
  }, []);

  const handleTileClick = useCallback(
    (tileIdx: number) => {
      if (feedback !== "idle" || !currentWord || submitAnimation !== null) return;
      const tile = tiles[tileIdx];
      if (tile.used) return;

      const firstEmpty = guessedLetters.findIndex((l, idx) => {
        if (clueMode === "hint" && idx === 0) return false;
        return l === "";
      });

      if (firstEmpty !== -1) {
        const nextGuessed = [...guessedLetters];
        nextGuessed[firstEmpty] = tile.letter;
        setGuessedLetters(nextGuessed);
        setAnswer(nextGuessed.join(""));

        const nextTiles = [...tiles];
        nextTiles[tileIdx].used = true;
        setTiles(nextTiles);

        setGuessedLettersTileMap((prev) => ({ ...prev, [firstEmpty]: tileIdx }));
      }
    },
    [guessedLetters, tiles, clueMode, feedback, currentWord, submitAnimation],
  );

  const handleBackspace = useCallback(() => {
    if (feedback !== "idle" || !currentWord || submitAnimation !== null) return;

    const lastFilled = [...guessedLetters].reverse().findIndex((l, revIdx) => {
      const idx = guessedLetters.length - 1 - revIdx;
      if (clueMode === "hint" && idx === 0) return false;
      return l !== "";
    });

    if (lastFilled !== -1) {
      const actualIdx = guessedLetters.length - 1 - lastFilled;
      const nextGuessed = [...guessedLetters];
      nextGuessed[actualIdx] = "";
      setGuessedLetters(nextGuessed);
      setAnswer(nextGuessed.join(""));

      const tileIdx = guessedLettersTileMap[actualIdx];
      if (tileIdx !== undefined && tileIdx !== -1) {
        const nextTiles = [...tiles];
        nextTiles[tileIdx].used = false;
        setTiles(nextTiles);
      }

      setGuessedLettersTileMap((prev) => {
        const nextMap = { ...prev };
        delete nextMap[actualIdx];
        return nextMap;
      });
    }
  }, [guessedLetters, guessedLettersTileMap, tiles, clueMode, feedback, currentWord, submitAnimation]);

  const removeLetterAtIndex = useCallback(
    (boxIdx: number) => {
      if (feedback !== "idle" || !currentWord || submitAnimation !== null) return;
      if (clueMode === "hint" && boxIdx === 0) return;

      const val = guessedLetters[boxIdx];
      if (!val) return;

      const nextGuessed = [...guessedLetters];
      nextGuessed[boxIdx] = "";
      setGuessedLetters(nextGuessed);
      setAnswer(nextGuessed.join(""));

      const tileIdx = guessedLettersTileMap[boxIdx];
      if (tileIdx !== undefined && tileIdx !== -1) {
        const nextTiles = [...tiles];
        nextTiles[tileIdx].used = false;
        setTiles(nextTiles);
      }

      setGuessedLettersTileMap((prev) => {
        const nextMap = { ...prev };
        delete nextMap[boxIdx];
        return nextMap;
      });
    },
    [guessedLetters, guessedLettersTileMap, tiles, clueMode, feedback, currentWord, submitAnimation],
  );

  const handleClear = useCallback(() => {
    if (feedback !== "idle" || !currentWord || submitAnimation !== null) return;

    const len = currentWord.word.length;
    const wordLower = currentWord.word.toLowerCase();

    if (clueMode === "hint") {
      const initialGuessed = Array(len).fill("");
      initialGuessed[0] = wordLower[0];
      setGuessedLetters(initialGuessed);
      setAnswer(wordLower[0]);
    } else {
      setGuessedLetters(Array(len).fill(""));
      setAnswer("");
    }

    const nextTiles = tiles.map((t) => ({ ...t, used: false }));
    setTiles(nextTiles);
    setGuessedLettersTileMap({});
  }, [currentWord, clueMode, tiles, feedback, submitAnimation]);

  const handleReshuffle = useCallback(() => {
    if (feedback !== "idle" || !currentWord || clueMode !== "no-hint") return;

    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const randomLetters: string[] = [];
    const tileCount = Math.max(8, Math.min(14, currentWord.word.length + 4));
    for (let i = 0; i < tileCount; i++) {
      const randChar = alphabet[Math.floor(Math.random() * 26)];
      randomLetters.push(randChar);
    }

    setTiles(randomLetters.map((letter, index) => ({ id: index, letter, used: false })));

    const len = currentWord.word.length;
    setGuessedLetters(Array(len).fill(""));
    setAnswer("");
    setGuessedLettersTileMap({});
  }, [currentWord, clueMode, feedback]);

  useEffect(() => {
    studyStateRef.current = studyState;
  }, [studyState]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    roomRef.current = multiplayerRoom;
  }, [multiplayerRoom]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const payload = await apiClient.get<{ data: Leader[] }>("/leaderboard");
      setLeaderboard(payload.data ?? []);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  const syncProgress = useCallback(async (session?: UserSession | null) => {
    const user = session ?? userRef.current;
    if (!user) return;

    try {
      const payload = await apiClient.get<{
        data: {
          xp: number;
          level: number;
          current_streak: number;
          best_streak: number;
          attempts: number;
          correct_attempts: number;
          word_progress: Record<string, ProgressPayloadItem>;
          history: HistoryPayloadItem[];
        };
      }>(`/progress?client_id=${encodeURIComponent(user.clientId)}`);

      const progressData = payload.data;
      const mappedWordProgress: Record<string, WordProgress> = {};

      if (progressData.word_progress) {
        Object.entries(progressData.word_progress).forEach(([wordId, p]) => {
          mappedWordProgress[wordId] = {
            attempts: p.attempts,
            correctAttempts: p.correct_attempts,
            incorrectAttempts: p.incorrect_attempts,
            streakCorrect: p.streak_correct,
            easeFactor: p.ease_factor,
            intervalDays: p.interval_days,
            learned: p.learned,
            lastAnsweredAt: p.last_answered_at,
            nextReviewAt: p.next_review_at,
          };
        });
      }

      const mappedHistory = (progressData.history ?? []).map((h) => ({
        id: h.id.toString(),
        word: h.word,
        level: h.level,
        answer: h.answer ?? "",
        correct: h.correct,
        score: h.score_delta ?? 0,
        mode: (h.mode as PracticeMode) ?? "level",
        studiedAt: h.studied_at,
      }));

        setStudyState((prev) => {
          const newState = {
            ...prev,
            xp: progressData.xp,
            level: progressData.level,
            currentStreak: progressData.current_streak,
            bestStreak: progressData.best_streak,
            wordProgress: { ...prev.wordProgress, ...mappedWordProgress },
            history: mappedHistory,
            totalAttempts: progressData.attempts,
            correctAttempts: progressData.correct_attempts,
          };
          studyStateRef.current = newState;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(`guessword-state-${user.clientId}`, JSON.stringify(newState));
          }
          return newState;
        });
    } catch (err) {
      console.error("Failed to sync progress:", err);
    }
  }, []);

  const finishLogin = useCallback(
    (session: UserSession) => {
      window.localStorage.setItem(CLIENT_ID_KEY, session.clientId);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setCurrentUser(session);
      const restored = safeStudyState(session.clientId);
      studyStateRef.current = restored;
      setStudyState(restored);
      setLoginError("");
      void loadLeaderboard();
      void syncProgress(session);
    },
    [loadLeaderboard, syncProgress],
  );

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      const googleAuth = consumeGoogleAuthResult();
      if (googleAuth?.session) {
        finishLogin(googleAuth.session);
        setApiOnline(true);
        setInitialized(true);
        return;
      }
      if (googleAuth?.error) {
        setLoginError(googleAuth.error);
      }
      const session = safeSession();
      const anonymousClientId = window.localStorage.getItem(CLIENT_ID_KEY) ?? createClientId();
      window.localStorage.setItem(CLIENT_ID_KEY, anonymousClientId);

      if (session) {
        setCurrentUser(session);
        const restored = safeStudyState(session.clientId);
        studyStateRef.current = restored;
        setStudyState(restored);
        void syncProgress(session);
      } else {
        const empty = createEmptyStudyState(anonymousClientId);
        studyStateRef.current = empty;
        setStudyState(empty);
      }
      setInitialized(true);
    }, 0);
    const controller = new AbortController();

    apiClient.get<ApiWordsResponse>("/words", { signal: controller.signal })
      .then((payload) => {
        const apiWords = payload.data.map(hydrateWord);
        if (apiWords.length > 0) {
          setWords(apiWords);
          wordsRef.current = apiWords;
        }
        setApiOnline(true);
        void loadLeaderboard();
      })
      .catch(() => {
        setApiOnline(false);
      });

    return () => {
      window.clearTimeout(hydrateTimer);
      controller.abort();
    };
  }, [finishLogin, loadLeaderboard, isLocalMode]);

  useEffect(() => {
    if (!initialized) return;
    window.localStorage.setItem(`${STORAGE_KEY}-${studyState.clientId}`, JSON.stringify(studyState));
  }, [initialized, studyState]);

  useEffect(() => {
    if (!currentUser || leaderboard.length === 0) return;
    const userInLeaderboard = leaderboard.find(
      (leader) => leader.client_id === currentUser.clientId || leader.display_name === currentUser.name,
    );
    if (userInLeaderboard && userInLeaderboard.xp !== studyState.xp) {
      setTimeout(() => {
        setStudyState((prev) => ({
          ...prev,
          xp: userInLeaderboard.xp,
          level: userInLeaderboard.level,
          streak: userInLeaderboard.streak,
        }));
      }, 0);
    }
  }, [leaderboard, currentUser, studyState.xp]);

  const beginRound = useCallback(() => {
    const next = selectNextWord(
      wordsRef.current,
      selectedLevel,
      mode,
      studyStateRef.current.wordProgress,
      lastWordIdRef.current,
    );
    lastWordIdRef.current = next?.id ?? null;
    setCurrentWord(next);
    setAnswer("");
    setFeedback("idle");
    setTimeLeft(ROUND_SECONDS);
    setHintVisible(false);

    if (next) {
      initializeTilesAndBoxes(next.word, clueMode);
    }
  }, [mode, selectedLevel, clueMode, initializeTilesAndBoxes]);

  const startGame = (selectedClueMode: "hint" | "no-hint") => {
    setClueMode(selectedClueMode);
    setGameStarted(true);
    if (currentWord) {
      initializeTilesAndBoxes(currentWord.word, selectedClueMode);
    } else {
      beginRound();
    }
  };

  useEffect(() => {
    if (initialized) {
      beginRound();
    }
  }, [beginRound, initialized]);

  const fetchRoom = useCallback(async (code: string) => {
    try {
      const user = userRef.current;
      const url = user?.clientId
        ? `/multiplayer/rooms/${code}?client_id=${encodeURIComponent(user.clientId)}`
        : `/multiplayer/rooms/${code}`;
      const payload = await apiClient.get<{ data: MultiplayerRoom }>(url);
      setMultiplayerRoom(payload.data);
    } catch {
      setApiOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!multiplayerRoom) return;
    const interval = window.setInterval(() => {
      void fetchRoom(multiplayerRoom.code);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [fetchRoom, multiplayerRoom]);

  useEffect(() => {
    if (!multiplayerRoom || !multiplayerRoom.current_word_id) return;
    if (multiplayerRoom.players.length >= 2 && !gameStarted) {
      setTimeout(() => setGameStarted(true), 0);
    }
    const matchedWord = words.find((w) => w.id === multiplayerRoom.current_word_id);
    if (!matchedWord) return;
    if (currentWord?.id !== matchedWord.id) {
      setTimeout(() => {
        setCurrentWord(matchedWord);
        setAnswer("");
        setFeedback("idle");
        setHintVisible(false);
        setTimeLeft(multiplayerRoom.round_seconds ?? ROUND_SECONDS);
        initializeTilesAndBoxes(matchedWord.word, clueMode);
      }, 0);
    }
  }, [
    multiplayerRoom?.current_word_id,
    multiplayerRoom?.players.length,
    multiplayerRoom?.round_seconds,
    words,
    currentWord?.id,
    clueMode,
    initializeTilesAndBoxes,
    gameStarted,
  ]);

  const syncAttempt = useCallback(
    async (word: VocabWord, submittedAnswer: string, seconds: number, hintsUsed: boolean) => {
      const user = userRef.current;
      try {
        const payload = await apiClient.post<{
          data: {
            correct: boolean;
            correct_answer: string;
            score_delta: number;
            user_progress: {
              xp: number;
              level: number;
              current_streak: number;
              best_streak: number;
              attempts: number;
              correct_attempts: number;
              word_progress: Record<string, ProgressPayloadItem>;
              history: HistoryPayloadItem[];
            };
          };
        }>("/attempts", {
          client_id: studyStateRef.current.clientId,
          word_id: word.id,
          answer: submittedAnswer,
          seconds_spent: seconds,
          hints_used: hintsUsed,
          mode,
        });

        setApiOnline(true);
        void loadLeaderboard();

        const progressData = payload.data.user_progress;
        if (progressData) {
          const mappedWordProgress: Record<string, WordProgress> = {};
          if (progressData.word_progress) {
            Object.entries(progressData.word_progress).forEach(([wordId, p]) => {
              mappedWordProgress[wordId] = {
                attempts: p.attempts,
                correctAttempts: p.correct_attempts,
                incorrectAttempts: p.incorrect_attempts,
                streakCorrect: p.streak_correct,
                easeFactor: p.ease_factor,
                intervalDays: p.interval_days,
                learned: p.learned,
                lastAnsweredAt: p.last_answered_at,
                nextReviewAt: p.next_review_at,
              };
            });
          }

          const mappedHistory = (progressData.history ?? []).map((h) => ({
            id: h.id.toString(),
            word: h.word,
            level: h.level,
            answer: h.answer ?? "",
            correct: h.correct,
            score: h.score_delta ?? 0,
            mode: (h.mode as PracticeMode) ?? "level",
            studiedAt: h.studied_at,
          }));

          setStudyState((prev) => {
            const newState = {
              ...prev,
              xp: progressData.xp,
              level: progressData.level,
              currentStreak: progressData.current_streak,
              bestStreak: progressData.best_streak,
              wordProgress: { ...prev.wordProgress, ...mappedWordProgress },
              history: mappedHistory,
              totalAttempts: progressData.attempts,
              correctAttempts: progressData.correct_attempts,
            };
            studyStateRef.current = newState;
            if (typeof window !== "undefined" && user) {
              window.localStorage.setItem(`guessword-state-${user.clientId}`, JSON.stringify(newState));
            }
            return newState;
          });
        }

        if (user && roomRef.current) {
          const roomPayload = await apiClient.post<{ data: { room: MultiplayerRoom } }>(
            `/multiplayer/rooms/${roomRef.current.code}/attempts`,
            {
              client_id: user.clientId,
              display_name: user.name,
              nationality: user.nationality,
              word_id: word.id,
              answer: submittedAnswer,
              seconds_spent: seconds,
              hints_used: hintsUsed,
            }
          );
          setMultiplayerRoom(roomPayload.data.room);
        }
      } catch {
        setApiOnline(false);
      }
    },
    [loadLeaderboard, mode],
  );

  const submitAnswer = useCallback(
    (timedOut = false) => {
      if (!currentWord || feedback !== "idle" || !currentUser || submitAnimation !== null) {
        return;
      }
      if (timedOut) {
        setFeedback("timeout");
        void syncAttempt(currentWord, "", ROUND_SECONDS, hintVisible);
        return;
      }
      const submittedAnswer = answer;
      const correct = normalizeAnswer(submittedAnswer) === normalizeAnswer(currentWord.word);
      const seconds = ROUND_SECONDS - timeLeft;
      const nextCombo = correct ? combo + 1 : 0;
      const score = correct ? calculateScore(currentWord.level, seconds, hintVisible, nextCombo) : 0;
      const nextState = applyAttempt(studyStateRef.current, currentWord, submittedAnswer, correct, score, mode);

      studyStateRef.current = nextState;
      setStudyState(nextState);
      setCombo(nextCombo);

      if (correct) {
        setSubmitAnimation("correct");
        void syncAttempt(currentWord, submittedAnswer, seconds, hintVisible);
        setTimeout(() => {
          setSubmitAnimation(null);
          beginRound();
        }, 1000);
      } else {
        setSubmitAnimation("incorrect");
        void syncAttempt(currentWord, submittedAnswer, seconds, hintVisible);
        setTimeout(() => {
          setSubmitAnimation(null);
          setFeedback("incorrect");
        }, 1000);
      }
    },
    [
      answer,
      combo,
      currentUser,
      currentWord,
      feedback,
      hintVisible,
      mode,
      syncAttempt,
      timeLeft,
      submitAnimation,
      beginRound,
    ],
  );

  useEffect(() => {
    if (feedback !== "idle" || !currentWord || !currentUser) return;
    if (timeLeft <= 0) {
      setTimeout(() => submitAnswer(true), 0);
      return;
    }
    const timer = window.setTimeout(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [currentUser, currentWord, feedback, submitAnswer, timeLeft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!gameStarted || !currentWord || submitAnimation !== null) return;
      if (feedback !== "idle") {
        if (event.key === "Enter") {
          event.preventDefault();
          beginRound();
        }
        return;
      }
      const key = event.key.toLowerCase();
      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const isFilled = guessedLetters.every((l) => l !== "");
        if (isFilled) {
          submitAnswer(false);
        }
        return;
      }
      if (/^[a-z]$/.test(key)) {
        event.preventDefault();
        const firstEmpty = guessedLetters.findIndex((l, idx) => {
          if (clueMode === "hint" && idx === 0) return false;
          return l === "";
        });
        if (firstEmpty !== -1) {
          const tileIdx = tiles.findIndex((t) => t.letter === key && !t.used);
          const nextGuessed = [...guessedLetters];
          nextGuessed[firstEmpty] = key;
          setGuessedLetters(nextGuessed);
          setAnswer(nextGuessed.join(""));
          if (tileIdx !== -1) {
            const nextTiles = [...tiles];
            nextTiles[tileIdx].used = true;
            setTiles(nextTiles);
            setGuessedLettersTileMap((prev) => ({ ...prev, [firstEmpty]: tileIdx }));
          } else {
            setGuessedLettersTileMap((prev) => ({ ...prev, [firstEmpty]: -1 }));
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    gameStarted,
    feedback,
    currentWord,
    guessedLetters,
    tiles,
    clueMode,
    beginRound,
    handleBackspace,
    guessedLettersTileMap,
    setAnswer,
    submitAnswer,
    submitAnimation,
  ]);

  const stats = useMemo(() => {
    const progressValues = Object.values(studyState.wordProgress);
    const accuracy =
      studyState.totalAttempts > 0 ? Math.round((studyState.correctAttempts / studyState.totalAttempts) * 100) : 0;
    const learned = progressValues.filter((item) => item.learned).length;
    const dueReviews = progressValues.filter((item) => isDue(item)).length;
    const seen = progressValues.filter((item) => item.attempts > 0).length;
    const levelStats = levels.map((level) => {
      const levelWords = words.filter((word) => word.level === level);
      const seenCount = levelWords.filter((word) => (studyState.wordProgress[word.id]?.attempts ?? 0) > 0).length;
      const learnedCount = levelWords.filter((word) => studyState.wordProgress[word.id]?.learned).length;
      return { level, total: levelWords.length, seen: seenCount, learned: learnedCount };
    });
    return { accuracy, learned, dueReviews, seen, levelStats };
  }, [studyState, words]);

  const timerRatio = Math.max(0, Math.min(100, (timeLeft / ROUND_SECONDS) * 100));
  const currentProgress = currentWord ? studyState.wordProgress[currentWord.id] : undefined;
  const feedbackTitle = feedback === "correct" ? "Correto" : feedback === "timeout" ? "Tempo esgotado" : "Incorreto";

  const switchAuthMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    setLoginError("");
  };

  const submitAuth = async () => {
    const email = loginEmail.trim().toLowerCase();
    const name = loginName.trim();

    if (!email || !loginPassword) {
      setLoginError("Preencha email e senha.");
      return;
    }
    if (authMode === "register" && (!name || !loginNationality.trim())) {
      setLoginError("Preencha nome e nacionalidade.");
      return;
    }
    setAuthLoading(true);
    setLoginError("");
    try {
      const payload = await apiClient.post<AuthResponse>(`/auth/${authMode === "register" ? "register" : "login"}`, {
        name: authMode === "register" ? name : undefined,
        email,
        nationality: loginNationality,
        password: loginPassword,
        password_confirmation: authMode === "register" ? loginPasswordConfirmation : undefined,
      });

      finishLogin(authPayloadToSession(payload.data));
      setApiOnline(true);
    } catch (err: unknown) {
      setApiOnline(false);
      const message = err instanceof Error ? err.message : "Não foi possível conectar ao servidor de autenticação.";
      setLoginError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const startGoogleLogin = () => {
    setAuthLoading(true);
    setLoginError("");
    try {
      const base = apiClient.getApiBaseUrl().replace(/\/$/, "");
      const redirectUrl = `${base}/auth/google/redirect?nationality=${encodeURIComponent(loginNationality)}`;
      window.location.assign(redirectUrl);
    } catch {
      setAuthLoading(false);
      setLoginError("Não foi possível iniciar o login com Google.");
    }
  };

  const logout = () => {
    const sessionToken = currentUser?.sessionToken;
    if (sessionToken) {
      void apiClient.post("/auth/logout").catch(() => undefined);
    }
    window.localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setMultiplayerRoom(null);
    setCombo(0);
  };

  const createRoom = async () => {
    if (!currentUser) return;
    try {
      const payload = await apiClient.post<{ data: MultiplayerRoom }>("/multiplayer/rooms", {
        client_id: currentUser.clientId,
        display_name: currentUser.name,
        nationality: currentUser.nationality,
        level: selectedLevel,
      });
      setMultiplayerRoom(payload.data);
      setJoinCode(payload.data.code);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  };

  const joinRoom = async () => {
    if (!currentUser || !joinCode.trim()) return;
    try {
      const payload = await apiClient.post<{ data: MultiplayerRoom }>(`/multiplayer/rooms/${joinCode.trim().toUpperCase()}/join`, {
        client_id: currentUser.clientId,
        display_name: currentUser.name,
        nationality: currentUser.nationality,
      });
      setMultiplayerRoom(payload.data);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  };

  const leaveRoom = () => {
    setMultiplayerRoom(null);
    setJoinCode("");
  };

  const speakWord = () => {
    if (!currentWord || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  return {
    gameStarted,
    clueMode,
    setClueMode,
    guessedLetters,
    tiles,
    submitAnimation,
    lang,
    toggleLanguage,
    selectedLevel,
    setSelectedLevel,
    mode,
    setMode,
    studyState,
    currentUser,
    currentWord,
    feedback,
    timeLeft,
    timerRatio,
    combo,
    apiOnline,
    leaderboard,
    multiplayerRoom,
    joinCode,
    setJoinCode,
    authMode,
    switchAuthMode,
    loginName,
    setLoginName,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginPasswordConfirmation,
    setLoginPasswordConfirmation,
    loginNationality,
    setLoginNationality,
    loginError,
    authLoading,
    stats,
    currentProgress,
    feedbackTitle,
    initializeTilesAndBoxes,
    handleTileClick,
    handleBackspace,
    removeLetterAtIndex,
    handleClear,
    handleReshuffle,
    beginRound,
    startGame,
    submitAnswer,
    submitAuth,
    startGoogleLogin,
    logout,
    createRoom,
    joinRoom,
    leaveRoom,
    speakWord,
    formatDateTime,
  };
}
