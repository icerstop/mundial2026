// Lightweight global tooltip. Any element (incl. SVG) with a `data-tip`
// attribute shows an instant floating tooltip on hover — more reliable and
// readable than native SVG <title>, and survives re-renders via delegation.
let tipEl = null;

function ensureTip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'app-tip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

function place(e) {
  if (!tipEl) return;
  const pad = 14;
  const r = tipEl.getBoundingClientRect();
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + r.width > window.innerWidth) x = e.clientX - r.width - pad;
  if (y + r.height > window.innerHeight) y = e.clientY - r.height - pad;
  tipEl.style.left = `${Math.max(4, x)}px`;
  tipEl.style.top = `${Math.max(4, y)}px`;
}

export function setupTooltip() {
  document.addEventListener('mouseover', e => {
    const t = e.target.closest?.('[data-tip]');
    if (!t) return;
    const tip = ensureTip();
    tip.textContent = t.getAttribute('data-tip');
    tip.classList.add('visible');
    place(e);
  });
  document.addEventListener('mousemove', e => {
    if (tipEl?.classList.contains('visible')) place(e);
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest?.('[data-tip]')) tipEl?.classList.remove('visible');
  });
}
