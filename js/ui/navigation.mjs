import { state } from '../core/state.mjs';
import { renderMatches } from '../features/matches.mjs';
import { renderScorers } from '../features/scorers.mjs';
import { renderRecords } from '../features/records.mjs';
import { renderXG } from '../features/xg.mjs';
import { renderStadiums } from '../features/stadiums.mjs';
import { renderBracket } from '../features/bracket.mjs';

// ── Navigation ─────────────────────────────────────────────────────────────
export function setupNav() {
  const tabs = document.querySelectorAll('#mainNav .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const section = tab.dataset.section;
      state.activeSection = section;

      document.querySelectorAll('[id^="section-"]').forEach(s => s.style.display = 'none');
      document.getElementById(`section-${section}`).style.display = '';

      if (section === 'records') {
        renderRecords();
      } else if (section === 'xg') {
        renderXG();
      } else if (section === 'stadiums') {
        renderStadiums();
      } else if (section === 'bracket') {
        renderBracket();
      }
    });
  });
}

export function setupMatchFilter() {
  const tabs = document.querySelectorAll('#matchFilter .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.matchFilter = tab.dataset.filter;
      renderMatches();
    });
  });
}

export function setupScorerFilter() {
  const tabs = document.querySelectorAll('#scorerFilter .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeScorerTab = tab.dataset.scorerTab;
      renderScorers();
    });
  });
}


export function setupRecordFilter() {
  const tabs = document.querySelectorAll('#recordFilter .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeRecordFilter = tab.dataset.recordFilter;
      renderRecords();
    });
  });
}
