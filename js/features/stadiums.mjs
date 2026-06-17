import { state } from '../core/state.mjs';
import { enrichStadiums, STADIUM_COUNTRIES, stadiumTotals } from '../domain/stadiums.mjs';

const MAP_BOUNDS = {
  minLat: 14,
  maxLat: 55,
  minLon: -130,
  maxLon: -65,
};

const MAP_SIZE = {
  width: 960,
  height: 620,
};

let stadiumUi = {
  country: 'all',
  selectedId: 'mexico-city',
};

let northAmericaMap = null;
let northAmericaMapPromise = null;
let northAmericaMapError = null;

const fmtNumber = value => Number(value || 0).toLocaleString('pl-PL');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMatchDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function matchTitle(match) {
  const home = match.home?.abbr || match.home?.name || '';
  const away = match.away?.abbr || match.away?.name || '';
  const score = match.status?.completed || match.status?.state === 'in'
    ? ` ${match.home?.score ?? '-'}-${match.away?.score ?? '-'} `
    : ' vs ';
  return `${home}${score}${away}`;
}

function mercatorY(lat) {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = clamped * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function projectLonLat(lon, lat) {
  const minY = mercatorY(MAP_BOUNDS.minLat);
  const maxY = mercatorY(MAP_BOUNDS.maxLat);
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * MAP_SIZE.width;
  const y = ((maxY - mercatorY(lat)) / (maxY - minY)) * MAP_SIZE.height;
  return { x, y };
}

function projectPoint(stadium) {
  const { lat, lon } = stadium.coordinates;
  return projectLonLat(lon, lat);
}

function loadNorthAmericaMap() {
  if (northAmericaMap || northAmericaMapPromise) return northAmericaMapPromise;

  northAmericaMapPromise = fetch('./data/north-america.geojson')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      northAmericaMap = data;
      northAmericaMapError = null;
      renderStadiums();
      return data;
    })
    .catch(error => {
      northAmericaMapError = error;
      renderStadiums();
      return null;
    });

  return northAmericaMapPromise;
}

function renderCountryTabs() {
  return `<div class="stadium-tabs" role="list" aria-label="Filtr kraju">
    ${STADIUM_COUNTRIES.map(country => `
      <button class="stadium-tab ${stadiumUi.country === country.id ? 'active' : ''}"
        type="button"
        onclick="setStadiumCountry('${country.id}')">
        ${escapeHtml(country.label)}
      </button>
    `).join('')}
  </div>`;
}

