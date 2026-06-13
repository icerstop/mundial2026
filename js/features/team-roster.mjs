import { shortenPosition } from '../core/format.mjs';
import { getPlayerAssists, getPlayerGoals } from '../domain/team.mjs';
import { normalizeTeamName } from '../domain/teams.mjs';

function positionCategory(position) {
  if (!position) return 'Inni';
  const value = position.toLowerCase();
  if (value.includes('goalkeeper') || value === 'gk' || value === 'g') return 'Bramkarze';
  if (value.includes('defender') || value.includes('back') || value === 'def' ||
      value === 'd' || value.includes('cb') || value.includes('lb') || value.includes('rb')) {
    return 'Obrońcy';
  }
  if (value.includes('midfielder') || value === 'mid' || value === 'm' ||
      value.includes('dm') || value.includes('cm') || value.includes('am') ||
      value.includes('lm') || value.includes('rm')) {
    return 'Pomocnicy';
  }
  if (value.includes('forward') || value.includes('striker') || value.includes('wing') ||
      value === 'fw' || value === 'f' || value === 'st' || value.includes('cf') ||
      value.includes('lw') || value.includes('rw')) {
    return 'Napastnicy';
  }
  return 'Inni';
}

function renderContributions(data, normalizedTeamName) {
  const scorers = (data.topScorers || []).filter(
    item => normalizeTeamName(item.teamName) === normalizedTeamName
  );
  const assisters = (data.topAssisters || []).filter(
    item => normalizeTeamName(item.teamName) === normalizedTeamName
  );
  if (!scorers.length && !assisters.length) return '';

  return `
    <div style="padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:20px;">
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--yellow);margin-bottom:8px;">Liderzy drużyny</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="font-size:0.65rem;color:var(--muted);font-weight:600;text-transform:uppercase;">Gole</div>
          ${scorers.slice(0, 3).map(item => `<div style="font-size:0.8rem;font-weight:600;margin-top:2px;">${item.name} (${item.goals} ⚽)</div>`).join('') || '<div style="font-size:0.8rem;color:var(--muted);">Brak goli</div>'}
        </div>
        <div>
          <div style="font-size:0.65rem;color:var(--muted);font-weight:600;text-transform:uppercase;">Asysty</div>
          ${assisters.slice(0, 3).map(item => `<div style="font-size:0.8rem;font-weight:600;margin-top:2px;">${item.name} (${item.assists} 🅰️)</div>`).join('') || '<div style="font-size:0.8rem;color:var(--muted);">Brak asyst</div>'}
        </div>
      </div>
    </div>`;
}

function renderPlayers(data, roster) {
  const categories = {
    Bramkarze: [],
    Obrońcy: [],
    Pomocnicy: [],
    Napastnicy: [],
    Inni: [],
  };
  for (const player of roster) categories[positionCategory(player.position)].push(player);

  return Object.entries(categories)
    .filter(([, players]) => players.length)
    .map(([category, players]) => {
      players.sort((a, b) => (parseInt(a.jersey, 10) || 999) - (parseInt(b.jersey, 10) || 999));
      return `
        <div style="margin-bottom:20px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--yellow);border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">${category}</div>
          <div style="display:flex;flex-direction:column;gap:2px;">
            ${players.map(player => {
              const goals = getPlayerGoals(data, player.name);
              const assists = getPlayerAssists(data, player.name);
              const stats = goals || assists ? `
                <span style="font-size:0.75rem;margin-left:8px;display:inline-flex;gap:6px;background:var(--bg);border:1px solid var(--border);padding:2px 6px;border-radius:4px;font-weight:700;">
                  ${goals ? `<span style="color:var(--yellow)">⚽ ${goals}</span>` : ''}
                  ${assists ? `<span style="color:var(--blue)">🅰️ ${assists}</span>` : ''}
                </span>` : '';
              return `
                <div class="lineup-player" style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.02);display:flex;align-items:center;">
                  <span class="lineup-player__jersey" style="background:var(--grid);color:var(--text);">${player.jersey || '—'}</span>
                  <span class="lineup-player__name">${player.shortName || player.name}</span>
                  ${stats}
                  <span class="lineup-player__pos" style="margin-left:auto;font-size:0.65rem;color:var(--muted);">${shortenPosition(player.position)}</span>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    })
    .join('');
}

export function renderTeamRoster(data, normalizedTeamName, roster) {
  const container = document.getElementById('teamTabRosterContainer');
  const coach = data.rosters?.[normalizedTeamName]?.coach;
  const coachHtml = coach ? `
    <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:16px;font-weight:600;display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);padding:8px 12px;border-radius:var(--radius-sm);">
      <span>👔 Trener reprezentacji:</span>
      <span style="color:var(--yellow);font-weight:700;">${coach}</span>
    </div>` : '';

  if (!roster.length) {
    container.innerHTML = `
      <div class="modal__stats-title">👥 Kadra zawodników</div>
      ${coachHtml}
      <div class="empty-state" style="padding:16px;">
        <div class="empty-state__text" style="color:var(--muted);font-size:0.8rem;line-height:1.4;">
          Skład i statystyki kadry zostaną zaktualizowane w dniu pierwszego meczu tej reprezentacji w turnieju.
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="modal__stats-title">👥 Kadra zawodników (${roster.length} zgłoszonych)</div>
    ${coachHtml}
    ${renderContributions(data, normalizedTeamName)}
    <div style="max-height:350px;overflow-y:auto;padding-right:8px;">
      ${renderPlayers(data, roster)}
    </div>`;
}
