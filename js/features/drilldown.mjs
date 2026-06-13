import { state } from '../core/state.mjs';

// ── Drill-through (Power BI style) ──────────────────────────────────────────
function _sumTeamStat(m, key) {
  let v = 0; (m.details?.teamStats || []).forEach(t => v += parseInt(t.stats?.[key]?.value || 0)); return v;
}
function _drillTeamStat(m, key) {
  return (m.details?.teamStats || []).map(t => {
    const team = t.homeAway === 'home' ? m.home : m.away;
    return { name: team.name, logo: team.logo, value: parseInt(t.stats?.[key]?.value || 0) };
  });
}

// Each stat: how a match contributes (matchValue) and how it splits per team (teamSplit)
const DRILL = {
  goals:         { label: 'Gole', unit: 'goli', teamView: true,
                   matchValue: m => (parseInt(m.home.score) || 0) + (parseInt(m.away.score) || 0),
                   teamSplit: m => [
                     { name: m.home.name, logo: m.home.logo, value: parseInt(m.home.score) || 0 },
                     { name: m.away.name, logo: m.away.logo, value: parseInt(m.away.score) || 0 },
                   ] },
  totalShots:    { label: 'Strzały', unit: 'strzałów', teamView: true, matchValue: m => _sumTeamStat(m, 'totalShots'),    teamSplit: m => _drillTeamStat(m, 'totalShots') },
  shotsOnTarget: { label: 'Strzały celne', unit: 'strzałów', teamView: true, matchValue: m => _sumTeamStat(m, 'shotsOnTarget'), teamSplit: m => _drillTeamStat(m, 'shotsOnTarget') },
  totalPasses:   { label: 'Podania', unit: 'podań', teamView: true, matchValue: m => _sumTeamStat(m, 'totalPasses'),    teamSplit: m => _drillTeamStat(m, 'totalPasses') },
  wonCorners:    { label: 'Rzuty rożne', unit: 'rożnych', teamView: true, matchValue: m => _sumTeamStat(m, 'wonCorners'), teamSplit: m => _drillTeamStat(m, 'wonCorners') },
  foulsCommitted:{ label: 'Faule', unit: 'fauli', teamView: true, matchValue: m => _sumTeamStat(m, 'foulsCommitted'), teamSplit: m => _drillTeamStat(m, 'foulsCommitted') },
  offsides:      { label: 'Spalone', unit: 'spalonych', teamView: true, matchValue: m => _sumTeamStat(m, 'offsides'), teamSplit: m => _drillTeamStat(m, 'offsides') },
  attendance:    { label: 'Frekwencja', unit: 'kibiców', teamView: false, matchValue: m => m.attendance || 0, teamSplit: () => [] },
};

let drillState = { statId: null, mode: 'match', filter: '', day: null };

