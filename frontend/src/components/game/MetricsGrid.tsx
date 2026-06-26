import { StudyState } from "@/lib/vocabulary";

type MetricsGridProps = {
  stats: {
    accuracy: number;
    learned: number;
  };
  studyState: StudyState;
  combo: number;
};

export function MetricsGrid({ stats, studyState, combo }: MetricsGridProps) {
  return (
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
  );
}
