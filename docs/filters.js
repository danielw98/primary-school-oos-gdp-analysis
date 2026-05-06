// Filter bar (search + region chips + year slider [+ gdp slider]) per tab + stats tiles update.

import { REGION_COLORS } from './charts.js';

const REGIONS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Other'];

// createFilterBar(tab, allData, onChange, options) -> { reset, getState }
//   tab          = 'oos' | 'gdp' | 'joined'
//   allData      = array de randuri (cu Region, Year, Entity, ...)
//   onChange     = callback(filtered) la orice schimbare de filtru
//   options:
//     includeGDP = true daca tab-ul are slider de PIB (presupune coloana 'GDP per capita')
export function createFilterBar(tab, allData, onChange, options = {}) {
  const { includeGDP = false } = options;

  const bar = document.querySelector('.filter-bar[data-tab="' + tab + '"]');
  const searchInput = bar.querySelector('.search-input');
  const chipsContainer = bar.querySelector('.region-chips');
  const yearSlider = bar.querySelector('.year-range .slider');
  const yearFromEl = bar.querySelector('.year-range .value-from');
  const yearToEl = bar.querySelector('.year-range .value-to');
  const clearBtn = bar.querySelector('.clear-btn');

  const years = allData.map(r => +r.Year).filter(y => !Number.isNaN(y));
  const yMin = Math.min(...years);
  const yMax = Math.max(...years);

  // GDP range bounds (round la $100 ca slider-ul sa nu aiba step zecimal)
  let gdpMin = null, gdpMax = null;
  let gdpSlider = null, gdpFromEl = null, gdpToEl = null;
  if (includeGDP) {
    const gdpRangeEl = bar.querySelector('.gdp-range');
    if (gdpRangeEl) {
      const gdps = allData.map(r => parseFloat(r['GDP per capita'])).filter(v => !Number.isNaN(v));
      gdpMin = Math.floor(Math.min(...gdps) / 100) * 100;
      gdpMax = Math.ceil(Math.max(...gdps) / 100) * 100;
      gdpSlider = gdpRangeEl.querySelector('.slider');
      gdpFromEl = gdpRangeEl.querySelector('.value-from');
      gdpToEl = gdpRangeEl.querySelector('.value-to');
    }
  }

  const state = {
    search: '',
    regions: new Set(),
    yearMin: yMin,
    yearMax: yMax,
    gdpMin: gdpMin,  // null daca nu e activ
    gdpMax: gdpMax,
  };

  // Region chips ----------
  chipsContainer.innerHTML = '';
  REGIONS.forEach(region => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.region = region;
    btn.textContent = region;
    btn.style.borderColor = REGION_COLORS[region];
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        btn.style.background = REGION_COLORS[region];
        state.regions.add(region);
      } else {
        btn.style.background = '';
        state.regions.delete(region);
      }
      apply();
    });
    chipsContainer.appendChild(btn);
  });

  // Year slider ----------
  noUiSlider.create(yearSlider, {
    start: [yMin, yMax],
    connect: true,
    step: 1,
    range: { min: yMin, max: yMax },
    format: { from: v => Math.round(v), to: v => Math.round(v) },
  });
  yearFromEl.textContent = yMin;
  yearToEl.textContent = yMax;
  yearSlider.noUiSlider.on('update', (values) => {
    state.yearMin = +values[0];
    state.yearMax = +values[1];
    yearFromEl.textContent = values[0];
    yearToEl.textContent = values[1];
  });
  yearSlider.noUiSlider.on('change', () => apply());

  // GDP slider (optional) ----------
  if (gdpSlider) {
    const fmtGdp = v => '$' + Math.round(v).toLocaleString('en-US');
    noUiSlider.create(gdpSlider, {
      start: [gdpMin, gdpMax],
      connect: true,
      step: 500,
      range: { min: gdpMin, max: gdpMax },
      format: { from: v => Math.round(v), to: v => Math.round(v) },
    });
    gdpFromEl.textContent = fmtGdp(gdpMin);
    gdpToEl.textContent = fmtGdp(gdpMax);
    gdpSlider.noUiSlider.on('update', (values) => {
      state.gdpMin = +values[0];
      state.gdpMax = +values[1];
      gdpFromEl.textContent = fmtGdp(values[0]);
      gdpToEl.textContent = fmtGdp(values[1]);
    });
    gdpSlider.noUiSlider.on('change', () => apply());
  }

  // Search input (debounced) ----------
  let searchTimer = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const v = e.target.value.trim().toLowerCase();
    searchTimer = setTimeout(() => {
      state.search = v;
      apply();
    }, 150);
  });

  // Clear ----------
  clearBtn.addEventListener('click', () => reset());

  function apply() {
    const filtered = allData.filter(r => {
      if (state.search && !(r.Entity || '').toLowerCase().includes(state.search)) return false;
      if (state.regions.size && !state.regions.has(r.Region || 'Other')) return false;
      const y = +r.Year;
      if (Number.isFinite(y)) {
        if (y < state.yearMin || y > state.yearMax) return false;
      }
      if (gdpSlider) {
        const g = parseFloat(r['GDP per capita']);
        if (Number.isNaN(g)) return false;
        if (g < state.gdpMin || g > state.gdpMax) return false;
      }
      return true;
    });
    onChange(filtered);
  }

  function reset() {
    searchInput.value = '';
    state.search = '';
    chipsContainer.querySelectorAll('.chip.active').forEach(btn => {
      btn.classList.remove('active');
      btn.style.background = '';
    });
    state.regions.clear();
    yearSlider.noUiSlider.set([yMin, yMax]);
    state.yearMin = yMin;
    state.yearMax = yMax;
    if (gdpSlider) {
      gdpSlider.noUiSlider.set([gdpMin, gdpMax]);
      state.gdpMin = gdpMin;
      state.gdpMax = gdpMax;
    }
    apply();
  }

  apply(); // initial render
  return { reset, getState: () => ({ ...state, regions: new Set(state.regions) }) };
}

