import { Feedback, MultiplayerRoom, Language } from "@/lib/types";
import { VocabWord, WordProgress } from "@/lib/vocabulary";

type ChallengePanelProps = {
  multiplayerRoom: MultiplayerRoom | null;
  currentWord: VocabWord | null;
  timeLeft: number;
  timerRatio: number;
  lang: Language;
  clueMode: "hint" | "no-hint";
  guessedLetters: string[];
  feedback: Feedback;
  submitAnimation: "correct" | "incorrect" | null;
  removeLetterAtIndex: (index: number) => void;
  tiles: Array<{ id: number; letter: string; used: boolean }>;
  handleTileClick: (idx: number) => void;
  handleBackspace: () => void;
  handleClear: () => void;
  handleReshuffle: () => void;
  submitAnswer: (timeout?: boolean) => void;
  speakWord: () => void;
  beginRound: () => void;
  feedbackTitle: string;
  currentProgress?: WordProgress;
};

export function ChallengePanel({
  multiplayerRoom,
  currentWord,
  timeLeft,
  timerRatio,
  lang,
  clueMode,
  guessedLetters,
  feedback,
  submitAnimation,
  removeLetterAtIndex,
  tiles,
  handleTileClick,
  handleBackspace,
  handleClear,
  handleReshuffle,
  submitAnswer,
  speakWord,
  beginRound,
  feedbackTitle,
  currentProgress,
}: ChallengePanelProps) {
  return (
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
              const isActive =
                feedback === "idle" &&
                (clueMode === "hint"
                  ? index > 0 && guessedLetters.slice(1, index).every((l) => l !== "") && val === ""
                  : guessedLetters.slice(0, index).every((l) => l !== "") && val === "");

              const animClass =
                submitAnimation === "correct"
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
  );
}
