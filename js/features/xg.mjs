import { state } from '../core/state.mjs';
import { computeTeamXG, matchXG, xgVerdict } from '../domain/xg.mjs';

// Scatter xG (oś X) vs gole (oś Y); przekątna y=x = "dokładnie wg xG"
export function svgScatter(points, opts = {}) {
  const { xTitle = 'xG stworzone', yTitle = 'Gole' } = opts;
  const W = 620, H = 340, pad = { l: 44, r: 16, t: 16, b: 42 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = Math.max(1, ...points.map(p => Math.max(p.x, p.y))) * 1.15;
  const X = v => pad.l + iw * (v / max);
  const Y = v => pad.t + ih - ih * (v / max);
  const ticks = [0, max / 2, max].map(v => {
    const gx = X(v).toFixed(1), gy = Y(v).toFixed(1);
    return `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" class="chart-grid"/>
      <text x="${pad.l - 6}" y="${(+gy + 3).toFixed(1)}" class="chart-ytick">${v.toFixed(1)}</text>
      <text x="${gx}" y="${(pad.t + ih + 16).toFixed(1)}" class="chart-xtick" text-anchor="middle">${v.toFixed(1)}</text>`;
  }).join('');
  const diag = `<line x1="${X(0).toFixed(1)}" y1="${Y(0).toFixed(1)}" x2="${X(max).toFixed(1)}" y2="${Y(max).toFixed(1)}" class="chart-ref"/>`;
  const dots = points.map(p => {
    const over = p.y >= p.x;
    return `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4.5" class="chart-dot"/>
      <text x="${(X(p.x) + 8).toFixed(1)}" y="${(Y(p.y) + 3.5).toFixed(1)}" class="chart-scatterlabel ${over ? 'over' : 'under'}">${p.label}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">
    ${ticks}${diag}${dots}
    <text x="${(pad.l + iw / 2).toFixed(1)}" y="${H - 4}" class="chart-axis-title" text-anchor="middle">${xTitle}</text>
    <text x="12" y="${(pad.t + ih / 2).toFixed(1)}" class="chart-axis-title" text-anchor="middle" transform="rotate(-90 12 ${(pad.t + ih / 2).toFixed(1)})">${yTitle}</text>
  </svg>`;
}

export function renderXG() {
  const el = document.getElementById('xgStats');
  if (!el) return;
  const completed = state.data.matches.filter(m => m.status.completed);
  const withXG = completed.filter(m => { const x = matchXG(m); return x.homeXG != null && x.awayXG != null; });

  if (withXG.length === 0) {
    el.innerHTML = `<div class="ts-card ts-card--wide"><div class="empty-state"><div class="empty-state__icon">🎯</div><div class="empty-state__text">Dane xG pojawią się po rozegraniu pierwszych meczów</div></div></div>`;
    return;
  }

  const intro = `
    <div class="ts-card ts-card--wide xg-intro">
      <div class="ts-card__title">🎯 xG — Expected Goals</div>
      <p class="xg-note">xG (oczekiwane gole) ocenia <b>jakość</b> sytuacji bramkowych, nie tylko ich liczbę. Drużyna z wyższym xG zwykle zasłużyła na więcej — różnica między golami a xG pokazuje <b>skuteczność wykończenia</b> (lub szczęście). Źródło: ESPN.</p>
    </div>`;

  // Tabela meczów — kto zasłużył na wynik (wszystkie zakończone; brak xG → „—")
  const matchRows = completed.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => {
    const { homeXG, awayXG } = matchXG(m);
    const has = homeXG != null && awayXG != null;
    const v = has ? xgVerdict(m) : { txt: 'brak danych xG', cls: 'xg-muted' };
    const hWin = (+m.home.score || 0) > (+m.away.score || 0);
    const aWin = (+m.away.score || 0) > (+m.home.score || 0);
    const hx = homeXG != null ? homeXG.toFixed(2) : '—';
    const ax = awayXG != null ? awayXG.toFixed(2) : '—';
    return `<tr>
      <td>
        <div class="xg-match">
          <span class="xg-side ${hWin ? 'w' : ''}"><img class="group-team__logo xg-mini" src="${m.home.logo}" alt=""><span>${m.home.abbr}</span></span>
          <span class="xg-score">${m.home.score ?? 0}–${m.away.score ?? 0}</span>
          <span class="xg-side ${aWin ? 'w' : ''}"><span>${m.away.abbr}</span><img class="group-team__logo xg-mini" src="${m.away.logo}" alt=""></span>
        </div>
      </td>
      <td class="${has && homeXG > awayXG ? 'xg-hi' : ''}">${hx}</td>
      <td class="${has && awayXG > homeXG ? 'xg-hi' : ''}">${ax}</td>
      <td class="${v.cls}">${v.txt}</td>
    </tr>`;
  }).join('');
  const matchTable = `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">⚖️ Kto zasłużył na wynik (gole vs xG)</div>
      <table class="group-table xg-table">
        <thead><tr><th>Mecz</th><th>xG gosp.</th><th>xG gość</th><th>Werdykt</th></tr></thead>
        <tbody>${matchRows}</tbody>
      </table>
    </div>`;

  // Ranking drużyn — skuteczność (gole − xG); liczby po meczach z dostępnym xG
  const allTeams = computeTeamXG(state.data.matches);
  const xgTeams = allTeams.filter(t => t.xgMF > 0);
  const teamRows = xgTeams.slice().sort((a, b) => b.finishing - a.finishing).map(t => {
    const f = t.finishing;
    return `<tr>
      <td><div class="group-team"><img class="group-team__logo" src="${t.logo}" alt=""><span class="group-team__name">${t.name}</span></div></td>
      <td>${t.xgMF}</td>
      <td>${t.gfX}</td>
      <td>${t.xgf.toFixed(2)}</td>
      <td class="${f > 0.05 ? 'xg-pos' : f < -0.05 ? 'xg-neg' : ''}">${f >= 0 ? '+' : ''}${f.toFixed(2)}</td>
      <td>${t.xgMA ? t.gaX : '—'}</td>
      <td>${t.xgMA ? t.xga.toFixed(2) : '—'}</td>
    </tr>`;
  }).join('');
  const teamTable = `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">📊 Skuteczność drużyn — gole vs xG</div>
      <table class="group-table xg-table">
        <thead><tr><th>Drużyna</th><th>M</th><th>Gole</th><th>xG</th><th>Δ skut.</th><th>Stracone</th><th>xGA</th></tr></thead>
        <tbody>${teamRows}</tbody>
      </table>
      <div class="ts-chart-note">Δ skut. = gole − xG. Dodatnie = wykorzystują szanse ponad oczekiwania; ujemne = marnują.</div>
    </div>`;

  // Scatter xG vs gole
  const points = xgTeams.map(t => ({ x: +t.xgf.toFixed(2), y: t.gfX, label: t.abbr }));
  const scatter = `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">🎯 xG stworzone vs gole zdobyte</div>
      ${svgScatter(points)}
      <div class="ts-chart-note">Nad przekątną = skuteczniejsi niż xG (zieloni). Pod przekątną = marnują szanse (czerwoni).</div>
    </div>`;

  // Styl gry — 3 rankingi
  const rankCard = (title, list, fmt) => `
    <div class="ts-card">
      <div class="ts-card__title">${title}</div>
      ${list.length ? list.map(([t, val], i) => `
        <div class="ts-item">
          <span class="ts-item__label"><span class="xg-rank-i">${i + 1}</span><img class="group-team__logo xg-mini" src="${t.logo}" alt="">${t.abbr}</span>
          <span class="ts-item__value">${fmt(val)}</span>
        </div>`).join('') : `<div class="xg-note">brak danych</div>`}
    </div>`;
  const top = (key, n = 6) => allTeams.filter(t => t[key] != null).sort((a, b) => b[key] - a[key]).slice(0, n).map(t => [t, t[key]]);
  const possCard = rankCard('🧮 Posiadanie piłki', top('avgPoss'), v => v.toFixed(1) + '%');
  const passCard = rankCard('🎯 Celność podań', top('avgPassPct'), v => v.toFixed(1) + '%');
  const defCard = rankCard('🛡️ Akcje obronne / mecz', top('defPerMatch'), v => v.toFixed(1));

  el.innerHTML = intro + matchTable + teamTable + scatter + possCard + passCard + defCard;
}
