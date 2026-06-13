/**
 * Mundial 2026 Dashboard — App Logic
 * Renders match data from data/matches.json into the dashboard UI.
 */

// ── State ──────────────────────────────────────────────────────────────────
let DATA = null;
let activeSection = 'matches';
let matchFilter = 'all';
let activeScorerTab = 'goals';
let activeRecordFilter = 'all';

// ── Metadata Lookups (Distance from style.txt & History stats) ──────────────
const TEAM_TRAVEL_DATA = {
  'Bosnia and Herzegovina': { base: 'RSL Stadium, Sandy UT', chain: 5058, camp: 9511 },
  'Algeria': { base: 'Rock Chalk Park, Lawrence KS', chain: 4798, camp: 4935 },
  'Czechia': { base: 'Mansfield TX', chain: 4544, camp: 8285 },
  'South Africa': { base: 'CF Pachuca, Universidad del Futbol MX', chain: 3943, camp: 5627 },
  'DR Congo': { base: 'Houston Sports Park TX', chain: 3660, camp: 4875 },
  'Ecuador': { base: 'Columbus Crew OH', chain: 3405, camp: 4839 },
  'Canada': { base: "Nat'l Soccer Dev. Centre, Vancouver", chain: 3357, camp: 6728 },
  'Belgium': { base: 'Sounders Center, Renton WA', chain: 3302, camp: 3532 },
  'United States': { base: 'Great Park, Irvine CA', chain: 3106, camp: 3445 },
  'Austria': { base: 'UC Santa Barbara, Goleta CA', chain: 3054, camp: 9610 },
  'Colombia': { base: 'Academia Atlas, Guadalajara MX', chain: 2915, camp: 5822 },
  'England': { base: 'Swope Soccer Village, Kansas City MO', chain: 2768, camp: 8958 },
  'Curacao': { base: 'Florida Atlantic, Boca Raton FL', chain: 2702, camp: 10121 },
  'Germany': { base: 'Wake Forest, Winston-Salem NC', chain: 2640, camp: 6337 },
  'Cabo Verde': { base: 'Waters Sportsplex, Tampa FL', chain: 2502, camp: 4504 },
  'Croatia': { base: 'Episcopal HS, Alexandria VA', chain: 2500, camp: 5395 },
  'Uruguay': { base: 'Mayakoba, Playa del Carmen MX', chain: 2439, camp: 7047 },
  'Spain': { base: 'Baylor School, Chattanooga TN', chain: 2373, camp: 5425 },
  'Uzbekistan': { base: 'Atlanta United Center, Marietta GA', chain: 2349, camp: 6666 },
  'Jordan': { base: 'Univ. of Portland OR', chain: 2315, camp: 8866 },
  'Switzerland': { base: 'SDJA, San Diego CA', chain: 2253, camp: 5382 },
  'Saudi Arabia': { base: 'Austin FC Stadium TX', chain: 2090, camp: 6649 },
  'Scotland': { base: 'Charlotte FC NC', chain: 1973, camp: 6582 },
  'Türkiye': { base: 'Arizona Athletic Grounds, Mesa AZ', chain: 1828, camp: 7239 },
  'Brazil': { base: 'Columbia Park, Morristown NJ', chain: 1758, camp: 3766 },
  'Morocco': { base: 'Pingry School, Basking Ridge NJ', chain: 1750, camp: 3042 },
  'New Zealand': { base: 'Univ. of San Diego CA', chain: 1749, camp: 7938 },
  'Japan': { base: 'Nashville SC TN', chain: 1688, camp: 7567 },
  'Tunisia': { base: 'Rayados Center, Monterrey MX', chain: 1582, camp: 3166 },
  'Iran': { base: 'Centro Xolo, Tijuana MX', chain: 1553, camp: 4264 },
  'Portugal': { base: 'Palm Beach Gardens FL', chain: 1547, camp: 6309 },
  'Qatar': { base: 'Westmont College, Santa Barbara CA', chain: 1519, camp: 7081 },
  'Haiti': { base: 'Stockton Univ., Galloway NJ', chain: 1476, camp: 3111 },
  'Netherlands': { base: 'KC Current Facility, Kansas City', chain: 1421, camp: 3595 },
  'Australia': { base: 'Oakland Roots, Alameda CA', chain: 1329, camp: 4843 },
  'Ghana': { base: 'Bryant Univ., Smithfield RI', chain: 1094, camp: 2156 },
  'Côte d\'Ivoire': { base: 'Subaru Park, Chester PA', chain: 1089, camp: 1156 },
  'Sweden': { base: 'FC Dallas, Frisco TX', chain: 1029, camp: 2709 },
  'Iraq': { base: 'Greenbrier, WV', chain: 953, camp: 4128 },
  'Mexico': { base: 'CAR, Mexico City', chain: 952, camp: 952 },
  'Argentina': { base: 'Sporting KC Center, Kansas City KS', chain: 739, camp: 2962 },
  'South Korea': { base: 'Chivas Verde Valle, Zapopan MX', chain: 645, camp: 1307 },
  'Norway': { base: 'UNC Greensboro NC', chain: 548, camp: 5434 },
  'France': { base: 'Bentley Univ., Waltham MA', chain: 545, camp: 1516 },
  'Senegal': { base: 'Rutgers, Piscataway NJ', chain: 540, camp: 1255 },
  'Panama': { base: 'Nottawasaga, New Tecumseth ON', chain: 540, camp: 1447 },
  'Paraguay': { base: 'SJSU Spartan Complex, San Jose CA', chain: 505, camp: 1031 },
  'Egypt': { base: 'Gonzaga Univ., Spokane WA', chain: 391, camp: 2388 }
};

const TEAM_METADATA = {
  'Argentina': { ranking: 1, appearances: 18, bestResult: 'Mistrzostwo (1978, 1986, 2022)' },
  'France': { ranking: 2, appearances: 16, bestResult: 'Mistrzostwo (1998, 2018)' },
  'Belgium': { ranking: 3, appearances: 14, bestResult: '3. miejsce (2018)' },
  'England': { ranking: 4, appearances: 16, bestResult: 'Mistrzostwo (1966)' },
  'Brazil': { ranking: 5, appearances: 22, bestResult: 'Mistrzostwo (1958, 1962, 1970, 1994, 2002)' },
  'Portugal': { ranking: 6, appearances: 8, bestResult: '3. miejsce (1966)' },
  'Netherlands': { ranking: 7, appearances: 11, bestResult: 'Wicemistrzostwo (1974, 1978, 2010)' },
  'Spain': { ranking: 8, appearances: 16, bestResult: 'Mistrzostwo (2010)' },
  'Germany': { ranking: 11, appearances: 20, bestResult: 'Mistrzostwo (1954, 1974, 1990, 2014)' },
  'Croatia': { ranking: 12, appearances: 6, bestResult: 'Wicemistrzostwo (2018)' },
  'Morocco': { ranking: 13, appearances: 6, bestResult: '4. miejsce (2022)' },
  'Uruguay': { ranking: 15, appearances: 14, bestResult: 'Mistrzostwo (1930, 1950)' },
  'United States': { ranking: 16, appearances: 11, bestResult: '3. miejsce (1930)' },
  'Colombia': { ranking: 17, appearances: 6, bestResult: 'Ćwierćfinał (2014)' },
  'Senegal': { ranking: 20, appearances: 3, bestResult: 'Ćwierćfinał (2002)' },
  'Switzerland': { ranking: 19, appearances: 12, bestResult: 'Ćwierćfinał (1934, 1938, 1954)' },
  'Japan': { ranking: 18, appearances: 7, bestResult: '1/8 finału (2002, 2010, 2018, 2022)' },
  'Iran': { ranking: 21, appearances: 6, bestResult: 'Faza grupowa' },
  'South Korea': { ranking: 22, appearances: 11, bestResult: '4. miejsce (2002)' },
  'Sweden': { ranking: 23, appearances: 12, bestResult: 'Wicemistrzostwo (1958)' },
  'Austria': { ranking: 25, appearances: 7, bestResult: '3. miejsce (1954)' },
  'Australia': { ranking: 26, appearances: 6, bestResult: '1/8 finału (2006, 2022)' },
  'Ecuador': { ranking: 31, appearances: 4, bestResult: '1/8 finału (2006)' },
  'Egypt': { ranking: 36, appearances: 3, bestResult: 'Faza grupowa' },
  'Algeria': { ranking: 43, appearances: 4, bestResult: '1/8 finału (2014)' },
  'Türkiye': { ranking: 40, appearances: 2, bestResult: '3. miejsce (2002)' },
  'Czechia': { ranking: 35, appearances: 9, bestResult: 'Wicemistrzostwo (1934, 1962 jako Czechosłowacja)' },
  'Tunisia': { ranking: 41, appearances: 6, bestResult: 'Faza grupowa' },
  'Panama': { ranking: 44, appearances: 1, bestResult: 'Faza grupowa' },
  'Canada': { ranking: 49, appearances: 2, bestResult: 'Faza grupowa' },
  'Saudi Arabia': { ranking: 53, appearances: 6, bestResult: '1/8 finału (1994)' },
  'Iraq': { ranking: 58, appearances: 1, bestResult: 'Faza grupowa' },
  'South Africa': { ranking: 59, appearances: 3, bestResult: 'Faza grupowa' },
  'Cabo Verde': { ranking: 65, appearances: 0, bestResult: 'Debiut na MŚ' },
  'Qatar': { ranking: 38, appearances: 1, bestResult: 'Faza grupowa' },
  'Haiti': { ranking: 85, appearances: 1, bestResult: 'Faza grupowa' },
  'Jordan': { ranking: 71, appearances: 0, bestResult: 'Debiut na MŚ' },
  'DR Congo': { ranking: 61, appearances: 1, bestResult: 'Faza grupowa (1974 jako Zair)' },
  'Curacao': { ranking: 90, appearances: 0, bestResult: 'Debiut na MŚ' },
  'Uzbekistan': { ranking: 66, appearances: 0, bestResult: 'Debiut na MŚ' },
  'Bosnia and Herzegovina': { ranking: 74, appearances: 1, bestResult: 'Faza grupowa (2014)' },
  'New Zealand': { ranking: 104, appearances: 2, bestResult: 'Faza grupowa' },
  'Ghana': { ranking: 64, appearances: 4, bestResult: 'Ćwierćfinał (2010)' },
  'Paraguay': { ranking: 56, appearances: 8, bestResult: 'Ćwierćfinał (2010)' },
  'Norway': { ranking: 47, appearances: 3, bestResult: '1/8 finału (1998)' },
  'Mexico': { ranking: 15, appearances: 17, bestResult: 'Ćwierćfinał (1970, 1986)' },
  'Côte d\'Ivoire': { ranking: 38, appearances: 3, bestResult: 'Faza grupowa' },
  'Scotland': { ranking: 39, appearances: 8, bestResult: 'Faza grupowa' },
};

// ── Firebase Configuration ──────────────────────────────────────────────────
// Uzupełnij poniższe dane po założeniu darmowego projektu Firebase Realtime Database
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB7DF-Fqtiu_H6d8Ji2GR9_SN4ye19NmRc",
  authDomain: "mundial2026-8b652.firebaseapp.com",
  databaseURL: "https://mundial2026-8b652-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mundial2026-8b652",
  storageBucket: "mundial2026-8b652.firebasestorage.app",
  messagingSenderId: "183516672823",
  appId: "1:183516672823:web:b4d86231d2cabe4adba0b2"
};