function ringPath(ring) {
  return ring.map(([lon, lat], index) => {
    const point = projectLonLat(lon, lat);
    return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

function featurePath(feature) {
  const { geometry } = feature;
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringPath).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap(polygon => polygon.map(ringPath)).join(' ');
  }
  return '';
}

function featureClass(feature) {
  const iso = feature.properties?.iso_a3;
  if (iso === 'USA') return 'stadium-map__land--host stadium-map__land--usa';
  if (iso === 'CAN') return 'stadium-map__land--host stadium-map__land--canada';
  if (iso === 'MEX') return 'stadium-map__land--host stadium-map__land--mexico';
  return 'stadium-map__land--neighbor';
}

function renderLand(mapData) {
  if (northAmericaMapError) {
    return `<text x="${MAP_SIZE.width / 2}" y="${MAP_SIZE.height / 2}" class="stadium-map__message" text-anchor="middle">Nie udało się załadować mapy Natural Earth</text>`;
  }
  if (!mapData) {
    return `<text x="${MAP_SIZE.width / 2}" y="${MAP_SIZE.height / 2}" class="stadium-map__message" text-anchor="middle">Ładowanie dokładnej mapy...</text>`;
  }

  return mapData.features.map(feature => `
    <path class="stadium-map__land ${featureClass(feature)}"
      d="${featurePath(feature)}"
      fill-rule="evenodd"
      data-country="${escapeHtml(feature.properties?.name || '')}">
      <title>${escapeHtml(feature.properties?.name || '')}</title>
    </path>
  `).join('');
}

function graticuleLine(type, value) {
  const points = [];
  const steps = 42;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = type === 'lon'
      ? value
      : MAP_BOUNDS.minLon + (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon) * t;
    const lat = type === 'lat'
      ? value
      : MAP_BOUNDS.minLat + (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat) * t;
    const point = projectLonLat(lon, lat);
    points.push(`${i === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
  }
  return points.join(' ');
}

function renderGraticule() {
  const lonLines = [-120, -110, -100, -90, -80, -70]
    .map(lon => `<path class="stadium-map__gridline" d="${graticuleLine('lon', lon)}"/>`);
  const latLines = [20, 30, 40, 50]
    .map(lat => `<path class="stadium-map__gridline" d="${graticuleLine('lat', lat)}"/>`);
  return lonLines.concat(latLines).join('');
}

function renderRoute(stadiums, country) {
  const points = stadiums
    .filter(stadium => stadium.country === country)
    .slice()
    .sort((a, b) => a.coordinates.lon - b.coordinates.lon)
    .map(projectPoint)
    .map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');

  return points ? `<polyline class="stadium-map__route stadium-map__route--${country.toLowerCase()}" points="${points}"/>` : '';
}

function renderMap(stadiums, selectedId) {
  loadNorthAmericaMap();

  return `<div class="stadium-map-panel">
    <div class="stadium-map-panel__meta">
      <span>Natural Earth 1:50m</span>
      <strong>16 stadionów / 3 kraje</strong>
    </div>
    <svg class="stadium-map" viewBox="0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}" role="img" aria-label="Mapa stadionów Mundialu 2026">
      <defs>
        <clipPath id="stadiumMapClip">
          <rect width="${MAP_SIZE.width}" height="${MAP_SIZE.height}" rx="18"/>
        </clipPath>
        <radialGradient id="stadiumGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(245,197,24,.4)"/>
          <stop offset="100%" stop-color="rgba(245,197,24,0)"/>
        </radialGradient>
      </defs>
      <rect class="stadium-map__ocean" width="${MAP_SIZE.width}" height="${MAP_SIZE.height}" rx="18"/>
      <g clip-path="url(#stadiumMapClip)">
        ${renderGraticule()}
        ${renderLand(northAmericaMap)}
        ${renderRoute(stadiums, 'Canada')}
        ${renderRoute(stadiums, 'USA')}
        ${renderRoute(stadiums, 'Mexico')}
        ${stadiums.map(stadium => {
          const point = projectPoint(stadium);
          const radius = 4.5 + (stadium.capacity / 94000) * 5.5;
          const selected = stadium.id === selectedId;
          return `<g class="stadium-marker stadium-marker--${stadium.countryCode.toLowerCase()} ${selected ? 'is-selected' : ''}"
              tabindex="0"
              role="button"
              aria-label="${escapeHtml(stadium.name)}"
              onclick="selectStadium('${stadium.id}')"
              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectStadium('${stadium.id}')}"
              data-tip="${escapeHtml(`${stadium.name} · ${stadium.coordinates.lat.toFixed(4)}, ${stadium.coordinates.lon.toFixed(4)} · ${fmtNumber(stadium.capacity)} miejsc`)}">
            ${selected ? `<circle class="stadium-marker__halo" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${(radius + 12).toFixed(1)}"/>` : ''}
            <circle class="stadium-marker__dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${radius.toFixed(1)}"/>
            <text class="stadium-marker__label" x="${(point.x + radius + 5).toFixed(1)}" y="${(point.y + 4).toFixed(1)}">${escapeHtml(stadium.city.split('/')[0])}</text>
          </g>`;
        }).join('')}
      </g>
    </svg>
  </div>`;
}

function renderHeroStats(totals) {
  return `<div class="stadium-kpis">
    <div class="stadium-kpi"><span>${totals.count}</span><small>stadionów</small></div>
    <div class="stadium-kpi"><span>${fmtNumber(totals.capacity)}</span><small>łączna pojemność</small></div>
    <div class="stadium-kpi"><span>${totals.matches}</span><small>mecze w terminarzu</small></div>
    <div class="stadium-kpi"><span>${totals.countries}</span><small>kraje gospodarze</small></div>
  </div>`;
}

function renderDetail(stadium) {
  const nextMatch = stadium.nextMatch;
  const photoAlt = `${stadium.name}, ${stadium.city}`;
  const roofLabel = {
    open: 'otwarty',
    partial: 'częściowy dach',
    retractable: 'rozsuwany dach',
    translucent: 'półprzezroczysty dach',
    canopy: 'zadaszone trybuny',
  }[stadium.roof] || stadium.roof;

  return `<article class="stadium-detail" id="stadiumDetail">
    <div class="stadium-photo">
      <img src="${escapeHtml(stadium.image)}" alt="${escapeHtml(photoAlt)}" loading="lazy" onerror="this.closest('.stadium-photo').classList.add('is-missing');this.remove()">
      <div class="stadium-photo__shade"></div>
      <div class="stadium-photo__caption">
        <span>${escapeHtml(stadium.countryCode)}</span>
        <strong>${escapeHtml(stadium.tournamentName)}</strong>
      </div>
    </div>
    <div class="stadium-dossier">
      <div class="stadium-dossier__eyebrow">${escapeHtml(stadium.municipality)}</div>
      <h3>${escapeHtml(stadium.name)}</h3>
      <p>${escapeHtml(stadium.summary)}</p>
      <div class="stadium-facts">
        <div><span>Pojemność</span><strong>${fmtNumber(stadium.capacity)}</strong></div>
        <div><span>Otwarcie</span><strong>${escapeHtml(stadium.opened)}</strong></div>
        <div><span>Dach</span><strong>${escapeHtml(roofLabel)}</strong></div>
        <div><span>Murawa</span><strong>${escapeHtml(stadium.surface)}</strong></div>
      </div>
      <div class="stadium-minirow">
        ${stadium.facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join('')}
      </div>
      <div class="stadium-schedule-summary">
        <div><span>Mecze</span><strong>${stadium.matchCount}</strong></div>
        <div><span>Rozegrane</span><strong>${stadium.completedCount}</strong></div>
        <div><span>Nadchodzące</span><strong>${stadium.upcomingCount}</strong></div>
        <div><span>Śr. frekwencja</span><strong>${stadium.avgAttendance ? fmtNumber(stadium.avgAttendance) : '—'}</strong></div>
      </div>
      <div class="stadium-next">
        <span>Najbliższy mecz</span>
        ${nextMatch ? `
          <button type="button" onclick="openMatchModal('${nextMatch.id}')">
            <strong>${escapeHtml(matchTitle(nextMatch))}</strong>
            <small>${escapeHtml(formatMatchDate(nextMatch.date))}</small>
          </button>` : '<strong>Terminarz zakończony</strong>'}
      </div>
    </div>
  </article>`;
}

function renderMatchStrip(stadium) {
  const rows = stadium.matches.slice(0, 8);
  if (!rows.length) return '';

  return `<div class="stadium-match-strip">
    ${rows.map(match => {
      const statusClass = match.status?.completed ? 'is-completed' : match.status?.state === 'in' ? 'is-live' : 'is-upcoming';
      const statusText = match.status?.completed ? 'FT' : match.status?.state === 'in' ? 'LIVE' : formatMatchDate(match.date);
      return `<button class="stadium-match ${statusClass}" type="button" onclick="openMatchModal('${match.id}')">
        <span>${escapeHtml(statusText)}</span>
        <strong>${escapeHtml(matchTitle(match))}</strong>
        <small>${escapeHtml(match.group || match.status?.shortDetail || '')}</small>
      </button>`;
    }).join('')}
  </div>`;
}

function renderCards(stadiums, selectedId) {
  return `<div class="stadium-card-grid">
    ${stadiums.map(stadium => `
      <button class="stadium-card ${stadium.id === selectedId ? 'active' : ''}" type="button" onclick="selectStadium('${stadium.id}')">
        <span class="stadium-card__image">
          <img src="${escapeHtml(stadium.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('is-missing');this.remove()">
        </span>
        <span class="stadium-card__body">
          <span class="stadium-card__meta">${escapeHtml(stadium.city)} · ${escapeHtml(stadium.countryCode)}</span>
          <strong>${escapeHtml(stadium.name)}</strong>
          <span class="stadium-card__stats">
            <span>${fmtNumber(stadium.capacity)} miejsc</span>
            <span>${stadium.matchCount} meczów</span>
          </span>
        </span>
      </button>
    `).join('')}
  </div>`;
}

function visibleStadiums(stadiums) {
  if (stadiumUi.country === 'all') return stadiums;
  return stadiums.filter(stadium => stadium.country === stadiumUi.country);
}

function resolveSelected(stadiums) {
  const visible = visibleStadiums(stadiums);
  if (!visible.length) return stadiums[0];
  const selected = visible.find(stadium => stadium.id === stadiumUi.selectedId);
  if (selected) return selected;
  stadiumUi.selectedId = visible[0].id;
  return visible[0];
}

export function selectStadium(id) {
  stadiumUi.selectedId = id;
  renderStadiums();
}

export function setStadiumCountry(country) {
  stadiumUi.country = country;
  renderStadiums();
}

export function renderStadiums() {
  const el = document.getElementById('stadiumsView');
  if (!el || !state.data) return;

  const stadiums = enrichStadiums(state.data);
  const selected = resolveSelected(stadiums);
  const visible = visibleStadiums(stadiums);
  const totals = stadiumTotals(state.data);

  el.innerHTML = `
    <div class="stadiums-head">
      <div>
        <span class="stadiums-head__eyebrow">Mundial w trzech krajach</span>
        <h3>Mapa stadionów 2026</h3>
      </div>
      ${renderCountryTabs()}
    </div>
    ${renderHeroStats(totals)}
    <div class="stadiums-layout">
      ${renderMap(visible, selected.id)}
      ${renderDetail(selected)}
    </div>
    ${renderMatchStrip(selected)}
    <div class="stadium-source-note">Mapa: Natural Earth Admin 0 Countries 1:50m. Koordynaty stadionów: Wikipedia / dane obiektów. Fotografie: Wikimedia Commons.</div>
    ${renderCards(visible, selected.id)}
  `;
}
