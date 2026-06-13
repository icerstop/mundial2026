import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGroupsFromMatches, rankThirdPlaced } from '../js/domain/groups.mjs';
import { getTeamMatches, getTeamTournamentStats } from '../js/domain/team.mjs';
import { normalizeTeamName } from '../js/domain/teams.mjs';
import { computeTeamXG, matchXG, xgVerdict } from '../js/domain/xg.mjs';
import { espnDateStr } from '../js/services/live-scores.mjs';

function team(id, name, abbr) {
  return { id, name, abbr, logo: `${id}.png`, score: null, winner: false };
}

function completedMatch({
  id,
  home,
  away,
  homeScore,
  awayScore,
  details = {},
}) {
  return {
    id,
    date: '2026-06-12T01:00:00Z',
    status: { completed: true, state: 'post' },
    home: { ...home, score: String(homeScore), winner: homeScore > awayScore },
    away: { ...away, score: String(awayScore), winner: awayScore > homeScore },
    details,
  };
}

test('normalizes ESPN team aliases to stable contract keys', () => {
  assert.equal(normalizeTeamName('Ivory Coast'), "cote d'ivoire");
  assert.equal(normalizeTeamName('Korea Republic'), 'south korea');
  assert.equal(normalizeTeamName('Cape Verde Islands'), 'cabo verde');
  assert.equal(normalizeTeamName('Czech Republic'), 'czechia');
});

test('builds all groups and ranks a completed group match', () => {
  const mexico = team('mex', 'Mexico', 'MEX');
  const southAfrica = team('rsa', 'South Africa', 'RSA');
  const groups = buildGroupsFromMatches([
    completedMatch({
      id: '1',
      home: mexico,
      away: southAfrica,
      homeScore: 2,
      awayScore: 1,
    }),
  ]);

  assert.equal(groups.length, 12);
  const groupA = groups.find(group => group.name === 'Grupa A');
  assert.equal(groupA.standings[0].team.name, 'Mexico');
  assert.deepEqual(groupA.standings[0].stats, {
    gamesPlayed: 1,
    wins: 1,
    draws: 0,
    losses: 0,
    pointsFor: 2,
    pointsAgainst: 1,
    points: 3,
  });
});

test('ranks third-placed teams by points, goal difference and goals scored', () => {
  const groups = [
    {
      name: 'Grupa A',
      standings: [{}, {}, {
        team: { name: 'A' },
        stats: { gamesPlayed: 3, points: 4, pointsFor: 4, pointsAgainst: 3 },
      }],
    },
    {
      name: 'Grupa B',
      standings: [{}, {}, {
        team: { name: 'B' },
        stats: { gamesPlayed: 3, points: 4, pointsFor: 5, pointsAgainst: 4 },
      }],
    },
  ];

  assert.equal(rankThirdPlaced(groups)[0].entry.team.name, 'B');
});

test('derives team xG from the opponent goalkeeper xGC', () => {
  const home = team('home', 'Mexico', 'MEX');
  const away = team('away', 'South Africa', 'RSA');
  const match = completedMatch({
    id: 'xg-1',
    home,
    away,
    homeScore: 2,
    awayScore: 0,
    details: {
      leaders: [
        {
          teamId: 'home',
          categories: [{
            name: 'saves',
            leader: { stats: [{ name: 'expectedGoalsConceded', value: '0.45' }] },
          }],
        },
        {
          teamId: 'away',
          categories: [{
            name: 'saves',
            leader: { stats: [{ name: 'expectedGoalsConceded', value: '1.75' }] },
          }],
        },
      ],
      teamStats: [
        {
          homeAway: 'home',
          stats: {
            possessionPct: { value: '55' },
            passPct: { value: '88' },
            totalShots: { value: '12' },
            shotsOnTarget: { value: '5' },
            totalTackles: { value: '9' },
            interceptions: { value: '4' },
          },
        },
        {
          homeAway: 'away',
          stats: {
            possessionPct: { value: '45' },
            passPct: { value: '80' },
            totalShots: { value: '6' },
            shotsOnTarget: { value: '2' },
            totalTackles: { value: '11' },
            interceptions: { value: '5' },
          },
        },
      ],
    },
  });

  assert.deepEqual(matchXG(match), { homeXG: 1.75, awayXG: 0.45 });
  assert.deepEqual(xgVerdict(match), { txt: 'wynik zasłużony', cls: 'xg-pos' });

  const mexico = computeTeamXG([match]).find(item => item.id === 'home');
  assert.equal(mexico.xgf, 1.75);
  assert.equal(mexico.finishing, 0.25);
  assert.equal(mexico.avgPoss, 55);
  assert.equal(mexico.defPerMatch, 13);
});

test('uses the ESPN US-Eastern bucket for late UTC kickoffs', () => {
  assert.equal(espnDateStr(new Date('2026-06-12T01:00:00Z')), '20260611');
});

test('computes team summaries without depending on the modal or DOM', () => {
  const mexico = team('mex', 'Mexico', 'MEX');
  const southAfrica = team('rsa', 'South Africa', 'RSA');
  const match = completedMatch({
    id: 'team-1',
    home: mexico,
    away: southAfrica,
    homeScore: 2,
    awayScore: 1,
    details: {
      teamStats: [
        {
          name: 'Mexico',
          stats: {
            possessionPct: { value: '60' },
            totalShots: { value: '10' },
            shotsOnTarget: { value: '4' },
            wonCorners: { value: '5' },
            foulsCommitted: { value: '8' },
            offsides: { value: '1' },
            yellowCards: { value: '2' },
            redCards: { value: '0' },
          },
        },
        {
          name: 'South Africa',
          stats: {
            possessionPct: { value: '40' },
            totalShots: { value: '6' },
            shotsOnTarget: { value: '2' },
            wonCorners: { value: '3' },
            foulsCommitted: { value: '10' },
            offsides: { value: '2' },
            yellowCards: { value: '1' },
            redCards: { value: '0' },
          },
        },
      ],
    },
  });
  const data = { matches: [match] };

  assert.equal(getTeamMatches(data, 'Mexico').length, 1);
  assert.deepEqual(
    {
      gp: getTeamTournamentStats(data, 'Mexico').gp,
      w: getTeamTournamentStats(data, 'Mexico').w,
      gf: getTeamTournamentStats(data, 'Mexico').gf,
      possessionAvg: getTeamTournamentStats(data, 'Mexico').possessionAvg,
    },
    { gp: 1, w: 1, gf: 2, possessionAvg: 60 }
  );
});
