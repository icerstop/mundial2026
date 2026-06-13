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


module.exports = { parseSummary };
