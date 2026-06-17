import { state } from '../core/state.mjs';
import { computeGoalAnatomy, computeGoalTiming, computeTeamProfiles } from '../domain/insights.mjs';

// ── 1. Goal-timing histogram ────────────────────────────────────────────────
function svgGoalTiming(timing) {
  const W = 640, H = 250, pad = { l: 30, r: 14, t: 22, b: 46 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const buckets = timing.buckets;
  const max = Math.max(...buckets.map(b => b.count), 1);
  const n = buckets.length, gap = 9;
  const bw = (iw - gap * (n - 1)) / n;
  const yOf = c => pad.t + ih - ih * (c / max);

  const grid = [0, max / 2, max].map(v => {
    const y = yOf(v).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" class="chart-grid"/>
      <text x="${pad.l - 6}" y="${(+y + 3).toFixed(1)}" class="chart-ytick">${Math.round(v)}</text>`;
  }).join('');

  const bars = buckets.map((b, i) => {
    const x = pad.l + i * (bw + gap);
    const y = yOf(b.count);
    const h = pad.t + ih - y;
    const stop = b.label.includes('+');
    const cx = (x + bw / 2).toFixed(1);
    return `<g class="gt-barwrap" onclick="openDrill('goalBucket',{bucket:'${b.label}'})" data-tip="${b.label}' — ${b.count} goli (kliknij)">
      <rect x="${x.toFixed(1)}" y="${pad.t}" width="${bw.toFixed(1)}" height="${ih.toFixed(1)}" fill="transparent"/>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="3" class="gt-bar ${stop ? 'gt-bar--stop' : ''}"/>
      <text x="${cx}" y="${(y - 7).toFixed(1)}" class="chart-pointlabel" text-anchor="middle">${b.count || ''}</text>
      <text x="${cx}" y="${H - 26}" class="chart-xtick" text-anchor="middle">${b.label}</text>
    </g>`;
  }).join('');

  // Half divider sits between bucket index 3 (45+) and 4 (46-60)
  const divX = pad.l + 4 * (bw + gap) - gap / 2;
  const divider = `<line x1="${divX.toFixed(1)}" y1="${pad.t}" x2="${divX.toFixed(1)}" y2="${pad.t + ih}" class="gt-divider"/>
    <text x="${(pad.l + (divX - pad.l) / 2).toFixed(1)}" y="${H - 8}" class="gt-half" text-anchor="middle">1. POŁOWA</text>
    <text x="${(divX + (W - pad.r - divX) / 2).toFixed(1)}" y="${H - 8}" class="gt-half" text-anchor="middle">2. POŁOWA</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">
    ${grid}${divider}${bars}</svg>`;
}

// ── 2. Goal anatomy donut ───────────────────────────────────────────────────
function svgDonut(segments, total) {
  const size = 168, r = 60, w = 24, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let off = 0;
  const arcs = segments.filter(s => s.value > 0).map(s => {
    const len = (s.value / total) * C;
    const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${w}"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" class="donut-arc" onclick="openDrill('goalKind',{kind:'${s.kind}'})" data-tip="${s.label}: ${s.value} (kliknij)"></circle>`;
    off += len;
    return arc;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="donut-svg" role="img">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--grid)" stroke-width="${w}"/>
    ${arcs}
    <text x="${cx}" y="${cy - 2}" class="donut-total" text-anchor="middle">${total}</text>
    <text x="${cx}" y="${cy + 16}" class="donut-sub" text-anchor="middle">GOLI</text>
  </svg>`;
}

// ── 3. Attack vs Defense quadrant ───────────────────────────────────────────
function svgQuadrant(points, avgX, avgY) {
  const W = 640, H = 460, pad = { l: 52, r: 18, t: 30, b: 48 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const xmax = Math.max(...points.map(p => p.x), avgX, 0.5) * 1.12;
  const ymax = Math.max(...points.map(p => p.y), avgY, 0.5) * 1.12;
  const X = v => pad.l + iw * (v / xmax);
  const Y = v => pad.t + ih * (v / ymax); // top = low xGA (strong defense)
  const ax = X(avgX), ay = Y(avgY);

  const zones = `
    <text x="${(ax + (W - pad.r - ax) / 2).toFixed(1)}" y="${pad.t + 14}" class="q-zone q-zone--elite" text-anchor="middle">KOMPLET ⭐</text>
    <text x="${(pad.l + (ax - pad.l) / 2).toFixed(1)}" y="${pad.t + 14}" class="q-zone q-zone--wall" text-anchor="middle">MUR 🧱</text>
    <text x="${(ax + (W - pad.r - ax) / 2).toFixed(1)}" y="${(pad.t + ih - 8).toFixed(1)}" class="q-zone q-zone--wild" text-anchor="middle">SZALENI ⚔️</text>
    <text x="${(pad.l + (ax - pad.l) / 2).toFixed(1)}" y="${(pad.t + ih - 8).toFixed(1)}" class="q-zone q-zone--crisis" text-anchor="middle">W KRYZYSIE 🆘</text>`;

  const dividers = `
    <line x1="${ax.toFixed(1)}" y1="${pad.t}" x2="${ax.toFixed(1)}" y2="${pad.t + ih}" class="q-divider"/>
    <line x1="${pad.l}" y1="${ay.toFixed(1)}" x2="${W - pad.r}" y2="${ay.toFixed(1)}" class="q-divider"/>`;

  const dots = points.map(p => {
    const good = p.x >= avgX && p.y <= avgY;
    const click = p.name ? ` onclick="openTeamModal('${p.name}')"` : '';
    return `<g class="q-pt"${click} data-tip="${p.label} — xG/mecz ${p.x.toFixed(2)} · xGA/mecz ${p.y.toFixed(2)} (kliknij)">
      <circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4.5" class="q-dot ${good ? 'q-dot--good' : ''}"/>
      <text x="${(X(p.x) + 7).toFixed(1)}" y="${(Y(p.y) + 3.5).toFixed(1)}" class="q-label">${p.label}</text></g>`;
  }).join('');

  const axes = `
    <text x="${(pad.l + iw / 2).toFixed(1)}" y="${H - 26}" class="chart-axis-title" text-anchor="middle">Atak → xG stworzone / mecz →</text>
    <text x="14" y="${(pad.t + ih / 2).toFixed(1)}" class="chart-axis-title" text-anchor="middle" transform="rotate(-90 14 ${(pad.t + ih / 2).toFixed(1)})">↑ Lepsza obrona · mniej xGA/mecz</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">
    ${dividers}${zones}${dots}${axes}</svg>`;
}

// ── 4. Style "fingerprint" mini-radar ───────────────────────────────────────
const RADAR_AXES = ['Atak', 'Kreacja', 'Posiadanie', 'Pressing', 'Dyscyplina'];

function radarPoints(values, cx, cy, r) {
  const n = values.length;
  return values.map((v, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rad = r * Math.max(0.03, Math.min(1, v));
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  });
}

function svgRadar(values, size, opts = {}) {
  const { labels = null, display = null } = opts;
  const cx = size / 2, cy = size / 2, r = size / 2 - (labels ? 22 : 12);
  const n = values.length;
  const ring = frac => radarPoints(values.map(() => frac), cx, cy, r)
    .map(p => p.map(c => c.toFixed(1)).join(',')).join(' ');
  const grid = [1, 0.66, 0.33].map(f => `<polygon points="${ring(f)}" class="radar-ring"/>`).join('');
  const spokes = values.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * r).toFixed(1)}" y2="${(cy + Math.sin(a) * r).toFixed(1)}" class="radar-spoke"/>`;
  }).join('');
  const pts = radarPoints(values, cx, cy, r);
  const poly = pts.map(p => p.map(c => c.toFixed(1)).join(',')).join(' ');
  const axisLabels = labels ? labels.map((lab, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const lr = r + 11;
    const x = cx + Math.cos(a) * lr, y = cy + Math.sin(a) * lr;
    const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
    return `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" class="radar-axislabel" text-anchor="${anchor}">${lab}</text>`;
  }).join('') : '';
  // Hover targets at each corner — custom tooltip (see ui/tooltip.mjs) shows the raw value
  const vertices = display ? pts.map((p, i) => `
    <circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8" class="radar-vertex" data-tip="${RADAR_AXES[i]}: ${display[i]}"></circle>`).join('') : '';
  return `<svg viewBox="0 0 ${size} ${size}" class="radar-svg" role="img">
    ${grid}${spokes}<polygon points="${poly}" class="radar-poly"/>${vertices}${axisLabels}</svg>`;
}

