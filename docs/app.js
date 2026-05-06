// Main entry. Orchestreaza CSV load -> joined -> tabele -> filtre/charts.

import { renderScatter, renderSparkline, renderCountryDetail, closeDetail } from './charts.js';
import { createFilterBar, updateStatsTiles, attachSortBreadcrumb } from './filters.js';

// State container (single source of truth in browser session)
const state = {
  allOOS: [],
  allGDP: [],
  joined: [],
  regionMap: new Map(),
  tables: {},   // tab id -> Tabulator instance
};

// CSV parser (gestioneaza ghilimele duble si campuri cu virgula).
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

function fetchCSV(path) {
  return fetch(path).then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  }).then(text => {
    const rows = parseCSV(text);
    const header = rows.shift();
    return rows.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
  });
}

// Inner join pe (Entity, Year). Doar randurile cu valori valide pentru ambele metrici.
function buildJoined() {
  const gdpMap = new Map();
  for (const r of state.allGDP) {
    gdpMap.set(r.Entity + '|' + r.Year, r);
  }
  state.joined = [];
  for (const o of state.allOOS) {
    const g = gdpMap.get(o.Entity + '|' + o.Year);
    if (!g) continue;
    const oosVal = parseFloat(o['Primary school age']);
    const gdpVal = parseFloat(g['GDP per capita']);
    if (Number.isNaN(oosVal) || Number.isNaN(gdpVal)) continue;
    state.joined.push({
      Entity: o.Entity,
      Code:   o.Code,
      Year:   o.Year,
      'OOS rate':       oosVal,
      'GDP per capita': gdpVal,
      Region:           g['World region according to OWID'] || 'Other',
    });
  }
}

const numFmt = (cell) => {
  const v = parseFloat(cell.getValue());
  if (Number.isNaN(v)) return cell.getValue();
  return v.toLocaleString('ro-RO', { maximumFractionDigits: 2 });
};

function showError(elId, msg) {
  document.getElementById(elId).innerHTML =
    '<p style="color:#a00">Eroare: ' + msg +
    '. Pagina trebuie servita prin HTTP, nu deschisa cu <code>file://</code>. Ruleaza <code>internal\\browse.bat</code> sau <code>internal/browse.sh</code>.</p>';
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
      // Plotly nu calculeaza dimensiuni cand container-ul e display:none.
      // Re-resize la activarea tab-ului.
      const tab = btn.dataset.panel;
      try {
        if (tab === 'oos')    Plotly.Plots.resize('oos-sparkline');
        if (tab === 'gdp')    Plotly.Plots.resize('gdp-sparkline');
        if (tab === 'joined') Plotly.Plots.resize('joined-scatter');
      } catch (_) { /* chart-ul poate sa nu fie inca initializat */ }
    });
  });
}

function setupDetailPanel() {
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.getElementById('backdrop').addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
}

function onCountryClick(entity) {
  renderCountryDetail(entity, state.allOOS, state.allGDP);
}

function setupOOSTab() {
  state.tables.oos = new Tabulator('#table-oos', {
    data: state.allOOS,
    layout: 'fitColumns',
    height: '60vh',
    pagination: true,
    paginationSize: 50,
    paginationSizeSelector: [25, 50, 100, 250],
    movableColumns: true,
    columns: [
      { title: 'Tara',    field: 'Entity', headerFilter: 'input', width: 200 },
      { title: 'Cod',     field: 'Code',   headerFilter: 'input', width: 70 },
      { title: 'An',      field: 'Year',   headerFilter: 'input', sorter: 'number', width: 90 },
      { title: 'Rata neinscrisi (%)', field: 'Primary school age', sorter: 'number', formatter: numFmt, headerFilter: 'input' },
      { title: 'Regiune', field: 'Region', headerFilter: 'list',  headerFilterParams: { valuesLookup: true, clearable: true } },
    ],
    rowClick: (e, row) => onCountryClick(row.getData().Entity),
  });

  createFilterBar('oos', state.allOOS, (filtered) => {
    state.tables.oos.replaceData(filtered);
    updateStatsTiles('oos', filtered);
    renderSparkline('oos-sparkline', filtered, 'Primary school age');
  });
  attachSortBreadcrumb('oos', state.tables.oos);
}

