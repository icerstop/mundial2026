
const fs = require('fs');
const {
  BASE,
  DATA_DIR,
  OUT_FILE,
  TOURNAMENT_END,
  TOURNAMENT_START,
} = require('./config');
const { computeAggregates } = require('./domain/aggregate');
const { dateStr } = require('./lib/dates');
const { fetchJSON, pushToFirebase, sleep } = require('./lib/http');
const { parseScoreboardEvent } = require('./parsers/scoreboard');
const { parseStandings } = require('./parsers/standings');
const { parseSummary } = require('./parsers/summary');
const { shouldRunScrape } = require('./schedule');
const { loadRosters } = require('./services/rosters');

async function fetchMatches() {
  const dates = [];
  const current = new Date(TOURNAMENT_START);
  while (current <= TOURNAMENT_END) {
    dates.push(dateStr(current));
    current.setDate(current.getDate() + 1);
  }

  console.log(`Scanning ${dates.length} days: ${dates[0]} -> ${dates[dates.length - 1]}`);
  const matches = [];
  const matchIds = new Set();

  for (const date of dates) {
    try {
      const data = await fetchJSON(`${BASE}/scoreboard?dates=${date}`);
      const events = data.events || [];
      for (const event of events) {
        const match = parseScoreboardEvent(event);
        if (match && !matchIds.has(match.id)) {
          matchIds.add(match.id);
          matches.push(match);
        }
      }
      if (events.length) console.log(`  ${date}: ${events.length} match(es)`);
      await sleep(200);
    } catch (error) {
      console.error(`  Error fetching ${date}: ${error.message}`);
    }
  }

  return matches;
}

async function enrichMatches(matches) {
  console.log('Fetching match details...');
  for (const match of matches) {
    if (match.status.state === 'pre' && !match.status.completed) continue;
    try {
      const data = await fetchJSON(`${BASE}/summary?event=${match.id}`);
      match.details = parseSummary(data);
      console.log(`  Details fetched: ${match.shortName}`);
      await sleep(300);
    } catch (error) {
      console.error(`  Error fetching details for ${match.shortName}: ${error.message}`);
    }
  }
}

async function fetchStandings() {
  try {
    const groups = parseStandings(await fetchJSON(`${BASE}/standings`));
    console.log(`Loaded ${groups.length} groups`);
    return groups;
  } catch (error) {
    console.error(`Error fetching standings: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('Mundial 2026 Scraper - start');
  console.log('-'.repeat(50));
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!await shouldRunScrape()) return;

  const matches = await fetchMatches();
  console.log(`Found ${matches.length} match(es) total`);
  await enrichMatches(matches);

  const groups = await fetchStandings();
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  const rosters = await loadRosters(matches, force);
  const { completedMatches, topAssisters, topCanadian, topScorers, totalGoals } =
    computeAggregates(matches);

  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      tournament: 'FIFA World Cup 2026',
      source: 'ESPN Public API',
      matchCount: matches.length,
      completedCount: completedMatches.length,
    },
    stats: {
      totalGoals,
      matchesPlayed: completedMatches.length,
      avgGoalsPerMatch: completedMatches.length
        ? (totalGoals / completedMatches.length).toFixed(2)
        : '0.00',
    },
    topScorers,
    topAssisters,
    topCanadian,
    groups,
    rosters,
    matches: matches.sort((a, b) => new Date(a.date) - new Date(b.date)),
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved to ${OUT_FILE}`);
  console.log(`Matches: ${output.meta.matchCount} | Completed: ${output.meta.completedCount} | Goals: ${totalGoals}`);

  try {
    await pushToFirebase(output);
  } catch (error) {
    console.error('Firebase synchronization failed:', error.message);
  }
}

module.exports = { enrichMatches, fetchMatches, fetchStandings, main };
