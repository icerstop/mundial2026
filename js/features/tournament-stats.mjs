import { state } from '../core/state.mjs';
import { recomputeStats } from './hero.mjs';
import { buildInsightsHTML } from './insights.mjs';

// ── Tournament Stats ───────────────────────────────────────────────────────
// All-time benchmarks for record comparisons
const WC_RECORD_GOALS = 172;   // Katar 2022 (najwięcej w historii)
const WC_RECORD_AVG = 2.69;    // Katar 2022: 172 goli / 64 mecze

// Group completed matches by tournament day, with running (cumulative) average
export function computeTrends() {
  const completed = state.data.matches.filter(m => m.status.completed)
    .slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const order = [];
  const map = new Map();
  for (const m of completed) {
    const day = (m.date || '').slice(0, 10);
    if (!day) continue;
    if (!map.has(day)) { map.set(day, { day, goals: 0, matches: 0, yellow: 0, red: 0, att: 0, attN: 0 }); order.push(day); }
    const d = map.get(day);
    d.goals += (parseInt(m.home.score) || 0) + (parseInt(m.away.score) || 0);
    d.matches += 1;
    if (m.attendance) { d.att += m.attendance; d.attN += 1; }
    (m.details?.teamStats || []).forEach(t => {
      d.yellow += parseInt(t.stats?.yellowCards?.value || 0);
      d.red += parseInt(t.stats?.redCards?.value || 0);
    });
  }
  let cumG = 0, cumM = 0;
  return order.map(day => {
    const d = map.get(day);
    cumG += d.goals; cumM += d.matches;
    const [, mo, da] = day.split('-');
    return {
      ...d, label: `${da}.${mo}`,
      runAvg: cumM ? cumG / cumM : 0,
      dayAvg: d.matches ? d.goals / d.matches : 0,
      avgAtt: d.attN ? d.att / d.attN : 0,
    };
  });
}

