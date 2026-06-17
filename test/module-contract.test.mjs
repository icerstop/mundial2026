import assert from 'node:assert/strict';
import test from 'node:test';

const modules = [
  '../js/core/state.mjs',
  '../js/core/format.mjs',
  '../js/domain/bracket.mjs',
  '../js/domain/groups.mjs',
  '../js/domain/record-catalog.mjs',
  '../js/domain/record-stats.mjs',
  '../js/domain/stadiums.mjs',
  '../js/domain/team.mjs',
  '../js/domain/teams.mjs',
  '../js/domain/xg.mjs',
  '../js/features/bracket.mjs',
  '../js/features/drilldown.mjs',
  '../js/features/groups.mjs',
  '../js/features/hero.mjs',
  '../js/features/matches.mjs',
  '../js/features/match-modal.mjs',
  '../js/features/records.mjs',
  '../js/features/scorers.mjs',
  '../js/features/stadiums.mjs',
  '../js/features/team-modal.mjs',
  '../js/features/team-roster.mjs',
  '../js/features/tournament-stats.mjs',
  '../js/features/xg.mjs',
  '../js/services/live-scores.mjs',
  '../js/ui/comparison-bar.mjs',
  '../js/ui/navigation.mjs',
];

test('all browser modules resolve without missing exports or circular init errors', async () => {
  const imported = await Promise.all(modules.map(modulePath => import(modulePath)));
  assert.equal(imported.length, modules.length);
});
