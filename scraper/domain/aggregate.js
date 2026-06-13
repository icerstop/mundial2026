
function computeAggregates(allMatches) {
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

  return { completedMatches, topAssisters, topCanadian, topScorers, totalGoals };
}

module.exports = { computeAggregates };
