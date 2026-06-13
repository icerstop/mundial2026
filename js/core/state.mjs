
export const state = {
  data: null,
  activeSection: 'matches',
  matchFilter: 'all',
  activeScorerTab: 'goals',
  activeRecordFilter: 'all',
  live: {
    modalInterval: null,
    lastFetch: null,
    pollingId: null,
    detailsFetching: new Set(),
    scoreCache: new Map(),
    badgeTicker: null,
  },
};

export const actions = {};

export function registerActions(nextActions) {
  Object.assign(actions, nextActions);
}