let useFirebase = false;
let db = null;

if (FIREBASE_CONFIG.databaseURL && typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    useFirebase = true;
    console.log('🔥 Firebase Realtime Database: zaimplementowany pomyślnie!');
  } catch (err) {
    console.error('Błąd inicjalizacji Firebase:', err);
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (useFirebase && db) {
    // Słuchaj zmian w czasie rzeczywistym z Firebase
    db.ref('worldcup').on('value', snapshot => {
      const val = snapshot.val();
      if (val) {
        console.log('🔥 Firebase Realtime Update: otrzymano nowe dane!');
        const isFirstLoad = (DATA === null);
        DATA = val;
        applyLiveOverride(); // keep fresh ESPN data for the open match — don't let stale scraper data win
        if (isFirstLoad) {
          init();
          // Hide loading
          setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
          }, 400);
        } else {
          // Re-render components dynamically when data updates in real-time
          renderHeroStats();
          renderMatches();
          renderScorers();
          renderGroups();
          renderTournamentStats();
          renderRecords();
          updateLastUpdated();
          
          // Refresh open modals if any
          const matchOverlay = document.getElementById('modalOverlay');
          if (matchOverlay && matchOverlay.classList.contains('active') && matchOverlay.dataset.activeMatchId) {
            openMatchModal(matchOverlay.dataset.activeMatchId);
          }
          const teamOverlay = document.getElementById('teamModalOverlay');
          if (teamOverlay && teamOverlay.classList.contains('active') && teamOverlay.dataset.activeTeamName) {
            openTeamModal(teamOverlay.dataset.activeTeamName);
          }
        }
      } else {
        console.warn('Firebase: baza danych jest pusta, pobieram plik lokalny...');
        loadLocalData();
      }
    }, err => {
      console.error('Firebase read error:', err);
      loadLocalData();
    });
  } else {
    loadLocalData();
  }
});

async function loadLocalData() {
  try {
    const res = await fetch('data/matches.json');
    DATA = await res.json();
    init();
    startRealTimeUpdates();
  } catch (err) {
    console.error('Nie udało się załadować danych lokalnych:', err);
    document.getElementById('loadingScreen').innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__text">Nie udało się załadować danych. Uruchom <code>node scraper.js</code></div>
      </div>
    `;
  }
}

function init() {
  renderHeroStats();
  renderMatches();
  renderScorers();
  renderGroups();
  renderTournamentStats();
  renderRecords();
  setupNav();
  setupMatchFilter();
  setupScorerFilter();
  setupRecordFilter();
  setupTeamModal();
  setupModal();
  setupDrillModal();
  updateLastUpdated();
  startLiveClockTicker();
  startLiveScoreRefresh(); // pull live scores from ESPN directly, independent of the scraper

  // Hide loading
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hidden');
  }, 400);
}

// Recompute aggregate stats from the live match list (same method as the scraper) so the
// counters track refreshLiveScores/modal updates instead of waiting for the next scraper push.
function recomputeStats() {
  if (!DATA?.matches) return;
  if (!DATA.stats) DATA.stats = {};
  const completed = DATA.matches.filter(m => m.status.completed);
  const totalGoals = completed.reduce((sum, m) =>
    sum + (parseInt(m.home.score) || 0) + (parseInt(m.away.score) || 0), 0);
  DATA.stats.matchesPlayed = completed.length;
  DATA.stats.totalGoals = totalGoals;
  DATA.stats.avgGoalsPerMatch = completed.length ? (totalGoals / completed.length).toFixed(2) : 0;
}

// ── Hero Stats ─────────────────────────────────────────────────────────────
function renderHeroStats() {
  recomputeStats();
  const el = document.getElementById('heroStats');
  const completed = DATA.matches.filter(m => m.status.completed);
  const live = DATA.matches.filter(m => m.status.state === 'in');
  const upcoming = DATA.matches.filter(m => m.status.state === 'pre');

  // Count total cards
  let totalYellow = 0, totalRed = 0;
  completed.forEach(m => {
    if (m.details?.teamStats) {
      m.details.teamStats.forEach(t => {
        totalYellow += parseInt(t.stats.yellowCards?.value || 0);
        totalRed += parseInt(t.stats.redCards?.value || 0);
      });
    }
  });

  const cards = [
    { value: DATA.stats.matchesPlayed, label: 'Mecze rozegrane' },
    { value: DATA.stats.totalGoals, label: 'Gole strzelone' },
    { value: DATA.stats.avgGoalsPerMatch, label: 'Średnia goli / mecz' },
    { value: upcoming.length, label: 'Nadchodzące mecze' },
    { value: totalYellow, label: 'Żółte kartki' },
    { value: totalRed, label: 'Czerwone kartki' },
  ];

  el.innerHTML = cards.map(c => `
    <div class="stat-card animate-in">
      <div class="stat-card__value">${c.value}</div>
      <div class="stat-card__label">${c.label}</div>
    </div>
  `).join('');
}

// ── Matches ────────────────────────────────────────────────────────────────
function renderMatches() {
  const el = document.getElementById('matchesGrid');
  let matches = DATA.matches;

  if (matchFilter === 'completed') matches = matches.filter(m => m.status.completed);
  else if (matchFilter === 'live') matches = matches.filter(m => m.status.state === 'in');
  else if (matchFilter === 'upcoming') matches = matches.filter(m => m.status.state === 'pre');

  // Sort: live first, then by date desc for completed, asc for upcoming
  matches = [...matches].sort((a, b) => {
    const aLive = a.status.state === 'in' ? 0 : 1;
    const bLive = b.status.state === 'in' ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    if (a.status.completed && b.status.completed) return new Date(b.date) - new Date(a.date);
    return new Date(a.date) - new Date(b.date);
  });

  if (matches.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><div class="empty-state__text">Brak meczów w tej kategorii</div></div>`;
    return;
  }

  el.innerHTML = matches.map(m => renderMatchCard(m)).join('');
}

function getDisplayClock(match) {
  if (match.status.completed) return 'FT';
  if (match.status.state !== 'in') return formatTime(match.date);

  const detail = (match.status.shortDetail || match.status.detail || '').toLowerCase();
  if (detail === 'ht' || detail.includes('halftime') || detail.includes('half time') || match.status.clock === 'HT') {
    return 'Przerwa';
  }

  const clockStr = match.status.clock || '';
  if (!clockStr) return 'LIVE';

  const drift = liveModalLastFetch ? Math.floor((Date.now() - liveModalLastFetch.getTime()) / 60000) : 0;

  const stopMatch = clockStr.match(/^(\d+)'\+(\d+)'?$/);
  if (stopMatch) {
    const base = parseInt(stopMatch[1], 10);
    const extra = Math.min(parseInt(stopMatch[2], 10) + drift, 15);
    return `${base}'+${extra}'`;
  }

  const regMatch = clockStr.match(/^(\d+)'?/);
  if (regMatch) {
    const period = match.status.period || 1;
    const cap = period <= 1 ? 45 : period === 2 ? 90 : 120;
    return `${Math.min(parseInt(regMatch[1], 10) + drift, cap)}'`;
  }

  return clockStr;
}

function startLiveClockTicker() {
  setInterval(() => {
    if (!DATA?.matches) return;
    DATA.matches
      .filter(m => m.status.state === 'in')
      .forEach(m => {
        // Skip active modal match — liveBadgeTicker handles it every 1s
        if (m.id === liveModalPollingId && liveModalLastFetch) return;
        const badge = document.querySelector(`[data-match-id="${m.id}"] .match-card__status`);
        if (badge) badge.textContent = getDisplayClock(m);
      });
  }, 60000);
}

function renderMatchCard(m) {
  const date = formatDate(m.date);
  const clock = m.status.state === 'in' ? getDisplayClock(m) : null;
  const isHT = clock === 'Przerwa';
  const statusClass = m.status.completed ? 'ft' : (m.status.state === 'in' ? (isHT ? 'ht' : 'live') : 'upcoming');
  const statusText = m.status.completed ? 'FT' : (m.status.state === 'in' ? (isHT ? '☕ Przerwa' : clock) : formatTime(m.date));

  const homeWinner = m.home.winner ? 'winner' : '';
  const awayWinner = m.away.winner ? 'winner' : '';

  // Key events for completed matches
  let eventsHTML = '';
  if (m.details?.keyEvents?.length) {
    const goals = m.details.keyEvents.filter(e =>
      e.type === 'Goal' || (e.text && e.text.toLowerCase().includes('goal'))
    ).slice(0, 6);

    if (goals.length > 0) {
      eventsHTML = `<div class="match-card__events">
        ${goals.map(e => {
          const scorer = e.athletes?.[0] ? (e.athletes[0].shortName || e.athletes[0].name) : '';
          const assister = e.athletes?.[1] && !e.ownGoal ? (e.athletes[1].shortName || e.athletes[1].name) : '';
          const playerText = assister ? `${scorer} (as. ${assister})` : scorer;

          return `
            <div class="match-event">
              <span class="match-event__time">${e.clock || ''}</span>
              <span class="match-event__icon">⚽</span>
              <span class="match-event__text">${playerText}${e.ownGoal ? ' (s.s.)' : ''}${e.penaltyKick ? ' (k.)' : ''}</span>
            </div>
          `;
        }).join('')}
      </div>`;
    }
  }

  // Quick stats badges
  let quickStats = '';
  if (m.details?.teamStats) {
    const home = m.details.teamStats.find(t => t.homeAway === 'home');
    const away = m.details.teamStats.find(t => t.homeAway === 'away');
    if (home && away) {
      const hPoss = home.stats.possessionPct?.value;
      const aPoss = away.stats.possessionPct?.value;
      if (hPoss && aPoss) {
        quickStats = `<span>📊 Posiadanie: ${hPoss}% - ${aPoss}%</span>`;
      }
    }
  }

  return `
    <div class="match-card animate-in" data-match-id="${m.id}" onclick="openMatchModal('${m.id}')">
      <div class="match-card__header">
        <span class="match-card__date">${date}${m.group ? ' · ' + m.group : ''}</span>
        <span class="match-card__status match-card__status--${statusClass}">${statusText}</span>
      </div>
      <div class="match-card__teams">
        <div class="match-card__team match-card__team--clickable" onclick="event.stopPropagation(); openTeamModal('${m.home.name}')">
          <img class="match-card__team-logo" src="${m.home.logo}" alt="${m.home.name}" loading="lazy" />
          <span class="match-card__team-name ${homeWinner}">${m.home.name}</span>
        </div>
        <div class="match-card__score">
          ${m.home.score !== null ? `
            <span class="match-card__score-num">${m.home.score}</span>
            <span class="match-card__score-sep">:</span>
            <span class="match-card__score-num">${m.away.score}</span>
          ` : `
            <span class="match-card__score-sep">vs</span>
          `}
        </div>
        <div class="match-card__team match-card__team--away match-card__team--clickable" onclick="event.stopPropagation(); openTeamModal('${m.away.name}')">
          <img class="match-card__team-logo" src="${m.away.logo}" alt="${m.away.name}" loading="lazy" />
          <span class="match-card__team-name ${awayWinner}">${m.away.name}</span>
        </div>
      </div>
      ${eventsHTML}
      <div class="match-card__footer">
        <span class="match-card__venue">📍 ${m.venue ? `${m.venue.name}, ${m.venue.city}` : '—'}</span>
        ${m.attendance ? `<span class="match-card__attendance">👥 ${m.attendance.toLocaleString('pl')}</span>` : ''}
        ${quickStats}
      </div>
    </div>
  `;
}

// ── Scorers ────────────────────────────────────────────────────────────────
function renderScorers() {
  const el = document.getElementById('scorersList');
  const countEl = document.getElementById('scorersCount');

  let list = [];
  let emptyText = 'Brak danych';
  let countLabel = '';
  let icon = '⚽';

  if (activeScorerTab === 'goals') {
    list = DATA.topScorers || [];
    emptyText = 'Brak goli jeszcze w turnieju';
    countLabel = `${list.length} strzelców`;
    icon = '⚽';
  } else if (activeScorerTab === 'assists') {
    list = DATA.topAssisters || [];
    emptyText = 'Brak asyst jeszcze w turnieju';
    countLabel = `${list.length} asystentów`;
    icon = '🅰️';
  } else if (activeScorerTab === 'canadian') {
    list = DATA.topCanadian || [];
    emptyText = 'Brak punktów jeszcze w turnieju';
    countLabel = `${list.length} zawodników`;
    icon = '🍁';
  }

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">${icon}</div><div class="empty-state__text">${emptyText}</div></div>`;
    countEl.textContent = countLabel;
    return;
  }

  countEl.textContent = countLabel;

  el.innerHTML = list.map((s, i) => {
    let detailsHTML = '';
    let scoreHTML = '';

    if (activeScorerTab === 'goals') {
      const clocks = (s.goalDetails || []).map(g => g.clock).join(', ');
      detailsHTML = `<span class="scorer-details" title="${clocks}">${clocks}</span>`;
      scoreHTML = `<span class="scorer-goals">${s.goals}</span>`;
    } else if (activeScorerTab === 'assists') {
      const clocks = (s.assistDetails || []).map(a => a.clock).join(', ');
      detailsHTML = `<span class="scorer-details" title="${clocks}">${clocks}</span>`;
      scoreHTML = `<span class="scorer-goals" style="color: var(--blue);">${s.assists}</span>`;
    } else if (activeScorerTab === 'canadian') {
      detailsHTML = `<span class="scorer-details">${s.goals} ⚽ / ${s.assists} 🅰️</span>`;
      scoreHTML = `<span class="scorer-goals">${s.total}</span>`;
    }

    return `
      <div class="scorer-row animate-in">
        <span class="scorer-rank">${i + 1}</span>
        <div class="scorer-info">
          <span class="scorer-name">${s.name}</span>
          <span class="scorer-team scorer-team--clickable" onclick="openTeamModal('${s.teamName}')">${s.teamName}</span>
        </div>
        ${detailsHTML}
        ${scoreHTML}
      </div>
    `;
  }).join('');
}

