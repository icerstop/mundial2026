import { matchXG } from './xg.mjs';
import { isOwnGoal, isPenalty } from './goal-kind.mjs';

// ── Goal events ─────────────────────────────────────────────────────────────
// Real in-match goals only (drop penalty-shootout goals, which aren't minute-based).
// Includes live matches in progress so goal counts match what's shown on the cards;
// live keyEvents are kept current by refreshLiveDetails() in the live-scores service.
function goalEvents(matches) {
  const goals = [];
  for (const m of matches) {
    if (!m.status?.completed && m.status?.state !== 'in') continue;
    for (const e of m.details?.keyEvents || []) {
      const isGoal = e.type === 'Goal' || (e.text || '').toLowerCase().includes('goal');
      if (isGoal && !e.shootout) goals.push(e);
    }
  }
  return goals;
}

// Parse an ESPN clock ("9'", "45'+2'", "90'+4'") into a numeric minute + bucket.
const TIMING_BUCKETS = ['1-15', '16-30', '31-45', '45+', '46-60', '61-75', '76-90', '90+'];

function clockToMinute(clock) {
  if (!clock) return null;
  const stop = String(clock).match(/^(\d+)\s*'?\s*\+\s*(\d+)/);
  if (stop) return { minute: +stop[1] + +stop[2], stoppage: true, base: +stop[1] };
  const reg = String(clock).match(/^(\d+)/);
  if (!reg) return null;
  return { minute: +reg[1], stoppage: false, base: +reg[1] };
}

function minuteToBucket(parsed) {
  if (!parsed) return null;
  if (parsed.stoppage) return parsed.base <= 45 ? '45+' : '90+';
  const m = parsed.minute;
  if (m <= 15) return '1-15';
  if (m <= 30) return '16-30';
  if (m <= 45) return '31-45';
  if (m <= 60) return '46-60';
  if (m <= 75) return '61-75';
  if (m <= 90) return '76-90';
  return '90+';
}

// Public helper: which timing bucket a goal event falls into (used by drill-through).
export function goalBucketOf(event) {
  return minuteToBucket(clockToMinute(event?.clock));
}
export { TIMING_BUCKETS };

export function computeGoalTiming(matches) {
  const counts = Object.fromEntries(TIMING_BUCKETS.map(b => [b, 0]));
  let sumMinute = 0, withMinute = 0, secondHalf = 0, stoppage = 0;
  for (const e of goalEvents(matches)) {
    const parsed = clockToMinute(e.clock);
    const bucket = minuteToBucket(parsed);
    if (!bucket) continue;
    counts[bucket]++;
    if (parsed) {
      sumMinute += parsed.minute; withMinute++;
      if (parsed.minute > 45) secondHalf++;
      if (parsed.stoppage) stoppage++;
    }
  }
  const total = withMinute;
  const peak = TIMING_BUCKETS.reduce((a, b) => (counts[b] > counts[a] ? b : a), TIMING_BUCKETS[0]);
  return {
    buckets: TIMING_BUCKETS.map(label => ({ label, count: counts[label] })),
    total,
    avgMinute: withMinute ? sumMinute / withMinute : 0,
    secondHalfPct: total ? (secondHalf / total) * 100 : 0,
    stoppageGoals: stoppage,
    peakBucket: peak,
  };
}

// ESPN encodes the goal kind in `type` ("Penalty - Scored", "Own Goal",
// "Goal - Header"…); the boolean flags are unreliable, so classify off type/text.
export function computeGoalAnatomy(matches) {
  let openPlay = 0, header = 0, penalty = 0, ownGoal = 0;
  for (const e of goalEvents(matches)) {
    if (isOwnGoal(e)) ownGoal++;
    else if (isPenalty(e)) penalty++;
    else if ((e.type || '').toLowerCase().includes('header')) header++;
    else openPlay++;
  }
  return { openPlay, header, penalty, ownGoal, total: openPlay + header + penalty + ownGoal };
}

// ── Per-team style/efficiency profiles (drives the quadrant + radars) ────────
const num = v => (v == null || v === '' ? null : parseFloat(v));

export function computeTeamProfiles(matches) {
  const teams = new Map();
  const get = t => {
    if (!teams.has(t.id)) {
      teams.set(t.id, {
        id: t.id, name: t.name, abbr: t.abbr, logo: t.logo,
        mp: 0, xgF: 0, xgFn: 0, xgA: 0, xgAn: 0, xaF: 0, xaN: 0,
        poss: 0, shots: 0, press: 0, fouls: 0, statM: 0,
      });
    }
    return teams.get(t.id);
  };

  for (const m of matches.filter(x => x.status?.completed)) {
    const { homeXG, awayXG } = matchXG(m);
    const xg = m.details?.xg;
    const sides = [
      { team: m.home, ha: 'home', xgFor: homeXG, xgAgainst: awayXG, xa: num(xg?.home?.xa) },
      { team: m.away, ha: 'away', xgFor: awayXG, xgAgainst: homeXG, xa: num(xg?.away?.xa) },
    ];
    for (const s of sides) {
      const e = get(s.team);
      e.mp++;
      if (s.xgFor != null) { e.xgF += s.xgFor; e.xgFn++; }
      if (s.xgAgainst != null) { e.xgA += s.xgAgainst; e.xgAn++; }
      if (s.xa != null) { e.xaF += s.xa; e.xaN++; }

      const ts = (m.details?.teamStats || []).find(t => t.homeAway === s.ha)?.stats;
      if (!ts) continue;
      const poss = num(ts.possessionPct?.value);
      if (poss != null) e.poss += poss;
      e.shots += parseInt(ts.totalShots?.value || 0, 10);
      e.press += parseInt(ts.totalTackles?.value || 0, 10) + parseInt(ts.interceptions?.value || 0, 10);
      e.fouls += parseInt(ts.foulsCommitted?.value || 0, 10);
      e.statM++;
    }
  }

  return [...teams.values()].map(e => ({
    id: e.id, name: e.name, abbr: e.abbr, logo: e.logo, mp: e.mp,
    xgForPM: e.xgFn ? e.xgF / e.xgFn : null,
    xgAgainstPM: e.xgAn ? e.xgA / e.xgAn : null,
    xaForPM: e.xaN ? e.xaF / e.xaN : null,
    possAvg: e.statM ? e.poss / e.statM : null,
    shotsPM: e.statM ? e.shots / e.statM : null,
    pressPM: e.statM ? e.press / e.statM : null,
    foulsPM: e.statM ? e.fouls / e.statM : null,
  }));
}
