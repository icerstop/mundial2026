import { state } from '../core/state.mjs';

export function renderScorers() {
  const el = document.getElementById('scorersList');
  const countEl = document.getElementById('scorersCount');

  let list = [];
  let emptyText = 'Brak danych';
  let countLabel = '';
  let icon = '⚽';

  if (state.activeScorerTab === 'goals') {
    list = state.data.topScorers || [];
    emptyText = 'Brak goli jeszcze w turnieju';
    countLabel = `${list.length} strzelców`;
    icon = '⚽';
  } else if (state.activeScorerTab === 'assists') {
    list = state.data.topAssisters || [];
    emptyText = 'Brak asyst jeszcze w turnieju';
    countLabel = `${list.length} asystentów`;
    icon = '🅰️';
  } else if (state.activeScorerTab === 'canadian') {
    list = state.data.topCanadian || [];
    emptyText = 'Brak punktów jeszcze w turnieju';
    countLabel = `${list.length} zawodników`;
    icon = '🍁';
  }

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">${icon}</div><div class="empty-state__text">${emptyText}</div></div>`;
    countEl.textContent = countLabel;
    return;
  }

  countEl.textContent = countLabel;

  el.innerHTML = list.map((s, i) => {
    let detailsHTML = '';
    let scoreHTML = '';

    if (state.activeScorerTab === 'goals') {
      const clocks = (s.goalDetails || []).map(g => g.clock).join(', ');
      detailsHTML = `<span class="scorer-details" title="${clocks}">${clocks}</span>`;
      scoreHTML = `<span class="scorer-goals">${s.goals}</span>`;
    } else if (state.activeScorerTab === 'assists') {
      const clocks = (s.assistDetails || []).map(a => a.clock).join(', ');
      detailsHTML = `<span class="scorer-details" title="${clocks}">${clocks}</span>`;
      scoreHTML = `<span class="scorer-goals" style="color: var(--blue);">${s.assists}</span>`;
    } else if (state.activeScorerTab === 'canadian') {
      detailsHTML = `<span class="scorer-details">${s.goals} ⚽ / ${s.assists} 🅰️</span>`;
      scoreHTML = `<span class="scorer-goals">${s.total}</span>`;
    }

    return `
      <div class="scorer-row animate-in">
        <span class="scorer-rank">${i + 1}</span>
        <div class="scorer-info">
          <span class="scorer-name">${s.name}</span>
          <span class="scorer-team scorer-team--clickable" onclick="openTeamModal('${s.teamName}')">${s.teamName}</span>
        </div>
        ${detailsHTML}
        ${scoreHTML}
      </div>
    `;
  }).join('');
}
