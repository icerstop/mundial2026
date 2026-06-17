import { actions, state } from '../core/state.mjs';
import { formatTime } from '../core/format.mjs';
import { getDisplayClock, renderMatchCard } from '../features/matches.mjs';

// ── Live Modal Polling ─────────────────────────────────────────────────────
// matchId -> latest authoritative ESPN state; re-applied after every Firebase push so a
// stale scraper snapshot can't clobber a live/finished match the frontend already corrected

export function cacheLive(match) {
  state.live.scoreCache.set(match.id, {
    home: { score: match.home.score, winner: match.home.winner },
    away: { score: match.away.score, winner: match.away.winner },
    status: { ...match.status },
    details: match.details ?? state.live.scoreCache.get(match.id)?.details,
  });
}

export function parseSummaryForModal(data) {
  const result = {};

  if (data.boxscore?.teams) {
    result.teamStats = data.boxscore.teams.map(t => ({
      id: t.team?.id,
      name: t.team?.displayName,
      homeAway: t.homeAway,
      stats: (t.statistics || []).reduce((acc, s) => {
        acc[s.name] = { value: s.displayValue, label: s.label };
        return acc;
      }, {}),
    }));
  }

  if (data.rosters) {
    result.lineups = data.rosters.map(roster => ({
      teamId: roster.team?.id,
      teamName: roster.team?.displayName,
      formation: roster.formation || null,
      players: (roster.roster || []).map(p => ({
        id: p.athlete?.id,
        name: p.athlete?.displayName,
        shortName: p.athlete?.shortName,
        jersey: p.athlete?.jersey,
        position: p.position?.displayName || p.athlete?.position?.displayName || null,
        starter: p.starter || false,
        subbedIn: p.subbedIn || false,
        subbedOut: p.subbedOut || false,
      })),
    }));
  }

  if (data.keyEvents) {
    result.keyEvents = data.keyEvents.map(e => ({
      id: e.id,
      type: e.type?.text || e.type?.id || null,
      clock: e.clock?.displayValue || null,
      period: e.period?.number || null,
      teamId: e.team?.id || null,
      teamName: e.team?.displayName || null,
      athletes: (e.participants || []).map(p => ({
        id: p.athlete?.id,
        name: p.athlete?.displayName,
        shortName: p.athlete?.shortName,
      })),
      text: e.text || null,
      penaltyKick: e.penaltyKick || false,
      ownGoal: e.ownGoal || false,
    }));
  }

  if (data.gameInfo) {
    result.gameInfo = {
      attendance: data.gameInfo.attendance || null,
      officials: (data.gameInfo.officials || []).map(o => ({
        name: o.displayName,
        position: o.position?.displayName || null,
      })),
    };
  }

  return result;
}

