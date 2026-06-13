export function getPlayerStats(data, playerName) {
  let goals = 0;
  let assists = 0;
  let appearances = 0;
  let cleanSheets = 0;
  let wins = 0;
  const searchName = playerName.toLowerCase();

  for (const match of data?.matches || []) {
    if (!match.details) continue;

    let played = false;
    let teamId = null;
    for (const lineup of match.details.lineups || []) {
      const player = (lineup.players || []).find(item =>
        item.name.toLowerCase().includes(searchName) ||
        item.shortName?.toLowerCase().includes(searchName)
      );
      if (player) {
        played = true;
        teamId = lineup.teamId;
      }
    }

    if (!played || !match.status.completed) continue;
    appearances++;
    const isHome = match.home.id === teamId;
    const isAway = match.away.id === teamId;
    if (isHome && match.home.winner) wins++;
    if (isAway && match.away.winner) wins++;
    if (isHome && (parseInt(match.away.score, 10) || 0) === 0) cleanSheets++;
    if (isAway && (parseInt(match.home.score, 10) || 0) === 0) cleanSheets++;
  }

  const scorer = (data?.topScorers || []).find(item =>
    item.name.toLowerCase().includes(searchName)
  );
  const assister = (data?.topAssisters || []).find(item =>
    item.name.toLowerCase().includes(searchName)
  );
  if (scorer) goals = scorer.goals;
  if (assister) assists = assister.assists;

  return { goals, assists, appearances, cleanSheets, wins };
}

export function checkPlayerHatTrick(data, playerName) {
  const scorer = (data?.topScorers || []).find(item =>
    item.name.toLowerCase().includes(playerName.toLowerCase())
  );
  if (!scorer) return false;

  const goalsByMatch = {};
  for (const goal of scorer.goalDetails || []) {
    goalsByMatch[goal.matchId] = (goalsByMatch[goal.matchId] || 0) + 1;
  }
  return Object.values(goalsByMatch).some(count => count >= 3);
}

export function getCountryMatchesCount(data, localName, englishName) {
  const local = localName.toLowerCase();
  const english = englishName.toLowerCase();
  return (data?.matches || []).filter(match =>
    match.status.completed &&
    [match.home.name, match.away.name].some(name => {
      const normalized = name.toLowerCase();
      return normalized.includes(local) || normalized.includes(english);
    })
  ).length;
}

export function getFranceMatchesCount(data) {
  return getCountryMatchesCount(data, 'francja', 'france');
}
