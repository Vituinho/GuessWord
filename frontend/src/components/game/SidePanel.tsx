import { Level, PracticeMode, VocabWord } from "@/lib/vocabulary";
import { UserSession, MultiplayerRoom } from "@/lib/types";

type SidePanelProps = {
  currentUser: UserSession;
  stats: {
    dueReviews: number;
    seen: number;
    levelStats: Array<{ level: Level; total: number; seen: number; learned: number }>;
  };
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;
  modeLabels: Record<PracticeMode, string>;
  clueMode: "hint" | "no-hint";
  setClueMode: (mode: "hint" | "no-hint") => void;
  currentWord: VocabWord | null;
  initializeTilesAndBoxes: (word: string, mode: "hint" | "no-hint") => void;
  levels: Level[];
  selectedLevel: Level;
  setSelectedLevel: (level: Level) => void;
  multiplayerRoom: MultiplayerRoom | null;
  createRoom: () => void;
  joinCode: string;
  setJoinCode: (val: string) => void;
  joinRoom: () => void;
  leaveRoom: () => void;
};

export function SidePanel({
  currentUser,
  stats,
  mode,
  setMode,
  modeLabels,
  clueMode,
  setClueMode,
  currentWord,
  initializeTilesAndBoxes,
  levels,
  selectedLevel,
  setSelectedLevel,
  multiplayerRoom,
  createRoom,
  joinCode,
  setJoinCode,
  joinRoom,
  leaveRoom,
}: SidePanelProps) {
  return (
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
          <button className="ghost-button primary" onClick={createRoom} type="button">
            Criar sala
          </button>
          <div className="join-row">
            <input
              maxLength={8}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Codigo"
              value={joinCode}
            />
            <button className="ghost-button" onClick={joinRoom} type="button">
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
  );
}
