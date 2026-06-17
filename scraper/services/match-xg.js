const { CORE } = require('../config');
const { fetchJSON, sleep } = require('../lib/http');

// Advanced xG metrics live in the core API competitor-statistics endpoint,
// grouped by category. We pull a focused, high-signal subset.
const FIELDS = [
  { key: 'xg', cat: 'offensive', name: 'expectedGoals' },
  { key: 'npxg', cat: 'offensive', name: 'expectedGoalsNonPenalty' },
  { key: 'xgot', cat: 'offensive', name: 'expectedGoalsOnTarget' },
  { key: 'xa', cat: 'offensive', name: 'expectedAssists' },
  { key: 'xga', cat: 'goalKeeping', name: 'expectedGoalsConceded' },
];

function readStat(json, category, name) {
  const cat = (json.splits?.categories || []).find(c => c.name === category);
  const stat = (cat?.stats || []).find(s => s.name === name);
  const value = stat?.value;
  return value == null ? null : Number(value);
}

// Returns { xg, npxg, xgot, xa, xga } for one competitor, or null if unavailable.
async function fetchTeamXG(eventId, teamId) {
  const url = `${CORE}/events/${eventId}/competitions/${eventId}/competitors/${teamId}/statistics?lang=en`;
  const json = await fetchJSON(url);
  const out = {};
  let any = false;
  for (const f of FIELDS) {
    const v = readStat(json, f.cat, f.name);
    out[f.key] = v;
    if (v != null) any = true;
  }
  return any ? out : null;
}

// Fetches xG for both sides of a match and writes match.details.xg = { home, away }.
// Returns true if at least one side was populated.
async function enrichMatchXG(match) {
  if (!match.details) return false;
  try {
    const home = await fetchTeamXG(match.id, match.home.id);
    await sleep(150);
    const away = await fetchTeamXG(match.id, match.away.id);
    if (!home && !away) return false;
    match.details.xg = { home: home || null, away: away || null };
    return true;
  } catch (error) {
    console.error(`  xG fetch failed for ${match.shortName || match.id}: ${error.message}`);
    return false;
  }
}

module.exports = { enrichMatchXG, fetchTeamXG };
