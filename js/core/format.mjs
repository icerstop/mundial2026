import { state } from './state.mjs';

export function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (el && state.data?.meta?.lastUpdated) {
    const d = new Date(state.data.meta.lastUpdated);
    el.textContent = `Aktualizacja: ${d.toLocaleString('pl-PL')}`;
  }
}

export function shortenPosition(pos) {
  if (!pos) return '';
  const map = {
    'Goalkeeper': 'GK',
    'Defender': 'DEF',
    'Midfielder': 'MID',
    'Forward': 'FW',
    'Center Left Defender': 'CB',
    'Center Right Defender': 'CB',
    'Left Back': 'LB',
    'Right Back': 'RB',
    'Defensive Midfielder': 'DM',
    'Central Midfielder': 'CM',
    'Attacking Midfielder': 'AM',
    'Left Midfielder': 'LM',
    'Right Midfielder': 'RM',
    'Left Wing': 'LW',
    'Right Wing': 'RW',
    'Center Forward': 'CF',
    'Striker': 'ST',
  };
  return map[pos] || pos.substring(0, 3).toUpperCase();
}