export async function fetchAndUpdateLiveMatch(matchId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${matchId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // Set before mutating match data — badge ticker uses this as drift reference
  state.live.lastFetch = new Date();

  const match = state.data.matches.find(m => m.id === matchId);
  if (!match) return;

  match.details = parseSummaryForModal(data);

  const comp = data.header?.competitions?.[0];
  if (comp) {
    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    if (home) { match.home.score = home.score; match.home.winner = home.winner || false; }
    if (away) { match.away.score = away.score; match.away.winner = away.winner || false; }
    match.status.clock = comp.status?.displayClock;
    match.status.period = comp.status?.period;
    match.status.state = comp.status?.type?.state || match.status.state;
    match.status.completed = comp.status?.type?.completed || false;
    match.status.shortDetail = comp.status?.type?.shortDetail || match.status.shortDetail;
  }

  // Cache fresh ESPN state so a stale Firebase push can't clobber it (see applyLiveOverride)
  cacheLive(match);

  // Re-render the card through the same path as the grid — card == modal, one source
  syncLiveCard(matchId);
}

// Rebuild one card in place from its state.data.matches object (identical to grid rendering)
export function syncLiveCard(matchId) {
  const cardEl = document.querySelector(`[data-match-id="${matchId}"]`);
  const match = state.data?.matches?.find(m => m.id === matchId);
  if (cardEl && match) cardEl.outerHTML = renderMatchCard(match);
}

// Re-apply the latest live ESPN data on top of state.data after a Firebase push replaces it wholesale
export function applyLiveOverride() {
  if (!state.data?.matches || state.live.scoreCache.size === 0) return;
  for (const m of state.data.matches) {
    const c = state.live.scoreCache.get(m.id);
    if (!c) continue;
    m.home.score = c.home.score; m.home.winner = c.home.winner;
    m.away.score = c.away.score; m.away.winner = c.away.winner;
    Object.assign(m.status, c.status);
    if (c.details) m.details = c.details;
  }
}

// ── Self-refresh live scores straight from ESPN (independent of the scraper) ──
// The scraper pushes to Firebase only every ~10 min and may lag or be down, so a
// finished match can stay frozen as "56' live" in the persisted snapshot. This pulls
// the authoritative scoreboard on load + every 30s so the main page is never stuck.
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

export function espnDateStr(d) {
  // ESPN buckets matches by US-Eastern date, NOT UTC — a 01:00 UTC match (e.g. PAR@USA)
  // belongs to the PREVIOUS ET day. Query by ET date so late-night matches aren't missed.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d).replace(/-/g, '');
}

export async function refreshLiveScores() {
  if (!state.data?.matches) return;
  const now = Date.now();

  // Which days have a match that's live, just finished, or about to start?
  const dates = new Set();
  for (const m of state.data.matches) {
    if (m.status.completed) continue;
    const hoursFromStart = (now - new Date(m.date).getTime()) / 3600e3;
    // Live, about to start (≤3h), or finished-but-not-yet-recorded (checked up to 24h later)
    if (m.status.state === 'in' || (hoursFromStart > -3 && hoursFromStart < 24)) {
      dates.add(espnDateStr(new Date(m.date)));
    }
  }
  if (dates.size === 0) return; // nothing live or near — no request, no churn

  let changed = false;
  for (const dt of dates) {
    let board;
    try {
      const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dt}`);
      if (!res.ok) continue;
      board = await res.json();
    } catch { continue; }

    for (const ev of (board.events || [])) {
      const match = state.data.matches.find(m => m.id === ev.id);
      if (!match) continue;
      if (match.id === state.live.pollingId) continue; // modal owns this one (fresher, per-second)
      const comp = ev.competitions?.[0];
      if (!comp) continue;

      const home = comp.competitors?.find(c => c.homeAway === 'home');
      const away = comp.competitors?.find(c => c.homeAway === 'away');

      // Only touch the DOM when something actually changed — otherwise re-rendering the
      // card every 30s re-triggers its fade-in animation (a visible flash on live cards)
      const before = `${match.home.score}|${match.away.score}|${match.status.clock}|${match.status.state}|${match.status.completed}`;

      if (home) { match.home.score = home.score ?? null; match.home.winner = home.winner || false; }
      if (away) { match.away.score = away.score ?? null; match.away.winner = away.winner || false; }
      match.status.state = comp.status?.type?.state ?? match.status.state;
      match.status.detail = comp.status?.type?.detail ?? match.status.detail;
      match.status.shortDetail = comp.status?.type?.shortDetail ?? match.status.shortDetail;
      match.status.clock = comp.status?.displayClock ?? match.status.clock;
      match.status.period = comp.status?.period ?? match.status.period;
      match.status.completed = comp.status?.type?.completed || false;

      const after = `${match.home.score}|${match.away.score}|${match.status.clock}|${match.status.state}|${match.status.completed}`;
      cacheLive(match); // always cache, so it survives the next Firebase push
      if (after !== before) {
        syncLiveCard(match.id);
        changed = true;
      }
    }
  }
  if (changed) {
    // Same full re-render as a Firebase push, so every score-derived view stays live:
    // hero counters, group tables (computed from completed matches), tournament stats, records
    actions.renderAll?.();
  }
}

// Pull full summaries (keyEvents/teamStats) for in-progress matches into global
// state, so analytics (goal timing/anatomy) and the grid cards reflect live goals
// without needing a modal open. Runs after refreshLiveScores so statuses are fresh.
export async function refreshLiveDetails() {
  if (!state.data?.matches) return;
  const live = state.data.matches.filter(m => m.status.state === 'in' && m.id !== state.live.pollingId);
  if (live.length === 0) return;

  let changed = false;
  for (const m of live) {
    try {
      const res = await fetch(`${ESPN_BASE}/summary?event=${m.id}`);
      if (!res.ok) continue;
      const data = await res.json();
      m.details = parseSummaryForModal(data);
      cacheLive(m); // survive the next Firebase push
      syncLiveCard(m.id); // surface live goals on the card
      changed = true;
    } catch { /* transient — try again next tick */ }
  }
  if (changed) actions.renderAll?.();
}

export function startLiveScoreRefresh() {
  const tick = () => refreshLiveScores().then(refreshLiveDetails);
  tick();                    // immediate on load — corrects frozen snapshots
  setInterval(tick, 30000);  // then every 30s
}


export function startLiveModalPolling(matchId) {
  if (state.live.pollingId === matchId && state.live.modalInterval) return;
  stopLiveModalPolling();
  state.live.pollingId = matchId;

  // Immediate fetch
  fetchAndUpdateLiveMatch(matchId)
    .then(() => {
      const overlay = document.getElementById('modalOverlay');
      if (overlay.dataset.activeMatchId === matchId) actions.openMatchModal?.(matchId);
    })
    .catch(e => {
      console.warn('Live fetch error:', e);
      const badgeEl = document.getElementById('modalBadge');
      if (badgeEl) badgeEl.innerHTML = getLiveModalBadge(state.data.matches.find(m => m.id === matchId));
    });

  // Re-fetch every 30s
  state.live.modalInterval = setInterval(async () => {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay.classList.contains('active') || overlay.dataset.activeMatchId !== matchId) {
      stopLiveModalPolling();
      return;
    }
    try {
      await fetchAndUpdateLiveMatch(matchId);
      actions.openMatchModal?.(matchId);
    } catch (e) {
      console.warn('Live stats refresh failed:', e);
    }
  }, 30000);

  // Tick every second — update BOTH modal badge AND card badge from the same getDisplayClock call
  state.live.badgeTicker = setInterval(() => {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay.classList.contains('active')) return;
    const m = state.data.matches.find(x => x.id === matchId);
    if (!m) return;

    const badgeEl = document.getElementById('modalBadge');
    if (badgeEl) badgeEl.innerHTML = getLiveModalBadge(m);

    const cardBadge = document.querySelector(`[data-match-id="${matchId}"] .match-card__status`);
    if (cardBadge) {
      const clock = getDisplayClock(m);
      const isHT = clock === 'Przerwa';
      cardBadge.className = `match-card__status match-card__status--${m.status.completed ? 'ft' : m.status.state === 'in' ? (isHT ? 'ht' : 'live') : 'upcoming'}`;
      cardBadge.textContent = m.status.completed ? 'FT' : (m.status.state === 'in' ? (isHT ? '☕ Przerwa' : clock) : formatTime(m.date));
    }
  }, 1000);
}

export function stopLiveModalPolling() {
  if (state.live.modalInterval) { clearInterval(state.live.modalInterval); state.live.modalInterval = null; }
  if (state.live.badgeTicker) { clearInterval(state.live.badgeTicker); state.live.badgeTicker = null; }
  state.live.pollingId = null;
  state.live.lastFetch = null;
  // state.live.scoreCache is intentionally NOT cleared — it keeps the main page correct across pushes
}

export function getLiveModalBadge(m) {
  if (m.status.completed) {
    return `<span style="color:var(--green);font-size:.75rem;font-weight:700;">FT — ${m.status.shortDetail || m.status.detail || ''}</span>`;
  }

  const matchStarted = new Date(m.date) <= new Date();
  if (!matchStarted) {
    return `<span style="color:var(--muted);font-size:.75rem;font-weight:600;">${m.status.shortDetail || m.status.detail || ''}</span>`;
  }

  const clock = getDisplayClock(m);
  const ago = state.live.lastFetch
    ? `<span style="color:var(--muted);font-size:.7rem;margin-left:8px;">odśw. ${Math.floor((Date.now()-state.live.lastFetch)/1000)}s temu</span>`
    : `<span style="color:var(--muted);font-size:.7rem;margin-left:8px;">pobieranie...</span>`;

  if (clock === 'Przerwa') {
    return `<span style="display:inline-flex;align-items:center;gap:6px;">
      <span style="color:var(--yellow);font-size:.75rem;font-weight:700;">☕ PRZERWA</span>
      ${ago}
    </span>`;
  }

  return `<span style="display:inline-flex;align-items:center;gap:6px;">
    <span class="dot" style="animation:pulse 1s infinite;"></span>
    <span style="color:var(--red);font-size:.75rem;font-weight:700;">NA ŻYWO · ${clock}</span>
    ${ago}
  </span>`;
}