// Normalise each axis 0..1 across teams (Discipline inverted: fewer fouls = bigger).
function radarMatrix(profiles) {
  const maxOf = key => Math.max(...profiles.map(p => p[key] || 0), 0.0001);
  const mx = {
    atk: maxOf('xgForPM'), cre: maxOf('xaForPM'), pos: maxOf('possAvg'),
    pre: maxOf('pressPM'), foul: maxOf('foulsPM'),
  };
  const fmt = (v, suffix, digits = 2) => (v != null ? v.toFixed(digits) : '—') + suffix;
  return profiles.map(p => ({
    ...p,
    radar: [
      (p.xgForPM || 0) / mx.atk,
      (p.xaForPM || 0) / mx.cre,
      (p.possAvg || 0) / mx.pos,
      (p.pressPM || 0) / mx.pre,
      1 - (p.foulsPM || 0) / mx.foul,
    ],
    display: [
      fmt(p.xgForPM, ' xG/mecz'),
      fmt(p.xaForPM, ' xA/mecz'),
      fmt(p.possAvg, '%', 0),
      fmt(p.pressPM, ' odb.+prze./mecz', 1),
      fmt(p.foulsPM, ' fauli/mecz', 1),
    ],
  }));
}

// Returns the analytics cards as an HTML string, appended into the Stats tab.
export function buildInsightsHTML() {
  const matches = state.data.matches;
  const completed = matches.filter(m => m.status.completed);
  if (completed.length === 0) return '';

  // 1. Goal timing
  const timing = computeGoalTiming(matches);
  const timingCard = `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">⏱️ Kiedy padają gole?</div>
      ${svgGoalTiming(timing)}
      <div class="ins-kpis">
        <div class="ins-kpi"><span class="ins-kpi__v">${timing.avgMinute.toFixed(0)}'</span><span class="ins-kpi__l">średnia minuta gola</span></div>
        <div class="ins-kpi"><span class="ins-kpi__v">${timing.secondHalfPct.toFixed(0)}%</span><span class="ins-kpi__l">goli po przerwie</span></div>
        <div class="ins-kpi"><span class="ins-kpi__v">${timing.stoppageGoals}</span><span class="ins-kpi__l">w doliczonym czasie</span></div>
        <div class="ins-kpi"><span class="ins-kpi__v">${timing.peakBucket}'</span><span class="ins-kpi__l">najgroźniejszy przedział</span></div>
      </div>
      <div class="ts-chart-note">Słupki w żółci to gra zasadnicza, ciemniejsze (45+, 90+) to doliczony czas. Uwzględnia mecze zakończone i na żywo. Kliknij słupek, by zobaczyć gole z danego przedziału.</div>
    </div>`;

  // 2. Goal anatomy donut
  const an = computeGoalAnatomy(matches);
  const segs = [
    { label: 'Z gry (nogą)', value: an.openPlay, color: 'var(--yellow)', kind: 'open' },
    { label: 'Głową', value: an.header, color: 'var(--green)', kind: 'header' },
    { label: 'Z karnego', value: an.penalty, color: 'var(--blue)', kind: 'penalty' },
    { label: 'Samobójcze', value: an.ownGoal, color: 'var(--red)', kind: 'own' },
  ];
  const pct = v => an.total ? Math.round((v / an.total) * 100) : 0;
  const anatomyCard = `
    <div class="ts-card">
      <div class="ts-card__title">🧬 Anatomia goli</div>
      <div class="anatomy">
        ${svgDonut(segs, an.total)}
        <div class="anatomy__legend">
          ${segs.map(s => `<button class="anatomy__row anatomy__row--click" onclick="openDrill('goalKind',{kind:'${s.kind}'})" title="Kliknij, by zobaczyć te gole">
            <span class="anatomy__dot" style="background:${s.color}"></span>
            <span class="anatomy__lbl">${s.label}</span>
            <span class="anatomy__val">${s.value} <small>(${pct(s.value)}%)</small></span>
            <i class="drill-cue">⤢</i></button>`).join('')}
        </div>
      </div>
      <div class="ts-chart-note">Uwzględnia mecze zakończone i na żywo. Kliknij kategorię (lub wycinek), by zobaczyć konkretne gole.</div>
    </div>`;

  // Team profiles drive quadrant + radars
  const profiles = computeTeamProfiles(matches);

  // 3. Attack vs Defense quadrant
  const qPoints = profiles
    .filter(p => p.xgForPM != null && p.xgAgainstPM != null)
    .map(p => ({ x: p.xgForPM, y: p.xgAgainstPM, label: p.abbr, name: p.name }));
  let quadrantCard = '';
  if (qPoints.length >= 2) {
    const avgX = qPoints.reduce((s, p) => s + p.x, 0) / qPoints.length;
    const avgY = qPoints.reduce((s, p) => s + p.y, 0) / qPoints.length;
    quadrantCard = `
      <div class="ts-card ts-card--wide">
        <div class="ts-card__title">🗺️ Mapa drużyn: Atak vs Obrona (xG/mecz)</div>
        ${svgQuadrant(qPoints, avgX, avgY)}
        <div class="ts-chart-note">Prawo = groźniejszy atak (xG stworzone). Góra = pewniejsza obrona (mniej xGA). Linie = średnia turnieju. Prawy-górny róg ⭐ to kandydaci do tytułu. Kliknij drużynę, by otworzyć profil. Liczone z meczów zakończonych.</div>
      </div>`;
  }

  // 4. Style fingerprints (mini-radars)
  const played = profiles.filter(p => p.mp > 0 && p.statM !== 0);
  const matrix = radarMatrix(played).sort((a, b) => (b.xgForPM || 0) - (a.xgForPM || 0));
  const legendRadar = svgRadar([0.85, 0.85, 0.85, 0.85, 0.85], 150, { labels: RADAR_AXES });
  const radarCard = matrix.length ? `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">🕸️ Odciski palca stylu gry</div>
      <div class="radar-legendwrap">
        <div class="radar-legend">${legendRadar}<span class="radar-legend__cap">Wzorzec osi</span></div>
        <p class="xg-note">Każdy kształt to „odcisk palca" drużyny na 5 osiach (znormalizowane do najlepszej drużyny turnieju): <b>Atak</b> (xG/mecz), <b>Kreacja</b> (xA/mecz), <b>Posiadanie</b>, <b>Pressing</b> (odbiory+przechwyty/mecz), <b>Dyscyplina</b> (im mniej fauli, tym większa). Im większe pole, tym bardziej kompletny zespół.</p>
      </div>
      <div class="radar-grid">
        ${matrix.map(t => `
          <div class="radar-cell" title="${t.name} — najedź na narożnik, by zobaczyć wartość" onclick="openTeamModal('${t.name}')">
            ${svgRadar(t.radar, 132, { display: t.display })}
            <div class="radar-cell__name"><img class="group-team__logo xg-mini" src="${t.logo}" alt="">${t.abbr}</div>
          </div>`).join('')}
      </div>
      <div class="ts-chart-note">Najedź kursorem na narożnik wykresu, aby zobaczyć dokładną wartość osi. Kliknij drużynę, by otworzyć jej profil. Liczone z meczów zakończonych.</div>
    </div>` : '';

  const header = `<div class="ts-card ts-card--wide ts-section-break">
    <div class="ts-card__title">🔬 Pogłębione analizy i wizualizacje</div>
    <p class="xg-note">Wszystko liczone na żywo z danych meczowych — odświeża się wraz z wynikami.</p>
  </div>`;

  return header + timingCard + anatomyCard + quadrantCard + radarCard;
}
