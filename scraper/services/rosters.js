
const fs = require('fs');
const { COACH_OVERRIDES, OUT_FILE } = require('../config');
const { normalizeTeamName } = require('../domain/teams');
const { fetchJSON, sleep } = require('../lib/http');

async function loadRosters(allMatches, force = false) {
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

  return rosters;
}

module.exports = { loadRosters };
