import { state } from '../core/state.mjs';
import { formatDate, formatTime } from '../core/format.mjs';
import { GROUPS_STRUCTURE, TEAM_METADATA, TEAM_TRAVEL_DATA, findGroupNameForTeam, normalizeTeamName } from '../domain/teams.mjs';
import { getTeamMatches, getTeamRoster, getTeamTournamentStats } from '../domain/team.mjs';
import { renderTeamStatComparisonBar } from '../ui/comparison-bar.mjs';
import { closeMatchModal } from './match-modal.mjs';
import { renderTeamRoster } from './team-roster.mjs';

export function openTeamModal(teamName) {
  closeMatchModal();

  const overlay = document.getElementById('teamModalOverlay');
  overlay.dataset.activeTeamName = teamName;

  // Read current active tab if there is one
  const activeTabEl = document.querySelector('#teamModalTabs .nav-tab.active');
  const activeTab = activeTabEl ? activeTabEl.dataset.teamTab : 'info';

  const normName = normalizeTeamName(teamName);

  let displayName = teamName;
  for (const groupName of Object.keys(GROUPS_STRUCTURE)) {
    const found = GROUPS_STRUCTURE[groupName].find(t => normalizeTeamName(t) === normName);
    if (found) {
      displayName = found;
      break;
    }
  }

  let logo = '';
  if (state.data && state.data.matches) {
    state.data.matches.forEach(m => {
      if (normalizeTeamName(m.home.name) === normName) logo = m.home.logo;
      if (normalizeTeamName(m.away.name) === normName) logo = m.away.logo;
    });
  }

  const travel = TEAM_TRAVEL_DATA[displayName] || { base: 'Brak danych', chain: 0, camp: 0 };
  const meta = TEAM_METADATA[displayName] || { ranking: '—', appearances: '—', bestResult: 'Brak danych' };
  const stats = getTeamTournamentStats(state.data, displayName);
  const roster = getTeamRoster(state.data, displayName);
  const matches = getTeamMatches(state.data, displayName);

  // Set the badge group name
  const groupName = findGroupNameForTeam(displayName) || '';
  const groupLabel = groupName ? groupName.replace('Group ', 'Grupa ') : 'Mundial 2026';
  document.getElementById('teamModalBadge').textContent = groupLabel;

  document.getElementById('teamModalHeader').innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
      <img src="${logo}" alt="${displayName}" style="width:72px; height:72px; object-fit:contain; background:var(--grid); padding:6px; border-radius:50%; border: 1px solid var(--border);" />
      <h2 style="font-size:1.75rem; font-weight:800; color:var(--yellow); text-align:center;">${displayName}</h2>
      <span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:var(--muted); letter-spacing:0.08em;">
        Ranking FIFA: #${meta.ranking} · Występy na MŚ: ${meta.appearances}
      </span>
    </div>
  `;

  // Render tabs in teamModalMetadata
  document.getElementById('teamModalMetadata').innerHTML = `
    <!-- Tab Bar -->
    <div class="nav-tabs" id="teamModalTabs" style="padding:2px; gap:2px; margin-bottom: 20px; display:flex; justify-content:center; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
      <button class="nav-tab active" data-team-tab="info">ℹ️ Info i Mecze</button>
      <button class="nav-tab" data-team-tab="stats">📈 Statystyki</button>
      <button class="nav-tab" data-team-tab="roster">👥 Kadra</button>
    </div>

    <!-- Panel 1: Info and Matches -->
    <div id="teamTabContentInfo" class="team-tab-panel">
      <div class="modal__stats-title">📊 Informacje o reprezentacji</div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom: 20px;">
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Najlepszy wynik MŚ</div>
          <div style="font-size:0.85rem; font-weight:700; margin-top:4px;">${meta.bestResult}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Baza Treningowa</div>
          <div style="font-size:0.85rem; font-weight:700; margin-top:4px;">${travel.base}</div>
        </div>
      </div>

      <div class="modal__stats-title">✈️ Podróże w fazie grupowej</div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom: 20px;">
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Trasa między stadionami</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--yellow); margin-top:4px;">${travel.chain ? travel.chain.toLocaleString('pl') + ' km' : '—'}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase;">Trasa Baza ➔ Mecz ➔ Baza</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--yellow); margin-top:4px;">${travel.camp ? travel.camp.toLocaleString('pl') + ' km' : '—'}</div>
        </div>
      </div>

      <div class="modal__stats-title">📅 Terminarz i wyniki</div>
      <div class="team-matches-list" style="display:flex; flex-direction:column; gap:10px;">
        ${matches.map(m => {
          const isCompleted = m.status.completed;
          const statusText = isCompleted ? 'FT' : formatTime(m.date);
          const scoreText = isCompleted ? `${m.home.score} : ${m.away.score}` : 'vs';
          const matchDate = formatDate(m.date);

          let resultBadge = '';
          if (isCompleted) {
            const isHome = normalizeTeamName(m.home.name) === normName;
            const hs = parseInt(m.home.score) || 0;
            const as = parseInt(m.away.score) || 0;
            let outcome = ''; // W, D, L
            if (hs === as) outcome = 'D';
            else if (isHome && hs > as) outcome = 'W';
            else if (!isHome && as > hs) outcome = 'W';
            else outcome = 'L';

            const badgeBg = outcome === 'W' ? 'var(--green)' : outcome === 'D' ? 'var(--muted)' : 'var(--red)';
            const outcomePl = outcome === 'W' ? 'W' : outcome === 'D' ? 'R' : 'P';
            resultBadge = `<span style="background:${badgeBg}; color:#fff; font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:8px;">${outcomePl}</span>`;
          }

          return `
            <div class="team-match-row" onclick="closeTeamModal(); openMatchModal('${m.id}')" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg); border:1px solid var(--border); padding:10px 14px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition);" onmouseover="this.style.borderColor='var(--yellow)'" onmouseout="this.style.borderColor='var(--border)'">
              <span style="font-size:0.75rem; color:var(--muted); min-width: 80px;">${matchDate}</span>
              <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
                <img src="${m.home.logo}" style="width:20px; height:20px; object-fit:contain;" />
                <span style="font-size:0.85rem; font-weight:600; color:${normalizeTeamName(m.home.name) === normName ? 'var(--yellow)' : 'var(--text)'}">${m.home.name}</span>
                <span style="font-size:0.85rem; font-weight:700; padding: 2px 8px; background:var(--grid); border-radius:4px; margin: 0 4px;">${scoreText}</span>
                <span style="font-size:0.85rem; font-weight:600; color:${normalizeTeamName(m.away.name) === normName ? 'var(--yellow)' : 'var(--text)'}">${m.away.name}</span>
                <img src="${m.away.logo}" style="width:20px; height:20px; object-fit:contain;" />
              </div>
              <div style="display:flex; align-items:center; min-width: 40px; justify-content:flex-end;">
                ${resultBadge}
                <span style="font-size:0.7rem; font-weight:600; color:var(--muted);">${statusText}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Panel 2: Stats -->
    <div id="teamTabContentStats" class="team-tab-panel" style="display:none;">
      <div class="modal__stats-title">📈 Statystyki w turnieju 2026</div>
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom: 24px;">
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Mecze (W-R-P)</div>
          <div style="font-size:0.95rem; font-weight:800; margin-top:4px;">${stats.gp} (${stats.w}-${stats.d}-${stats.l})</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Bramki +/-</div>
          <div style="font-size:0.95rem; font-weight:800; margin-top:4px;">${stats.gf}:${stats.ga}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Żółte kartki</div>
          <div style="font-size:0.95rem; font-weight:800; color:#f1c40f; margin-top:4px;">${stats.yellow}</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:0.65rem; color:var(--muted); font-weight:600; text-transform:uppercase; line-height:1.2; height:24px; display:flex; align-items:center; justify-content:center;">Czerwone kartki</div>
          <div style="font-size:0.95rem; font-weight:800; color:var(--red); margin-top:4px;">${stats.red}</div>
        </div>
      </div>

      ${stats.gp > 0 ? `
        <div class="modal__stats-title">📊 Porównanie średnich z turnieju</div>

        <!-- Possession comparison -->
        ${renderTeamStatComparisonBar('Posiadanie piłki', stats.possessionAvg, stats.tournamentAvg.possessionPct, '%')}
        <!-- Shots comparison -->
        ${renderTeamStatComparisonBar('Strzały na mecz', stats.shotsAvg, stats.tournamentAvg.totalShots, '')}
        <!-- Shots on target comparison -->
        ${renderTeamStatComparisonBar('Celne strzały na mecz', stats.shotsOnTargetAvg, stats.tournamentAvg.shotsOnTarget, '')}
        <!-- Corners comparison -->
        ${renderTeamStatComparisonBar('Rzuty rożne na mecz', stats.cornersAvg, stats.tournamentAvg.wonCorners, '')}
        <!-- Fouls comparison -->
        ${renderTeamStatComparisonBar('Faule na mecz', stats.foulsAvg, stats.tournamentAvg.foulsCommitted, '')}
        <!-- Spalone comparison -->
        ${renderTeamStatComparisonBar('Spalone na mecz', stats.offsidesAvg, stats.tournamentAvg.offsides, '')}
      ` : `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state__text" style="color: var(--muted);">Statystyki porównawcze będą dostępne po rozegraniu pierwszego meczu.</div>
        </div>
      `}
    </div>

    <!-- Panel 3: Roster -->
    <div id="teamTabContentRoster" class="team-tab-panel" style="display:none;">
      <div id="teamTabRosterContainer"></div>
    </div>
  `;

  renderTeamRoster(state.data, normName, roster);

  // Clear original teamModalRoster container
  document.getElementById('teamModalRoster').innerHTML = '';

  // Setup tab switcher logic
  const tabButtons = document.querySelectorAll('#teamModalTabs .nav-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.dataset.teamTab;
      document.querySelectorAll('.team-tab-panel').forEach(panel => {
        panel.style.display = 'none';
      });

      if (targetTab === 'info') {
        document.getElementById('teamTabContentInfo').style.display = '';
      } else if (targetTab === 'stats') {
        document.getElementById('teamTabContentStats').style.display = '';
      } else if (targetTab === 'roster') {
        document.getElementById('teamTabContentRoster').style.display = '';
      }
    });
  });

  // Restore active tab
  if (activeTab && activeTab !== 'info') {
    const tabButtons = document.querySelectorAll('#teamModalTabs .nav-tab');
    tabButtons.forEach(b => b.classList.remove('active'));
    const targetBtn = Array.from(tabButtons).find(b => b.dataset.teamTab === activeTab);
    if (targetBtn) {
      targetBtn.classList.add('active');
      document.querySelectorAll('.team-tab-panel').forEach(panel => {
        panel.style.display = 'none';
      });
      if (activeTab === 'stats') {
        document.getElementById('teamTabContentStats').style.display = '';
      } else if (activeTab === 'roster') {
        document.getElementById('teamTabContentRoster').style.display = '';
      }
    }
  }

  document.getElementById('teamModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeTeamModal() {
  const overlay = document.getElementById('teamModalOverlay');
  overlay.classList.remove('active');
  delete overlay.dataset.activeTeamName;
  document.body.style.overflow = '';
}

export function setupTeamModal() {
  document.getElementById('teamModalClose').addEventListener('click', closeTeamModal);
  document.getElementById('teamModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTeamModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTeamModal();
  });
}
