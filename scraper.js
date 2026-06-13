/**
 * Mundial 2026 Dashboard — Scraper / Agent
 * 
 * Pobiera dane z ESPN Public API (site.api.espn.com) i zapisuje do data/matches.json.
 * Uruchamiaj: node scraper.js
 * 
 * Endpointy:
 *   - scoreboard?dates=YYYYMMDD  → wyniki meczów danego dnia
 *   - summary?event={id}         → pełne statystyki meczu
 *   - standings                  → tabele grupowe
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const DATA_DIR = path.join(__dirname, 'data');
const OUT_FILE = path.join(DATA_DIR, 'matches.json');

// Real, current managers for the 48 countries in the 2026 World Cup (overriding stale/historic ESPN data)
const COACH_OVERRIDES = {
  'algeria': 'Vladimir Petković',
  'argentina': 'Lionel Scaloni',
  'australia': 'Tony Popovic',
  'austria': 'Ralf Rangnick',
  'belgium': 'Domenico Tedesco',
  'bosnia and herzegovina': 'Sergej Barbarez',
  'brazil': 'Dorival Júnior',
  'canada': 'Jesse Marsch',
  'cabo verde': 'Bubista',
  'colombia': 'Néstor Lorenzo',
  'dr congo': 'Sébastien Desabre',
  'croatia': 'Zlatko Dalić',
  'curacao': 'Dick Advocaat',
  'czechia': 'Ivan Hašek',
  'ecuador': 'Sebastián Beccacece',
  'egypt': 'Hossam Hassan',
  'england': 'Thomas Tuchel',
  'france': 'Didier Deschamps',
  'germany': 'Julian Nagelsmann',
  'ghana': 'Otto Addo',
  'haiti': 'Sébastien Migné',
  'iran': 'Amir Ghalenoei',
  'iraq': 'Jesús Casas',
  'cote d\'ivoire': 'Emerse Faé',
  'japan': 'Hajime Moriyasu',
  'jordan': 'Jamal Sellami',
  'mexico': 'Javier Aguirre',
  'morocco': 'Walid Regragui',
  'netherlands': 'Ronald Koeman',
  'new zealand': 'Darren Bazeley',
  'norway': 'Ståle Solbakken',
  'panama': 'Thomas Christiansen',
  'paraguay': 'Gustavo Alfaro',
  'portugal': 'Roberto Martínez',
  'qatar': 'Tintín Márquez',
  'saudi arabia': 'Hervé Renard',
  'scotland': 'Steve Clarke',
  'senegal': 'Pape Thiaw',
  'south africa': 'Hugo Broos',
  'south korea': 'Hong Myung-bo',
  'spain': 'Luis de la Fuente',
  'sweden': 'Jon Dahl Tomasson',
  'switzerland': 'Murat Yakin',
  'tunisia': 'Sabri Lamouchi',
  'türkiye': 'Vincenzo Montella',
  'united states': 'Mauricio Pochettino',
  'uruguay': 'Marcelo Bielsa',
  'uzbekistan': 'Srečko Katanec'
};

// ── Firebase Configuration (Scraper Push) ──────────────────────────────────
// Uzupełnij poniższe dane po założeniu projektu Firebase Realtime Database
const FIREBASE_DB_URL = "https://mundial2026-8b652-default-rtdb.europe-west1.firebasedatabase.app"; // np. "https://twoja-baza.europe-west1.firebasedatabase.app"
const FIREBASE_DB_SECRET = ""; // Opcjonalnie, jeśli baza wymaga uwierzytelnienia (Database Secret lub Token)

// Tournament window
const TOURNAMENT_START = new Date('2026-06-11');

// ── helpers ─────────────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Mundial Dashboard Agent)' } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function pushToFirebase(data) {
  if (!FIREBASE_DB_URL) {
    console.log('ℹ️ Firebase: URL bazy danych nie jest skonfigurowany. Pomijam wypychanie chmurowe.');
    return Promise.resolve();
  }

  // Parse database URL
  let cleanUrl = FIREBASE_DB_URL.trim();
  if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
  
  const targetUrl = `${cleanUrl}/worldcup.json` + (FIREBASE_DB_SECRET ? `?auth=${FIREBASE_DB_SECRET}` : '');
  console.log(`📡 Firebase: Wypychanie danych na adres: ${cleanUrl}/worldcup.json ...`);

  const urlObj = new URL(targetUrl);
  const payload = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('🔥 Firebase: Dane zostały pomyślnie zsynchronizowane w czasie rzeczywistym!');
          resolve();
        } else {
          reject(new Error(`Firebase REST API zwróciło status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
}

function dateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function normalizeTeamName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  n = n.replace(/á/g, 'a')
       .replace(/ç/g, 'c')
       .replace(/í/g, 'i')
       .replace(/ó/g, 'o')
       .replace(/ú/g, 'u')
       .replace(/ć/g, 'c')
       .replace(/š/g, 's')
       .replace(/đ/g, 'd')
       .replace(/ž/g, 'z')
       .replace(/ü/g, 'u')
       .replace(/ö/g, 'o')
       .replace(/ä/g, 'a')
       .replace(/ô/g, 'o');

  if (n.includes('ivory coast') || n.includes('cote d') || n.includes('cote d\'ivoire') || n.includes('cote divoire')) {
    return 'cote d\'ivoire';
  }
  if (n.includes('congo dr') || n.includes('dr congo') || n.includes('democratic republic of congo')) {
    return 'dr congo';
  }
  if (n.includes('cape verde') || n.includes('cabo verde')) {
    return 'cabo verde';
  }
  if (n.includes('curacao') || n.includes('curaçao')) {
    return 'curacao';
  }
  if (n.includes('bosnia') || n.includes('herzegovina')) {
    return 'bosnia and herzegovina';
  }
  if (n.includes('south korea') || n.includes('korea republic') || n.includes('korea rep') || n.includes('korea rd')) {
    return 'south korea';
  }
  if (n.includes('czechia') || n.includes('czech republic')) {
    return 'czechia';
  }
  if (n.includes('turkey') || n.includes('turkiye') || n.includes('türkiye')) {
    return 'türkiye';
  }
  // Remove Firebase-forbidden characters
  return n.replace(/[\/\.\$#\[\]]/g, '-');
}

// ── parse match from scoreboard ─────────────────────────────────────────────
function parseScoreboardEvent(ev) {
  const comp = ev.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors?.find(c => c.homeAway === 'home');
  const away = comp.competitors?.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  return {
    id: ev.id,
    date: ev.date,
    name: ev.name,
    shortName: ev.shortName,
    status: {
      state: comp.status?.type?.state,       // pre | in | post
      detail: comp.status?.type?.detail,
      shortDetail: comp.status?.type?.shortDetail,
      clock: comp.status?.displayClock,
      period: comp.status?.period,
      completed: comp.status?.type?.completed || false,
    },
    venue: comp.venue ? {
      name: comp.venue.fullName,
      city: comp.venue.address?.city,
      country: comp.venue.address?.country,
    } : null,
    attendance: comp.attendance || null,
    home: {
      id: home.team?.id,
      name: home.team?.displayName,
      abbr: home.team?.abbreviation,
      logo: home.team?.logo,
      score: home.score ?? null,
      winner: home.winner || false,
      record: home.records?.[0]?.summary || null,
      form: home.form || null,
    },
    away: {
      id: away.team?.id,
      name: away.team?.displayName,
      abbr: away.team?.abbreviation,
      logo: away.team?.logo,
      score: away.score ?? null,
      winner: away.winner || false,
      record: away.records?.[0]?.summary || null,
      form: away.form || null,
    },
    group: comp.notes?.[0]?.headline || null,
  };
}

// ── parse match summary (detailed) ─────────────────────────────────────────
function parseSummary(data) {
  const result = {};

  // team statistics
  if (data.boxscore?.teams) {
    result.teamStats = data.boxscore.teams.map(t => ({
      id: t.team?.id,
      name: t.team?.displayName,
      abbr: t.team?.abbreviation,
      logo: t.team?.logo,
      homeAway: t.homeAway,
      stats: (t.statistics || []).reduce((acc, s) => {
        acc[s.name] = { value: s.displayValue, label: s.label };
        return acc;
      }, {}),
    }));
  }

  // rosters / lineups
  if (data.rosters) {
    result.lineups = data.rosters.map(roster => ({
      teamId: roster.team?.id,
      teamName: roster.team?.displayName,
      abbr: roster.team?.abbreviation,
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
        stats: (p.stats || []).map(st => ({
          name: st.name,
          value: st.displayValue,
          label: st.abbreviation,
        })),
      })),
    }));
  }

  // key events (goals, cards, subs)
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
      shootout: e.shootout || false,
      penaltyKick: e.penaltyKick || false,
      ownGoal: e.ownGoal || false,
    }));
  }

  // commentary / incidents
  if (data.commentary) {
    result.commentary = data.commentary.slice(0, 50).map(c => ({
      time: c.time?.displayValue || null,
      text: c.text || null,
      type: c.type || null,
    }));
  }

  // game info
  if (data.gameInfo) {
    result.gameInfo = {
      attendance: data.gameInfo.attendance || null,
      venue: data.gameInfo.venue ? {
        name: data.gameInfo.venue.fullName,
        city: data.gameInfo.venue.address?.city,
        country: data.gameInfo.venue.address?.country,
      } : null,
      officials: (data.gameInfo.officials || []).map(o => ({
        name: o.displayName,
        position: o.position?.displayName || null,
      })),
    };
  }

  // leaders
  if (data.leaders) {
    result.leaders = data.leaders.map(teamLeaders => ({
      teamId: teamLeaders.team?.id,
      teamName: teamLeaders.team?.displayName,
      categories: (teamLeaders.leaders || []).map(cat => ({
        name: cat.name,
        displayName: cat.displayName,
        leader: cat.leaders?.[0] ? {
          name: cat.leaders[0].athlete?.displayName,
          shortName: cat.leaders[0].athlete?.shortName,
          jersey: cat.leaders[0].athlete?.jersey,
          position: cat.leaders[0].athlete?.position?.displayName,
          value: cat.leaders[0].displayValue,
          summary: cat.leaders[0].summary,
          stats: (cat.leaders[0].statistics || []).map(s => ({
            name: s.name,
            value: s.displayValue,
            label: s.abbreviation,
          })),
        } : null,
      })),
    }));
  }

  return result;
}

// ── parse standings ─────────────────────────────────────────────────────────
function parseStandings(data) {
  const groups = [];
  const children = data.children || [];
  for (const child of children) {
    const group = {
      name: child.name || child.abbreviation || 'Group',
      standings: [],
    };
    const entries = child.standings?.entries || [];
    for (const entry of entries) {
      const stats = (entry.stats || []).reduce((acc, s) => {
        acc[s.name || s.abbreviation] = s.displayValue ?? s.value;
        return acc;
      }, {});
      group.standings.push({
        team: {
          id: entry.team?.id,
          name: entry.team?.displayName || entry.team?.name,
          abbr: entry.team?.abbreviation,
          logo: entry.team?.logos?.[0]?.href || null,
        },
        stats,
      });
    }
    groups.push(group);
  }
  return groups;
}

// Decide whether to run a full scrape — driven by our OWN fixture list.
// We already know every kickoff time, so we can work only around matches and rest
// otherwise, with no dependency on ESPN's date bucketing (which is US-Eastern, not UTC —
// a 01:00 UTC match lands in the *previous* ET day, which broke the old "today" check).
async function shouldRunScrape() {
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  if (force) {
    console.log('⚡ Flaga --force — pełny scrape.');
    return true;
  }

  if (!fs.existsSync(OUT_FILE)) {
    console.log('⚡ Brak matches.json — pierwszy scrape.');
    return true;
  }

  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
  } catch (e) {
    console.warn('⚠️  Nie udało się sparsować matches.json — pełny scrape.');
    return true;
  }

  const matches = existing.matches || [];
  if (matches.length === 0) {
    console.log('⚡ Brak meczów w danych — pełny scrape.');
    return true;
  }

  const now = Date.now();
  const PRE_MS     = 10 * 60 * 1000;      // zacznij chwilę przed gwizdkiem
  const LIVE_MS    = 165 * 60 * 1000;     // 90' + przerwa + doliczony + ew. dogrywka + bufor
  const CATCHUP_MS = 18 * 60 * 60 * 1000; // dogoń wynik meczu, którego nie zdążyliśmy zapisać

  for (const m of matches) {
    const k = new Date(m.date).getTime();
    if (isNaN(k)) continue;
    const since = now - k;

    // Mecz w oknie: za chwilę start / trwa / dopiero co się skończył
    if (since >= -PRE_MS && since <= LIVE_MS) {
      console.log(`🔥 ${m.shortName || m.name} w oknie meczowym — scraping.`);
      return true;
    }
    // Mecz powinien być już zakończony, a nie mamy jego wyniku — dogoń (do 18h po gwizdku)
    if (!m.status?.completed && since > LIVE_MS && since <= CATCHUP_MS) {
      console.log(`🏁 ${m.shortName || m.name} zakończony, brak wyniku w danych — scraping.`);
      return true;
    }
  }

  // Fallback dzienny: odśwież terminarz/tabele, jeśli dane są starsze niż 12h
  const lastUpdated = existing.meta?.lastUpdated ? new Date(existing.meta.lastUpdated).getTime() : 0;
  if (now - lastUpdated >= 12 * 60 * 60 * 1000) {
    console.log('⚡ Dane starsze niż 12h — odświeżam (terminarz/tabele).');
    return true;
  }

  console.log('💤 Brak meczów w oknie i wszystkie wyniki zapisane — śpię.');
  return false;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏟️  Mundial 2026 Scraper — start');
  console.log('─'.repeat(50));

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const shouldRun = await shouldRunScrape();
  if (!shouldRun) {
    console.log('✨ Done! (Skipped)');
    return;
  }

  // 1. Determine date range (scan the entire tournament from June 11 to July 20, 2026)
  const endDate = new Date('2026-07-20');

  const dates = [];
  const d = new Date(TOURNAMENT_START);
  while (d <= endDate) {
    dates.push(dateStr(d));
    d.setDate(d.getDate() + 1);
  }
  console.log(`📅 Scanning ${dates.length} days: ${dates[0]} → ${dates[dates.length - 1]}`);

  // 2. Fetch scoreboard for each day
  const allMatches = [];
  const matchIds = new Set();

  for (const dt of dates) {
    try {
      const url = `${BASE}/scoreboard?dates=${dt}`;
      const data = await fetchJSON(url);
      const events = data.events || [];

      for (const ev of events) {
        const match = parseScoreboardEvent(ev);
        if (match && !matchIds.has(match.id)) {
          matchIds.add(match.id);
          allMatches.push(match);
        }
      }

      if (events.length > 0) {
        console.log(`  ${dt}: ${events.length} match(es)`);
      }

      await sleep(200); // rate limit
    } catch (err) {
      console.error(`  ⚠️  Error fetching ${dt}: ${err.message}`);
    }
  }

  console.log(`\n⚽ Found ${allMatches.length} match(es) total`);

  // 3. Fetch detailed summary for completed/in-progress matches
  console.log('\n📊 Fetching match details...');
  for (const match of allMatches) {
    if (match.status.state === 'pre' && !match.status.completed) {
      continue; // skip upcoming — no data yet
    }
    try {
      const url = `${BASE}/summary?event=${match.id}`;
      const data = await fetchJSON(url);
      const summary = parseSummary(data);
      Object.assign(match, { details: summary });
      console.log(`  ✅ ${match.shortName} — details fetched`);
      await sleep(300);
    } catch (err) {
      console.error(`  ⚠️  Error fetching details for ${match.shortName}: ${err.message}`);
    }
  }

  // 4. Fetch standings
  console.log('\n🏆 Fetching group standings...');
  let groups = [];
  try {
    const url = `${BASE}/standings`;
    const data = await fetchJSON(url);
    groups = parseStandings(data);
    console.log(`  ✅ ${groups.length} groups loaded`);
  } catch (err) {
    console.error(`  ⚠️  Error fetching standings: ${err.message}`);
  }

  // 4b. Load or fetch rosters for all 48 teams
  let rosters = {};
  let existingRosters = {};
  if (fs.existsSync(OUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
      if (existing.rosters) {
        existingRosters = existing.rosters;
      }
    } catch (e) {
      // ignore parsing errors
    }
  }

  const force = process.argv.includes('--force') || process.argv.includes('-f');
  
  // Compile unique teams from match data
  const teamsMap = {};
  allMatches.forEach(m => {
    if (m.home && m.home.id) {
      teamsMap[m.home.name] = { id: m.home.id, logo: m.home.logo, abbr: m.home.abbr };
    }
    if (m.away && m.away.id) {
      teamsMap[m.away.name] = { id: m.away.id, logo: m.away.logo, abbr: m.away.abbr };
    }
  });

  console.log('\n👥 Loading rosters for 48 teams...');
  for (const [teamName, teamInfo] of Object.entries(teamsMap)) {
    const norm = normalizeTeamName(teamName);
    if (!force && existingRosters[norm] && existingRosters[norm].players?.length > 0) {
      rosters[norm] = existingRosters[norm];
      if (COACH_OVERRIDES[norm]) {
        rosters[norm].coach = COACH_OVERRIDES[norm];
      }
      continue; // Use cached roster
    }

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${teamInfo.id}/roster`;
      const data = await fetchJSON(url);
      const athletes = (data.athletes || []).map(p => ({
        id: p.id,
        name: p.displayName || p.fullName,
        shortName: p.shortName || p.displayName,
        jersey: p.jersey,
        position: p.position?.displayName || null,
      }));
      
      let coachName = COACH_OVERRIDES[norm] || null;
      if (!coachName) {
        const firstCoach = data.coach?.[0];
        coachName = firstCoach 
          ? (firstCoach.displayName || [firstCoach.firstName, firstCoach.lastName].filter(Boolean).join(' '))
          : (data.coach?.displayName || null);
      }
      
      rosters[norm] = {
        teamId: teamInfo.id,
        teamName: teamName,
        abbr: teamInfo.abbr,
        players: athletes,
        coach: coachName
      };
      console.log(`  ✅ Fetched roster for ${teamName} (${athletes.length} players)`);
      await sleep(250); // Rate limiting
    } catch (err) {
      console.error(`  ⚠️  Error fetching roster for ${teamName}: ${err.message}`);
      if (existingRosters[norm]) {
        rosters[norm] = existingRosters[norm];
        if (COACH_OVERRIDES[norm]) {
          rosters[norm].coach = COACH_OVERRIDES[norm];
        }
      }
    }
  }

  // 5. Compute aggregate stats
  const completedMatches = allMatches.filter(m => m.status.completed);
  const totalGoals = completedMatches.reduce((sum, m) => {
    return sum + (parseInt(m.home.score) || 0) + (parseInt(m.away.score) || 0);
  }, 0);

  const scorers = {};   // id -> { ...info, goals, goalDetails }
  const assisters = {}; // id -> { ...info, assists, assistDetails }

  for (const match of completedMatches) {
    const events = match.details?.keyEvents || [];
    for (const ev of events) {
      const isGoal = ev.type === 'Goal' || (ev.type && ev.type.startsWith('Goal')) || (ev.text && /^Goal!/.test(ev.text));
      if (!isGoal) continue;
      if (ev.ownGoal) continue; // samobóje nie liczą się do klasyfikacji

      // athletes[0] = strzelec, athletes[1] = asystent
      const scorer = ev.athletes?.[0];
      const assister = ev.athletes?.[1];

      if (scorer && scorer.name) {
        if (!scorers[scorer.id]) {
          scorers[scorer.id] = {
            id: scorer.id,
            name: scorer.name,
            shortName: scorer.shortName,
            teamId: ev.teamId,
            teamName: ev.teamName,
            goals: 0,
            goalDetails: [],
          };
        }
        scorers[scorer.id].goals++;
        scorers[scorer.id].goalDetails.push({ matchId: match.id, clock: ev.clock, vs: match.home.id === ev.teamId ? match.away.abbr : match.home.abbr });
      }

      if (assister && assister.name) {
        if (!assisters[assister.id]) {
          assisters[assister.id] = {
            id: assister.id,
            name: assister.name,
            shortName: assister.shortName,
            teamId: ev.teamId,
            teamName: ev.teamName,
            assists: 0,
            assistDetails: [],
          };
        }
        assisters[assister.id].assists++;
        assisters[assister.id].assistDetails.push({ matchId: match.id, clock: ev.clock, vs: match.home.id === ev.teamId ? match.away.abbr : match.home.abbr });
      }
    }
  }

  // Build sorted lists
  const topScorers = Object.values(scorers)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 50);

  const topAssisters = Object.values(assisters)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 50);

  // Canadian: goals + assists combined
  const canadianMap = {};
  for (const s of Object.values(scorers)) {
    canadianMap[s.id] = {
      id: s.id, name: s.name, shortName: s.shortName,
      teamId: s.teamId, teamName: s.teamName,
      goals: s.goals, assists: 0, total: s.goals,
      goalDetails: s.goalDetails, assistDetails: [],
    };
  }
  for (const a of Object.values(assisters)) {
    if (canadianMap[a.id]) {
      canadianMap[a.id].assists = a.assists;
      canadianMap[a.id].total = canadianMap[a.id].goals + a.assists;
      canadianMap[a.id].assistDetails = a.assistDetails;
    } else {
      canadianMap[a.id] = {
        id: a.id, name: a.name, shortName: a.shortName,
        teamId: a.teamId, teamName: a.teamName,
        goals: 0, assists: a.assists, total: a.assists,
        goalDetails: [], assistDetails: a.assistDetails,
      };
    }
  }
  const topCanadian = Object.values(canadianMap)
    .sort((a, b) => b.total - a.total || b.goals - a.goals)
    .slice(0, 50);

  // 6. Build output
  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      tournament: 'FIFA World Cup 2026',
      source: 'ESPN Public API',
      matchCount: allMatches.length,
      completedCount: completedMatches.length,
    },
    stats: {
      totalGoals,
      matchesPlayed: completedMatches.length,
      avgGoalsPerMatch: completedMatches.length > 0
        ? (totalGoals / completedMatches.length).toFixed(2)
        : '0.00',
    },
    topScorers,
    topAssisters,
    topCanadian,
    groups,
    rosters,
    matches: allMatches.sort((a, b) => new Date(a.date) - new Date(b.date)),
  };

  // 7. Write local cache
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 Saved to ${OUT_FILE}`);
  console.log(`   Matches: ${output.meta.matchCount} | Completed: ${output.meta.completedCount} | Goals: ${totalGoals}`);

  // 8. Push to Firebase in real-time
  try {
    await pushToFirebase(output);
  } catch (err) {
    console.error('⚠️  Błąd synchronizacji z Firebase Realtime Database:', err.message);
  }

  console.log('─'.repeat(50));
  console.log('✨ Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
