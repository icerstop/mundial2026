import { normalizeTeamName } from './teams.mjs';

export function getTeamTournamentStats(data, teamName) {
  let gp = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let yellow = 0;
  let red = 0;
  let possessionSum = 0;
  let shotsSum = 0;
  let shotsOnTargetSum = 0;
  let cornersSum = 0;
  let foulsSum = 0;
  let offsidesSum = 0;
  let tournamentTeamRows = 0;
  let tournamentPossession = 0;
  let tournamentShots = 0;
  let tournamentShotsOnTarget = 0;
  let tournamentCorners = 0;
  let tournamentFouls = 0;
  let tournamentOffsides = 0;
  const normalizedName = normalizeTeamName(teamName);

  for (const match of data?.matches || []) {
    if (!match.status?.completed) continue;

    const isHome = normalizeTeamName(match.home.name) === normalizedName;
    const isAway = normalizeTeamName(match.away.name) === normalizedName;

    for (const teamStats of match.details?.teamStats || []) {
      tournamentTeamRows++;
      tournamentPossession += parseFloat(teamStats.stats.possessionPct?.value || 0);
      tournamentShots += parseInt(teamStats.stats.totalShots?.value || 0, 10);
      tournamentShotsOnTarget += parseInt(teamStats.stats.shotsOnTarget?.value || 0, 10);
      tournamentCorners += parseInt(teamStats.stats.wonCorners?.value || 0, 10);
      tournamentFouls += parseInt(teamStats.stats.foulsCommitted?.value || 0, 10);
      tournamentOffsides += parseInt(teamStats.stats.offsides?.value || 0, 10);
    }

    if (!isHome && !isAway) continue;
    gp++;
    const homeScore = parseInt(match.home.score, 10) || 0;
    const awayScore = parseInt(match.away.score, 10) || 0;

    if (isHome) {
      goalsFor += homeScore;
      goalsAgainst += awayScore;
      if (homeScore > awayScore) wins++;
      else if (homeScore < awayScore) losses++;
      else draws++;
    } else {
      goalsFor += awayScore;
      goalsAgainst += homeScore;
      if (awayScore > homeScore) wins++;
      else if (awayScore < homeScore) losses++;
      else draws++;
    }

    const teamStats = (match.details?.teamStats || []).find(
      item => normalizeTeamName(item.name) === normalizedName
    );
    if (!teamStats) continue;
    yellow += parseInt(teamStats.stats.yellowCards?.value || 0, 10);
    red += parseInt(teamStats.stats.redCards?.value || 0, 10);
    possessionSum += parseFloat(teamStats.stats.possessionPct?.value || 0);
    shotsSum += parseInt(teamStats.stats.totalShots?.value || 0, 10);
    shotsOnTargetSum += parseInt(teamStats.stats.shotsOnTarget?.value || 0, 10);
    cornersSum += parseInt(teamStats.stats.wonCorners?.value || 0, 10);
    foulsSum += parseInt(teamStats.stats.foulsCommitted?.value || 0, 10);
    offsidesSum += parseInt(teamStats.stats.offsides?.value || 0, 10);
  }

  const teamAverage = value => gp ? value / gp : 0;
  const tournamentAverage = value => tournamentTeamRows
    ? value / tournamentTeamRows
    : 0;

  return {
    gp,
    w: wins,
    d: draws,
    l: losses,
    gf: goalsFor,
    ga: goalsAgainst,
    yellow,
    red,
    possessionAvg: teamAverage(possessionSum),
    shotsAvg: teamAverage(shotsSum),
    shotsOnTargetAvg: teamAverage(shotsOnTargetSum),
    cornersAvg: teamAverage(cornersSum),
    foulsAvg: teamAverage(foulsSum),
    offsidesAvg: teamAverage(offsidesSum),
    tournamentAvg: {
      possessionPct: tournamentAverage(tournamentPossession),
      totalShots: tournamentAverage(tournamentShots),
      shotsOnTarget: tournamentAverage(tournamentShotsOnTarget),
      wonCorners: tournamentAverage(tournamentCorners),
      foulsCommitted: tournamentAverage(tournamentFouls),
      offsides: tournamentAverage(tournamentOffsides),
    },
  };
}

export function getTeamRoster(data, teamName) {
  const normalizedName = normalizeTeamName(teamName);
  if (data?.rosters?.[normalizedName]) {
    return data.rosters[normalizedName].players || [];
  }

  for (const match of data?.matches || []) {
    const lineup = match.details?.lineups?.find(
      item => normalizeTeamName(item.teamName) === normalizedName
    );
    if (lineup?.players?.length) return lineup.players;
  }
  return [];
}

export function getTeamMatches(data, teamName) {
  const normalizedName = normalizeTeamName(teamName);
  return (data?.matches || []).filter(match =>
    normalizeTeamName(match.home.name) === normalizedName ||
    normalizeTeamName(match.away.name) === normalizedName
  );
}

function getPlayerValue(list, name, key) {
  const normalizedName = name.toLowerCase().trim();
  const player = (list || []).find(item => {
    const candidate = item.name.toLowerCase().trim();
    return candidate === normalizedName ||
      candidate.includes(normalizedName) ||
      normalizedName.includes(candidate);
  });
  return player ? player[key] : 0;
}

export function getPlayerGoals(data, name) {
  return getPlayerValue(data?.topScorers, name, 'goals');
}

export function getPlayerAssists(data, name) {
  return getPlayerValue(data?.topAssisters, name, 'assists');
}
