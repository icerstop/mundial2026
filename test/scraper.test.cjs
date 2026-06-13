const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { computeAggregates } = require('../scraper/domain/aggregate');
const { parseScoreboardEvent } = require('../scraper/parsers/scoreboard');
const { parseSummary } = require('../scraper/parsers/summary');

test('aggregate module preserves the current gold contract totals', () => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'matches.json'), 'utf8')
  );
  const aggregate = computeAggregates(data.matches);

  assert.equal(aggregate.completedMatches.length, data.stats.matchesPlayed);
  assert.equal(aggregate.totalGoals, data.stats.totalGoals);
  const serializable = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(serializable(aggregate.topScorers), data.topScorers);
  assert.deepEqual(serializable(aggregate.topAssisters), data.topAssisters);
  assert.deepEqual(serializable(aggregate.topCanadian), data.topCanadian);
});

test('scoreboard parser keeps the frontend match contract', () => {
  const parsed = parseScoreboardEvent({
    id: '401',
    date: '2026-06-12T01:00:00Z',
    name: 'Mexico at South Africa',
    shortName: 'MEX @ RSA',
    competitions: [{
      status: {
        type: { state: 'post', detail: 'Final', shortDetail: 'FT', completed: true },
        displayClock: '90:00',
        period: 2,
      },
      competitors: [
        {
          homeAway: 'home',
          team: { id: 'mex', displayName: 'Mexico', abbreviation: 'MEX', logo: 'mex.png' },
          score: '2',
          winner: true,
        },
        {
          homeAway: 'away',
          team: { id: 'rsa', displayName: 'South Africa', abbreviation: 'RSA', logo: 'rsa.png' },
          score: '1',
          winner: false,
        },
      ],
      notes: [{ headline: 'Group A' }],
    }],
  });

  assert.equal(parsed.id, '401');
  assert.equal(parsed.status.completed, true);
  assert.equal(parsed.home.name, 'Mexico');
  assert.equal(parsed.away.score, '1');
  assert.equal(parsed.group, 'Group A');
});

test('summary parser preserves expectedGoalsConceded leaders for xG', () => {
  const parsed = parseSummary({
    leaders: [{
      team: { id: 'mex', displayName: 'Mexico' },
      leaders: [{
        name: 'saves',
        displayName: 'Saves',
        leaders: [{
          athlete: { displayName: 'Goalkeeper' },
          statistics: [{
            name: 'expectedGoalsConceded',
            displayValue: '1.25',
            abbreviation: 'xGC',
          }],
        }],
      }],
    }],
  });

  assert.equal(
    parsed.leaders[0].categories[0].leader.stats[0].value,
    '1.25'
  );
});
