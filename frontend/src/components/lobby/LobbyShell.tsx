type LobbyShellProps = {
  clueMode: "hint" | "no-hint";
  setClueMode: (mode: "hint" | "no-hint") => void;
  startGame: (mode: "hint" | "no-hint") => void;
};

export function LobbyShell({ clueMode, setClueMode, startGame }: LobbyShellProps) {
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
            <p>
              A primeira letra é revelada e travada. As peças abaixo contêm as letras certas e algumas falsas embaralhadas.
            </p>
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
            <p>
              Clássico! Nenhuma letra é revelada. As peças abaixo são puramente aleatórias e não contêm dicas.
            </p>
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
