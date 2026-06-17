// ESPN encodes the goal kind in keyEvents `type` ("Penalty - Scored", "Own Goal",
// "Goal - Header"…). The `penaltyKick`/`ownGoal` booleans are always false, so
// classification reads `type` — the authoritative field. We deliberately do NOT
// match on `text`: goal commentary routinely says "from the penalty area/box",
// which would false-positive open-play goals as penalties. Single source of
// truth — see [[espn-goal-type-gotcha]].
export function isOwnGoal(e) {
  return !!(e?.ownGoal || (e?.type || '').toLowerCase().includes('own goal'));
}

export function isPenalty(e) {
  return !!(e?.penaltyKick || (e?.type || '').toLowerCase().includes('penalt'));
}
