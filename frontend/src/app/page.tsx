"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMinutes,
  blankExample,
  calculateScore,
  createEmptyStudyState,
  dateKey,
  fallbackWords,
  HistoryItem,
  isDue,
  Level,
  levels,
  modeLabels,
  normalizeAnswer,
  PracticeMode,
  scrambleWord,
  selectNextWord,
  StudyState,
  VocabWord,
  WordProgress,
  yesterdayKey,
} from "@/lib/vocabulary";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const CLIENT_ID_KEY = "guessword-client-id";
const SESSION_KEY = "guessword-session-v1";
const STORAGE_KEY = "guessword-study-state-v1";
const ROUND_SECONDS = 30;

type Feedback = "idle" | "correct" | "incorrect" | "timeout";
type AuthMode = "login" | "register";
type LoginProvider = "email" | "gmail";

type UserSession = {
  clientId: string;
  name: string;
  email: string;
  nationality: string;
  provider: LoginProvider;
  gmailConnected: boolean;
  sessionToken?: string | null;
  avatarUrl?: string | null;
};

type Leader = {
  rank: number;
  client_id: string;
  display_name: string;
  nationality?: string | null;
  xp: number;
  level: number;
  streak: number;
  best_streak?: number;
};

type MultiplayerPlayer = {
  rank: number;
  client_id: string;
  display_name: string;
  nationality?: string | null;
  score: number;
  combo: number;
  attempts: number;
  correct_attempts: number;
};

type MultiplayerRoom = {
  code: string;
  level: Level;
  status: string;
  current_word_id?: number | null;
  players: MultiplayerPlayer[];
};

type ApiWordsResponse = {
  data: Array<Partial<VocabWord> & Pick<VocabWord, "id" | "word" | "definition" | "example" | "level">>;
};

type AuthResponse = {
  data: {
    client_id: string;
    name: string;
    email: string;
    nationality: string;
    provider: LoginProvider;
    gmail_connected: boolean;
    session_token?: string | null;
    avatar_url?: string | null;
  };
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

const nationalities = [
  "Brazil",
  "United States",
  "Canada",
  "Mexico",
  "Portugal",
  "Spain",
  "United Kingdom",
  "Argentina",
  "Colombia",
  "Japan",
  "South Korea",
  "Other",
];

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function safeStudyState(clientId: string): StudyState {
  if (typeof window === "undefined") {
    return createEmptyStudyState(clientId);
  }

  try {
    const saved = window.localStorage.getItem(`${STORAGE_KEY}-${clientId}`);

    if (!saved) {
      return createEmptyStudyState(clientId);
    }

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
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as UserSession) : null;
  } catch {
    return null;
  }
}

function hydrateWord(word: ApiWordsResponse["data"][number]): VocabWord {
  return {
    id: word.id,
    word: word.word,
    definition: word.definition,
    example: word.example,
    example_with_blank: word.example_with_blank ?? blankExample(word.example, word.word),
    level: word.level,
    part_of_speech: word.part_of_speech ?? null,
  };
}

function jsonHeaders(session?: UserSession | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.sessionToken) {
    headers.Authorization = `Bearer ${session.sessionToken}`;
  }

  return headers;
}

async function readApiMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : null;

    return firstError ?? payload.message ?? fallback;
  } catch {
    return fallback;
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
  if (progress.streakCorrect <= 1) {
    return 1;
  }

  if (progress.streakCorrect === 2) {
    return 3;
  }

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
    progress.learned = progress.correctAttempts >= 3 && progress.streakCorrect >= 2;
  } else {
    progress.incorrectAttempts += 1;
    progress.streakCorrect = 0;
    progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.25);
    progress.intervalDays = 0;
    progress.nextReviewAt = addMinutes(now, 10);
    progress.learned = false;
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
    wordProgress: {
      ...state.wordProgress,
      [word.id]: progress,
    },
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function localUserSession(name: string, email: string, nationality: string, provider: LoginProvider): UserSession {
  const savedClientId = window.localStorage.getItem(CLIENT_ID_KEY) ?? createClientId();
  window.localStorage.setItem(CLIENT_ID_KEY, savedClientId);

  return {
    clientId: savedClientId,
    name,
    email,
    nationality,
    provider,
    gmailConnected: provider === "gmail",
    sessionToken: null,
  };
}