// updateStatsTiles(tab, data) - data-attribute-driven (vezi index.html)
export function updateStatsTiles(tab, data) {
  const tiles = document.querySelectorAll('.stats-tiles[data-tab="' + tab + '"] .big-num');
  if (!tiles.length) return;

  const countries = new Set(data.map(r => r.Entity)).size;
  const years = data.map(r => +r.Year).filter(y => !Number.isNaN(y));
  const yearStr = years.length ? Math.min(...years) + '-' + Math.max(...years) : '-';
  const fmt = v => v.toLocaleString('ro-RO', { maximumFractionDigits: 2 });

  tiles.forEach(el => {
    const stat = el.dataset.stat;
    if (stat === 'rows') {
      el.textContent = data.length.toLocaleString('ro-RO');
    } else if (stat === 'countries') {
      el.textContent = countries;
    } else if (stat === 'years') {
      el.textContent = yearStr;
    } else if (stat === 'mean') {
      const key = el.dataset.key;
      const suffix = el.dataset.suffix || '';
      const vals = data.map(r => parseFloat(r[key])).filter(v => !Number.isNaN(v));
      const mean = vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length) : null;
      el.textContent = mean !== null ? fmt(mean) + suffix : '-';
    }
  });
}

// attachSortBreadcrumb(tab, table)
//   Hook pe Tabulator dataSorted - actualizeaza breadcrumb deasupra tabelului.
//   Gol cand nu e sortat; afiseaza "Sortat: <Col1> ↑ then by <Col2> ↓" cand sunt sorturi active.
export function attachSortBreadcrumb(tab, table) {
  const el = document.querySelector(`.sort-breadcrumb[data-tab="${tab}"]`);
  if (!el) return;

  function update(sorters) {
    if (!sorters || sorters.length === 0) {
      el.classList.remove('active');
      el.innerHTML = '';
      return;
    }
    const parts = sorters.map(s => {
      const arrow = s.dir === 'asc' ? '↑' : '↓';
      let title = s.field;
      try {
        const col = table.getColumn(s.field);
        if (col) title = col.getDefinition().title;
      } catch (_) { /* keep field as fallback */ }
      return `<span class="sort-tag">${title} ${arrow}</span>`;
    });
    el.classList.add('active');
    el.innerHTML = '<span class="sort-label">Sortat:</span> ' +
      parts.join(' <span class="sort-arrow">then by</span> ');
  }

  table.on('dataSorted', (sorters, _rows) => update(sorters));
  // Initial state: ce sorters are tabelul la momentul atasarii (de obicei niciunul)
  setTimeout(() => update(table.getSorters()), 50);
}
