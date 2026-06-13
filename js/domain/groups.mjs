import {
  GROUPS_STRUCTURE,
  findGroupNameForTeam,
  normalizeTeamName,
} from './teams.mjs';

export function rankThirdPlaced(groups) {
  return groups
    .map(group => ({ group: group.name, entry: group.standings[2] }))
    .filter(item => item.entry && item.entry.stats.gamesPlayed > 0)
    .map(item => ({
      ...item,
      goalDifference: item.entry.stats.pointsFor - item.entry.stats.pointsAgainst,
    }))
    .sort((a, b) =>
      b.entry.stats.points - a.entry.stats.points ||
      b.goalDifference - a.goalDifference ||
      b.entry.stats.pointsFor - a.entry.stats.pointsFor ||
      a.entry.team.name.localeCompare(b.entry.team.name)
    );
}

export function buildGroupsFromMatches(matches = []) {
  const logos = {};
  for (const match of matches) {
    if (match.home?.name) logos[normalizeTeamName(match.home.name)] = match.home.logo;
    if (match.away?.name) logos[normalizeTeamName(match.away.name)] = match.away.logo;
  }

  const standings = Object.fromEntries(
    Object.entries(GROUPS_STRUCTURE).map(([groupName, teamNames]) => [
      groupName,
      teamNames.map(teamName => ({
        team: {
          name: teamName,
          logo: logos[normalizeTeamName(teamName)] || '',
        },
        stats: {
          gamesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          points: 0,
        },
      })),
    ])
  );

  for (const match of matches.filter(item => item.status?.completed)) {
    const groupName =
      findGroupNameForTeam(match.home?.name) ||
      findGroupNameForTeam(match.away?.name) ||
      match.group;
    if (!groupName || !standings[groupName]) continue;

    const homeEntry = standings[groupName].find(
      entry => normalizeTeamName(entry.team.name) === normalizeTeamName(match.home?.name)
    );
    const awayEntry = standings[groupName].find(
      entry => normalizeTeamName(entry.team.name) === normalizeTeamName(match.away?.name)
    );
    if (!homeEntry || !awayEntry) continue;

    const homeScore = parseInt(match.home.score, 10) || 0;
    const awayScore = parseInt(match.away.score, 10) || 0;
    homeEntry.stats.gamesPlayed++;
    awayEntry.stats.gamesPlayed++;
    homeEntry.stats.pointsFor += homeScore;
    homeEntry.stats.pointsAgainst += awayScore;
    awayEntry.stats.pointsFor += awayScore;
    awayEntry.stats.pointsAgainst += homeScore;

    if (homeScore > awayScore) {
      homeEntry.stats.wins++;
      homeEntry.stats.points += 3;
      awayEntry.stats.losses++;
    } else if (awayScore > homeScore) {
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

  const groups = Object.entries(standings).map(([groupName, entries]) => ({
    name: groupName.replace('Group ', 'Grupa '),
    standings: [...entries].sort((a, b) => {
      const goalDifferenceA = a.stats.pointsFor - a.stats.pointsAgainst;
      const goalDifferenceB = b.stats.pointsFor - b.stats.pointsAgainst;
      return (
        b.stats.points - a.stats.points ||
        goalDifferenceB - goalDifferenceA ||
        b.stats.pointsFor - a.stats.pointsFor ||
        a.team.name.localeCompare(b.team.name)
      );
    }),
  }));

  for (const item of rankThirdPlaced(groups).slice(0, 8)) {
    item.entry.qualifyThird = true;
  }

  return groups;
}