export function openDrill(statId, opts = {}) {
  if (!DRILL[statId] || !state.data?.matches) return;
  drillState = { statId, mode: 'match', filter: '', day: opts.day || null };
  document.getElementById('drillOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderDrill();
}
export function closeDrill() {
  document.getElementById('drillOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
export function setDrillMode(mode) { drillState.mode = mode; renderDrill(); }
export function setDrillFilter(v) { drillState.filter = v; renderDrillList(); } // list only → keep input focus

function _dayLabel(day) { const [, mo, da] = day.split('-'); return `${da}.${mo}`; }
function _fmtNum(n) { return n.toLocaleString('pl-PL'); }
function _drillEmpty() { return `<div class="empty-state" style="padding:24px;"><div class="empty-state__text" style="color:var(--muted);">Brak danych do wyświetlenia</div></div>`; }

export function renderDrill() {
  const spec = DRILL[drillState.statId];
  if (!spec) return;
  document.getElementById('drillTitle').textContent = `📊 ${spec.label}${drillState.day ? ' · ' + _dayLabel(drillState.day) : ''}`;
  document.getElementById('drillBody').innerHTML = `
    <div class="drill-toolbar">
      ${spec.teamView ? `
      <div class="drill-toggle">
        <button class="${drillState.mode === 'match' ? 'active' : ''}" onclick="setDrillMode('match')">Mecze</button>
        <button class="${drillState.mode === 'team' ? 'active' : ''}" onclick="setDrillMode('team')">Drużyny</button>
      </div>` : '<div></div>'}
      <input class="drill-filter" type="text" placeholder="Filtruj drużynę…" value="${drillState.filter}" oninput="setDrillFilter(this.value)">
    </div>
    <div class="drill-total" id="drillTotal"></div>
    <div class="drill-list" id="drillList"></div>`;
  renderDrillList();
}

export function renderDrillList() {
  const spec = DRILL[drillState.statId];
  let completed = state.data.matches.filter(m => m.status.completed);
  if (drillState.day) completed = completed.filter(m => (m.date || '').slice(0, 10) === drillState.day);
  const f = drillState.filter.trim().toLowerCase();
  const listEl = document.getElementById('drillList');
  const totalEl = document.getElementById('drillTotal');

  if (drillState.mode === 'team' && spec.teamView) {
    const map = new Map();
    completed.forEach(m => spec.teamSplit(m).forEach(t => {
      const e = map.get(t.name) || { name: t.name, logo: t.logo, value: 0, matches: 0 };
      e.value += t.value; e.matches += 1; map.set(t.name, e);
    }));
    let teams = [...map.values()].filter(t => t.value > 0).sort((a, b) => b.value - a.value);
    const total = teams.reduce((s, t) => s + t.value, 0);
    if (f) teams = teams.filter(t => (t.name || '').toLowerCase().includes(f));
    totalEl.innerHTML = `Suma: <b>${_fmtNum(total)}</b> ${spec.unit} · ${teams.length} druż.`;
    listEl.innerHTML = teams.length ? teams.map((t, i) => `
      <button class="drill-row" onclick="closeDrill(); openTeamModal(${JSON.stringify(t.name)})">
        <span class="drill-row__rank">${String(i + 1).padStart(2, '0')}</span>
        ${t.logo ? `<img class="drill-row__logo" src="${t.logo}" alt="" loading="lazy">` : ''}
        <span class="drill-row__name">${t.name}</span>
        <span class="drill-row__meta">${t.matches} ${t.matches === 1 ? 'mecz' : 'mecze'}</span>
        <span class="drill-row__val">${_fmtNum(t.value)}</span>
      </button>`).join('') : _drillEmpty();
    return;
  }

  let rows = completed.map(m => ({ m, value: spec.matchValue(m), split: spec.teamSplit(m) }))
    .filter(r => r.value > 0).sort((a, b) => b.value - a.value);
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (f) rows = rows.filter(r => [r.m.home.name, r.m.away.name].some(nm => (nm || '').toLowerCase().includes(f)));
  totalEl.innerHTML = `Suma: <b>${_fmtNum(total)}</b> ${spec.unit} · ${rows.length} ${rows.length === 1 ? 'mecz' : 'meczów'}`;
  listEl.innerHTML = rows.length ? rows.map((r, i) => {
    const m = r.m;
    const [, mo, da] = (m.date || '').slice(0, 10).split('-');
    const splitTxt = r.split.length ? ' · (' + r.split.map(s => s.value).join('–') + ')' : '';
    return `
      <button class="drill-row" onclick="closeDrill(); openMatchModal('${m.id}')">
        <span class="drill-row__rank">${String(i + 1).padStart(2, '0')}</span>
        <span class="drill-row__main">
          <span class="drill-row__teams">${m.home.abbr || m.home.name} <b>${m.home.score}–${m.away.score}</b> ${m.away.abbr || m.away.name}</span>
          <span class="drill-row__meta">${da}.${mo}${m.group ? ' · ' + m.group : ''}${splitTxt}</span>
        </span>
        <span class="drill-row__val">${_fmtNum(r.value)}</span>
      </button>`;
  }).join('') : _drillEmpty();
}

export function setupDrillModal() {
  document.getElementById('drillClose').addEventListener('click', closeDrill);
  document.getElementById('drillOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDrill(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('drillOverlay').classList.contains('active')) closeDrill(); });
}