// ── Groups ─────────────────────────────────────────────────────────────────
const GROUPS_STRUCTURE = {
  'Group A': ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  'Group B': ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  'Group C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  'Group D': ['United States', 'Paraguay', 'Australia', 'Türkiye'],
  'Group E': ['Germany', 'Curacao', 'Côte d\'Ivoire', 'Ecuador'],
  'Group F': ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  'Group G': ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  'Group H': ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'],
  'Group I': ['France', 'Senegal', 'Iraq', 'Norway'],
  'Group J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  'Group K': ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  'Group L': ['England', 'Croatia', 'Ghana', 'Panama']
};

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

function findGroupNameForTeam(teamName) {
  if (!teamName) return null;
  const normName = normalizeTeamName(teamName);
  for (const groupName of Object.keys(GROUPS_STRUCTURE)) {
    const found = GROUPS_STRUCTURE[groupName].some(t => normalizeTeamName(t) === normName);
    if (found) return groupName;
  }
  return null;
}

function renderGroups() {
  const el = document.getElementById('groupsGrid');
  if (!el) return;

  const groupMap = buildGroupsFromMatches();
  el.innerHTML = groupMap.map(g => renderGroupCard(g)).join('');
  renderThirdPlaceTable(groupMap);
}

// Standalone ranking table of all third-placed teams — preview of who advances (top 8)
function renderThirdPlaceTable(groupMap) {
  const el = document.getElementById('thirdPlaceTable');
  if (!el) return;

  const ranked = rankThirdPlaced(groupMap);
  if (ranked.length === 0) {
    el.innerHTML = '';
    return;
  }

  const rows = ranked.map((x, i) => {
    const s = x.e.stats;
    const gd = s.pointsFor - s.pointsAgainst;
    const cls = (i < 8 ? 'qualify-third' : 'eliminated-third') + (i === 8 ? ' cutoff' : '');
    return `
      <tr class="${cls}">
        <td>${i + 1}</td>
        <td>
          <div class="group-team" onclick="openTeamModal('${x.e.team.name}')" style="cursor:pointer;">
            ${x.e.team.logo ? `<img class="group-team__logo" src="${x.e.team.logo}" alt="${x.e.team.name}" loading="lazy" />` : ''}
            <span class="group-team__name">${x.e.team.name}</span>
            <span class="third-group">${x.group}</span>
          </div>
        </td>
        <td>${s.gamesPlayed}</td>
        <td>${s.wins}</td>
        <td>${s.draws}</td>
        <td>${s.losses}</td>
        <td>${s.pointsFor}:${s.pointsAgainst}</td>
        <td style="color:${gd > 0 ? 'var(--green)' : gd < 0 ? 'var(--red)' : 'var(--muted)'}">${gd > 0 ? '+' : ''}${gd}</td>
        <td style="color:var(--yellow);font-weight:800;">${s.points}</td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="group-card animate-in">
      <div class="group-card__header">🥉 Ranking drużyn z 3. miejsc — awansuje 8 najlepszych</div>
      <table class="group-table">
        <thead>
          <tr><th>#</th><th>Drużyna</th><th>M</th><th>W</th><th>R</th><th>P</th><th>G</th><th>+/-</th><th>Pkt</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildGroupsFromMatches() {
  const standings = {};

  // Build a dictionary of team logos from matches using normalized names
  const logos = {};
  if (DATA && DATA.matches) {
    DATA.matches.forEach(m => {
      if (m.home && m.home.name) {
        logos[normalizeTeamName(m.home.name)] = m.home.logo;
      }
      if (m.away && m.away.name) {
        logos[normalizeTeamName(m.away.name)] = m.away.logo;
      }
    });
  }

  // Initialize standings for all 48 teams
  Object.keys(GROUPS_STRUCTURE).forEach(groupName => {
    standings[groupName] = GROUPS_STRUCTURE[groupName].map(teamName => {
      const normName = normalizeTeamName(teamName);
      const logo = logos[normName] || '';

      return {
        team: { name: teamName, logo: logo },
        stats: { gamesPlayed: 0, wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, points: 0 }
      };
    });
  });

  // Process completed matches
  if (DATA && DATA.matches) {
    const completed = DATA.matches.filter(m => m.status.completed);
    completed.forEach(m => {
      const groupName = findGroupNameForTeam(m.home.name) || findGroupNameForTeam(m.away.name) || m.group;
      if (!groupName || !standings[groupName]) return;

      const hs = parseInt(m.home.score) || 0;
      const as = parseInt(m.away.score) || 0;

      const normHome = normalizeTeamName(m.home.name);
      const normAway = normalizeTeamName(m.away.name);

      const homeEntry = standings[groupName].find(e => normalizeTeamName(e.team.name) === normHome);
      const awayEntry = standings[groupName].find(e => normalizeTeamName(e.team.name) === normAway);

      if (homeEntry && awayEntry) {
        homeEntry.stats.gamesPlayed++;
        awayEntry.stats.gamesPlayed++;
        homeEntry.stats.pointsFor += hs;
        homeEntry.stats.pointsAgainst += as;
        awayEntry.stats.pointsFor += as;
        awayEntry.stats.pointsAgainst += hs;

        if (hs > as) {
          homeEntry.stats.wins++;
          homeEntry.stats.points += 3;
          awayEntry.stats.losses++;
        } else if (hs < as) {
          awayEntry.stats.wins++;
          awayEntry.stats.points += 3;
          homeEntry.stats.losses++;
        } else {
          homeEntry.stats.draws++;
          awayEntry.stats.draws++;
          homeEntry.stats.points++;
          awayEntry.stats.points++;
        }
      }
    });
  }

  // Sort groups and format labels
  const sortedGroups = [];
  Object.keys(standings).forEach(groupName => {
    const sortedStandings = [...standings[groupName]].sort((a, b) => {
      const gdA = a.stats.pointsFor - a.stats.pointsAgainst;
      const gdB = b.stats.pointsFor - b.stats.pointsAgainst;
      return b.stats.points - a.stats.points || gdB - gdA || b.stats.pointsFor - a.stats.pointsFor || a.team.name.localeCompare(b.team.name);
    });

    const groupLabel = groupName
      .replace('Group A', 'Grupa A')
      .replace('Group B', 'Grupa B')
      .replace('Group C', 'Grupa C')
      .replace('Group D', 'Grupa D')
      .replace('Group E', 'Grupa E')
      .replace('Group F', 'Grupa F')
      .replace('Group G', 'Grupa G')
      .replace('Group H', 'Grupa H')
      .replace('Group I', 'Grupa I')
      .replace('Group J', 'Grupa J')
      .replace('Group K', 'Grupa K')
      .replace('Group L', 'Grupa L');

    sortedGroups.push({
      name: groupLabel,
      standings: sortedStandings
    });
  });

  // World Cup 2026: besides the top 2 of each group (24 teams), the 8 best third-placed
  // teams (of 12) also advance to the Round of 32. Flag them so group cards mark them.
  rankThirdPlaced(sortedGroups).slice(0, 8).forEach(x => { x.e.qualifyThird = true; });

  return sortedGroups;
}

// Rank the third-placed teams by FIFA criteria: points → goal difference → goals scored.
// Only teams that have actually played count. Returns [{ group, e, gd }] best-first.
function rankThirdPlaced(sortedGroups) {
  return sortedGroups
    .map(g => ({ group: g.name, e: g.standings[2] }))
    .filter(x => x.e && x.e.stats.gamesPlayed > 0)
    .map(x => ({ ...x, gd: x.e.stats.pointsFor - x.e.stats.pointsAgainst }))
    .sort((a, b) =>
      b.e.stats.points - a.e.stats.points ||
      b.gd - a.gd ||
      b.e.stats.pointsFor - a.e.stats.pointsFor ||
      a.e.team.name.localeCompare(b.e.team.name)
    );
}

function renderGroupCard(group) {
  const rows = group.standings.map((entry, i) => {
    const s = entry.stats;
    const gp = s.gamesPlayed ?? s.GP ?? s.overall?.gamesPlayed ?? '0';
    const w = s.wins ?? s.W ?? s.overall?.wins ?? '0';
    const d = s.draws ?? s.D ?? s.overall?.draws ?? '0';
    const l = s.losses ?? s.L ?? s.overall?.losses ?? '0';
    const gf = s.pointsFor ?? s.GF ?? s.overall?.pointsFor ?? '0';
    const ga = s.pointsAgainst ?? s.GA ?? s.overall?.pointsAgainst ?? '0';
    const gd = s.goalDifference ?? s.GD ?? (parseInt(gf) - parseInt(ga));
    const pts = s.points ?? s.P ?? '0';
    // Top 2 advance directly; 3rd place advances only if among the 8 best third-placed teams
    const qualify = i < 2 ? 'qualify' : (i === 2 && entry.qualifyThird ? 'qualify-third' : '');

    return `
      <tr class="${qualify}">
        <td>
          <div class="group-team" onclick="openTeamModal('${entry.team.name}')" style="cursor: pointer; transition: color var(--transition);" onmouseover="this.style.color='var(--yellow)'" onmouseout="this.style.color=''">
            ${entry.team.logo ? `<img class="group-team__logo" src="${entry.team.logo}" alt="${entry.team.name}" loading="lazy" />` : ''}
            <span class="group-team__name">${entry.team.name || entry.team.abbr}</span>
          </div>
        </td>
        <td>${gp}</td>
        <td>${w}</td>
        <td>${d}</td>
        <td>${l}</td>
        <td>${gf}:${ga}</td>
        <td style="color: ${parseInt(gd) > 0 ? 'var(--green)' : parseInt(gd) < 0 ? 'var(--red)' : 'var(--muted)'}">${parseInt(gd) > 0 ? '+' : ''}${gd}</td>
        <td style="color: var(--yellow); font-weight: 800;">${pts}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="group-card animate-in">
      <div class="group-card__header">${group.name}</div>
      <table class="group-table">
        <thead>
          <tr>
            <th>Drużyna</th>
            <th>M</th>
            <th>W</th>
            <th>R</th>
            <th>P</th>
            <th>G</th>
            <th>+/-</th>
            <th>Pkt</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ── Tournament Stats ───────────────────────────────────────────────────────
// All-time benchmarks for record comparisons
const WC_RECORD_GOALS = 172;   // Katar 2022 (najwięcej w historii)
const WC_RECORD_AVG = 2.69;    // Katar 2022: 172 goli / 64 mecze

// Group completed matches by tournament day, with running (cumulative) average
function computeTrends() {
  const completed = DATA.matches.filter(m => m.status.completed)
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
function svgLineChart(series, opts = {}) {
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
function cssBars(series, valueFmt = v => v, onClick = null) {
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

function renderTournamentStats() {
  recomputeStats();
  const el = document.getElementById('tournamentStats');
  const completed = DATA.matches.filter(m => m.status.completed);

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
  const totalGoals = DATA.stats.totalGoals;
  const avg = parseFloat(DATA.stats.avgGoalsPerMatch) || 0;
  const totalMatches = DATA.matches.length || 104;
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
          <div class="ts-record__big">${projected}</div>
          <div class="ts-record__lbl">Projekcja na ${totalMatches} meczów (tempo ${avg.toFixed(2)}/mecz)</div>
          <div class="ts-record__delta ${projDelta >= 0 ? 'up' : 'down'}">${projDelta >= 0 ? '▲ +' : '▼ '}${projDelta} vs rekord</div>
        </div>
        <div class="ts-record__metric">
          <div class="ts-record__big">${avg.toFixed(2)}<span> / ${WC_RECORD_AVG}</span></div>
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
        { label: 'Celność strzałów', value: totalShots > 0 ? ((totalOnTarget / totalShots) * 100).toFixed(1) + '%' : '—' },
        { label: 'Śr. strzałów / mecz', value: n > 0 ? (totalShots / n).toFixed(1) : '—' },
        { label: 'Gole łącznie', value: DATA.stats.totalGoals, drill: 'goals' },
        { label: 'Śr. goli / mecz', value: DATA.stats.avgGoalsPerMatch },
      ]
    },
    {
      title: '⚙️ Podania i posiadanie',
      items: [
        { label: 'Podania łącznie', value: totalPasses.toLocaleString('pl'), drill: 'totalPasses' },
        { label: 'Śr. podań / mecz', value: n > 0 ? Math.round(totalPasses / n).toLocaleString('pl') : '—' },
        { label: 'Kornery łącznie', value: totalCorners, drill: 'wonCorners' },
        { label: 'Śr. kornerów / mecz', value: n > 0 ? (totalCorners / n).toFixed(1) : '—' },
      ]
    },
    {
      title: '🛡️ Dyscyplina i inne',
      items: [
        { label: 'Faule łącznie', value: totalFouls, drill: 'foulsCommitted' },
        { label: 'Śr. fauli / mecz', value: n > 0 ? (totalFouls / n).toFixed(1) : '—' },
        { label: 'Spalone łącznie', value: totalOffsides, drill: 'offsides' },
        { label: 'Łączna frekwencja', value: totalAttendance.toLocaleString('pl'), drill: 'attendance' },
        { label: 'Śr. frekwencja / mecz', value: n > 0 ? Math.round(totalAttendance / n).toLocaleString('pl') : '—' },
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

  el.innerHTML = recordCard + avgChart + goalsChart + attChart + aggregateCards;
}

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

function openDrill(statId, opts = {}) {
  if (!DRILL[statId] || !DATA?.matches) return;
  drillState = { statId, mode: 'match', filter: '', day: opts.day || null };
  document.getElementById('drillOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderDrill();
}
function closeDrill() {
  document.getElementById('drillOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
function setDrillMode(mode) { drillState.mode = mode; renderDrill(); }
function setDrillFilter(v) { drillState.filter = v; renderDrillList(); } // list only → keep input focus

function _dayLabel(day) { const [, mo, da] = day.split('-'); return `${da}.${mo}`; }
function _fmtNum(n) { return n.toLocaleString('pl-PL'); }
function _drillEmpty() { return `<div class="empty-state" style="padding:24px;"><div class="empty-state__text" style="color:var(--muted);">Brak danych do wyświetlenia</div></div>`; }

function renderDrill() {
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

function renderDrillList() {
  const spec = DRILL[drillState.statId];
  let completed = DATA.matches.filter(m => m.status.completed);
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

function setupDrillModal() {
  document.getElementById('drillClose').addEventListener('click', closeDrill);
  document.getElementById('drillOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDrill(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('drillOverlay').classList.contains('active')) closeDrill(); });
}

// ── Live Modal Polling ─────────────────────────────────────────────────────
let liveModalInterval = null;
let liveModalLastFetch = null;
let liveModalPollingId = null;
const detailsFetching = new Set(); // matchIds whose one-time summary fetch is in flight
// matchId -> latest authoritative ESPN state; re-applied after every Firebase push so a
// stale scraper snapshot can't clobber a live/finished match the frontend already corrected
const liveScoreCache = new Map();

function cacheLive(match) {
  liveScoreCache.set(match.id, {
    home: { score: match.home.score, winner: match.home.winner },
    away: { score: match.away.score, winner: match.away.winner },
    status: { ...match.status },
    details: match.details ?? liveScoreCache.get(match.id)?.details,
  });
}

function parseSummaryForModal(data) {
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

async function fetchAndUpdateLiveMatch(matchId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${matchId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // Set before mutating match data — badge ticker uses this as drift reference
  liveModalLastFetch = new Date();

  const match = DATA.matches.find(m => m.id === matchId);
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

// Rebuild one card in place from its DATA.matches object (identical to grid rendering)
function syncLiveCard(matchId) {
  const cardEl = document.querySelector(`[data-match-id="${matchId}"]`);
  const match = DATA?.matches?.find(m => m.id === matchId);
  if (cardEl && match) cardEl.outerHTML = renderMatchCard(match);
}

// Re-apply the latest live ESPN data on top of DATA after a Firebase push replaces it wholesale
function applyLiveOverride() {
  if (!DATA?.matches || liveScoreCache.size === 0) return;
  for (const m of DATA.matches) {
    const c = liveScoreCache.get(m.id);
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

function espnDateStr(d) {
  // ESPN buckets matches by US-Eastern date, NOT UTC — a 01:00 UTC match (e.g. PAR@USA)
  // belongs to the PREVIOUS ET day. Query by ET date so late-night matches aren't missed.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d).replace(/-/g, '');
}

async function refreshLiveScores() {
  if (!DATA?.matches) return;
  const now = Date.now();

  // Which days have a match that's live, just finished, or about to start?
  const dates = new Set();
  for (const m of DATA.matches) {
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
      const match = DATA.matches.find(m => m.id === ev.id);
      if (!match) continue;
      if (match.id === liveModalPollingId) continue; // modal owns this one (fresher, per-second)
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
    renderHeroStats();
    renderScorers();
    renderGroups();
    renderTournamentStats();
    renderRecords();
  }
}

function startLiveScoreRefresh() {
  refreshLiveScores();                   // immediate on load — corrects frozen snapshots
  setInterval(refreshLiveScores, 30000); // then every 30s
}

let liveBadgeTicker = null;

function startLiveModalPolling(matchId) {
  if (liveModalPollingId === matchId && liveModalInterval) return;
  stopLiveModalPolling();
  liveModalPollingId = matchId;

  // Immediate fetch
  fetchAndUpdateLiveMatch(matchId)
    .then(() => {
      const overlay = document.getElementById('modalOverlay');
      if (overlay.dataset.activeMatchId === matchId) openMatchModal(matchId);
    })
    .catch(e => {
      console.warn('Live fetch error:', e);
      const badgeEl = document.getElementById('modalBadge');
      if (badgeEl) badgeEl.innerHTML = getLiveModalBadge(DATA.matches.find(m => m.id === matchId));
    });

  // Re-fetch every 30s
  liveModalInterval = setInterval(async () => {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay.classList.contains('active') || overlay.dataset.activeMatchId !== matchId) {
      stopLiveModalPolling();
      return;
    }
    try {
      await fetchAndUpdateLiveMatch(matchId);
      openMatchModal(matchId);
    } catch (e) {
      console.warn('Live stats refresh failed:', e);
    }
  }, 30000);

  // Tick every second — update BOTH modal badge AND card badge from the same getDisplayClock call
  liveBadgeTicker = setInterval(() => {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay.classList.contains('active')) return;
    const m = DATA.matches.find(x => x.id === matchId);
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

function stopLiveModalPolling() {
  if (liveModalInterval) { clearInterval(liveModalInterval); liveModalInterval = null; }
  if (liveBadgeTicker) { clearInterval(liveBadgeTicker); liveBadgeTicker = null; }
  liveModalPollingId = null;
  liveModalLastFetch = null;
  // liveScoreCache is intentionally NOT cleared — it keeps the main page correct across pushes
}

function getLiveModalBadge(m) {
  if (m.status.completed) {
    return `<span style="color:var(--green);font-size:.75rem;font-weight:700;">FT — ${m.status.shortDetail || m.status.detail || ''}</span>`;
  }

  const matchStarted = new Date(m.date) <= new Date();
  if (!matchStarted) {
    return `<span style="color:var(--muted);font-size:.75rem;font-weight:600;">${m.status.shortDetail || m.status.detail || ''}</span>`;
  }

  const clock = getDisplayClock(m);
  const ago = liveModalLastFetch
    ? `<span style="color:var(--muted);font-size:.7rem;margin-left:8px;">odśw. ${Math.floor((Date.now()-liveModalLastFetch)/1000)}s temu</span>`
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

// ── Match Modal ────────────────────────────────────────────────────────────
function openMatchModal(matchId) {
  const m = DATA.matches.find(match => match.id === matchId);
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
  } else if (matchStarted && !hasDetails && !detailsFetching.has(matchId)) {
    detailsFetching.add(matchId);
    fetchAndUpdateLiveMatch(matchId)
      .catch(e => console.warn('Modal details fetch failed:', e))
      .finally(() => {
        detailsFetching.delete(matchId);
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
    const fetching = (!m.status.completed && matchStarted) || detailsFetching.has(matchId);
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

function closeMatchModal() {
  stopLiveModalPolling();
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  delete overlay.dataset.activeMatchId;
  document.body.style.overflow = '';
}

function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeMatchModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeMatchModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMatchModal();
  });
}

// ── Navigation ─────────────────────────────────────────────────────────────
function setupNav() {
  const tabs = document.querySelectorAll('#mainNav .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const section = tab.dataset.section;
      activeSection = section;

      document.querySelectorAll('[id^="section-"]').forEach(s => s.style.display = 'none');
      document.getElementById(`section-${section}`).style.display = '';

      if (section === 'records') {
        renderRecords();
      }
    });
  });
}

function setupMatchFilter() {
  const tabs = document.querySelectorAll('#matchFilter .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      matchFilter = tab.dataset.filter;
      renderMatches();
    });
  });
}

function setupScorerFilter() {
  const tabs = document.querySelectorAll('#scorerFilter .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeScorerTab = tab.dataset.scorerTab;
      renderScorers();
    });
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (DATA.meta.lastUpdated) {
    const d = new Date(DATA.meta.lastUpdated);
    el.textContent = `Aktualizacja: ${d.toLocaleString('pl-PL')}`;
  }
}

function shortenPosition(pos) {
  if (!pos) return '';
  const map = {
    'Goalkeeper': 'GK',
    'Defender': 'DEF',
    'Midfielder': 'MID',
    'Forward': 'FW',
    'Center Left Defender': 'CB',
    'Center Right Defender': 'CB',
    'Left Back': 'LB',
    'Right Back': 'RB',
    'Defensive Midfielder': 'DM',
    'Central Midfielder': 'CM',
    'Attacking Midfielder': 'AM',
    'Left Midfielder': 'LM',
    'Right Midfielder': 'RM',
    'Left Wing': 'LW',
    'Right Wing': 'RW',
    'Center Forward': 'CF',
    'Striker': 'ST',
  };
  return map[pos] || pos.substring(0, 3).toUpperCase();
}

function setupRecordFilter() {
  const tabs = document.querySelectorAll('#recordFilter .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeRecordFilter = tab.dataset.recordFilter;
      renderRecords();
    });
  });
}

function getPlayerStats(playerName) {
  let goals = 0;
  let assists = 0;
  let appearances = 0;
  let cleanSheets = 0;
  let wins = 0;

  if (DATA && DATA.matches) {
    DATA.matches.forEach(m => {
      if (!m.details) return;

      let played = false;
      let teamId = null;
      let isHome = false;
      let isAway = false;

      if (m.details.lineups) {
        m.details.lineups.forEach(lineup => {
          const player = lineup.players.find(p => 
            p.name.toLowerCase().includes(playerName.toLowerCase()) || 
            p.shortName?.toLowerCase().includes(playerName.toLowerCase())
          );
          if (player) {
            played = true;
            teamId = lineup.teamId;
            if (m.home.id === teamId) isHome = true;
            if (m.away.id === teamId) isAway = true;
          }
        });
      }

      if (played && m.status.completed) {
        appearances++;
        
        // Winner
        if (isHome && m.home.winner) wins++;
        if (isAway && m.away.winner) wins++;

        // Clean sheet for their team
        if (isHome && parseInt(m.away.score || 0) === 0) cleanSheets++;
        if (isAway && parseInt(m.home.score || 0) === 0) cleanSheets++;
      }
    });
  }

  // Also query topScorers/topAssisters for live totals
  if (DATA && DATA.topScorers) {
    const s = DATA.topScorers.find(x => x.name.toLowerCase().includes(playerName.toLowerCase()));
    if (s) goals = s.goals;
  }
  if (DATA && DATA.topAssisters) {
    const a = DATA.topAssisters.find(x => x.name.toLowerCase().includes(playerName.toLowerCase()));
    if (a) assists = a.assists;
  }

  return { goals, assists, appearances, cleanSheets, wins };
}

function checkPlayerHatTrick2026(playerName) {
  if (!DATA || !DATA.topScorers) return false;
  const scorer = DATA.topScorers.find(s => s.name.toLowerCase().includes(playerName.toLowerCase()));
  if (!scorer) return false;
  const matchCounts = {};
  (scorer.goalDetails || []).forEach(g => {
    matchCounts[g.matchId] = (matchCounts[g.matchId] || 0) + 1;
  });
  return Object.values(matchCounts).some(c => c >= 3);
}

function getFranceMatchesCount() {
  if (!DATA || !DATA.matches) return 0;
  return DATA.matches.filter(m => 
    (m.home.name.toLowerCase().includes('france') || m.away.name.toLowerCase().includes('france') || m.home.name.toLowerCase().includes('francja') || m.away.name.toLowerCase().includes('francja')) &&
    m.status.completed
  ).length;
}

function getCountryMatchesCount(countryNamePl, countryNameEn) {
  if (!DATA || !DATA.matches) return 0;
  return DATA.matches.filter(m => 
    (m.home.name.toLowerCase().includes(countryNamePl.toLowerCase()) || 
     m.away.name.toLowerCase().includes(countryNamePl.toLowerCase()) ||
     m.home.name.toLowerCase().includes(countryNameEn.toLowerCase()) || 
     m.away.name.toLowerCase().includes(countryNameEn.toLowerCase())) &&
    m.status.completed
  ).length;
}

function renderRecords() {
  recomputeStats();
  const el = document.getElementById('recordsGrid');
  if (!el) return;

  const completed = DATA.matches.filter(m => m.status.completed);
  
  // Aggregate card stats for card record
  let totalYellow = 0, totalRed = 0, totalAttendance = 0;
  completed.forEach(m => {
    if (m.attendance) totalAttendance += m.attendance;
    if (m.details?.teamStats) {
      m.details.teamStats.forEach(t => {
        totalYellow += parseInt(t.stats.yellowCards?.value || 0);
        totalRed += parseInt(t.stats.redCards?.value || 0);
      });
    }
  });

  const messi = getPlayerStats('Messi');
  const ronaldo = getPlayerStats('Ronaldo');
  const mbappe = getPlayerStats('Mbappé');
  const courtois = getPlayerStats('Courtois');

  const recordsList = [
    {
      id: 'total_goals',
      icon: '⚽',
      title: 'Łączna liczba goli w turnieju',
      desc: 'Poprzedni rekord wynosi 172 bramki (Katar 2022). W 48-zespołowym formacie niemal na pewno padnie nowy rekord.',
      target: 172,
      current: DATA.stats.totalGoals,
      unit: ' goli',
      type: DATA.stats.totalGoals > 172 ? 'achieved' : 'chasing',
      statText: `Rekord: 172 (2022) | Obecnie: ${DATA.stats.totalGoals}`
    },
    {
      id: 'yellow_cards',
      icon: '🟨',
      title: 'Łączna liczba żółtych kartek',
      desc: 'Najwięcej żółtych kartek w historii pokazano w 2006 roku w Niemczech (345).',
      target: 345,
      current: totalYellow,
      unit: ' kartek',
      type: totalYellow > 345 ? 'achieved' : 'chasing',
      statText: `Rekord: 345 (2006) | Obecnie: ${totalYellow}`
    },
    {
      id: 'red_cards',
      icon: '🟥',
      title: 'Łączna liczba czerwonych kartek',
      desc: 'Rekord wszech czasów to 28 czerwonych kartek pokazanych na MŚ 2006.',
      target: 28,
      current: totalRed,
      unit: ' kartek',
      type: totalRed > 28 ? 'achieved' : 'chasing',
      statText: `Rekord: 28 (2006) | Obecnie: ${totalRed}`
    },
    {
      id: 'longest_road',
      icon: '🏆',
      title: 'Najdłuższa droga do tytułu',
      desc: 'Zwycięzca turnieju rozegra 8 meczów (dotychczasowy rekord to 7 meczów dla mistrza).',
      target: 8,
      current: 8,
      unit: ' meczów',
      type: 'achieved',
      statText: 'Status: Pewny (nowy format) 🏆'
    },
    {
      id: 'messi_appearances',
      icon: '🇦🇷',
      title: 'Śrubowanie rekordu występów Messiego',
      desc: 'Leo Messi jest już rekordzistą z 26 występami na MŚ. Każdy kolejny mecz wydłuża ten rekord.',
      target: 27,
      current: 26 + messi.appearances,
      unit: ' meczów',
      type: messi.appearances > 0 ? 'achieved' : 'chasing',
      statText: `Rekord: 26 | Obecnie: ${26 + messi.appearances}`
    },
    {
      id: 'messi_wins',
      icon: '🇦🇷',
      title: 'Najwięcej wygranych meczów na MŚ',
      desc: 'Rekord należy do Miroslava Klose (17 zwycięstw). Leo Messi ma 16 i potrzebuje dwóch wygranych do pobicia.',
      target: 18,
      current: 16 + messi.wins,
      unit: ' wygranych',
      type: (16 + messi.wins) >= 18 ? 'achieved' : 'chasing',
      statText: `Rekord Klosego: 17 | Obecnie Messi: ${16 + messi.wins}`
    },
    {
      id: 'six_world_cups',
      icon: '🌍',
      title: 'Pierwszy zawodnik na 6 mundialach',
      desc: 'Leo Messi (a także Cristiano Ronaldo) ma szansę zagrać na 6. turnieju. Argentyna gra mecz otwarcia wcześniej niż Portugalia.',
      target: 1,
      current: messi.appearances > 0 ? 1 : 0,
      unit: '',
      type: messi.appearances > 0 ? 'achieved' : 'chasing',
      statText: messi.appearances > 0 ? 'Osiągnięty przez Messiego! 🏆' : 'Czeka na pierwszy mecz Argentyny'
    },
    {
      id: 'top_scorer_history',
      icon: '⚽',
      title: 'Top strzelec w historii MŚ',
      desc: 'Miroslav Klose prowadzi z 16 golami. Leo Messi (13 goli) i Kylian Mbappé (12 goli) gonią ten rekord.',
      target: 16,
      current: Math.max(13 + messi.goals, 12 + mbappe.goals),
      unit: ' goli',
      type: Math.max(13 + messi.goals, 12 + mbappe.goals) > 16 ? 'achieved' : 'chasing',
      statText: `Rekord Klosego: 16 | Messi: ${13 + messi.goals} | Mbappé: ${12 + mbappe.goals}`
    },
    {
      id: 'goals_six_tournaments',
      icon: '⚽',
      title: 'Gole w 6 różnych turniejach',
      desc: 'Cristiano Ronaldo jest jedynym graczem z golami w 5 edycjach. Gol w 2026 przedłuży ten kosmiczny rekord do 6.',
      target: 1,
      current: ronaldo.goals > 0 ? 1 : 0,
      unit: '',
      type: ronaldo.goals > 0 ? 'achieved' : 'chasing',
      statText: ronaldo.goals > 0 ? 'Osiągnięty przez Ronaldo! 🏆' : 'Czeka na gola Ronaldo'
    },
    {
      id: 'oldest_scorer_knockout',
      icon: '👴',
      title: 'Najstarszy strzelec fazy pucharowej',
      desc: 'Obecny rekordzista to Pepe (39 lat, 283 dni). Kandydaci na pobicie: C. Ronaldo (41 l.), L. Modrić (40 l.), E. Džeko (40 l.).',
      target: 40,
      current: 39,
      unit: ' lat',
      type: 'chasing',
      statText: 'Rekord Pepe: 39 lat | Faza pucharowa jeszcze nie ruszyła'
    },
    {
      id: 'coach_matches',
      icon: '⚽',
      title: 'Najwięcej meczów jako trener',
      desc: 'Helmut Schön prowadził zespoły w 25 meczach. Didier Deschamps (Francja) ma obecnie 19 i musi awansować do półfinału.',
      target: 25,
      current: 19 + getFranceMatchesCount(),
      unit: ' meczów',
      type: (19 + getFranceMatchesCount()) > 25 ? 'achieved' : 'chasing',
      statText: `Rekord Schöna: 25 | Obecnie Deschamps: ${19 + getFranceMatchesCount()}`
    },
    {
      id: 'hattricks_tournaments',
      icon: '⚽',
      title: 'Najwięcej turniejów z hattrickami',
      desc: 'Gabriel Batistuta strzelał hattricki na 2 turniejach. Kane, Mbappé, G. Ramos i Ronaldo mają po 1 i szukają drugiego.',
      target: 2,
      current: (checkPlayerHatTrick2026('Kane') || checkPlayerHatTrick2026('Mbappé') || checkPlayerHatTrick2026('Ramos') || checkPlayerHatTrick2026('Ronaldo')) ? 2 : 1,
      unit: ' turnieje',
      type: 'chasing',
      statText: 'Rekord Batistuty: 2 | Żaden z kandydatów nie strzelił hat-tricka w 2026'
    },
    {
      id: 'two_golden_boots',
      icon: '🥇',
      title: 'Dwa Złote Buty (Klasyfikacje Strzelców)',
      desc: 'Nikt nigdy nie wygrał klasyfikacji strzelców dwukrotnie. Zdobywca z 2022 r. Kylian Mbappé może być pierwszym.',
      target: 1,
      current: 0,
      unit: '',
      type: 'chasing',
      statText: 'Mbappé walczy o obronę tytułu króla strzelców'
    },
    {
      id: 'final_appearances',
      icon: '🇫🇷',
      title: 'Najwięcej występów w finałach MŚ',
      desc: 'Rekord to 3 finały (Cafu). Lionel Messi i Kylian Mbappé zagrali w 2 finałach i mogą wyrównać ten rekord.',
      target: 3,
      current: 2,
      unit: ' finały',
      type: 'chasing',
      statText: 'Rekord Cafu: 3 | Messi i Mbappé mają po 2'
    },
    {
      id: 'clean_sheets',
      icon: '🧹',
      title: 'Rekord czystych kont bramkarza',
      desc: 'Rekord wynosi 10 czystych kont (Shilton, Barthez). Thibaut Courtois ma 7 i ma szansę go pobić.',
      target: 10,
      current: 7 + courtois.cleanSheets,
      unit: ' czystych kont',
      type: (7 + courtois.cleanSheets) >= 10 ? 'achieved' : 'chasing',
      statText: `Rekord: 10 | Obecnie Courtois: ${7 + courtois.cleanSheets}`
    },
    {
      id: 'captain_title_defense',
      icon: '🇦🇷',
      title: 'Pierwszy kapitan z obroną tytułu',
      desc: 'Żaden kapitan w historii nie wzniósł Pucharu Świata dwukrotnie z rzędu. Leo Messi może być pierwszy.',
      target: 1,
      current: 0,
      unit: '',
      type: 'chasing',
      statText: 'Argentyna rozpoczyna obronę tytułu mistrzowskiego'
    },
    {
      id: 'goal_involvements_pele',
      icon: '🅰️',
      title: 'Samodzielny rekord udziałów przy golach (G+A)',
      desc: 'Messi i Pelé dzielą rekord 21 udziałów przy bramkach. Jeden punkt kanadyjski Messiego w 2026 da mu samodzielny rekord.',
      target: 22,
      current: 21 + messi.goals + messi.assists,
      unit: ' punktów',
      type: (21 + messi.goals + messi.assists) >= 22 ? 'achieved' : 'chasing',
      statText: `Rekord: 21 | Obecnie Messi: ${21 + messi.goals + messi.assists}`
    },
    {
      id: 'oldest_field_player_final',
      icon: '👴',
      title: 'Najstarszy gracz z pola w finale MŚ',
      desc: 'Rekord to Nils Liedholm (35 lat). Jeśli Portugalia dojdzie do finału z Cristiano Ronaldo (41 lat), pobije go o 6 lat.',
      target: 41,
      current: 35,
      unit: ' lat',
      type: 'chasing',
      statText: 'Rekord Liedholma: 35 lat | Portugalia walczy w turnieju'
    },
    {
      id: 'mbappe_finals_goal',
      icon: '🇫🇷',
      title: 'Kylian Mbappé — gole w 3 różnych finałach',
      desc: 'Mbappé strzelał już w 2018 i 2022. Trafienie w finale 2026 uczyniłoby go jedynym graczem z golami w 3 różnych finałach MŚ.',
      target: 3,
      current: 0,
      unit: ' finały',
      type: 'chasing',
      statText: 'Mbappé ma już na koncie rekordowe 4 gole w finałach MŚ'
    },
    {
      id: 'azteca_stadium',
      icon: '🏟️',
      title: 'Estadio Azteca — trzykrotny gospodarz MŚ',
      desc: 'Kultowy stadion w Meksyku staje się pierwszym obiektem w historii, który ugości mecze trzech edycji MŚ (1970, 1986, 2026).',
      target: 1,
      current: 1,
      unit: '',
      type: 'achieved',
      statText: 'Status: Osiągnięty (mecz otwarcia za nami) 🏆'
    },
    {
      id: 'total_attendance',
      icon: '🌍',
      title: 'Rekord frekwencji całego turnieju',
      desc: 'Rekord wszech czasów wynosi 3 587 538 widzów (USA 1994). Z racji 104 meczów i olbrzymich stadionów ten rekord pęknie bez problemu.',
      target: 3587538,
      current: totalAttendance,
      unit: ' widzów',
      type: totalAttendance > 3587538 ? 'achieved' : 'chasing',
      statText: `Rekord z 1994: 3.58M | Obecnie na stadionach: ${totalAttendance.toLocaleString('pl')}`
    },
    {
      id: 'oldest_coach',
      icon: '👴',
      title: 'Rekord najstarszego selekcjonera MŚ',
      desc: 'Dotychczasowy rekord należał do Otto Rehhagela (71 lat). W tym roku pobije go aż trzech trenerów: Broos (74), Koubek (74) i Advocaat (78).',
      target: 1,
      current: (getCountryMatchesCount('Czechia', 'czech') > 0 || getCountryMatchesCount('South Africa', 'africa') > 0 || getCountryMatchesCount('Curacao', 'cura') > 0) ? 1 : 0,
      unit: '',
      type: (getCountryMatchesCount('Czechia', 'czech') > 0 || getCountryMatchesCount('South Africa', 'africa') > 0 || getCountryMatchesCount('Curacao', 'cura') > 0) ? 'achieved' : 'chasing',
      statText: (getCountryMatchesCount('Czechia', 'czech') > 0 || getCountryMatchesCount('South Africa', 'africa') > 0 || getCountryMatchesCount('Curacao', 'cura') > 0) ? 'Osiągnięty! (Rekordzistą Dick Advocaat - 78 lat) 🏆' : 'Czeka na mecze Czech, RPA lub Curaçao'
    }
  ];

  let filtered = recordsList;
  if (activeRecordFilter === 'chasing') {
    filtered = recordsList.filter(r => r.type === 'chasing');
  } else if (activeRecordFilter === 'achieved') {
    filtered = recordsList.filter(r => r.type === 'achieved');
  }

  el.innerHTML = filtered.map(r => {
    const isCompletedType = r.type === 'achieved';
    const badgeClass = isCompletedType ? 'record-badge--achieved' : 'record-badge--chasing';
    const badgeText = isCompletedType ? 'Osiągnięty' : 'W toku';
    const fillClass = isCompletedType ? 'record-progress-fill--achieved' : '';

    const pct = Math.min(100, Math.max(0, (r.current / r.target) * 100));

    const currentValText = typeof r.current === 'number' && r.current > 10000 
      ? r.current.toLocaleString('pl') 
      : r.current;
    const targetValText = typeof r.target === 'number' && r.target > 10000 
      ? r.target.toLocaleString('pl') 
      : r.target;

    return `
      <div class="record-card animate-in">
        <div class="record-card__header">
          <div class="record-card__title-group">
            <span class="record-card__icon">${r.icon}</span>
            <span class="record-card__title">${r.title}</span>
          </div>
          <span class="record-badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="record-card__description">${r.desc}</p>
        <div class="record-card__stats">
          <span>Postęp</span>
          <span class="record-card__value">${currentValText} / ${targetValText}${r.unit}</span>
        </div>
        <div class="record-progress-bar">
          <div class="record-progress-fill ${fillClass}" style="width: ${pct}%"></div>
        </div>
        <div style="font-size:0.7rem; color:var(--muted); margin-top:8px; font-weight:500;">
          ${r.statText}
        </div>
      </div>
    `;
  }).join('');
}

function openTeamModal(teamName) {
  closeMatchModal();

  const overlay = document.getElementById('teamModalOverlay');
  overlay.dataset.activeTeamName = teamName;

  // Read current active tab if there is one
  const activeTabEl = document.querySelector('#teamModalTabs .nav-tab.active');
  const activeTab = activeTabEl ? activeTabEl.dataset.teamTab : 'info';

  const normName = normalizeTeamName(teamName);
  
  let displayName = teamName;
  for (const groupName of Object.keys(GROUPS_STRUCTURE)) {
    const found = GROUPS_STRUCTURE[groupName].find(t => normalizeTeamName(t) === normName);
    if (found) {
      displayName = found;
      break;
    }
  }

  let logo = '';
  if (DATA && DATA.matches) {
    DATA.matches.forEach(m => {
      if (normalizeTeamName(m.home.name) === normName) logo = m.home.logo;
      if (normalizeTeamName(m.away.name) === normName) logo = m.away.logo;
    });
  }

  const travel = TEAM_TRAVEL_DATA[displayName] || { base: 'Brak danych', chain: 0, camp: 0 };
  const meta = TEAM_METADATA[displayName] || { ranking: '—', appearances: '—', bestResult: 'Brak danych' };
  const stats = getTeamTournamentStats(displayName);
  const roster = getTeamRoster(displayName);
  const matches = getTeamMatches(displayName);

  // Set the badge group name
  const groupName = findGroupNameForTeam(displayName) || '';
  const groupLabel = groupName ? groupName.replace('Group ', 'Grupa ') : 'Mundial 2026';
  document.getElementById('teamModalBadge').textContent = groupLabel;

  document.getElementById('teamModalHeader').innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
      <img src="${logo}" alt="${displayName}" style="width:72px; height:72px; object-fit:contain; background:var(--grid); padding:6px; border-radius:50%; border: 1px solid var(--border);" />
      <h2 style="font-size:1.75rem; font-weight:800; color:var(--yellow); text-align:center;">${displayName}</h2>
      <span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:var(--muted); letter-spacing:0.08em;">
        Ranking FIFA: #${meta.ranking} · Występy na MŚ: ${meta.appearances}
      </span>
    </div>
  `;

  // Render tabs in teamModalMetadata
  document.getElementById('teamModalMetadata').innerHTML = `
    <!-- Tab Bar -->
    <div class="nav-tabs" id="teamModalTabs" style="padding:2px; gap:2px; margin-bottom: 20px; display:flex; justify-content:center; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
      <button class="nav-tab active" data-team-tab="info">ℹ️ Info i Mecze</button>
      <button class="nav-tab" data-team-tab="stats">📈 Statystyki</button>
      <button class="nav-tab" data-team-tab="roster">👥 Kadra</button>
    </div>

    <!-- Panel 1: Info and Matches -->
    <div id="teamTabContentInfo" class="team-tab-panel">
      <div class="modal__stats-title">📊 Informacje o reprezentacji</div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom: 20px;">
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Najlepszy wynik MŚ</div>
          <div style="font-size:0.85rem; font-weight:700; margin-top:4px;">${meta.bestResult}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Baza Treningowa</div>
          <div style="font-size:0.85rem; font-weight:700; margin-top:4px;">${travel.base}</div>
        </div>
      </div>

      <div class="modal__stats-title">✈️ Podróże w fazie grupowej</div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom: 20px;">
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Trasa między stadionami</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--yellow); margin-top:4px;">${travel.chain ? travel.chain.toLocaleString('pl') + ' km' : '—'}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Trasa Baza ➔ Mecz ➔ Baza</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--yellow); margin-top:4px;">${travel.camp ? travel.camp.toLocaleString('pl') + ' km' : '—'}</div>
        </div>
      </div>

      <div class="modal__stats-title">📅 Terminarz i wyniki</div>
      <div class="team-matches-list" style="display:flex; flex-direction:column; gap:10px;">
        ${matches.map(m => {
          const isCompleted = m.status.completed;
          const statusText = isCompleted ? 'FT' : formatTime(m.date);
          const scoreText = isCompleted ? `${m.home.score} : ${m.away.score}` : 'vs';
          const matchDate = formatDate(m.date);
          
          let resultBadge = '';
          if (isCompleted) {
            const isHome = normalizeTeamName(m.home.name) === normName;
            const hs = parseInt(m.home.score) || 0;
            const as = parseInt(m.away.score) || 0;
            let outcome = ''; // W, D, L
            if (hs === as) outcome = 'D';
            else if (isHome && hs > as) outcome = 'W';
            else if (!isHome && as > hs) outcome = 'W';
            else outcome = 'L';

            const badgeBg = outcome === 'W' ? 'var(--green)' : outcome === 'D' ? 'var(--muted)' : 'var(--red)';
            const outcomePl = outcome === 'W' ? 'W' : outcome === 'D' ? 'R' : 'P';
            resultBadge = `<span style="background:${badgeBg}; color:#fff; font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:8px;">${outcomePl}</span>`;
          }

          return `
            <div class="team-match-row" onclick="closeTeamModal(); openMatchModal('${m.id}')" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg); border:1px solid var(--border); padding:10px 14px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition);" onmouseover="this.style.borderColor='var(--yellow)'" onmouseout="this.style.borderColor='var(--border)'">
              <span style="font-size:0.75rem; color:var(--muted); min-width: 80px;">${matchDate}</span>
              <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
                <img src="${m.home.logo}" style="width:20px; height:20px; object-fit:contain;" />
                <span style="font-size:0.85rem; font-weight:600; color:${normalizeTeamName(m.home.name) === normName ? 'var(--yellow)' : 'var(--text)'}">${m.home.name}</span>
                <span style="font-size:0.85rem; font-weight:700; padding: 2px 8px; background:var(--grid); border-radius:4px; margin: 0 4px;">${scoreText}</span>
                <span style="font-size:0.85rem; font-weight:600; color:${normalizeTeamName(m.away.name) === normName ? 'var(--yellow)' : 'var(--text)'}">${m.away.name}</span>
                <img src="${m.away.logo}" style="width:20px; height:20px; object-fit:contain;" />
              </div>
              <div style="display:flex; align-items:center; min-width: 40px; justify-content:flex-end;">
                ${resultBadge}
                <span style="font-size:0.7rem; font-weight:600; color:var(--muted);">${statusText}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Panel 2: Stats -->
    <div id="teamTabContentStats" class="team-tab-panel" style="display:none;">
      <div class="modal__stats-title">📈 Statystyki w turnieju 2026</div>
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom: 24px;">
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Mecze (W-R-P)</div>
          <div style="font-size:0.95rem; font-weight:800; margin-top:4px;">${stats.gp} (${stats.w}-${stats.d}-${stats.l})</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Bramki +/-</div>
          <div style="font-size:0.95rem; font-weight:800; margin-top:4px;">${stats.gf}:${stats.ga}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Żółte kartki</div>
          <div style="font-size:0.95rem; font-weight:800; color:#f1c40f; margin-top:4px;">${stats.yellow}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Czerwone kartki</div>
          <div style="font-size:0.95rem; font-weight:800; color:var(--red); margin-top:4px;">${stats.red}</div>
        </div>
      </div>

      ${stats.gp > 0 ? `
        <div class="modal__stats-title">📊 Porównanie średnich z turnieju</div>
        
        <!-- Possession comparison -->
        ${renderTeamStatComparisonBar('Posiadanie piłki', stats.possessionAvg, stats.tournamentAvg.possessionPct, '%')}
        <!-- Shots comparison -->
        ${renderTeamStatComparisonBar('Strzały na mecz', stats.shotsAvg, stats.tournamentAvg.totalShots, '')}
        <!-- Shots on target comparison -->
        ${renderTeamStatComparisonBar('Celne strzały na mecz', stats.shotsOnTargetAvg, stats.tournamentAvg.shotsOnTarget, '')}
        <!-- Corners comparison -->
        ${renderTeamStatComparisonBar('Rzuty rożne na mecz', stats.cornersAvg, stats.tournamentAvg.wonCorners, '')}
        <!-- Fouls comparison -->
        ${renderTeamStatComparisonBar('Faule na mecz', stats.foulsAvg, stats.tournamentAvg.foulsCommitted, '')}
        <!-- Spalone comparison -->
        ${renderTeamStatComparisonBar('Spalone na mecz', stats.offsidesAvg, stats.tournamentAvg.offsides, '')}
      ` : `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state__text" style="color: var(--muted);">Statystyki porównawcze będą dostępne po rozegraniu pierwszego meczu.</div>
        </div>
      `}
    </div>

    <!-- Panel 3: Roster -->
    <div id="teamTabContentRoster" class="team-tab-panel" style="display:none;">
      <div id="teamTabRosterContainer"></div>
    </div>
  `;

  // Roster rendering helper (Panel 3)
  const rosterContainer = document.getElementById('teamTabRosterContainer');
  const coach = DATA.rosters && DATA.rosters[normName] ? DATA.rosters[normName].coach : null;
  const coachHTML = coach ? `
    <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom: 16px; font-weight: 600; display:flex; align-items:center; gap:6px; background:var(--bg); border: 1px solid var(--border); padding: 8px 12px; border-radius: var(--radius-sm);">
      <span>👔 Trener reprezentacji:</span>
      <span style="color:var(--yellow); font-weight:700;">${coach}</span>
    </div>
  ` : '';

  if (roster.length === 0) {
    rosterContainer.innerHTML = `
      <div class="modal__stats-title">👥 Kadra zawodników</div>
      ${coachHTML}
      <div class="empty-state" style="padding: 16px;">
        <div class="empty-state__text" style="color:var(--muted); font-size:0.8rem; line-height: 1.4;">
          Skład i statystyki kadry zostaną zaktualizowane w dniu pierwszego meczu tej reprezentacji w turnieju.
        </div>
      </div>
    `;
  } else {
    // Group players by position
    const getPosCategory = (pos) => {
      if (!pos) return 'Inni';
      const p = pos.toLowerCase();
      if (p.includes('goalkeeper') || p === 'gk' || p === 'g') return 'Bramkarze';
      if (p.includes('defender') || p.includes('back') || p === 'def' || p === 'd' || p.includes('cb') || p.includes('lb') || p.includes('rb')) return 'Obrońcy';
      if (p.includes('midfielder') || p === 'mid' || p === 'm' || p.includes('dm') || p.includes('cm') || p.includes('am') || p.includes('lm') || p.includes('rm')) return 'Pomocnicy';
      if (p.includes('forward') || p.includes('striker') || p.includes('wing') || p === 'fw' || p === 'f' || p === 'st' || p.includes('cf') || p.includes('lw') || p.includes('rw')) return 'Napastnicy';
      return 'Inni';
    };

    const categories = {
      'Bramkarze': [],
      'Obrońcy': [],
      'Pomocnicy': [],
      'Napastnicy': [],
      'Inni': []
    };

    roster.forEach(p => {
      const cat = getPosCategory(p.position);
      categories[cat].push(p);
    });

    let rosterHTML = '';
    for (const [catName, playersList] of Object.entries(categories)) {
      if (playersList.length === 0) continue;
      
      playersList.sort((a, b) => {
        const jA = parseInt(a.jersey) || 999;
        const jB = parseInt(b.jersey) || 999;
        return jA - jB;
      });

      rosterHTML += `
        <div style="margin-bottom: 20px;">
          <div style="font-size:0.75rem; font-weight:700; color: var(--yellow); border-bottom: 1px solid var(--border); padding-bottom: 4px; margin-bottom: 8px; text-transform:uppercase; letter-spacing:0.05em;">
            ${catName}
          </div>
          <div style="display:flex; flex-direction:column; gap:2px;">
            ${playersList.map(p => {
              const goals = getPlayerGoals(p.name);
              const assists = getPlayerAssists(p.name);
              const statsBadge = (goals > 0 || assists > 0) ? `
                <span style="font-size: 0.75rem; margin-left: 8px; display:inline-flex; gap:6px; background:var(--bg); border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                  ${goals > 0 ? `<span style="color:var(--yellow)">⚽ ${goals}</span>` : ''}
                  ${assists > 0 ? `<span style="color:var(--blue)">🅰️ ${assists}</span>` : ''}
                </span>
              ` : '';

              return `
                <div class="lineup-player" style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.02); display:flex; align-items:center;">
                  <span class="lineup-player__jersey" style="background:var(--grid); color:var(--text);">${p.jersey || '—'}</span>
                  <span class="lineup-player__name">${p.shortName || p.name}</span>
                  ${statsBadge}
                  <span class="lineup-player__pos" style="margin-left:auto; font-size:0.65rem; color:var(--muted);">${shortenPosition(p.position)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Calculate team contributions
    const teamScorers = (DATA.topScorers || []).filter(s => normalizeTeamName(s.teamName) === normName);
    const teamAssisters = (DATA.topAssisters || []).filter(a => normalizeTeamName(a.teamName) === normName);

    let contributionsHTML = '';
    if (teamScorers.length > 0 || teamAssisters.length > 0) {
      contributionsHTML = `
        <div style="padding:12px; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom: 20px;">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--yellow); margin-bottom:8px;">Liderzy drużyny</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Gole</div>
              ${teamScorers.slice(0, 3).map(s => `<div style="font-size:0.8rem; font-weight:600; margin-top:2px;">${s.name} (${s.goals} ⚽)</div>`).join('') || '<div style="font-size:0.8rem; color:var(--muted);">Brak goli</div>'}
            </div>
            <div>
              <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Asysty</div>
              ${teamAssisters.slice(0, 3).map(a => `<div style="font-size:0.8rem; font-weight:600; margin-top:2px;">${a.name} (${a.assists} 🅰️)</div>`).join('') || '<div style="font-size:0.8rem; color:var(--muted);">Brak asyst</div>'}
            </div>
          </div>
        </div>
      `;
    }

    rosterContainer.innerHTML = `
      <div class="modal__stats-title">👥 Kadra zawodników (${roster.length} zgłoszonych)</div>
      ${coachHTML}
      ${contributionsHTML}
      <div style="max-height: 350px; overflow-y: auto; padding-right: 8px;">
        ${rosterHTML}
      </div>
    `;
  }

  // Clear original teamModalRoster container
  document.getElementById('teamModalRoster').innerHTML = '';

  // Setup tab switcher logic
  const tabButtons = document.querySelectorAll('#teamModalTabs .nav-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.dataset.teamTab;
      document.querySelectorAll('.team-tab-panel').forEach(panel => {
        panel.style.display = 'none';
      });

      if (targetTab === 'info') {
        document.getElementById('teamTabContentInfo').style.display = '';
      } else if (targetTab === 'stats') {
        document.getElementById('teamTabContentStats').style.display = '';
      } else if (targetTab === 'roster') {
        document.getElementById('teamTabContentRoster').style.display = '';
      }
    });
  });

  // Restore active tab
  if (activeTab && activeTab !== 'info') {
    const tabButtons = document.querySelectorAll('#teamModalTabs .nav-tab');
    tabButtons.forEach(b => b.classList.remove('active'));
    const targetBtn = Array.from(tabButtons).find(b => b.dataset.teamTab === activeTab);
    if (targetBtn) {
      targetBtn.classList.add('active');
      document.querySelectorAll('.team-tab-panel').forEach(panel => {
        panel.style.display = 'none';
      });
      if (activeTab === 'stats') {
        document.getElementById('teamTabContentStats').style.display = '';
      } else if (activeTab === 'roster') {
        document.getElementById('teamTabContentRoster').style.display = '';
      }
    }
  }

  document.getElementById('teamModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTeamModal() {
  const overlay = document.getElementById('teamModalOverlay');
  overlay.classList.remove('active');
  delete overlay.dataset.activeTeamName;
  document.body.style.overflow = '';
}

function setupTeamModal() {
  document.getElementById('teamModalClose').addEventListener('click', closeTeamModal);
  document.getElementById('teamModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTeamModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTeamModal();
  });
}

function getTeamTournamentStats(teamName) {
  let gp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0, yellow = 0, red = 0;
  let possessionSum = 0, shotsSum = 0, shotsOnTargetSum = 0, cornersSum = 0, foulsSum = 0, offsidesSum = 0;
  const normName = normalizeTeamName(teamName);

  // Tournament-wide totals to compute averages
  let tourCompletedCount = 0;
  let tourPossessionSum = 0, tourShotsSum = 0, tourShotsOnTargetSum = 0, tourCornersSum = 0, tourFoulsSum = 0, tourOffsidesSum = 0;

  if (DATA && DATA.matches) {
    DATA.matches.forEach(m => {
      if (!m.status.completed) return;
      
      const isHome = normalizeTeamName(m.home.name) === normName;
      const isAway = normalizeTeamName(m.away.name) === normName;

      // Add to tournament aggregates
      if (m.details?.teamStats) {
        m.details.teamStats.forEach(t => {
          tourCompletedCount++;
          tourPossessionSum += parseFloat(t.stats.possessionPct?.value || 0);
          tourShotsSum += parseInt(t.stats.totalShots?.value || 0);
          tourShotsOnTargetSum += parseInt(t.stats.shotsOnTarget?.value || 0);
          tourCornersSum += parseInt(t.stats.wonCorners?.value || 0);
          tourFoulsSum += parseInt(t.stats.foulsCommitted?.value || 0);
          tourOffsidesSum += parseInt(t.stats.offsides?.value || 0);
        });
      }

      if (isHome || isAway) {
        gp++;
        const hs = parseInt(m.home.score) || 0;
        const as = parseInt(m.away.score) || 0;

        if (isHome) {
          gf += hs;
          ga += as;
          if (hs > as) w++;
          else if (hs < as) l++;
          else d++;
        } else {
          gf += as;
          ga += hs;
          if (as > hs) w++;
          else if (as < hs) l++;
          else d++;
        }

        if (m.details?.teamStats) {
          const stats = m.details.teamStats.find(t => 
            normalizeTeamName(t.name) === normName
          );
          if (stats) {
            yellow += parseInt(stats.stats.yellowCards?.value || 0);
            red += parseInt(stats.stats.redCards?.value || 0);
            possessionSum += parseFloat(stats.stats.possessionPct?.value || 0);
            shotsSum += parseInt(stats.stats.totalShots?.value || 0);
            shotsOnTargetSum += parseInt(stats.stats.shotsOnTarget?.value || 0);
            cornersSum += parseInt(stats.stats.wonCorners?.value || 0);
            foulsSum += parseInt(stats.stats.foulsCommitted?.value || 0);
            offsidesSum += parseInt(stats.stats.offsides?.value || 0);
          }
        }
      }
    });
  }

  // Calculate team averages
  const possessionAvg = gp > 0 ? (possessionSum / gp) : 0;
  const shotsAvg = gp > 0 ? (shotsSum / gp) : 0;
  const shotsOnTargetAvg = gp > 0 ? (shotsOnTargetSum / gp) : 0;
  const cornersAvg = gp > 0 ? (cornersSum / gp) : 0;
  const foulsAvg = gp > 0 ? (foulsSum / gp) : 0;
  const offsidesAvg = gp > 0 ? (offsidesSum / gp) : 0;

  // Calculate tournament averages
  const tourPossessionAvg = tourCompletedCount > 0 ? (tourPossessionSum / tourCompletedCount) : 0;
  const tourShotsAvg = tourCompletedCount > 0 ? (tourShotsSum / tourCompletedCount) : 0;
  const tourShotsOnTargetAvg = tourCompletedCount > 0 ? (tourShotsOnTargetSum / tourCompletedCount) : 0;
  const tourCornersAvg = tourCompletedCount > 0 ? (tourCornersSum / tourCompletedCount) : 0;
  const tourFoulsAvg = tourCompletedCount > 0 ? (tourFoulsSum / tourCompletedCount) : 0;
  const tourOffsidesAvg = tourCompletedCount > 0 ? (tourOffsidesSum / tourCompletedCount) : 0;

  return {
    gp, w, d, l, gf, ga, yellow, red,
    possessionAvg, shotsAvg, shotsOnTargetAvg, cornersAvg, foulsAvg, offsidesAvg,
    tournamentAvg: {
      possessionPct: tourPossessionAvg,
      totalShots: tourShotsAvg,
      shotsOnTarget: tourShotsOnTargetAvg,
      wonCorners: tourCornersAvg,
      foulsCommitted: tourFoulsAvg,
      offsides: tourOffsidesAvg
    }
  };
}

function getTeamRoster(teamName) {
  const normName = normalizeTeamName(teamName);
  if (DATA && DATA.rosters && DATA.rosters[normName]) {
    return DATA.rosters[normName].players || [];
  }

  let players = [];
  if (DATA && DATA.matches) {
    DATA.matches.forEach(m => {
      if (m.details?.lineups) {
        const lineup = m.details.lineups.find(l => 
          normalizeTeamName(l.teamName) === normName
        );
        if (lineup && lineup.players && lineup.players.length > 0 && players.length === 0) {
          players = lineup.players;
        }
      }
    });
  }
  return players;
}

function getTeamMatches(teamName) {
  const normName = normalizeTeamName(teamName);
  if (!DATA || !DATA.matches) return [];
  return DATA.matches.filter(m => 
    normalizeTeamName(m.home.name) === normName || 
    normalizeTeamName(m.away.name) === normName
  );
}

function getPlayerGoals(name) {
  if (!DATA || !DATA.topScorers) return 0;
  const norm = name.toLowerCase().trim();
  const p = DATA.topScorers.find(x => 
    x.name.toLowerCase().trim() === norm || 
    x.name.toLowerCase().includes(norm) || 
    norm.includes(x.name.toLowerCase())
  );
  return p ? p.goals : 0;
}

function getPlayerAssists(name) {
  if (!DATA || !DATA.topAssisters) return 0;
  const norm = name.toLowerCase().trim();
  const p = DATA.topAssisters.find(x => 
    x.name.toLowerCase().trim() === norm || 
    x.name.toLowerCase().includes(norm) || 
    norm.includes(x.name.toLowerCase())
  );
  return p ? p.assists : 0;
}

function renderTeamStatComparisonBar(label, teamVal, tourVal, suffix) {
  const teamNum = parseFloat(teamVal) || 0;
  const tourNum = parseFloat(tourVal) || 0;
  const max = Math.max(teamNum, tourNum, 1);
  const teamPct = (teamNum / max * 100).toFixed(1);
  const tourPct = (tourNum / max * 100).toFixed(1);

  const teamHighlight = teamNum > tourNum ? 'color: var(--yellow);' : '';
  const tourHighlight = tourNum > teamNum ? 'color: var(--muted);' : '';

  return `
    <div class="stat-row" style="padding: 6px 0;">
      <span class="stat-row__value stat-row__value--home" style="${teamHighlight}">${teamNum.toFixed(1)}${suffix}</span>
      <div class="stat-bar stat-bar--home">
        <div class="stat-bar__fill ${teamNum >= tourNum ? '' : 'stat-bar__fill--dim'}" style="width: ${teamPct}%"></div>
      </div>
      <span class="stat-row__label" style="font-size: 0.65rem; min-width: 120px;">${label}</span>
      <div class="stat-bar">
        <div class="stat-bar__fill ${tourNum >= teamNum ? '' : 'stat-bar__fill--dim'}" style="width: ${tourPct}%"></div>
      </div>
      <span class="stat-row__value stat-row__value--away" style="${tourHighlight}">${tourNum.toFixed(1)}${suffix}</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:0.6rem; color:var(--muted); margin-top:-4px; margin-bottom:8px; padding:0 4px;">
      <span>Średnia drużyny</span>
      <span>Średnia turnieju</span>
    </div>
  `;
}

// Make openMatchModal and openTeamModal globally available
window.openMatchModal = openMatchModal;
window.openTeamModal = openTeamModal;

function startRealTimeUpdates() {
  setInterval(async () => {
    try {
      const res = await fetch('data/matches.json?t=' + Date.now());
      const newData = await res.json();
      
      if (newData.meta?.lastUpdated !== DATA.meta?.lastUpdated) {
        console.log('🔄 Dashboard: background data changed, refreshing UI...');
        DATA = newData;
        applyLiveOverride(); // keep fresh ESPN data for the open match — don't let stale scraper data win

        // Refresh main page stats
        renderHeroStats();
        renderMatches();
        renderScorers();
        renderGroups();
        renderTournamentStats();
        renderRecords();
        updateLastUpdated();
        
        // Refresh open match modal
        const matchOverlay = document.getElementById('modalOverlay');
        if (matchOverlay && matchOverlay.classList.contains('active') && matchOverlay.dataset.activeMatchId) {
          openMatchModal(matchOverlay.dataset.activeMatchId);
        }
        
        // Refresh open team modal
        const teamOverlay = document.getElementById('teamModalOverlay');
        if (teamOverlay && teamOverlay.classList.contains('active') && teamOverlay.dataset.activeTeamName) {
          openTeamModal(teamOverlay.dataset.activeTeamName);
        }
      }
    } catch (err) {
      console.warn('Real-time sync failed:', err);
    }
  }, 5000); // Check every 5 seconds
}
