import { state } from '../core/state.mjs';
import { formatDate, shortenPosition } from '../core/format.mjs';
import { fetchAndUpdateLiveMatch, getLiveModalBadge, startLiveModalPolling, stopLiveModalPolling } from '../services/live-scores.mjs';

// ── Match Modal ────────────────────────────────────────────────────────────
export function openMatchModal(matchId) {
  const m = state.data.matches.find(match => match.id === matchId);
  if (!m) return;

  const overlay = document.getElementById('modalOverlay');
  overlay.dataset.activeMatchId = matchId;

  // Score section
  const scoreEl = document.getElementById('modalScore');
  scoreEl.innerHTML = `
    <div class="modal__teams-row">
      <div class="modal__team" onclick="openTeamModal('${m.home.name}')" style="cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
        <img class="modal__team-logo" src="${m.home.logo}" alt="${m.home.name}" />
        <span class="modal__team-name ${m.home.winner ? 'winner' : ''}">${m.home.name}</span>
      </div>
      <div class="modal__big-score">
        ${m.home.score !== null ? `
          <span class="modal__big-score-num">${m.home.score}</span>
          <span class="modal__big-score-sep">:</span>
          <span class="modal__big-score-num">${m.away.score}</span>
        ` : `
          <span class="modal__big-score-sep">vs</span>
        `}
      </div>
      <div class="modal__team" onclick="openTeamModal('${m.away.name}')" style="cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
        <img class="modal__team-logo" src="${m.away.logo}" alt="${m.away.name}" />
        <span class="modal__team-name ${m.away.winner ? 'winner' : ''}">${m.away.name}</span>
      </div>
    </div>
    <div class="modal__meta">
      <span>📅 ${formatDate(m.date)}</span>
      ${m.venue ? `<span>📍 ${m.venue.name}, ${m.venue.city}</span>` : ''}
      ${m.attendance ? `<span>👥 ${m.attendance.toLocaleString('pl')}</span>` : ''}
      ${m.details?.gameInfo?.officials?.[0] ? `<span>🟨 ${m.details.gameInfo.officials[0].name}</span>` : ''}
    </div>
  `;

  // Badge
  const badgeEl = document.getElementById('modalBadge');
  badgeEl.innerHTML = getLiveModalBadge(m);
  badgeEl.style.cssText = '';

  // Live match → poll repeatedly. Finished match whose details were never scraped → fetch
  // the full summary once, so its stats/scorers/lineups still show without the scraper.
  const matchStarted = new Date(m.date) <= new Date();
  const hasDetails = !!(m.details && (m.details.teamStats?.length || m.details.keyEvents?.length || m.details.lineups?.length));
  if (matchStarted && !m.status.completed) {
    startLiveModalPolling(matchId);
  } else if (matchStarted && !hasDetails && !state.live.detailsFetching.has(matchId)) {
    state.live.detailsFetching.add(matchId);
    fetchAndUpdateLiveMatch(matchId)
      .catch(e => console.warn('Modal details fetch failed:', e))
      .finally(() => {
        state.live.detailsFetching.delete(matchId);
        const overlay = document.getElementById('modalOverlay');
        if (overlay.dataset.activeMatchId === matchId) openMatchModal(matchId);
      });
  }

  // Stats
  const statsEl = document.getElementById('modalStats');
  if (m.details?.teamStats) {
    const home = m.details.teamStats.find(t => t.homeAway === 'home');
    const away = m.details.teamStats.find(t => t.homeAway === 'away');

    if (home && away) {
      const statKeys = [
        { key: 'possessionPct', label: 'Posiadanie', suffix: '%', max: 100 },
        { key: 'totalShots', label: 'Strzały', max: null },
        { key: 'shotsOnTarget', label: 'Strzały celne', max: null },
        { key: 'accuratePasses', label: 'Podania celne', max: null },
        { key: 'wonCorners', label: 'Kornery', max: null },
        { key: 'foulsCommitted', label: 'Faule', max: null },
        { key: 'yellowCards', label: 'Żółte kartki', max: null },
        { key: 'redCards', label: 'Czerwone kartki', max: null },
        { key: 'offsides', label: 'Spalone', max: null },
        { key: 'saves', label: 'Obrony', max: null },
        { key: 'totalTackles', label: 'Odbiory', max: null },
        { key: 'interceptions', label: 'Przechwycenia', max: null },
        { key: 'effectiveClearance', label: 'Wybicia', max: null },
      ];

      statsEl.innerHTML = `
        <div class="modal__stats-title">📊 Statystyki meczowe</div>
        ${statKeys.map(sk => {
          const hv = parseFloat(home.stats[sk.key]?.value || 0);
          const av = parseFloat(away.stats[sk.key]?.value || 0);
          const max = sk.max || Math.max(hv, av, 1);
          const hPct = (hv / max * 100).toFixed(1);
          const aPct = (av / max * 100).toFixed(1);
          const hHighlight = hv > av ? 'color: var(--yellow)' : '';
          const aHighlight = av > hv ? 'color: var(--yellow)' : '';

          return `
            <div class="stat-row">
              <span class="stat-row__value stat-row__value--home" style="${hHighlight}">${sk.suffix ? hv + sk.suffix : hv}</span>
              <div class="stat-bar stat-bar--home">
                <div class="stat-bar__fill ${hv >= av ? '' : 'stat-bar__fill--dim'}" style="width: ${hPct}%"></div>
              </div>
              <span class="stat-row__label">${sk.label}</span>
              <div class="stat-bar">
                <div class="stat-bar__fill ${av >= hv ? '' : 'stat-bar__fill--dim'}" style="width: ${aPct}%"></div>
              </div>
              <span class="stat-row__value stat-row__value--away" style="${aHighlight}">${sk.suffix ? av + sk.suffix : av}</span>
            </div>
          `;
        }).join('')}
      `;
    } else {
      statsEl.innerHTML = '';
    }
  } else {
    const matchStarted = new Date(m.date) <= new Date();
    const fetching = (!m.status.completed && matchStarted) || state.live.detailsFetching.has(matchId);
    statsEl.innerHTML = fetching
      ? `<div class="empty-state" style="padding:24px;"><div class="empty-state__icon" style="font-size:1.5rem;">📡</div><div class="empty-state__text" style="color:var(--muted);">Pobieranie statystyk…</div></div>`
      : `<div class="empty-state" style="padding: 24px;"><div class="empty-state__text" style="color: var(--muted);">Statystyki niedostępne dla tego meczu</div></div>`;
  }

  // Key Events
  const eventsEl = document.getElementById('modalEvents');
  if (m.details?.keyEvents?.length) {
    const events = m.details.keyEvents;
    eventsEl.innerHTML = `
      <div class="modal__stats-title">⚡ Kluczowe zdarzenia</div>
      <div class="event-timeline">
        ${events.map(e => {
          let typeClass = '';
          let icon = '•';
          const textLower = (e.text || e.type || '').toLowerCase();
          if (textLower.includes('goal') || e.type === 'Goal') { typeClass = 'goal'; icon = '⚽'; }
          else if (textLower.includes('yellow') || textLower.includes('żółt')) { typeClass = 'card-yellow'; icon = '🟨'; }
          else if (textLower.includes('red') || textLower.includes('czerw')) { typeClass = 'card-red'; icon = '🟥'; }
          else if (textLower.includes('sub') || textLower.includes('zmian')) { typeClass = 'sub'; icon = '🔄'; }

          let athletesText = (e.athletes || []).map(a => a.shortName || a.name).join(', ');
          if (typeClass === 'goal') {
            const scorer = e.athletes?.[0] ? (e.athletes[0].shortName || e.athletes[0].name) : '';
            const assister = e.athletes?.[1] && !e.ownGoal ? (e.athletes[1].shortName || e.athletes[1].name) : '';
            athletesText = assister ? `${scorer} (as. ${assister})` : scorer;
          }

          return `
            <div class="timeline-item timeline-item--${typeClass}">
              <span class="timeline-item__time">${e.clock || ''}</span>
              <span>${icon}</span>
              <span class="timeline-item__text">
                ${athletesText}
                ${e.teamName ? `<span style="color:var(--muted)"> (${e.teamName})</span>` : ''}
                ${e.ownGoal ? ' <span style="color:var(--red)">(samobój)</span>' : ''}
                ${e.penaltyKick ? ' <span style="color:var(--yellow)">(karny)</span>' : ''}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    eventsEl.innerHTML = '';
  }

  // Lineups
  const lineupsEl = document.getElementById('modalLineups');
  if (m.details?.lineups?.length) {
    lineupsEl.innerHTML = `
      <div class="modal__stats-title">👥 Składy</div>
      <div class="lineup-grid">
        ${m.details.lineups.map(lineup => {
          const starters = (lineup.players || []).filter(p => p.starter);
          const subs = (lineup.players || []).filter(p => !p.starter);

          return `
            <div class="lineup-col">
              <div class="lineup-col__header">
                ${lineup.teamName}
                ${lineup.formation ? `<span class="lineup-col__formation">${lineup.formation}</span>` : ''}
              </div>
              ${starters.map(p => `
                <div class="lineup-player lineup-player--starter">
                  <span class="lineup-player__jersey">${p.jersey || '—'}</span>
                  <span class="lineup-player__name">${p.shortName || p.name}${p.subbedOut ? ' 🔻' : ''}</span>
                  <span class="lineup-player__pos">${shortenPosition(p.position)}</span>
                </div>
              `).join('')}
              ${subs.length > 0 ? `
                <div class="lineup-divider">Rezerwowi</div>
                ${subs.map(p => `
                  <div class="lineup-player">
                    <span class="lineup-player__jersey">${p.jersey || '—'}</span>
                    <span class="lineup-player__name">${p.shortName || p.name}${p.subbedIn ? ' 🔺' : ''}</span>
                    <span class="lineup-player__pos">${shortenPosition(p.position)}</span>
                  </div>
                `).join('')}
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    lineupsEl.innerHTML = '';
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeMatchModal() {
  stopLiveModalPolling();
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  delete overlay.dataset.activeMatchId;
  document.body.style.overflow = '';
}

export function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeMatchModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeMatchModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMatchModal();
  });
}
