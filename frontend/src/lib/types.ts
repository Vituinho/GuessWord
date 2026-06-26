import { Level, VocabWord } from "./vocabulary";

export type Feedback = "idle" | "correct" | "incorrect" | "timeout";
export type AuthMode = "login" | "register";
export type LoginProvider = "email" | "gmail";
export type Language = "pt" | "en";

export type UserSession = {
  clientId: string;
  name: string;
  email: string;
  nationality: string;
  provider: LoginProvider;
  gmailConnected: boolean;
  sessionToken?: string | null;
  avatarUrl?: string | null;
};

export type Leader = {
  rank: number;
  client_id: string;
  display_name: string;
  nationality?: string | null;
  xp: number;
  level: number;
  streak: number;
  best_streak?: number;
};

export type MultiplayerPlayer = {
  rank: number;
  client_id: string;
  display_name: string;
  nationality?: string | null;
  score: number;
  combo: number;
  attempts: number;
  correct_attempts: number;
};

export type MultiplayerRoom = {
  code: string;
  level: Level;
  status: string;
  round_seconds?: number;
  current_word_id?: number | null;
  players: MultiplayerPlayer[];
};

export type ApiWordsResponse = {
  data: Array<Partial<VocabWord> & Pick<VocabWord, "id" | "word" | "definition" | "example" | "level">>;
};

export type AuthResponse = {
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

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};
