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


module.exports = { parseScoreboardEvent };