// Lightweight inline SVG line chart (running averages over days) — no external libs
export function svgLineChart(series, opts = {}) {
  const { ref = null, refLabel = '', valueFmt = v => v } = opts;
  const W = 620, H = 210, pad = { l: 38, r: 18, t: 20, b: 30 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = Math.max(ref || 0, ...series.map(s => s.value), 0.1) * 1.18;
  const xs = i => series.length <= 1 ? pad.l + iw / 2 : pad.l + iw * i / (series.length - 1);
  const ys = v => pad.t + ih - (v / max) * ih;

  const yticks = [0, max / 2, max].map(v => {
    const y = ys(v).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" class="chart-grid"/>
            <text x="${pad.l - 7}" y="${(+y + 3).toFixed(1)}" class="chart-ytick">${valueFmt(v)}</text>`;
  }).join('');

  const refLine = ref != null ? `
    <line x1="${pad.l}" y1="${ys(ref).toFixed(1)}" x2="${W - pad.r}" y2="${ys(ref).toFixed(1)}" class="chart-ref"/>
    <text x="${W - pad.r}" y="${(ys(ref) - 6).toFixed(1)}" class="chart-ref-label" text-anchor="end">${refLabel}</text>` : '';

  const linePts = series.map((s, i) => `${xs(i).toFixed(1)},${ys(s.value).toFixed(1)}`).join(' ');
  const area = series.length > 1
    ? `<polygon points="${pad.l},${(pad.t + ih).toFixed(1)} ${linePts} ${(W - pad.r).toFixed(1)},${(pad.t + ih).toFixed(1)}" class="chart-area"/>`
    : '';
  const line = series.length > 1 ? `<polyline points="${linePts}" class="chart-line"/>` : '';

  const dots = series.map((s, i) => `
    <circle cx="${xs(i).toFixed(1)}" cy="${ys(s.value).toFixed(1)}" r="3.5" class="chart-dot"/>
    <text x="${xs(i).toFixed(1)}" y="${(ys(s.value) - 10).toFixed(1)}" class="chart-pointlabel" text-anchor="middle">${valueFmt(s.value)}</text>
    <text x="${xs(i).toFixed(1)}" y="${H - 9}" class="chart-xtick" text-anchor="middle">${s.label}</text>`).join('');

  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">
    ${yticks}${refLine}${area}${line}${dots}
  </svg>`;
}

// CSS bar chart for per-day counts; onClick(s) → optional onclick handler string (drill)
export function cssBars(series, valueFmt = v => v, onClick = null) {
  const max = Math.max(...series.map(s => s.value), 1);
  return `<div class="ts-bars">${series.map(s => {
    const attrs = onClick ? ` class="ts-bar ts-bar--click" onclick="${onClick(s)}"` : ' class="ts-bar"';
    return `<div${attrs} title="${s.label}: ${s.value}">
      <span class="ts-bar__v">${valueFmt(s.value)}</span>
      <span class="ts-bar__fill" style="height:${(s.value / max * 100).toFixed(0)}%"></span>
      <span class="ts-bar__x">${s.label}</span>
    </div>`;
  }).join('')}</div>`;
}

export function renderTournamentStats() {
  recomputeStats();
  const el = document.getElementById('tournamentStats');
  const completed = state.data.matches.filter(m => m.status.completed);

  if (completed.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📈</div><div class="empty-state__text">Statystyki pojawią się po rozegraniu meczów</div></div>`;
    return;
  }

  // Aggregate team stats
  let totalShots = 0, totalOnTarget = 0, totalPasses = 0, totalFouls = 0;
  let totalCorners = 0, totalOffsides = 0, totalAttendance = 0;
  const possessions = [];

  completed.forEach(m => {
    if (m.attendance) totalAttendance += m.attendance;
    if (m.details?.teamStats) {
      m.details.teamStats.forEach(t => {
        totalShots += parseInt(t.stats.totalShots?.value || 0);
        totalOnTarget += parseInt(t.stats.shotsOnTarget?.value || 0);
        totalPasses += parseInt(t.stats.totalPasses?.value || 0);
        totalFouls += parseInt(t.stats.foulsCommitted?.value || 0);
        totalCorners += parseInt(t.stats.wonCorners?.value || 0);
        totalOffsides += parseInt(t.stats.offsides?.value || 0);
        if (t.stats.possessionPct?.value) possessions.push(parseFloat(t.stats.possessionPct.value));
      });
    }
  });

  const n = completed.length;

  // ── Record / pace comparison ──────────────────────────────────────────────
  const totalGoals = state.data.stats.totalGoals;
  const avg = parseFloat(state.data.stats.avgGoalsPerMatch) || 0;
  const totalMatches = state.data.matches.length || 104;
  const projected = Math.round(avg * totalMatches);
  const projDelta = projected - WC_RECORD_GOALS;
  const avgDelta = (avg - WC_RECORD_AVG);

  const recordCard = `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">🏆 Tempo vs rekord wszech czasów</div>
      <div class="ts-record">
        <div class="ts-record__metric">
          <div class="ts-record__big ts-record__big--drill" onclick="openDrill('goals')" title="Pokaż rozbicie">${totalGoals}<span> / ${WC_RECORD_GOALS}</span> <i class="drill-cue">⤢</i></div>
          <div class="ts-record__lbl">Gole · rekord 172 (Katar 2022)</div>
          <div class="ts-progress"><span style="width:${Math.min(100, totalGoals / WC_RECORD_GOALS * 100).toFixed(1)}%"></span></div>
        </div>
        <div class="ts-record__metric">
          <div class="ts-record__big ts-record__big--drill" onclick="openDrill('goals')" title="Pokaż rozbicie">${projected} <i class="drill-cue">⤢</i></div>
          <div class="ts-record__lbl">Projekcja na ${totalMatches} meczów (tempo ${avg.toFixed(2)}/mecz)</div>
          <div class="ts-record__delta ${projDelta >= 0 ? 'up' : 'down'}">${projDelta >= 0 ? '▲ +' : '▼ '}${projDelta} vs rekord</div>
        </div>
        <div class="ts-record__metric">
          <div class="ts-record__big ts-record__big--drill" onclick="openDrill('goals')" title="Pokaż rozbicie">${avg.toFixed(2)}<span> / ${WC_RECORD_AVG}</span> <i class="drill-cue">⤢</i></div>
          <div class="ts-record__lbl">Śr. goli/mecz vs Mundial 2022</div>
          <div class="ts-record__delta ${avgDelta >= 0 ? 'up' : 'down'}">${avgDelta >= 0 ? '▲ +' : '▼ '}${avgDelta.toFixed(2)} / mecz</div>
        </div>
      </div>
    </div>`;

  // ── Trend charts ──────────────────────────────────────────────────────────
  const trends = computeTrends();
  const avgChart = `
    <div class="ts-card ts-card--wide">
      <div class="ts-card__title">📈 Średnia goli / mecz w czasie</div>
      ${svgLineChart(trends.map(t => ({ label: t.label, value: +t.runAvg.toFixed(2) })),
        { ref: WC_RECORD_AVG, refLabel: `rekord 2022 · ${WC_RECORD_AVG}`, valueFmt: v => (+v).toFixed(2) })}
      <div class="ts-chart-note">Średnia narastająco po każdym dniu turnieju — przerywana linia to rekordowy Mundial 2022 (${WC_RECORD_AVG})</div>
    </div>`;

  const goalsChart = `
    <div class="ts-card">
      <div class="ts-card__title">⚽ Gole na dzień <span class="ts-drill-hint">— kliknij dzień</span></div>
      ${cssBars(trends.map(t => ({ label: t.label, value: t.goals, day: t.day })), v => v, s => `openDrill('goals',{day:'${s.day}'})`)}
    </div>`;

  const attChart = `
    <div class="ts-card">
      <div class="ts-card__title">👥 Śr. frekwencja / dzień <span class="ts-drill-hint">— kliknij dzień</span></div>
      ${cssBars(trends.map(t => ({ label: t.label, value: Math.round(t.avgAtt), day: t.day })), v => (v / 1000).toFixed(0) + 'k', s => `openDrill('attendance',{day:'${s.day}'})`)}
    </div>`;

  const sections = [
    {
      title: '🎯 Atak',
      items: [
        { label: 'Strzały łącznie', value: totalShots, drill: 'totalShots' },
        { label: 'Strzały celne', value: totalOnTarget, drill: 'shotsOnTarget' },
        { label: 'Celność strzałów', value: totalShots > 0 ? ((totalOnTarget / totalShots) * 100).toFixed(1) + '%' : '—', drill: 'shotsOnTarget' },
        { label: 'Śr. strzałów / mecz', value: n > 0 ? (totalShots / n).toFixed(1) : '—', drill: 'totalShots' },
        { label: 'Gole łącznie', value: state.data.stats.totalGoals, drill: 'goals' },
        { label: 'Śr. goli / mecz', value: state.data.stats.avgGoalsPerMatch, drill: 'goals' },
      ]
    },
    {
      title: '⚙️ Podania i posiadanie',
      items: [
        { label: 'Podania łącznie', value: totalPasses.toLocaleString('pl'), drill: 'totalPasses' },
        { label: 'Śr. podań / mecz', value: n > 0 ? Math.round(totalPasses / n).toLocaleString('pl') : '—', drill: 'totalPasses' },
        { label: 'Kornery łącznie', value: totalCorners, drill: 'wonCorners' },
        { label: 'Śr. kornerów / mecz', value: n > 0 ? (totalCorners / n).toFixed(1) : '—', drill: 'wonCorners' },
      ]
    },
    {
      title: '🛡️ Dyscyplina i inne',
      items: [
        { label: 'Faule łącznie', value: totalFouls, drill: 'foulsCommitted' },
        { label: 'Śr. fauli / mecz', value: n > 0 ? (totalFouls / n).toFixed(1) : '—', drill: 'foulsCommitted' },
        { label: 'Spalone łącznie', value: totalOffsides, drill: 'offsides' },
        { label: 'Łączna frekwencja', value: totalAttendance.toLocaleString('pl'), drill: 'attendance' },
        { label: 'Śr. frekwencja / mecz', value: n > 0 ? Math.round(totalAttendance / n).toLocaleString('pl') : '—', drill: 'attendance' },
      ]
    },
  ];

  const aggregateCards = sections.map(s => `
    <div class="ts-card animate-in">
      <div class="ts-card__title">${s.title}</div>
      ${s.items.map(item => `
        <div class="ts-item">
          <span class="ts-item__label">${item.label}</span>
          <span class="ts-item__value${item.drill ? ' ts-item__value--drill' : ''}"${item.drill ? ` onclick="openDrill('${item.drill}')" title="Pokaż rozbicie"` : ''}>${item.value}${item.drill ? ' <i class="drill-cue">⤢</i>' : ''}</span>
        </div>
      `).join('')}
    </div>
  `).join('');

  el.innerHTML = recordCard + avgChart + goalsChart + attChart + aggregateCards + buildInsightsHTML();
}
