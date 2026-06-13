import { state } from '../core/state.mjs';

// Recompute aggregate stats from the live match list (same method as the scraper) so the
// counters track refreshLiveScores/modal updates instead of waiting for the next scraper push.
export function recomputeStats() {
  if (!state.data?.matches) return;
  if (!state.data.stats) state.data.stats = {};
  const completed = state.data.matches.filter(m => m.status.completed);
  const totalGoals = completed.reduce((sum, m) =>
    sum + (parseInt(m.home.score) || 0) + (parseInt(m.away.score) || 0), 0);
  state.data.stats.matchesPlayed = completed.length;
  state.data.stats.totalGoals = totalGoals;
  state.data.stats.avgGoalsPerMatch = completed.length ? (totalGoals / completed.length).toFixed(2) : 0;
}


// ── Hero Stats ─────────────────────────────────────────────────────────────
export function renderHeroStats() {
  recomputeStats();
  const el = document.getElementById('heroStats');
  const completed = state.data.matches.filter(m => m.status.completed);
  const live = state.data.matches.filter(m => m.status.state === 'in');
  const upcoming = state.data.matches.filter(m => m.status.state === 'pre');

  // Count total cards
  let totalYellow = 0, totalRed = 0;
  completed.forEach(m => {
    if (m.details?.teamStats) {
      m.details.teamStats.forEach(t => {
        totalYellow += parseInt(t.stats.yellowCards?.value || 0);
        totalRed += parseInt(t.stats.redCards?.value || 0);
      });
    }
  });

  const cards = [
    { value: state.data.stats.matchesPlayed, label: 'Mecze rozegrane' },
    { value: state.data.stats.totalGoals, label: 'Gole strzelone' },
    { value: state.data.stats.avgGoalsPerMatch, label: 'Średnia goli / mecz' },
    { value: upcoming.length, label: 'Nadchodzące mecze' },
    { value: totalYellow, label: 'Żółte kartki' },
    { value: totalRed, label: 'Czerwone kartki' },
  ];

  el.innerHTML = cards.map(c => `
    <div class="stat-card animate-in">
      <div class="stat-card__value">${c.value}</div>
      <div class="stat-card__label">${c.label}</div>
    </div>
  `).join('');
}
