import { state } from '../core/state.mjs';
import { buildRecordCatalog } from '../domain/record-catalog.mjs';
import { recomputeStats } from './hero.mjs';

export function renderRecords() {
  recomputeStats();
  const el = document.getElementById('recordsGrid');
  if (!el) return;

  const recordsList = buildRecordCatalog(state.data);
  let filtered = recordsList;
  if (state.activeRecordFilter === 'chasing') {
    filtered = recordsList.filter(r => r.type === 'chasing');
  } else if (state.activeRecordFilter === 'achieved') {
    filtered = recordsList.filter(r => r.type === 'achieved');
  }

  el.innerHTML = filtered.map(r => {
    const isCompletedType = r.type === 'achieved';
    const badgeClass = isCompletedType ? 'record-badge--achieved' : 'record-badge--chasing';
    const badgeText = isCompletedType ? 'Osiągnięty' : 'W toku';
    const fillClass = isCompletedType ? 'record-progress-fill--achieved' : '';

    const pct = Math.min(100, Math.max(0, (r.current / r.target) * 100));

    const currentValText = typeof r.current === 'number' && r.current > 10000
      ? r.current.toLocaleString('pl')
      : r.current;
    const targetValText = typeof r.target === 'number' && r.target > 10000
      ? r.target.toLocaleString('pl')
      : r.target;

    return `
      <div class="record-card animate-in">
        <div class="record-card__header">
          <div class="record-card__title-group">
            <span class="record-card__icon">${r.icon}</span>
            <span class="record-card__title">${r.title}</span>
          </div>
          <span class="record-badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="record-card__description">${r.desc}</p>
        <div class="record-card__stats">
          <span>Postęp</span>
          <span class="record-card__value">${currentValText} / ${targetValText}${r.unit}</span>
        </div>
        <div class="record-progress-bar">
          <div class="record-progress-fill ${fillClass}" style="width: ${pct}%"></div>
        </div>
        <div style="font-size:0.7rem; color:var(--muted); margin-top:8px; font-weight:500;">
          ${r.statText}
        </div>
      </div>
    `;
  }).join('');
}
