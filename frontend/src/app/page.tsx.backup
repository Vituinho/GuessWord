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
  getPortugueseDefinition,
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
type Language = "pt" | "en";

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
  round_seconds?: number;
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

const uiCopy = {
  pt: {
    appTitle: "Arena de revisão",
    authLabel: "Autenticação",
    backspace: "Apagar",
    chooseMode: "Escolha o modo",
    clear: "Limpar",
    clueMode: "Tipo de dica",
    code: "Código",
    combo: "Combo",
    connecting: "Conectando",
    correct: "Correto",
    correctAnswer: "Resposta",
    createAccount: "Criar conta",
    createRoom: "Criar sala",
    definition: "Definição",
    definitionUnavailable: "Tradução indisponível para esta palavra.",
    email: "Email",
    emptyHistory: "Sem respostas ainda.",
    emptyRoom: "Sem sala ativa.",
    enter: "Entrar",
    errors: "Erros",
    feedbackNext: "Próxima",
    gmailConnected: "Gmail conectado",
    googleLogin: "Continuar com Google",
    guessed: "Acertos",
    hintMode: "Modo com dica",
    hintModeDescription:
      "A primeira letra é revelada e travada. As peças abaixo contêm as letras certas e algumas falsas embaralhadas.",
    history: "Histórico",
    incorrect: "Incorreto",
    join: "Entrar",
    learned: "Aprendidas",
    leaderboard: "Leaderboard",
    leaveRoom: "Sair da sala",
    level: "Nível",
    levels: "Níveis",
    lobbyEyebrow: "GuessWord Lobby",
    login: "Entrar",
    logout: "Sair",
    mode: "Modo",
    modeLabels: {
      auto: "Progressão",
      level: "Nível",
      review: "Revisão",
      seen: "Já vistas",
    },
    name: "Nome",
    nationality: "Nacionalidade",
    noHintMode: "Modo sem dica",
    noHintModeDescription:
      "Clássico. Nenhuma letra é revelada. As peças abaixo são aleatórias e não contêm dicas.",
    noWords: "Nenhuma palavra encontrada",
    noWordsHint: "Confira o seed do backend ou os dados locais.",
    offline: "offline",
    password: "Senha",
    passwordConfirm: "Confirmar senha",
    passwordLength: "8+ caracteres",
    passwordMatch: "Confirmação igual",
    passwordMixed: "Maiúscula e minúscula",
    passwordNumber: "Número",
    play: "Jogar GuessWord",
    players: "jogadores",
    progressByLevel: "Progresso por nível",
    reshuffle: "Novas letras",
    reviews: "revisões",
    room: "Sala",
    roomCode: "Código da sala",
    roomPlaceholder: "Código",
    rounds: "rodadas",
    seen: "vistas",
    sentence: "Frase",
    signInRequired: "Preencha email e senha.",
    signInServerError: "Não foi possível conectar ao servidor de autenticação.",
    signInUnavailable: "Não foi possível autenticar.",
    startGoogleError: "Não foi possível iniciar o login com Google.",
    streak: "Sequência",
    submit: "Responder",
    timeLeftSuffix: "s",
    timeout: "Tempo esgotado",
    tryAgain: "Tentar de novo",
    waitingDesc: "Compartilhe o código acima. O jogo começará automaticamente quando outro jogador entrar na sala.",
    waitingOpponent: "Aguardando oponente...",
    weakProfile: "Preencha nome e nacionalidade.",
    weakPassword: "A senha precisa cumprir todos os requisitos.",
    wordMemoryAttempts: "Tentativas",
    wordMemoryInterval: "Intervalo",
    you: "Você",
  },
  en: {
    appTitle: "Recall arena",
    authLabel: "Authentication",
    backspace: "Backspace",
    chooseMode: "Choose mode",
    clear: "Clear",
    clueMode: "Hint type",
    code: "Code",
    combo: "Combo",
    connecting: "Connecting",
    correct: "Correct",
    correctAnswer: "Answer",
    createAccount: "Create account",
    createRoom: "Create room",
    definition: "Definition",
    definitionUnavailable: "Translation unavailable for this word.",
    email: "Email",
    emptyHistory: "No answers yet.",
    emptyRoom: "No active room.",
    enter: "Join",
    errors: "Errors",
    feedbackNext: "Next",
    gmailConnected: "Gmail connected",
    googleLogin: "Continue with Google",
    guessed: "Correct",
    hintMode: "Hint mode",
    hintModeDescription:
      "The first letter is revealed and locked. The tiles below contain the right letters plus shuffled decoys.",
    history: "History",
    incorrect: "Incorrect",
    join: "Join",
    learned: "Learned",
    leaderboard: "Leaderboard",
    leaveRoom: "Leave room",
    level: "Level",
    levels: "Levels",
    lobbyEyebrow: "GuessWord Lobby",
    login: "Sign in",
    logout: "Log out",
    mode: "Mode",
    modeLabels: {
      auto: "Progression",
      level: "Level",
      review: "Review",
      seen: "Seen",
    },
    name: "Name",
    nationality: "Nationality",
    noHintMode: "No-hint mode",
    noHintModeDescription:
      "Classic mode. No letters are revealed. The tiles below are random and do not contain hints.",
    noWords: "No words found",
    noWordsHint: "Check the backend seed or local data.",
    offline: "offline",
    password: "Password",
    passwordConfirm: "Confirm password",
    passwordLength: "8+ characters",
    passwordMatch: "Confirmation matches",
    passwordMixed: "Uppercase and lowercase",
    passwordNumber: "Number",
    play: "Play GuessWord",
    players: "players",
    progressByLevel: "Progress by level",
    reshuffle: "New letters",
    reviews: "reviews",
    room: "Room",
    roomCode: "Room code",
    roomPlaceholder: "Code",
    rounds: "rounds",
    seen: "seen",
    sentence: "Sentence",
    signInRequired: "Fill in email and password.",
    signInServerError: "Could not connect to the authentication server.",
    signInUnavailable: "Could not authenticate.",
    startGoogleError: "Could not start Google login.",
    streak: "Streak",
    submit: "Submit",
    timeLeftSuffix: "s",
    timeout: "Time is up",
    tryAgain: "Try again",
    waitingDesc: "Share the code above. The game will start automatically when another player joins the room.",
    waitingOpponent: "Waiting for opponent...",
    weakProfile: "Fill in name and nationality.",
    weakPassword: "The password must meet all requirements.",
    wordMemoryAttempts: "Attempts",
    wordMemoryInterval: "Interval",
    you: "You",
  },
} as const;

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
    definition_pt: (word as any).definition_pt,
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
  if (typeof window === "undefined" || !window.location.hash) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const sessionValue = params.get("session");
  const errorValue = params.get("auth_error");

  if (!sessionValue && !errorValue) {
    return null;
  }

  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);

  if (sessionValue) {
    try {
      return {
        session: authPayloadToSession(JSON.parse(decodeBase64Url(sessionValue)) as AuthResponse["data"]),
      };
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
  const [gameStarted, setGameStarted] = useState(false);
  const [clueMode, setClueMode] = useState<"hint" | "no-hint">("hint");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [tiles, setTiles] = useState<Array<{ id: number; letter: string; used: boolean }>>([]);
  const [submitAnimation, setSubmitAnimation] = useState<"correct" | "incorrect" | null>(null);
  const [guessedLettersTileMap, setGuessedLettersTileMap] = useState<Record<number, number>>({});
  const [lang, setLang] = useState<"pt" | "en">(() => {
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
    if (typeof window === "undefined") {
      return createEmptyStudyState();
    }
    const savedClientId = window.localStorage.getItem(CLIENT_ID_KEY);
    if (savedClientId) {
      return safeStudyState(savedClientId);
    }
    return createEmptyStudyState();
  });
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
      
      setTiles(combined.map((letter, index) => ({
        id: index,
        letter,
        used: false
      })));
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
      
      setTiles(randomLetters.map((letter, index) => ({
        id: index,
        letter,
        used: false
      })));
    }
  }, [setAnswer]);

  const handleTileClick = useCallback((tileIdx: number) => {
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
      
      setGuessedLettersTileMap((prev) => ({
        ...prev,
        [firstEmpty]: tileIdx
      }));
    }
  }, [guessedLetters, tiles, clueMode, feedback, currentWord, setAnswer, submitAnimation]);

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
  }, [guessedLetters, guessedLettersTileMap, tiles, clueMode, feedback, currentWord, setAnswer, submitAnimation]);

  const removeLetterAtIndex = useCallback((boxIdx: number) => {
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
  }, [guessedLetters, guessedLettersTileMap, tiles, clueMode, feedback, currentWord, setAnswer, submitAnimation]);

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
  }, [currentWord, clueMode, tiles, feedback, setAnswer, submitAnimation]);

  const handleReshuffle = useCallback(() => {
    if (feedback !== "idle" || !currentWord || clueMode !== "no-hint") return;
    
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const randomLetters: string[] = [];
    const tileCount = Math.max(8, Math.min(14, currentWord.word.length + 4));
    for (let i = 0; i < tileCount; i++) {
      const randChar = alphabet[Math.floor(Math.random() * 26)];
      randomLetters.push(randChar);
    }
    
    setTiles(randomLetters.map((letter, index) => ({
      id: index,
      letter,
      used: false
    })));
    
    const len = currentWord.word.length;
    setGuessedLetters(Array(len).fill(""));
    setAnswer("");
    setGuessedLettersTileMap({});
  }, [currentWord, clueMode, feedback, setAnswer]);

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

  const syncProgress = useCallback(async (session?: UserSession | null) => {
    const user = session ?? userRef.current;
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/progress?client_id=${encodeURIComponent(user.clientId)}`, {
        method: "GET",
        headers: jsonHeaders(user),
      });

      if (response.ok) {
        const payload = await response.json() as {
          data: {
            xp: number;
            level: number;
            current_streak: number;
            best_streak: number;
            attempts: number;
            correct_attempts: number;
            word_progress: Record<string, any>;
            history: any[];
          };
        };

        const progressData = payload.data;
        const mappedWordProgress: Record<string, WordProgress> = {};

        if (progressData.word_progress) {
          Object.entries(progressData.word_progress).forEach(([wordId, p]: [string, any]) => {
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

        const mappedHistory = (progressData.history ?? []).map((h: any) => ({
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
            wordProgress: {
              ...prev.wordProgress,
              ...mappedWordProgress,
            },
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
      }
    } catch (err) {
      console.error("Failed to sync progress:", err);
    }
  }, []);

  const finishLogin = useCallback((session: UserSession) => {
    window.localStorage.setItem(CLIENT_ID_KEY, session.clientId);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setCurrentUser(session);
    const restored = safeStudyState(session.clientId);
    studyStateRef.current = restored;
    setStudyState(restored);
    setLoginError("");
    void loadLeaderboard();
    void syncProgress(session);
  }, [loadLeaderboard, syncProgress]);

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
  }, [finishLogin, loadLeaderboard]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    window.localStorage.setItem(`${STORAGE_KEY}-${studyState.clientId}`, JSON.stringify(studyState));
  }, [initialized, studyState]);

  useEffect(() => {
    if (!currentUser || leaderboard.length === 0) {
      return;
    }

    const userInLeaderboard = leaderboard.find(
      (leader) => leader.client_id === currentUser.clientId || leader.display_name === currentUser.name
    );

    if (userInLeaderboard && userInLeaderboard.xp !== studyState.xp) {
      setStudyState((prev) => ({
        ...prev,
        xp: userInLeaderboard.xp,
        level: userInLeaderboard.level,
        streak: userInLeaderboard.streak,
      }));
    }
  }, [leaderboard, currentUser]);

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
        ? `${API_BASE}/multiplayer/rooms/${code}?client_id=${encodeURIComponent(user.clientId)}`
        : `${API_BASE}/multiplayer/rooms/${code}`;
      const response = await fetch(url);

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

  useEffect(() => {
    if (!multiplayerRoom || !multiplayerRoom.current_word_id) {
      return;
    }

    if (multiplayerRoom.players.length >= 2 && !gameStarted) {
      setGameStarted(true);
    }

    const matchedWord = words.find((w) => w.id === multiplayerRoom.current_word_id);
    if (!matchedWord) {
      return;
    }

    if (currentWord?.id !== matchedWord.id) {
      setCurrentWord(matchedWord);
      setAnswer("");
      setFeedback("idle");
      setTimeLeft(multiplayerRoom.round_seconds ?? ROUND_SECONDS);
      setHintVisible(false);
      setHintLetters(scrambleWord(matchedWord.word));
      initializeTilesAndBoxes(matchedWord.word, clueMode);
    }
  }, [multiplayerRoom?.current_word_id, multiplayerRoom?.players.length, words, currentWord?.id, clueMode, initializeTilesAndBoxes, gameStarted]);

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

          try {
            const payload = (await response.json()) as {
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
                  word_progress: Record<string, any>;
                  history: any[];
                };
              };
            };

            const progressData = payload.data.user_progress;
            if (progressData) {
              const mappedWordProgress: Record<string, WordProgress> = {};
              if (progressData.word_progress) {
                Object.entries(progressData.word_progress).forEach(([wordId, p]: [string, any]) => {
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

              const mappedHistory = (progressData.history ?? []).map((h: any) => ({
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
                  wordProgress: {
                    ...prev.wordProgress,
                    ...mappedWordProgress,
                  },
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
          } catch (e) {
            console.error("Error parsing syncAttempt response:", e);
          }
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
    [answer, combo, currentUser, currentWord, feedback, hintVisible, mode, syncAttempt, timeLeft, submitAnimation, beginRound],
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
            setGuessedLettersTileMap((prev) => ({
              ...prev,
              [firstEmpty]: tileIdx
            }));
          } else {
            setGuessedLettersTileMap((prev) => ({
              ...prev,
              [firstEmpty]: -1
            }));
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
        setLoginError(await readApiMessage(response, "Não foi possivel autenticar."));
        return;
      }

      const payload = (await response.json()) as AuthResponse;

      finishLogin(authPayloadToSession(payload.data));
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setLoginError("Não foi possível conectar ao servidor de autenticação.");
    } finally {
      setAuthLoading(false);
    }
  };

  const startGoogleLogin = () => {
    setAuthLoading(true);
    setLoginError("");

    try {
      const base = API_BASE.replace(/\/$/, "");
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
              <h1>Vocabulary</h1>
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
                    <span className={passwordChecks.number ? "ok" : ""}>Número</span>
                    <span className={passwordChecks.match ? "ok" : ""}>Confirmação igual</span>
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
              <button className="gmail-button" disabled={authLoading} onClick={startGoogleLogin} type="button">
                Continuar com Google
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (!gameStarted) {
    return (
      <main className="login-shell">
        <section className="login-panel" style={{ width: "min(640px, 100%)" }}>
          <div className="brand-lockup" style={{ marginBottom: "24px" }}>
            <div className="brand-mark">GW</div>
            <div>
              <p className="eyebrow">GuessWord Lobby</p>
              <h1>Escolha o Modo</h1>
            </div>
          </div>
          
          <div className="lobby-modes-grid">
            <button
              type="button"
              className={`lobby-mode-card ${clueMode === "hint" ? "active" : ""}`}
              onClick={() => setClueMode("hint")}
            >
              <div className="lobby-mode-header">
                <span className="lobby-mode-icon">💡</span>
                <h3>Modo com Dica</h3>
              </div>
              <p>A primeira letra é revelada e travada. As peças abaixo contêm as letras certas e algumas falsas embaralhadas.</p>
            </button>
            
            <button
              type="button"
              className={`lobby-mode-card ${clueMode === "no-hint" ? "active" : ""}`}
              onClick={() => setClueMode("no-hint")}
            >
              <div className="lobby-mode-header">
                <span className="lobby-mode-icon">🎯</span>
                <h3>Modo sem Dica</h3>
              </div>
              <p>Clássico! Nenhuma letra é revelada. As peças abaixo são puramente aleatórias e não contêm dicas.</p>
            </button>
          </div>

          <div className="login-actions" style={{ marginTop: "32px", gridTemplateColumns: "1fr" }}>
            <button
              type="button"
              className="lobby-play-button"
              onClick={() => startGame(clueMode)}
              style={{ width: "100%" }}
            >
              Jogar GuessWord
            </button>
          </div>
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
          {apiOnline !== false ? (
            <div className={`api-status ${apiOnline ? "online" : ""}`}>
              <span />
              {apiOnline ? "API online" : "Conectando"}
            </div>
          ) : null}
          <button 
            className="ghost-button compact language-toggle-btn" 
            onClick={toggleLanguage} 
            type="button"
            title="Mudar idioma / Switch language"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
          </button>
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
              <strong>{stats.dueReviews} revisões</strong>
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
              <span>Tipo de Dica</span>
            </div>
            <div className="segmented-control">
              <button
                className={clueMode === "hint" ? "active" : ""}
                onClick={() => {
                  setClueMode("hint");
                  if (currentWord) initializeTilesAndBoxes(currentWord.word, "hint");
                }}
                type="button"
              >
                Com Dica
              </button>
              <button
                className={clueMode === "no-hint" ? "active" : ""}
                onClick={() => {
                  setClueMode("no-hint");
                  if (currentWord) initializeTilesAndBoxes(currentWord.word, "no-hint");
                }}
                type="button"
              >
                Sem Dica
              </button>
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
          {multiplayerRoom && multiplayerRoom.players.length < 2 ? (
            <div className="waiting-lobby">
              <div className="waiting-lobby-content">
                <div className="pulse-loader">
                  <span />
                  <span />
                  <span />
                </div>
                <h2>Aguardando oponente...</h2>
                <div className="room-code-badge">
                  Código da sala: <span>{multiplayerRoom.code}</span>
                </div>
                <p className="waiting-desc">
                  Compartilhe o código acima. O jogo começará automaticamente quando outro jogador entrar na sala!
                </p>
              </div>
            </div>
          ) : currentWord ? (
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
                <span>{lang === "pt" ? "Definição" : "Definition"}</span>
                <p>{lang === "pt" ? (currentWord.definition_pt ?? currentWord.definition) : currentWord.definition}</p>
              </div>

              <div className="letter-boxes-row">
                {currentWord.word.split("").map((char, index) => {
                  const isLocked = clueMode === "hint" && index === 0;
                  const val = guessedLetters[index] ?? "";
                  const isActive = feedback === "idle" && (
                    clueMode === "hint"
                      ? (index > 0 && guessedLetters.slice(1, index).every((l) => l !== "") && val === "")
                      : (guessedLetters.slice(0, index).every((l) => l !== "") && val === "")
                  );

                  const animClass = submitAnimation === "correct"
                    ? "submit-correct"
                    : submitAnimation === "incorrect"
                    ? "submit-incorrect"
                    : "";

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={feedback !== "idle" || isLocked || submitAnimation !== null}
                      className={`letter-box ${isLocked ? "locked" : ""} ${isActive ? "active" : ""} ${val !== "" ? "filled" : ""} ${animClass}`}
                      onClick={() => removeLetterAtIndex(index)}
                    >
                      {val.toUpperCase()}
                      {isLocked && <span className="lock-icon">🔒</span>}
                    </button>
                  );
                })}
              </div>

              <div className="letter-tiles-pool">
                <div className="letter-tiles-grid">
                  {tiles.map((tile, idx) => (
                    <button
                      key={tile.id}
                      type="button"
                      disabled={feedback !== "idle" || tile.used || submitAnimation !== null}
                      className={`letter-tile ${tile.used ? "used" : ""}`}
                      onClick={() => handleTileClick(idx)}
                    >
                      {tile.letter.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="letter-tiles-actions">
                  <button
                    type="button"
                    className="ghost-button action-btn backspace-btn"
                    disabled={feedback !== "idle" || submitAnimation !== null}
                    onClick={handleBackspace}
                    title="Apagar última letra"
                  >
                    ⬅️ Apagar
                  </button>
                  <button
                    type="button"
                    className="ghost-button action-btn clear-btn"
                    disabled={feedback !== "idle" || submitAnimation !== null}
                    onClick={handleClear}
                    title="Limpar tudo"
                  >
                    ❌ Limpar
                  </button>
                  {clueMode === "no-hint" && (
                    <button
                      type="button"
                      className="ghost-button action-btn reshuffle-btn"
                      disabled={feedback !== "idle" || submitAnimation !== null}
                      onClick={handleReshuffle}
                      title="Sortear novas letras"
                    >
                      🔄 Novas Letras
                    </button>
                  )}
                  <button
                    type="button"
                    className="ghost-button primary action-btn submit-btn"
                    disabled={feedback !== "idle" || guessedLetters.some((l) => l === "") || submitAnimation !== null}
                    onClick={() => submitAnswer(false)}
                  >
                    Responder
                  </button>
                </div>
              </div>

              <div className="action-row" style={{ marginTop: "24px" }}>
                <button className="ghost-button" disabled={feedback === "idle"} onClick={speakWord} type="button">
                  Ouvir
                </button>
                <button className="ghost-button primary" disabled={feedback === "idle"} onClick={beginRound} type="button">
                  Próxima
                </button>
              </div>

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
                <span>Você</span>
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
              <span>Histórico</span>
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
