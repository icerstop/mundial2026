import { buildGroupsFromMatches, rankThirdPlaced } from './groups.mjs';
import { normalizeTeamName } from './teams.mjs';

const ROUND_CONFIG = [
  { id: 'rd32', title: '1/16 finału', matchCount: 16 },
  { id: 'rd16', title: '1/8 finału', matchCount: 8 },
  { id: 'qf', title: 'Ćwierćfinały', matchCount: 4 },
  { id: 'sf', title: 'Półfinały', matchCount: 2 },
  { id: 'final', title: 'Finał', matchCount: 1 },
];

const ROUND_REF = {
  'Round of 32': 'rd32',
  'Round of 16': 'rd16',
  Quarterfinal: 'qf',
  Semifinal: 'sf',
};

function groupLetter(groupName) {
  return String(groupName || '').replace('Grupa ', '').replace('Group ', '').trim();
}

function groupByLetter(groups) {
  return Object.fromEntries(groups.map(group => [groupLetter(group.name), group]));
}

function scoreOf(match, side) {
  const value = match?.[side]?.score;
  return value == null || value === '' ? null : parseInt(value, 10);
}

function completedWinner(match) {
  if (!match?.status?.completed) return null;
  const homeScore = scoreOf(match, 'home');
  const awayScore = scoreOf(match, 'away');
  if (homeScore == null || awayScore == null || homeScore === awayScore) return null;
  return homeScore > awayScore ? match.home : match.away;
}

function teamCandidate(team, extra = {}) {
  if (!team?.name) return null;
  return {
    key: normalizeTeamName(team.name),
    name: team.name,
    logo: team.logo || '',
    abbr: team.abbr || '',
    ...extra,
  };
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates.filter(Boolean)) {
    const key = candidate.key || normalizeTeamName(candidate.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...candidate, key });
  }
  return out;
}

function isRoundOf32Seed(match) {
  const names = `${match?.home?.name || ''} ${match?.away?.name || ''}`;
  return /Group [A-L]/.test(names) || /Third Place Group/.test(names);
}

function stageMatches(matches, stage) {
  const sorted = matches
    .filter(match => !match.group)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (stage.id === 'rd32') {
    return sorted.filter(isRoundOf32Seed).slice(0, stage.matchCount);
  }
  if (stage.id === 'rd16') {
    return sorted.filter(match => /Round of 32 \d+ Winner/.test(`${match.home?.name} ${match.away?.name}`)).slice(0, stage.matchCount);
  }
  if (stage.id === 'qf') {
    return sorted.filter(match => /Round of 16 \d+ Winner/.test(`${match.home?.name} ${match.away?.name}`)).slice(0, stage.matchCount);
  }
  if (stage.id === 'sf') {
    return sorted.filter(match => /Quarterfinal \d+ Winner/.test(`${match.home?.name} ${match.away?.name}`)).slice(0, stage.matchCount);
  }
  return sorted.filter(match => /Semifinal \d+ Winner/.test(`${match.home?.name} ${match.away?.name}`)).slice(0, stage.matchCount);
}

function nodeId(stageId, number) {
  return `${stageId}-${number}`;
}

function makeSlot(team, side) {
  const rawLabel = team?.name || '';
  return {
    side,
    rawLabel,
    actualTeam: team?.id ? teamCandidate(team, { tag: 'obsadzony slot' }) : null,
    label: rawLabel
      .replace('Group ', 'Grupa ')
      .replace('Winner', 'zwycięzca')
      .replace('2nd Place', '2. miejsce')
      .replace('Third Place', '3. miejsce')
      .replace('Round of 32', '1/16')
      .replace('Round of 16', '1/8')
      .replace('Quarterfinal', 'ćwierćfinał')
      .replace('Semifinal', 'półfinał'),
  };
}

function makeNode(match, stageId, number) {
  return {
    id: nodeId(stageId, number),
    stageId,
    number,
    matchId: match.id,
    date: match.date,
    venue: match.venue,
    status: match.status,
    home: makeSlot(match.home, 'home'),
    away: makeSlot(match.away, 'away'),
    completedWinner: completedWinner(match),
  };
}

function groupPositionCandidates(slot, groupsByLetter) {
  const match = slot.rawLabel.match(/^Group ([A-L]) (Winner|2nd Place)$/);
  if (!match) return null;

  const letter = match[1];
  const targetIndex = match[2] === 'Winner' ? 0 : 1;
  const group = groupsByLetter[letter];
  if (!group) return null;

  const entries = group.standings || [];
  const current = entries[targetIndex];
  const candidates = entries.map((entry, index) => teamCandidate(entry.team, {
    group: `Grupa ${letter}`,
    currentPlace: index + 1,
    points: entry.stats.points,
    goalDifference: entry.stats.pointsFor - entry.stats.pointsAgainst,
    tag: index === targetIndex ? 'aktualnie w slocie' : `${index + 1}. miejsce teraz`,
  }));

  return {
    type: 'group-position',
    sourceLabel: `Grupa ${letter} · ${targetIndex === 0 ? 'zwycięzca' : '2. miejsce'}`,
    current: current ? teamCandidate(current.team, {
      group: `Grupa ${letter}`,
      currentPlace: targetIndex + 1,
      points: current.stats.points,
      tag: 'aktualnie w slocie',
    }) : null,
    candidates: uniqueCandidates(candidates),
  };
}

