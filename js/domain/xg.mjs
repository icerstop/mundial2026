export function matchXG(match) {
  const expectedGoalsConceded = {};
  for (const team of match.details?.leaders || []) {
    const saves = (team.categories || []).find(category => category.name === 'saves');
    const value = saves?.leader?.stats?.find(
      stat => stat.name === 'expectedGoalsConceded'
    )?.value;
    if (value != null && value !== '') {
      expectedGoalsConceded[team.teamId] = parseFloat(value);
    }
  }

  return {
    homeXG: match.away.id in expectedGoalsConceded
      ? expectedGoalsConceded[match.away.id]
      : null,
    awayXG: match.home.id in expectedGoalsConceded
      ? expectedGoalsConceded[match.home.id]
      : null,
  };
}

export function xgVerdict(match) {
  const { homeXG, awayXG } = matchXG(match);
  if (homeXG == null || awayXG == null) return { txt: '—', cls: '' };

  const resultDirection = Math.sign(
    (parseInt(match.home.score, 10) || 0) - (parseInt(match.away.score, 10) || 0)
  );
  const xgDifference = homeXG - awayXG;
  const xgDirection = Math.abs(xgDifference) < 0.3 ? 0 : Math.sign(xgDifference);

  if (resultDirection === 0) {
    if (xgDirection === 0) return { txt: 'wyrównany mecz', cls: '' };
    return {
      txt: `${xgDirection > 0 ? match.home.abbr : match.away.abbr} stracił punkty`,
      cls: 'xg-warn',
    };
  }
  if (resultDirection === xgDirection) {
    return { txt: 'wynik zasłużony', cls: 'xg-pos' };
  }
  return {
    txt: `${resultDirection > 0 ? match.home.abbr : match.away.abbr} ponad stan`,
    cls: 'xg-neg',
  };
}

export function computeTeamXG(matches = []) {
  const teams = new Map();
  const getTeam = team => {
    if (!teams.has(team.id)) {
      teams.set(team.id, {
        id: team.id,
        name: team.name,
        logo: team.logo,
        abbr: team.abbr,
        mp: 0,
        gf: 0,
        ga: 0,
        xgf: 0,
        xga: 0,
        gfX: 0,
        gaX: 0,
        xgMF: 0,
        xgMA: 0,
        poss: [],
        passPct: [],
        shots: 0,
        sot: 0,
        def: 0,
        statM: 0,
      });
    }
    return teams.get(team.id);
  };

  for (const match of matches.filter(item => item.status?.completed)) {
    const { homeXG, awayXG } = matchXG(match);
    const sides = [
      {
        team: match.home,
        homeAway: 'home',
        goalsFor: +match.home.score || 0,
        goalsAgainst: +match.away.score || 0,
        xgFor: homeXG,
        xgAgainst: awayXG,
      },
      {
        team: match.away,
        homeAway: 'away',
        goalsFor: +match.away.score || 0,
        goalsAgainst: +match.home.score || 0,
        xgFor: awayXG,
        xgAgainst: homeXG,
      },
    ];

    for (const side of sides) {
      const entry = getTeam(side.team);
      entry.mp++;
      entry.gf += side.goalsFor;
      entry.ga += side.goalsAgainst;
      if (side.xgFor != null) {
        entry.xgf += side.xgFor;
        entry.gfX += side.goalsFor;
        entry.xgMF++;
      }
      if (side.xgAgainst != null) {
        entry.xga += side.xgAgainst;
        entry.gaX += side.goalsAgainst;
        entry.xgMA++;
      }

      const teamStats = (match.details?.teamStats || []).find(
        item => item.homeAway === side.homeAway
      );
      if (!teamStats) continue;

      const stats = teamStats.stats || {};
      if (stats.possessionPct?.value) {
        entry.poss.push(parseFloat(stats.possessionPct.value));
      }
      if (stats.passPct?.value) {
        entry.passPct.push(parseFloat(stats.passPct.value));
      }
      entry.shots += parseInt(stats.totalShots?.value || 0, 10);
      entry.sot += parseInt(stats.shotsOnTarget?.value || 0, 10);
      entry.def +=
        parseInt(stats.totalTackles?.value || 0, 10) +
        parseInt(stats.interceptions?.value || 0, 10);
      entry.statM++;
    }
  }

  const average = values => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

  return [...teams.values()].map(entry => ({
    ...entry,
    avgPoss: average(entry.poss),
    avgPassPct: average(entry.passPct),
    defPerMatch: entry.statM ? entry.def / entry.statM : null,
    finishing: entry.xgMF ? entry.gfX - entry.xgf : null,
  }));
}
