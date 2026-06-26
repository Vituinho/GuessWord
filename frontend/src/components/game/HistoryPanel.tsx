import { Leader, MultiplayerRoom } from "@/lib/types";
import { StudyState } from "@/lib/vocabulary";

type HistoryPanelProps = {
  studyState: StudyState;
  leaderboard: Leader[];
  multiplayerRoom: MultiplayerRoom | null;
  formatDateTime: (value: string) => string;
};

export function HistoryPanel({ studyState, leaderboard, multiplayerRoom, formatDateTime }: HistoryPanelProps) {
  return (
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
  );
}
