import { state } from '../core/state.mjs';
import { buildTournamentBracket, findBracketSlot } from '../domain/bracket.mjs';

let bracketUi = {
  nodeId: 'final-1',
  side: 'home',
};

const TREE = {
  nodeW: 118,
  nodeH: 118,
  colGap: 16,
  rowGap: 148,
  pad: 8,
  finalW: 170,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortVenue(venue) {
  if (!venue?.name) return '';
  return `${venue.name}${venue.city ? ` · ${venue.city}` : ''}`;
}

function candidateLead(slot) {
  const resolution = slot.resolution;
  if (resolution?.current) return resolution.current;
  return resolution?.candidates?.[0] || null;
}

function renderMiniCandidates(candidates = []) {
  if (!candidates.length) return '<span class="bracket-slot__empty">brak danych</span>';

  return `<div class="bracket-slot__chips">
    ${candidates.slice(0, 3).map(candidate => `
      <span>${candidate.logo ? `<img src="${escapeHtml(candidate.logo)}" alt="" loading="lazy">` : ''}${escapeHtml(candidate.abbr || candidate.name)}</span>
    `).join('')}
    ${candidates.length > 3 ? `<span>+${candidates.length - 3}</span>` : ''}
  </div>`;
}

function renderSlot(node, side) {
  const slot = node[side];
  const lead = candidateLead(slot);
  const candidates = slot.resolution?.candidates || [];
  const active = bracketUi.nodeId === node.id && bracketUi.side === side;
  const title = lead ? `${slot.label}: ${lead.name}` : slot.label;

  return `<button class="bracket-slot ${active ? 'active' : ''}" type="button"
      onclick="selectBracketSlot('${node.id}','${side}')"
      title="${escapeHtml(title)}"
      aria-label="${escapeHtml(title)}">
    <span class="bracket-slot__label">${escapeHtml(slot.label)}</span>
    ${lead ? `
      <span class="bracket-slot__team">
        ${lead.logo ? `<img src="${escapeHtml(lead.logo)}" alt="" loading="lazy">` : ''}
        <strong>${escapeHtml(lead.name)}</strong>
      </span>
    ` : ''}
    ${renderMiniCandidates(candidates)}
  </button>`;
}

function refFromSlot(slot) {
  const match = slot.rawLabel.match(/^(Round of 32|Round of 16|Quarterfinal|Semifinal) (\d+) Winner$/);
  if (!match) return null;
  const stageId = {
    'Round of 32': 'rd32',
    'Round of 16': 'rd16',
    Quarterfinal: 'qf',
    Semifinal: 'sf',
  }[match[1]];
  return { stageId, number: parseInt(match[2], 10) };
}

function refNode(bracket, slot) {
  const ref = refFromSlot(slot);
  return ref ? bracket.nodesById?.[`${ref.stageId}-${ref.number}`] : null;
}

function childNodes(bracket, node) {
  return [refNode(bracket, node.home), refNode(bracket, node.away)].filter(Boolean);
}

function stageDepth(stageId) {
  return { rd32: 0, rd16: 1, qf: 2, sf: 3 }[stageId] ?? 0;
}

function treeLayout(bracket, root) {
  const leaves = [];
  const seenLeaves = new Set();

  function collectLeaves(node) {
    const children = childNodes(bracket, node);
    if (!children.length) {
      if (!seenLeaves.has(node.id)) {
        seenLeaves.add(node.id);
        leaves.push(node);
      }
      return;
    }
    children.forEach(collectLeaves);
  }

  collectLeaves(root);
  const leafRows = new Map(leaves.map((leaf, index) => [leaf.id, index]));
  const positioned = new Map();
  const connectors = [];

  function place(node) {
    if (positioned.has(node.id)) return positioned.get(node.id);
    const children = childNodes(bracket, node);
    const childPositions = children.map(place);
    const row = childPositions.length
      ? childPositions.reduce((sum, pos) => sum + pos.row, 0) / childPositions.length
      : (leafRows.get(node.id) ?? 0);
    const pos = { node, row, depth: stageDepth(node.stageId) };
    positioned.set(node.id, pos);
    childPositions.forEach(child => connectors.push({ from: child, to: pos }));
    return pos;
  }

  place(root);
  return {
    nodes: [...positioned.values()],
    connectors,
    height: (Math.max(leaves.length, 1) - 1) * TREE.rowGap + TREE.nodeH + TREE.pad * 2,
    width: TREE.nodeW * 4 + TREE.colGap * 3 + TREE.pad * 2,
  };
}

function treePoint(pos, orientation) {
  const visualDepth = orientation === 'left' ? pos.depth : 3 - pos.depth;
  return {
    x: TREE.pad + visualDepth * (TREE.nodeW + TREE.colGap),
    y: TREE.pad + pos.row * TREE.rowGap,
  };
}

function connectorPath(connector, orientation) {
  const from = treePoint(connector.from, orientation);
  const to = treePoint(connector.to, orientation);
  const fromX = orientation === 'left' ? from.x + TREE.nodeW : from.x;
  const toX = orientation === 'left' ? to.x : to.x + TREE.nodeW;
  const fromY = from.y + TREE.nodeH / 2;
  const toY = to.y + TREE.nodeH / 2;
  const midX = (fromX + toX) / 2;
  return `M${fromX.toFixed(1)} ${fromY.toFixed(1)} H${midX.toFixed(1)} V${toY.toFixed(1)} H${toX.toFixed(1)}`;
}

function renderTreeSlot(node, side) {
  return renderSlot(node, side);
}

function renderTreeNode(pos, orientation) {
  const point = treePoint(pos, orientation);
  const node = pos.node;
  const status = node.status?.completed ? 'FT' : formatShortDate(node.date);
  return `<article class="bracket-match bracket-tree-node bracket-tree-node--${node.stageId}"
      data-node="${node.id}"
      style="left:${point.x}px;top:${point.y}px;width:${TREE.nodeW}px;height:${TREE.nodeH}px;">
    <div class="bracket-match__head">
      <span>${escapeHtml(node.stageId.toUpperCase())} #${node.number}</span>
      <strong>${escapeHtml(status)}</strong>
    </div>
    <div class="bracket-match__slots">
      ${renderTreeSlot(node, 'home')}
      ${renderTreeSlot(node, 'away')}
    </div>
  </article>`;
}

function renderTreeSide(bracket, root, orientation) {
  const layout = treeLayout(bracket, root);
  return `<section class="bracket-tree-side bracket-tree-side--${orientation}"
      style="width:${layout.width}px;height:${layout.height}px;">
    <svg class="bracket-connectors" viewBox="0 0 ${layout.width} ${layout.height}" aria-hidden="true">
      ${layout.connectors.map(connector => `<path d="${connectorPath(connector, orientation)}"/>`).join('')}
    </svg>
    ${layout.nodes.map(pos => renderTreeNode(pos, orientation)).join('')}
  </section>`;
}

function renderChampionRail() {
  return `<div class="bracket-champion-rail">
    <span></span>
    <strong>Mistrz</strong>
    <span></span>
  </div>`;
}

function renderFinalNode(finalNode) {
  if (!finalNode) return '';
  const status = finalNode.status?.completed ? 'FT' : formatShortDate(finalNode.date);
  return `<section class="bracket-final-stage">
    <div class="bracket-final-line"></div>
    <article class="bracket-match bracket-final-card" data-node="${finalNode.id}">
      <div class="bracket-match__head">
        <span>Finał</span>
        <strong>${escapeHtml(status)}</strong>
      </div>
      <div class="bracket-match__venue">${escapeHtml(shortVenue(finalNode.venue))}</div>
      <div class="bracket-match__slots">
        ${renderSlot(finalNode, 'home')}
        ${renderSlot(finalNode, 'away')}
      </div>
    </article>
    ${renderChampionRail()}
  </section>`;
}

function renderBracketTree(bracket) {
  const leftRoot = bracket.nodesById?.['sf-1'];
  const rightRoot = bracket.nodesById?.['sf-2'];
  const finalNode = bracket.nodesById?.['final-1'];
  if (!leftRoot || !rightRoot || !finalNode) {
    return '<div class="empty-state"><div class="empty-state__text">Brak pełnej drabinki fazy pucharowej</div></div>';
  }

  return `<div class="bracket-tree-scroll">
    <div class="bracket-tree">
      ${renderTreeSide(bracket, leftRoot, 'left')}
      ${renderFinalNode(finalNode)}
      ${renderTreeSide(bracket, rightRoot, 'right')}
    </div>
  </div>`;
}

function renderCandidateRow(candidate, index) {
  const meta = [
    candidate.group,
    candidate.currentPlace ? `${candidate.currentPlace}. miejsce teraz` : '',
    candidate.points != null ? `${candidate.points} pkt` : '',
  ].filter(Boolean).join(' · ');

  const encodedName = encodeURIComponent(candidate.name);

  return `<button class="bracket-candidate" type="button" onclick="openTeamModal(decodeURIComponent('${encodedName}'))">
    <span class="bracket-candidate__rank">${String(index + 1).padStart(2, '0')}</span>
    ${candidate.logo ? `<img class="bracket-candidate__logo" src="${escapeHtml(candidate.logo)}" alt="" loading="lazy">` : ''}
    <span class="bracket-candidate__body">
      <strong>${escapeHtml(candidate.name)}</strong>
      <small>${escapeHtml(meta || candidate.tag || '')}</small>
    </span>
    ${candidate.tag ? `<span class="bracket-candidate__tag ${candidate.qualifiesNow ? 'is-green' : ''}">${escapeHtml(candidate.tag)}</span>` : ''}
  </button>`;
}

function renderSlotPanel(bracket) {
  const selection = findBracketSlot(bracket, bracketUi.nodeId, bracketUi.side)
    || findBracketSlot(bracket, 'final-1', 'home')
    || findBracketSlot(bracket, bracket.rounds[0]?.matches[0]?.id, 'home');

  if (!selection) {
    return '<aside class="bracket-panel"><div class="empty-state"><div class="empty-state__text">Brak danych drabinki</div></div></aside>';
  }

  const { node, slot, resolution } = selection;
  const candidates = resolution?.candidates || [];
  const current = resolution?.current;
  const allowed = resolution?.allowedGroups?.length
    ? `<div class="bracket-panel__groups">${resolution.allowedGroups.map(group => `<span>${escapeHtml(group)}</span>`).join('')}</div>`
    : '';

  return `<aside class="bracket-panel">
    <div class="bracket-panel__eyebrow">${escapeHtml(node.stageId.toUpperCase())} #${node.number} · ${escapeHtml(formatShortDate(node.date))}</div>
    <h3>${escapeHtml(slot.label)}</h3>
    <p>${escapeHtml(resolution?.sourceLabel || slot.label)}</p>
    ${allowed}
    <div class="bracket-panel__meta">
      <span>${escapeHtml(shortVenue(node.venue))}</span>
      <strong>${candidates.length} kandydatów</strong>
    </div>
    ${current ? `
      <div class="bracket-current">
        <span>Aktualnie w slocie</span>
        <strong>${current.logo ? `<img src="${escapeHtml(current.logo)}" alt="" loading="lazy">` : ''}${escapeHtml(current.name)}</strong>
      </div>
    ` : ''}
    <div class="bracket-candidates">
      ${candidates.length ? candidates.map(renderCandidateRow).join('') : '<div class="empty-state"><div class="empty-state__text">Ten slot czeka na rozstrzygnięcie wcześniejszej rundy</div></div>'}
    </div>
  </aside>`;
}

export function selectBracketSlot(nodeId, side) {
  bracketUi = { nodeId, side };
  renderBracket();
}

export function renderBracket() {
  const el = document.getElementById('bracketView');
  if (!el || !state.data) return;

  const bracket = buildTournamentBracket(state.data);
  el.innerHTML = `
    <div class="bracket-head">
      <div>
        <span class="bracket-head__eyebrow">Faza pucharowa</span>
        <h3>Drabinka możliwych ścieżek</h3>
      </div>
      <div class="bracket-head__kpis">
        <span>32 drużyny</span>
        <span>5 rund</span>
        <span>1 finał</span>
      </div>
    </div>
    <div class="bracket-shell">
      ${renderBracketTree(bracket)}
      ${renderSlotPanel(bracket)}
    </div>
  `;
}
