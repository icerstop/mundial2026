import { state } from '../core/state.mjs';
import { buildGroupsFromMatches, rankThirdPlaced } from '../domain/groups.mjs';

export function renderGroups() {
  const groupsElement = document.getElementById('groupsGrid');
  if (!groupsElement) return;

  const groups = buildGroupsFromMatches(state.data?.matches || []);
  groupsElement.innerHTML = groups.map(renderGroupCard).join('');
  renderThirdPlaceTable(groups);
}

export function renderThirdPlaceTable(groups) {
  const element = document.getElementById('thirdPlaceTable');
  if (!element) return;

  const ranked = rankThirdPlaced(groups);
  if (!ranked.length) {
    element.innerHTML = '';
    return;
  }

  const rows = ranked.map((item, index) => {
    const stats = item.entry.stats;
    const goalDifference = stats.pointsFor - stats.pointsAgainst;
    const className =
      (index < 8 ? 'qualify-third' : 'eliminated-third') +
      (index === 8 ? ' cutoff' : '');

    return `
      <tr class="${className}">
        <td>${index + 1}</td>
        <td>
          <div class="group-team" onclick="openTeamModal('${item.entry.team.name}')" style="cursor:pointer;">
            ${item.entry.team.logo ? `<img class="group-team__logo" src="${item.entry.team.logo}" alt="${item.entry.team.name}" loading="lazy" />` : ''}
            <span class="group-team__name">${item.entry.team.name}</span>
            <span class="third-group">${item.group}</span>
          </div>
        </td>
        <td>${stats.gamesPlayed}</td>
        <td>${stats.wins}</td>
        <td>${stats.draws}</td>
        <td>${stats.losses}</td>
        <td>${stats.pointsFor}:${stats.pointsAgainst}</td>
        <td style="color:${goalDifference > 0 ? 'var(--green)' : goalDifference < 0 ? 'var(--red)' : 'var(--muted)'}">${goalDifference > 0 ? '+' : ''}${goalDifference}</td>
        <td style="color:var(--yellow);font-weight:800;">${stats.points}</td>
      </tr>`;
  }).join('');

  element.innerHTML = `
    <div class="group-card animate-in">
      <div class="group-card__header">Ranking drużyn z 3. miejsc - awansuje 8 najlepszych</div>
      <table class="group-table">
        <thead>
          <tr><th>#</th><th>Drużyna</th><th>M</th><th>W</th><th>R</th><th>P</th><th>G</th><th>+/-</th><th>Pkt</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderGroupCard(group) {
  const rows = group.standings.map((entry, index) => {
    const stats = entry.stats;
    const gamesPlayed = stats.gamesPlayed ?? stats.GP ?? stats.overall?.gamesPlayed ?? '0';
    const wins = stats.wins ?? stats.W ?? stats.overall?.wins ?? '0';
    const draws = stats.draws ?? stats.D ?? stats.overall?.draws ?? '0';
    const losses = stats.losses ?? stats.L ?? stats.overall?.losses ?? '0';
    const goalsFor = stats.pointsFor ?? stats.GF ?? stats.overall?.pointsFor ?? '0';
    const goalsAgainst = stats.pointsAgainst ?? stats.GA ?? stats.overall?.pointsAgainst ?? '0';
    const goalDifference = stats.goalDifference ?? stats.GD ??
      (parseInt(goalsFor, 10) - parseInt(goalsAgainst, 10));
    const points = stats.points ?? stats.P ?? '0';
    const qualifyClass =
      index < 2 ? 'qualify' : (index === 2 && entry.qualifyThird ? 'qualify-third' : '');

    return `
      <tr class="${qualifyClass}">
        <td>
          <div class="group-team" onclick="openTeamModal('${entry.team.name}')" style="cursor:pointer;transition:color var(--transition);" onmouseover="this.style.color='var(--yellow)'" onmouseout="this.style.color=''">
            ${entry.team.logo ? `<img class="group-team__logo" src="${entry.team.logo}" alt="${entry.team.name}" loading="lazy" />` : ''}
            <span class="group-team__name">${entry.team.name || entry.team.abbr}</span>
          </div>
        </td>
        <td>${gamesPlayed}</td>
        <td>${wins}</td>
        <td>${draws}</td>
        <td>${losses}</td>
        <td>${goalsFor}:${goalsAgainst}</td>
        <td style="color:${goalDifference > 0 ? 'var(--green)' : goalDifference < 0 ? 'var(--red)' : 'var(--muted)'}">${goalDifference > 0 ? '+' : ''}${goalDifference}</td>
        <td style="color:var(--yellow);font-weight:800;">${points}</td>
      </tr>`;
  }).join('');

  return `
    <div class="group-card animate-in">
      <div class="group-card__header">${group.name}</div>
      <table class="group-table">
        <thead>
          <tr><th>Drużyna</th><th>M</th><th>W</th><th>R</th><th>P</th><th>G</th><th>+/-</th><th>Pkt</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
