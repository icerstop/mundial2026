export function renderTeamStatComparisonBar(label, teamValue, tournamentValue, suffix) {
  const team = parseFloat(teamValue) || 0;
  const tournament = parseFloat(tournamentValue) || 0;
  const max = Math.max(team, tournament, 1);
  const teamPercent = (team / max * 100).toFixed(1);
  const tournamentPercent = (tournament / max * 100).toFixed(1);

  return `
    <div class="stat-row" style="padding:6px 0;">
      <span class="stat-row__value stat-row__value--home" style="${team > tournament ? 'color:var(--yellow);' : ''}">${team.toFixed(1)}${suffix}</span>
      <div class="stat-bar stat-bar--home">
        <div class="stat-bar__fill ${team >= tournament ? '' : 'stat-bar__fill--dim'}" style="width:${teamPercent}%"></div>
      </div>
      <span class="stat-row__label" style="font-size:0.65rem;min-width:120px;">${label}</span>
      <div class="stat-bar">
        <div class="stat-bar__fill ${tournament >= team ? '' : 'stat-bar__fill--dim'}" style="width:${tournamentPercent}%"></div>
      </div>
      <span class="stat-row__value stat-row__value--away" style="${tournament > team ? 'color:var(--muted);' : ''}">${tournament.toFixed(1)}${suffix}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:0.6rem;color:var(--muted);margin-top:-4px;margin-bottom:8px;padding:0 4px;">
      <span>Średnia drużyny</span>
      <span>Średnia turnieju</span>
    </div>`;
}
