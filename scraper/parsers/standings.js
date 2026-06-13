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


module.exports = { parseStandings };