export default function Home() {
  const [words, setWords] = useState<VocabWord[]>(fallbackWords);
  const [selectedLevel, setSelectedLevel] = useState<Level>("A1");
  const [mode, setMode] = useState<PracticeMode>("auto");
  const [studyState, setStudyState] = useState<StudyState>(() => createEmptyStudyState());
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintLetters, setHintLetters] = useState<string[]>([]);
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const studyStateRef = useRef(studyState);
  const wordsRef = useRef(words);
  const userRef = useRef(currentUser);
  const roomRef = useRef(multiplayerRoom);
  const lastWordIdRef = useRef<number | null>(null);

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
      const response = await fetch(`${API_BASE}/leaderboard`);

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { data: Leader[] };
      setLeaderboard(payload.data ?? []);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  const finishLogin = useCallback((session: UserSession) => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setCurrentUser(session);
    const restored = safeStudyState(session.clientId);
    studyStateRef.current = restored;
    setStudyState(restored);
    setLoginError("");
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      const session = safeSession();
      const anonymousClientId = window.localStorage.getItem(CLIENT_ID_KEY) ?? createClientId();
      window.localStorage.setItem(CLIENT_ID_KEY, anonymousClientId);

      if (session) {
        setCurrentUser(session);
        const restored = safeStudyState(session.clientId);
        studyStateRef.current = restored;
        setStudyState(restored);
      } else {
        const empty = createEmptyStudyState(anonymousClientId);
        studyStateRef.current = empty;
        setStudyState(empty);
      }

      setInitialized(true);
    }, 0);
    const controller = new AbortController();

    fetch(`${API_BASE}/words`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("API unavailable");
        }

        const payload = (await response.json()) as ApiWordsResponse;
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
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    window.localStorage.setItem(`${STORAGE_KEY}-${studyState.clientId}`, JSON.stringify(studyState));
  }, [initialized, studyState]);

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
    setHintLetters(next ? scrambleWord(next.word) : []);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [mode, selectedLevel]);

  useEffect(() => {
    if (initialized) {
      beginRound();
    }
  }, [beginRound, initialized]);

  const fetchRoom = useCallback(async (code: string) => {
    try {
      const response = await fetch(`${API_BASE}/multiplayer/rooms/${code}`);

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { data: MultiplayerRoom };
      setMultiplayerRoom(payload.data);
    } catch {
      setApiOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!multiplayerRoom) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchRoom(multiplayerRoom.code);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [fetchRoom, multiplayerRoom]);

  const syncAttempt = useCallback(
    async (word: VocabWord, submittedAnswer: string, seconds: number, hintsUsed: boolean) => {
      const user = userRef.current;

      try {
        const response = await fetch(`${API_BASE}/attempts`, {
          method: "POST",
          headers: jsonHeaders(user),
          body: JSON.stringify({
            client_id: studyStateRef.current.clientId,
            word_id: word.id,
            answer: submittedAnswer,
            seconds_spent: seconds,
            hints_used: hintsUsed,
            mode,
          }),
        });

        setApiOnline(response.ok);

        if (response.ok) {
          void loadLeaderboard();
        }

        if (response.ok && user && roomRef.current) {
          const roomResponse = await fetch(`${API_BASE}/multiplayer/rooms/${roomRef.current.code}/attempts`, {
            method: "POST",
            headers: jsonHeaders(user),
            body: JSON.stringify({
              client_id: user.clientId,
              display_name: user.name,
              nationality: user.nationality,
              word_id: word.id,
              answer: submittedAnswer,
              seconds_spent: seconds,
              hints_used: hintsUsed,
            }),
          });

          if (roomResponse.ok) {
            const payload = (await roomResponse.json()) as { data: { room: MultiplayerRoom } };
            setMultiplayerRoom(payload.data.room);
          }
        }
      } catch {
        setApiOnline(false);
      }
    },
    [loadLeaderboard, mode],
  );

  const submitAnswer = useCallback(
    (timedOut = false) => {
      if (!currentWord || feedback !== "idle" || !currentUser) {
        return;
      }

      const submittedAnswer = timedOut ? "" : answer;
      const correct = !timedOut && normalizeAnswer(submittedAnswer) === normalizeAnswer(currentWord.word);
      const seconds = ROUND_SECONDS - timeLeft;
      const nextCombo = correct ? combo + 1 : 0;
      const score = correct ? calculateScore(currentWord.level, seconds, hintVisible, nextCombo) : 0;
      const nextState = applyAttempt(studyStateRef.current, currentWord, submittedAnswer, correct, score, mode);

      studyStateRef.current = nextState;
      setStudyState(nextState);
      setCombo(nextCombo);
      setFeedback(timedOut ? "timeout" : correct ? "correct" : "incorrect");
      void syncAttempt(currentWord, submittedAnswer, seconds, hintVisible);
    },
    [answer, combo, currentUser, currentWord, feedback, hintVisible, mode, syncAttempt, timeLeft],
  );

  useEffect(() => {
    if (feedback !== "idle" || !currentWord || !currentUser) {
      return;
    }

    if (timeLeft <= 0) {
      submitAnswer(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentUser, currentWord, feedback, submitAnswer, timeLeft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && feedback !== "idle") {
        event.preventDefault();
        beginRound();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [beginRound, feedback]);

  const passwordChecks = useMemo(
    () => ({
      length: loginPassword.length >= 8,
      mixedCase: /[a-z]/.test(loginPassword) && /[A-Z]/.test(loginPassword),
      number: /\d/.test(loginPassword),
      match: loginPassword.length > 0 && loginPassword === loginPasswordConfirmation,
    }),
    [loginPassword, loginPasswordConfirmation],
  );
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const registerPasswordReady =
    passwordChecks.length && passwordChecks.mixedCase && passwordChecks.number && passwordChecks.match;

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

      return {
        level,
        total: levelWords.length,
        seen: seenCount,
        learned: learnedCount,
      };
    });

    return { accuracy, learned, dueReviews, seen, levelStats };
  }, [studyState, words]);

  const timerRatio = Math.max(0, Math.min(100, (timeLeft / ROUND_SECONDS) * 100));
  const currentProgress = currentWord ? studyState.wordProgress[currentWord.id] : undefined;
  const feedbackTitle =
    feedback === "correct" ? "Correto" : feedback === "timeout" ? "Tempo esgotado" : "Incorreto";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (feedback !== "idle") {
      beginRound();
      return;
    }

    submitAnswer(false);
  };

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

    if (authMode === "register" && !registerPasswordReady) {
      setLoginError("A senha precisa cumprir todos os requisitos.");
      return;
    }

    setAuthLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/auth/${authMode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: authMode === "register" ? name : undefined,
          email,
          nationality: loginNationality,
          password: loginPassword,
          password_confirmation: authMode === "register" ? loginPasswordConfirmation : undefined,
        }),
      });

      if (!response.ok) {
        setLoginError(await readApiMessage(response, "Nao foi possivel autenticar."));
        return;
      }

      const payload = (await response.json()) as AuthResponse;

      finishLogin({
        clientId: payload.data.client_id,
        name: payload.data.name,
        email: payload.data.email,
        nationality: payload.data.nationality,
        provider: payload.data.provider,
        gmailConnected: payload.data.gmail_connected,
        sessionToken: payload.data.session_token ?? null,
        avatarUrl: payload.data.avatar_url,
      });
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setLoginError("Nao foi possivel conectar ao servidor de autenticacao.");
    } finally {
      setAuthLoading(false);
    }
  };

  const startGoogleLogin = async () => {
    setAuthLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/auth/google-url?nationality=${encodeURIComponent(loginNationality)}`);

      if (!response.ok) {
        setLoginError(await readApiMessage(response, "Google nao esta disponivel agora."));
        return;
      }

      const payload = (await response.json()) as { configured: boolean; message?: string; url?: string };

      if (!payload.configured || !payload.url) {
        setLoginError(payload.message ?? "Google OAuth ainda nao esta configurado no backend.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setApiOnline(false);
      setLoginError("Nao foi possivel iniciar o login com Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  const continueOffline = () => {
    const name = loginName.trim() || "Player";
    const email = loginEmail.trim().toLowerCase() || "local@guessword.app";

    finishLogin(localUserSession(name, email, loginNationality, "email"));
    setApiOnline(false);
  };

  const logout = () => {
    const sessionToken = currentUser?.sessionToken;

    if (sessionToken) {
      void fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      }).catch(() => undefined);
    }

    window.localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setMultiplayerRoom(null);
    setCombo(0);
  };

  const createRoom = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/multiplayer/rooms`, {
        method: "POST",
        headers: jsonHeaders(currentUser),
        body: JSON.stringify({
          client_id: currentUser.clientId,
          display_name: currentUser.name,
          nationality: currentUser.nationality,
          level: selectedLevel,
        }),
      });

      if (!response.ok) {
        throw new Error("Room unavailable");
      }

      const payload = (await response.json()) as { data: MultiplayerRoom };
      setMultiplayerRoom(payload.data);
      setJoinCode(payload.data.code);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  };

  const joinRoom = async () => {
    if (!currentUser || !joinCode.trim()) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/multiplayer/rooms/${joinCode.trim().toUpperCase()}/join`, {
        method: "POST",
        headers: jsonHeaders(currentUser),
        body: JSON.stringify({
          client_id: currentUser.clientId,
          display_name: currentUser.name,
          nationality: currentUser.nationality,
        }),
      });

      if (!response.ok) {
        throw new Error("Join unavailable");
      }

      const payload = (await response.json()) as { data: MultiplayerRoom };
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
    if (!currentWord || !("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (!currentUser) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="brand-lockup">
            <div className="brand-mark">GW</div>
            <div>
              <p className="eyebrow">GuessWord</p>
              <h1>Vocabulary battle</h1>
            </div>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Autenticacao">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => switchAuthMode("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => switchAuthMode("register")}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitAuth();
            }}
          >
            {authMode === "register" ? (
              <label>
                Nome
                <input
                  autoComplete="name"
                  onChange={(event) => setLoginName(event.target.value)}
                  placeholder="Seu nome"
                  value={loginName}
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                autoComplete="email"
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="voce@email.com"
                type="email"
                value={loginEmail}
              />
            </label>
            <label>
              Senha
              <input
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder={authMode === "login" ? "Sua senha" : "Minimo de 8 caracteres"}
                type="password"
                value={loginPassword}
              />
            </label>

            {authMode === "register" ? (
              <>
                <label>
                  Confirmar senha
                  <input
                    autoComplete="new-password"
                    onChange={(event) => setLoginPasswordConfirmation(event.target.value)}
                    placeholder="Repita a senha"
                    type="password"
                    value={loginPasswordConfirmation}
                  />
                </label>

                <div className="password-panel" aria-live="polite">
                  <div className="password-meter">
                    <span style={{ width: `${(passwordScore / 4) * 100}%` }} />
                  </div>
                  <div className="password-rules">
                    <span className={passwordChecks.length ? "ok" : ""}>8+ caracteres</span>
                    <span className={passwordChecks.mixedCase ? "ok" : ""}>Maiuscula e minuscula</span>
                    <span className={passwordChecks.number ? "ok" : ""}>Numero</span>
                    <span className={passwordChecks.match ? "ok" : ""}>Confirmacao igual</span>
                  </div>
                </div>

                <label>
                  Nacionalidade
                  <select onChange={(event) => setLoginNationality(event.target.value)} value={loginNationality}>
                    {nationalities.map((nationality) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            {loginError ? <div className="login-error">{loginError}</div> : null}

            <div className="login-actions">
              <button disabled={authLoading} type="submit">
                {authLoading ? "Aguarde" : authMode === "login" ? "Entrar" : "Criar conta"}
              </button>
              <button className="gmail-button" disabled={authLoading} onClick={() => void startGoogleLogin()} type="button">
                Google
              </button>
            </div>

            <button className="offline-button" disabled={authLoading} onClick={continueOffline} type="button">
              Modo local
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">GW</div>
          <div>
            <p className="eyebrow">GuessWord</p>
            <h1>Recall arena</h1>
          </div>
        </div>
        <div className="top-actions">
          <div className={`api-status ${apiOnline ? "online" : apiOnline === false ? "offline" : ""}`}>
            <span />
            {apiOnline ? "API online" : apiOnline === false ? "Modo local" : "Conectando"}
          </div>
          <button className="ghost-button compact" onClick={logout} type="button">
            Sair
          </button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Progresso">
        <article className="metric-card">
          <span>Acertos</span>
          <strong>{stats.accuracy}%</strong>
        </article>
        <article className="metric-card">
          <span>Aprendidas</span>
          <strong>{stats.learned}</strong>
        </article>
        <article className="metric-card">
          <span>Streak</span>
          <strong>{studyState.currentStreak}d</strong>
        </article>
        <article className="metric-card">
          <span>XP</span>
          <strong>{studyState.xp}</strong>
        </article>
        <article className="metric-card">
          <span>Level</span>
          <strong>{studyState.level}</strong>
        </article>
        <article className="metric-card accent">
          <span>Combo</span>
          <strong>{combo}x</strong>
        </article>
      </section>

      <div className="workspace-grid">
        <aside className="side-panel" aria-label="Controles">
          <section className="account-card">
            <div className="avatar">{currentUser.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.nationality}</span>
              <small>{currentUser.gmailConnected ? "Gmail conectado" : currentUser.email}</small>
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>Modo</span>
              <strong>{stats.dueReviews} revisoes</strong>
            </div>
            <div className="segmented-control">
              {(Object.keys(modeLabels) as PracticeMode[]).map((item) => (
                <button
                  className={mode === item ? "active" : ""}
                  key={item}
                  onClick={() => setMode(item)}
                  type="button"
                >
                  {modeLabels[item]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>Niveis</span>
              <strong>{stats.seen} vistas</strong>
            </div>
            <div className="level-grid">
              {levels.map((level) => (
                <button
                  className={selectedLevel === level ? "active" : ""}
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>Multiplayer</span>
              <strong>{multiplayerRoom ? multiplayerRoom.code : "offline"}</strong>
            </div>
            <div className="room-controls">
              <button className="ghost-button primary" onClick={() => void createRoom()} type="button">
                Criar sala
              </button>
              <div className="join-row">
                <input
                  maxLength={8}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="Codigo"
                  value={joinCode}
                />
                <button className="ghost-button" onClick={() => void joinRoom()} type="button">
                  Entrar
                </button>
              </div>
              {multiplayerRoom ? (
                <button className="ghost-button compact" onClick={leaveRoom} type="button">
                  Sair da sala
                </button>
              ) : null}
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>Progresso por nivel</span>
            </div>
            <div className="level-progress-list">
              {stats.levelStats.map((item) => (
                <div className="level-progress" key={item.level}>
                  <div>
                    <strong>{item.level}</strong>
                    <span>
                      {item.learned}/{item.total}
                    </span>
                  </div>
                  <div className="mini-track">
                    <span style={{ width: `${item.total ? (item.learned / item.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className={`challenge-panel ${feedback}`} aria-live="polite">
          {currentWord ? (
            <>
              <div className="round-meta">
                <div>
                  <span className="pill">{currentWord.level}</span>
                  <span className="pill soft">{currentWord.part_of_speech}</span>
                </div>
                <div className="timer-block">
                  <strong>{timeLeft}s</strong>
                  <div className="timer-track">
                    <span style={{ width: `${timerRatio}%` }} />
                  </div>
                </div>
              </div>

              <div className="sentence-block">
                <span>Frase</span>
                <p>{currentWord.example_with_blank}</p>
              </div>

              <div className="definition-block">
                <span>Definicao</span>
                <p>{currentWord.definition}</p>
              </div>

              <form className="answer-form" onSubmit={onSubmit}>
                <input
                  autoComplete="off"
                  autoFocus
                  disabled={feedback !== "idle"}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Digite a palavra em ingles"
                  ref={inputRef}
                  spellCheck={false}
                  value={answer}
                />
                <button type="submit">{feedback === "idle" ? "Responder" : "Enter"}</button>
              </form>

              <div className="action-row">
                <button
                  className="ghost-button"
                  disabled={feedback !== "idle" || hintVisible}
                  onClick={() => setHintVisible(true)}
                  type="button"
                >
                  Letras
                </button>
                <button className="ghost-button" disabled={feedback === "idle"} onClick={speakWord} type="button">
                  Ouvir
                </button>
                <button className="ghost-button primary" disabled={feedback === "idle"} onClick={beginRound} type="button">
                  Proxima
                </button>
              </div>

              {hintVisible ? (
                <div className="letter-hint" aria-label="Letras embaralhadas">
                  {hintLetters.map((letter, index) => (
                    <span key={`${letter}-${index}`}>{letter}</span>
                  ))}
                </div>
              ) : null}

              {feedback !== "idle" ? (
                <div className="feedback-box">
                  <div>
                    <strong>{feedbackTitle}</strong>
                    <span>
                      Resposta: <b>{currentWord.word}</b>
                    </span>
                  </div>
                  <p>{currentWord.example}</p>
                </div>
              ) : null}

              <div className="word-memory">
                <div>
                  <span>Tentativas</span>
                  <strong>{currentProgress?.attempts ?? 0}</strong>
                </div>
                <div>
                  <span>Erros</span>
                  <strong>{currentProgress?.incorrectAttempts ?? 0}</strong>
                </div>
                <div>
                  <span>Intervalo</span>
                  <strong>{currentProgress?.intervalDays ?? 0}d</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>Nenhuma palavra encontrada</strong>
              <span>Confira o seed do backend ou os dados locais.</span>
            </div>
          )}
        </section>

        <aside className="history-panel" aria-label="Historico e leaderboard">
          <section>
            <div className="section-title">
              <span>Leaderboard</span>
              <strong>global</strong>
            </div>
            <div className="leaderboard">
              <div className="leader-row self">
                <span>Voce</span>
                <strong>{studyState.xp} XP</strong>
              </div>
              {leaderboard.slice(0, 6).map((leader) => (
                <div className="leader-row" key={`${leader.rank}-${leader.client_id}`}>
                  <span>
                    #{leader.rank} {leader.display_name}
                  </span>
                  <strong>{leader.xp} XP</strong>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>Sala</span>
              <strong>{multiplayerRoom ? multiplayerRoom.players.length : 0} players</strong>
            </div>
            <div className="leaderboard">
              {multiplayerRoom ? (
                multiplayerRoom.players.map((player) => (
                  <div className="leader-row" key={player.client_id}>
                    <span>
                      #{player.rank} {player.display_name}
                    </span>
                    <strong>{player.score}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-list">Sem sala ativa.</div>
              )}
            </div>
          </section>

          <section>
            <div className="section-title">
              <span>Historico</span>
              <strong>{studyState.totalAttempts} rodadas</strong>
            </div>
            <div className="history-list">
              {studyState.history.length === 0 ? (
                <div className="empty-list">Sem respostas ainda.</div>
              ) : (
                studyState.history.slice(0, 8).map((item) => (
                  <div className={`history-item ${item.correct ? "ok" : "miss"}`} key={item.id}>
                    <div>
                      <strong>{item.word}</strong>
                      <span>{formatDateTime(item.studiedAt)}</span>
                    </div>
                    <b>{item.correct ? `+${item.score}` : "erro"}</b>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