function thirdPlaceCandidates(slot, groupsByLetter, thirdRanked) {
  const match = slot.rawLabel.match(/^Third Place Group ([A-L/]+)$/);
  if (!match) return null;

  const letters = match[1].split('/');
  const thirdByGroup = new Map(thirdRanked.map(item => [groupLetter(item.group), item]));
  const candidates = letters.map(letter => {
    const group = groupsByLetter[letter];
    const third = group?.standings?.[2];
    if (!third) return null;
    const ranked = thirdByGroup.get(letter);
    const rank = ranked ? thirdRanked.indexOf(ranked) + 1 : null;
    return teamCandidate(third.team, {
      group: `Grupa ${letter}`,
      currentPlace: 3,
      points: third.stats.points,
      goalDifference: third.stats.pointsFor - third.stats.pointsAgainst,
      tag: ranked?.entry?.qualifyThird ? `3. miejsce · obecnie awans #${rank}` : '3. miejsce · poza top 8 teraz',
      qualifiesNow: !!ranked?.entry?.qualifyThird,
    });
  });

  const current = uniqueCandidates(candidates)
    .filter(candidate => candidate.qualifiesNow)
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)[0] || null;

  return {
    type: 'third-place',
    sourceLabel: `3. miejsce z grup ${letters.join(', ')}`,
    current,
    candidates: uniqueCandidates(candidates),
    allowedGroups: letters.map(letter => `Grupa ${letter}`),
  };
}

function refCandidates(slot, nodesById, context, visiting = new Set()) {
  const match = slot.rawLabel.match(/^(Round of 32|Round of 16|Quarterfinal|Semifinal) (\d+) (Winner|Loser)$/);
  if (!match) return null;

  const refStage = ROUND_REF[match[1]];
  const refNumber = parseInt(match[2], 10);
  const refNode = nodesById[nodeId(refStage, refNumber)];
  if (!refNode) return null;

  const refKey = `${refNode.id}:${match[3]}`;
  if (visiting.has(refKey)) return null;
  visiting.add(refKey);

  if (refNode.completedWinner) {
    const winner = teamCandidate(refNode.completedWinner, { tag: `wygrał ${stageTitle(refStage)} #${refNumber}` });
    return {
      type: 'winner-ref',
      sourceLabel: `${stageTitle(refStage)} #${refNumber} · zwycięzca`,
      current: winner,
      candidates: winner ? [winner] : [],
      refNodeId: refNode.id,
    };
  }

  const home = resolveSlot(refNode.home, context, visiting);
  const away = resolveSlot(refNode.away, context, visiting);
  const candidates = uniqueCandidates([
    ...(home?.candidates || []),
    ...(away?.candidates || []),
  ]).map(candidate => ({
    ...candidate,
    tag: candidate.tag || `może wygrać ${stageTitle(refStage)} #${refNumber}`,
  }));

  return {
    type: 'winner-ref',
    sourceLabel: `${stageTitle(refStage)} #${refNumber} · zwycięzca`,
    current: null,
    candidates,
    refNodeId: refNode.id,
  };
}

function actualTeamCandidates(slot) {
  if (!slot.actualTeam) return null;
  const hasPlaceholder = /^(Group [A-L]|Third Place Group|Round of 32|Round of 16|Quarterfinal|Semifinal)/.test(slot.rawLabel);
  if (hasPlaceholder) return null;

  return {
    type: 'actual-team',
    sourceLabel: 'Obsadzony slot',
    current: slot.actualTeam,
    candidates: [slot.actualTeam],
  };
}

function stageTitle(stageId) {
  return ROUND_CONFIG.find(round => round.id === stageId)?.title || stageId;
}

function resolveSlot(slot, context, visiting = new Set()) {
  if (!slot) return null;

  return groupPositionCandidates(slot, context.groupsByLetter)
    || thirdPlaceCandidates(slot, context.groupsByLetter, context.thirdRanked)
    || refCandidates(slot, context.nodesById, context, visiting)
    || actualTeamCandidates(slot)
    || {
      type: 'unknown',
      sourceLabel: slot.label,
      current: null,
      candidates: [],
    };
}

export function buildTournamentBracket(data = {}) {
  const matches = data.matches || [];
  const groups = buildGroupsFromMatches(matches);
  const thirdRanked = rankThirdPlaced(groups);
  const rounds = ROUND_CONFIG.map(round => ({
    ...round,
    matches: stageMatches(matches, round).map((match, index) => makeNode(match, round.id, index + 1)),
  }));
  const nodesById = Object.fromEntries(rounds.flatMap(round => round.matches.map(node => [node.id, node])));
  const context = {
    groups,
    groupsByLetter: groupByLetter(groups),
    thirdRanked,
    nodesById,
  };

  for (const round of rounds) {
    for (const node of round.matches) {
      node.home.resolution = resolveSlot(node.home, context);
      node.away.resolution = resolveSlot(node.away, context);
      node.candidates = uniqueCandidates([
        ...(node.home.resolution?.candidates || []),
        ...(node.away.resolution?.candidates || []),
      ]);
    }
  }

  return {
    rounds,
    nodesById,
    groups,
    thirdRanked,
  };
}

export function findBracketSlot(bracket, nodeIdValue, side) {
  const node = bracket?.nodesById?.[nodeIdValue];
  if (!node || !node[side]) return null;
  return {
    node,
    side,
    slot: node[side],
    resolution: node[side].resolution,
  };
}