function setupGDPTab() {
  state.tables.gdp = new Tabulator('#table-gdp', {
    data: state.allGDP,
    layout: 'fitColumns',
    height: '60vh',
    pagination: true,
    paginationSize: 50,
    paginationSizeSelector: [25, 50, 100, 250],
    movableColumns: true,
    columns: [
      { title: 'Tara',    field: 'Entity', headerFilter: 'input', width: 200 },
      { title: 'Cod',     field: 'Code',   headerFilter: 'input', width: 70 },
      { title: 'An',      field: 'Year',   headerFilter: 'input', sorter: 'number', width: 90 },
      { title: 'PIB/capita (USD)', field: 'GDP per capita', sorter: 'number', formatter: numFmt, headerFilter: 'input' },
      { title: 'Regiune', field: 'Region', headerFilter: 'list',  headerFilterParams: { valuesLookup: true, clearable: true } },
    ],
    rowClick: (e, row) => onCountryClick(row.getData().Entity),
  });

  createFilterBar('gdp', state.allGDP, (filtered) => {
    state.tables.gdp.replaceData(filtered);
    updateStatsTiles('gdp', filtered);
    renderSparkline('gdp-sparkline', filtered, 'GDP per capita');
  }, { includeGDP: true });
  attachSortBreadcrumb('gdp', state.tables.gdp);
}

function setupJoinedTab() {
  state.tables.joined = new Tabulator('#table-joined', {
    data: state.joined,
    layout: 'fitColumns',
    height: '50vh',
    pagination: true,
    paginationSize: 50,
    paginationSizeSelector: [25, 50, 100, 250],
    movableColumns: true,
    columns: [
      { title: 'Tara',    field: 'Entity', headerFilter: 'input', width: 200 },
      { title: 'An',      field: 'Year',   headerFilter: 'input', sorter: 'number', width: 90 },
      { title: 'OOS (%)',          field: 'OOS rate',       sorter: 'number', formatter: numFmt, headerFilter: 'input' },
      { title: 'PIB/capita (USD)', field: 'GDP per capita', sorter: 'number', formatter: numFmt, headerFilter: 'input' },
      { title: 'Regiune', field: 'Region', headerFilter: 'list',  headerFilterParams: { valuesLookup: true, clearable: true } },
    ],
    rowClick: (e, row) => onCountryClick(row.getData().Entity),
  });

  // Header filters (per coloana, in tabel) compun cu filter bar-ul. Scatter-ul
  // si stats-urile reflecta randurile dupa AMBELE filtre via dataFiltered.
  state.tables.joined.on('dataFiltered', (filters, rows) => {
    const filtered = rows.map(r => r.getData());
    renderScatter('joined-scatter', filtered, onCountryClick);
    updateStatsTiles('joined', filtered);
  });

  // Filter bar inlocuieste data setul de baza. Tabulator re-aplica header
  // filters dupa replaceData -> dataFiltered se declanseaza automat.
  createFilterBar('joined', state.joined, (filtered) => {
    state.tables.joined.replaceData(filtered);
  }, { includeGDP: true });
  attachSortBreadcrumb('joined', state.tables.joined);
}

function init() {
  setupTabs();
  setupDetailPanel();

  Promise.all([
    fetchCSV('data/children-not-in-school-primary.csv'),
    fetchCSV('data/gdp-per-capita-worldbank.csv'),
  ]).then(([oos, gdp]) => {
    // Region map din GDP (sursa autoritativa pentru regiune per Entity).
    state.regionMap = new Map(
      gdp.filter(r => r['World region according to OWID'])
         .map(r => [r.Entity, r['World region according to OWID']])
    );
    // Imbogateste OOS cu Region (lipseste in CSV-ul UNESCO).
    state.allOOS = oos.map(r => ({ ...r, Region: state.regionMap.get(r.Entity) || 'Other' }));
    // GDP are deja regiunea, dar normalizez numele coloanei pentru filtre.
    state.allGDP = gdp.map(r => ({ ...r, Region: r['World region according to OWID'] || 'Other' }));
    buildJoined();

    setupOOSTab();
    setupGDPTab();
    setupJoinedTab();
  }).catch(err => {
    showError('table-oos', err.message);
    showError('table-gdp', err.message);
    showError('table-joined', err.message);
  });
}

init();
