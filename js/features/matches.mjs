import { state } from '../core/state.mjs';
import { formatDate, formatTime } from '../core/format.mjs';

export function renderMatches() {
  const el = document.getElementById('matchesGrid');
  let matches = state.data.matches;

  if (state.matchFilter === 'completed') matches = matches.filter(m => m.status.completed);
  else if (state.matchFilter === 'live') matches = matches.filter(m => m.status.state === 'in');
  else if (state.matchFilter === 'upcoming') matches = matches.filter(m => m.status.state === 'pre');

  // Sort: live first, then by date desc for completed, asc for upcoming
  matches = [...matches].sort((a, b) => {
    const aLive = a.status.state === 'in' ? 0 : 1;
    const bLive = b.status.state === 'in' ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    if (a.status.completed && b.status.completed) return new Date(b.date) - new Date(a.date);
    return new Date(a.date) - new Date(b.date);
  });

  if (matches.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><div class="empty-state__text">Brak meczów w tej kategorii</div></div>`;
    return;
  }

  el.innerHTML = matches.map(m => renderMatchCard(m)).join('');
}

export function getDisplayClock(match) {
  if (match.status.completed) return 'FT';
  if (match.status.state !== 'in') return formatTime(match.date);

  const detail = (match.status.shortDetail || match.status.detail || '').toLowerCase();
  if (detail === 'ht' || detail.includes('halftime') || detail.includes('half time') || match.status.clock === 'HT') {
    return 'Przerwa';
  }

  const clockStr = match.status.clock || '';
  if (!clockStr) return 'LIVE';

  const drift = state.live.lastFetch ? Math.floor((Date.now() - state.live.lastFetch.getTime()) / 60000) : 0;

  const stopMatch = clockStr.match(/^(\d+)'\+(\d+)'?$/);
  if (stopMatch) {
    const base = parseInt(stopMatch[1], 10);
    const extra = Math.min(parseInt(stopMatch[2], 10) + drift, 15);
    return `${base}'+${extra}'`;
  }

  const regMatch = clockStr.match(/^(\d+)'?/);
  if (regMatch) {
    const period = match.status.period || 1;
    const cap = period <= 1 ? 45 : period === 2 ? 90 : 120;
    return `${Math.min(parseInt(regMatch[1], 10) + drift, cap)}'`;
  }

  return clockStr;
}

export function startLiveClockTicker() {
  setInterval(() => {
    if (!state.data?.matches) return;
    state.data.matches
      .filter(m => m.status.state === 'in')
      .forEach(m => {
        // Skip active modal match — state.live.badgeTicker handles it every 1s
        if (m.id === state.live.pollingId && state.live.lastFetch) return;
        const badge = document.querySelector(`[data-match-id="${m.id}"] .match-card__status`);
        if (badge) badge.textContent = getDisplayClock(m);
      });
  }, 60000);
}

export function renderMatchCard(m) {
  const date = formatDate(m.date);
  const clock = m.status.state === 'in' ? getDisplayClock(m) : null;
  const isHT = clock === 'Przerwa';
  const statusClass = m.status.completed ? 'ft' : (m.status.state === 'in' ? (isHT ? 'ht' : 'live') : 'upcoming');
  const statusText = m.status.completed ? 'FT' : (m.status.state === 'in' ? (isHT ? '☕ Przerwa' : clock) : formatTime(m.date));

  const homeWinner = m.home.winner ? 'winner' : '';
  const awayWinner = m.away.winner ? 'winner' : '';

  // Key events for completed matches — scorers split to each team's side
  let eventsHTML = '';
  if (m.details?.keyEvents?.length) {
    const goals = m.details.keyEvents.filter(e =>
      e.type === 'Goal' || (e.text && e.text.toLowerCase().includes('goal'))
    );

    if (goals.length > 0) {
      const renderGoal = e => {
        const scorer = e.athletes?.[0] ? (e.athletes[0].shortName || e.athletes[0].name) : '';
        const assister = e.athletes?.[1] && !e.ownGoal ? (e.athletes[1].shortName || e.athletes[1].name) : '';
        const playerText = assister ? `${scorer} (as. ${assister})` : scorer;

        return `
          <div class="match-event">
            <span class="match-event__time">${e.clock || ''}</span>
            <span class="match-event__icon">⚽</span>
            <span class="match-event__text">${playerText}${e.ownGoal ? ' (s.s.)' : ''}${e.penaltyKick ? ' (k.)' : ''}</span>
          </div>
        `;
      };

      const homeGoals = goals.filter(e => e.teamId === m.home.id).slice(0, 6);
      const awayGoals = goals.filter(e => e.teamId !== m.home.id).slice(0, 6);

      eventsHTML = `<div class="match-card__events match-card__events--split">
        <div class="match-card__events-col">${homeGoals.map(renderGoal).join('')}</div>
        <div class="match-card__events-col match-card__events-col--away">${awayGoals.map(renderGoal).join('')}</div>
      </div>`;
    }
  }

  // Quick stats badges
  let quickStats = '';
  if (m.details?.teamStats) {
    const home = m.details.teamStats.find(t => t.homeAway === 'home');
    const away = m.details.teamStats.find(t => t.homeAway === 'away');
    if (home && away) {
      const hPoss = home.stats.possessionPct?.value;
      const aPoss = away.stats.possessionPct?.value;
      if (hPoss && aPoss) {
        quickStats = `<span>📊 Posiadanie: ${hPoss}% - ${aPoss}%</span>`;
      }
    }
  }

  return `
    <div class="match-card animate-in" data-match-id="${m.id}" onclick="openMatchModal('${m.id}')">
      <div class="match-card__header">
        <span class="match-card__date">${date}${m.group ? ' · ' + m.group : ''}</span>
        <span class="match-card__status match-card__status--${statusClass}">${statusText}</span>
      </div>
      <div class="match-card__teams">
        <div class="match-card__team match-card__team--clickable" onclick="event.stopPropagation(); openTeamModal('${m.home.name}')">
          <img class="match-card__team-logo" src="${m.home.logo}" alt="${m.home.name}" loading="lazy" />
          <span class="match-card__team-name ${homeWinner}">${m.home.name}</span>
        </div>
        <div class="match-card__score">
          ${m.home.score !== null ? `
            <span class="match-card__score-num">${m.home.score}</span>
            <span class="match-card__score-sep">:</span>
            <span class="match-card__score-num">${m.away.score}</span>
          ` : `
            <span class="match-card__score-sep">vs</span>
          `}
        </div>
        <div class="match-card__team match-card__team--away match-card__team--clickable" onclick="event.stopPropagation(); openTeamModal('${m.away.name}')">
          <img class="match-card__team-logo" src="${m.away.logo}" alt="${m.away.name}" loading="lazy" />
          <span class="match-card__team-name ${awayWinner}">${m.away.name}</span>
        </div>
      </div>
      ${eventsHTML}
      <div class="match-card__footer">
        <span class="match-card__venue">📍 ${m.venue ? `${m.venue.name}, ${m.venue.city}` : '—'}</span>
        ${m.attendance ? `<span class="match-card__attendance">👥 ${m.attendance.toLocaleString('pl')}</span>` : ''}
        ${quickStats}
      </div>
    </div>
  `;
}
