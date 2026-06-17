
import { registerActions, state } from './core/state.mjs';
import { updateLastUpdated } from './core/format.mjs';
import { renderHeroStats } from './features/hero.mjs';
import { renderMatches, startLiveClockTicker } from './features/matches.mjs';
import { renderScorers } from './features/scorers.mjs';
import { renderGroups } from './features/groups.mjs';
import { renderTournamentStats } from './features/tournament-stats.mjs';
import { renderXG } from './features/xg.mjs';
import { openDrill, closeDrill, setDrillFilter, setDrillMode, setupDrillModal } from './features/drilldown.mjs';
import { renderRecords } from './features/records.mjs';
import { openMatchModal, closeMatchModal, setupModal } from './features/match-modal.mjs';
import { openTeamModal, closeTeamModal, setupTeamModal } from './features/team-modal.mjs';
import { setupMatchFilter, setupNav, setupRecordFilter, setupScorerFilter } from './ui/navigation.mjs';
import { setupTooltip } from './ui/tooltip.mjs';
import { applyLiveOverride, startLiveScoreRefresh } from './services/live-scores.mjs';
import { startDataSource } from './services/data-source.mjs';

let initialized = false;

export function renderAll() {
  renderHeroStats();
  renderMatches();
  renderScorers();
  renderGroups();
  renderTournamentStats();
  renderRecords();
  renderXG();
  updateLastUpdated();
}

function refreshOpenModals() {
  const matchOverlay = document.getElementById('modalOverlay');
  if (matchOverlay?.classList.contains('active') && matchOverlay.dataset.activeMatchId) {
    openMatchModal(matchOverlay.dataset.activeMatchId);
  }

  const teamOverlay = document.getElementById('teamModalOverlay');
  if (teamOverlay?.classList.contains('active') && teamOverlay.dataset.activeTeamName) {
    openTeamModal(teamOverlay.dataset.activeTeamName);
  }
}

function initializeUi() {
  renderAll();
  setupNav();
  setupMatchFilter();
  setupScorerFilter();
  setupRecordFilter();
  setupTeamModal();
  setupModal();
  setupDrillModal();
  setupTooltip();
  startLiveClockTicker();
  startLiveScoreRefresh();
  initialized = true;
  setTimeout(() => document.getElementById('loadingScreen')?.classList.add('hidden'), 400);
}

function acceptData(data) {
  state.data = data;
  applyLiveOverride();

  if (!initialized) {
    initializeUi();
    return;
  }

  renderAll();
  refreshOpenModals();
}

function showLoadError(error) {
  console.error('Could not load tournament data:', error);
  const loading = document.getElementById('loadingScreen');
  if (loading) {
    loading.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">!</div>
        <div class="empty-state__text">Nie udało się załadować danych. Uruchom <code>node scraper.js</code></div>
      </div>`;
  }
}

registerActions({ renderAll, openMatchModal });
Object.assign(window, {
  openMatchModal,
  closeMatchModal,
  openTeamModal,
  closeTeamModal,
  openDrill,
  closeDrill,
  setDrillMode,
  setDrillFilter,
});

document.addEventListener('DOMContentLoaded', () => {
  startDataSource({
    onData: acceptData,
    onError: showLoadError,
    getCurrentData: () => state.data,
  });
});
