// Plotly chart renderers. Pure functions: primesc DOM id + date, randeaza.
// Niciun state intern. Globalele Plotly / window.Plotly vin de la CDN (vezi index.html).

export const REGION_COLORS = {
  'Africa':        '#E69F00',
  'Asia':          '#56B4E9',
  'Europe':        '#009E73',
  'North America': '#CC79A7',
  'South America': '#D55E00',
  'Oceania':       '#0072B2',
  'Other':         '#888888',
};

// Scatter PIB-vs-OOS pentru tab-ul Joined.
// `data` = randuri din `state.joined` (deja filtrate sau nu).
// `onClick(entity)` se apeleaza la click pe punct.
export function renderScatter(elId, data, onClick) {
  const byRegion = {};
  for (const r of data) {
    const region = r.Region || 'Other';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(r);
  }
  const traces = Object.keys(byRegion).sort().map(region => ({
    x: byRegion[region].map(r => r['GDP per capita']),
    y: byRegion[region].map(r => r['OOS rate']),
    text: byRegion[region].map(r => r.Entity + ' (' + r.Year + ')'),
    customdata: byRegion[region].map(r => r.Entity),
    mode: 'markers',
    type: 'scatter',
    name: region,
    marker: { size: 7, opacity: 0.65, color: REGION_COLORS[region] || '#888' },
    hovertemplate: '<b>%{text}</b><br>PIB/capita: $%{x:,.0f}<br>OOS: %{y:.1f}%<extra>' + region + '</extra>',
  }));
  const layout = {
    xaxis: { type: 'log', title: 'PIB per capita (USD, log scale)', gridcolor: '#eee' },
    yaxis: { title: 'Rata neinscrisi (%)', gridcolor: '#eee' },
    margin: { l: 60, r: 20, t: 16, b: 50 },
    legend: { orientation: 'h', y: -0.18 },
    hoverlabel: { bgcolor: 'white', bordercolor: '#ccc' },
    plot_bgcolor: '#fafaf7',
    paper_bgcolor: '#ffffff',
  };
  Plotly.react(elId, traces, layout, { displayModeBar: false, responsive: true });

  const gd = document.getElementById(elId);
  if (gd && gd.removeAllListeners) gd.removeAllListeners('plotly_click');
  if (gd && onClick) {
    gd.on('plotly_click', (ev) => {
      const pt = ev.points && ev.points[0];
      if (pt && pt.customdata) onClick(pt.customdata);
    });
  }
}

// Sparkline: media globala an cu an pentru o singura metrica.
export function renderSparkline(elId, data, valueKey) {
  const byYear = new Map();
  for (const r of data) {
    const y = +r.Year;
    const v = parseFloat(r[valueKey]);
    if (Number.isNaN(y) || Number.isNaN(v)) continue;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(v);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const means = years.map(y => byYear.get(y).reduce((s, v) => s + v, 0) / byYear.get(y).length);

  const trace = {
    x: years,
    y: means,
    type: 'scatter',
    mode: 'lines+markers',
    line: { color: '#2d4a3e', width: 2 },
    marker: { size: 4 },
    hovertemplate: '%{x}: %{y:.2f}<extra></extra>',
  };
  Plotly.react(elId, [trace], {
    margin: { l: 40, r: 10, t: 6, b: 28 },
    xaxis: { tickfont: { size: 10 }, gridcolor: '#eee' },
    yaxis: { tickfont: { size: 10 }, gridcolor: '#eee' },
    plot_bgcolor: '#fafaf7',
    paper_bgcolor: '#ffffff',
    showlegend: false,
  }, { displayModeBar: false, responsive: true });
}

// Country detail panel: timeseries dual-axis (OOS stanga, PIB dreapta log).
// Apelat la click pe rand sau punct scatter.
export function renderCountryDetail(entity, allOOS, allGDP) {
  const oos = allOOS.filter(r => r.Entity === entity)
    .map(r => ({ Year: +r.Year, val: parseFloat(r['Primary school age']) }))
    .filter(r => !Number.isNaN(r.val) && !Number.isNaN(r.Year))
    .sort((a, b) => a.Year - b.Year);
  const gdp = allGDP.filter(r => r.Entity === entity)
    .map(r => ({
      Year: +r.Year,
      val: parseFloat(r['GDP per capita']),
      region: r['World region according to OWID'],
    }))
    .filter(r => !Number.isNaN(r.val) && !Number.isNaN(r.Year))
    .sort((a, b) => a.Year - b.Year);

  const region = (gdp[0] && gdp[0].region) || 'Other';
  document.getElementById('detail-title').textContent = entity;
  document.getElementById('detail-sub').textContent =
    region + '  -  OOS pe stanga (portocaliu), PIB/capita pe dreapta (albastru, log)';

  const traces = [];
  if (oos.length) {
    traces.push({
      x: oos.map(r => r.Year),
      y: oos.map(r => r.val),
      name: 'OOS rate (%)',
      mode: 'lines+markers',
      type: 'scatter',
      line: { color: '#D55E00', width: 2 },
      marker: { size: 6 },
      yaxis: 'y',
      hovertemplate: '%{x}: %{y:.2f}%<extra></extra>',
    });
  }
  if (gdp.length) {
    traces.push({
      x: gdp.map(r => r.Year),
      y: gdp.map(r => r.val),
      name: 'PIB/capita (USD)',
      mode: 'lines+markers',
      type: 'scatter',
      line: { color: '#0072B2', width: 2 },
      marker: { size: 6 },
      yaxis: 'y2',
      hovertemplate: '%{x}: $%{y:,.0f}<extra></extra>',
    });
  }
  const layout = {
    margin: { l: 56, r: 56, t: 12, b: 50 },
    xaxis: { title: 'An', gridcolor: '#eee' },
    yaxis: {
      title: 'Rata neinscrisi (%)',
      side: 'left',
      titlefont: { color: '#D55E00' },
      tickfont: { color: '#D55E00' },
      gridcolor: '#eee',
    },
    yaxis2: {
      title: 'PIB/capita (USD, log)',
      side: 'right',
      overlaying: 'y',
      type: 'log',
      titlefont: { color: '#0072B2' },
      tickfont: { color: '#0072B2' },
      showgrid: false,
    },
    legend: { orientation: 'h', y: -0.18 },
    plot_bgcolor: '#fafaf7',
    paper_bgcolor: '#ffffff',
  };
  Plotly.react('detail-chart', traces, layout, { displayModeBar: false, responsive: true });

  const fmt = n => Number.isFinite(n) ? n.toLocaleString('ro-RO', { maximumFractionDigits: 2 }) : '-';
  const stat = arr => {
    if (!arr.length) return null;
    const xs = arr.map(r => r.val);
    return { min: Math.min(...xs), max: Math.max(...xs), first: arr[0], last: arr[arr.length - 1] };
  };
  const sOOS = stat(oos), sGDP = stat(gdp);
  let html = '';
  if (sOOS) {
    html += '<div><strong>OOS:</strong></div><div>' + sOOS.first.Year + ' = ' + fmt(sOOS.first.val) + '% &rarr; ' + sOOS.last.Year + ' = ' + fmt(sOOS.last.val) + '%</div>';
    html += '<div><strong>OOS min/max:</strong></div><div>' + fmt(sOOS.min) + '% / ' + fmt(sOOS.max) + '%</div>';
  }
  if (sGDP) {
    html += '<div><strong>PIB:</strong></div><div>$' + fmt(sGDP.first.val) + ' (' + sGDP.first.Year + ') &rarr; $' + fmt(sGDP.last.val) + ' (' + sGDP.last.Year + ')</div>';
    html += '<div><strong>PIB min/max:</strong></div><div>$' + fmt(sGDP.min) + ' / $' + fmt(sGDP.max) + '</div>';
  }
  document.getElementById('detail-stats').innerHTML = html;

  document.getElementById('detail-panel').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  document.getElementById('detail-panel').setAttribute('aria-hidden', 'false');
}

export function closeDetail() {
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('detail-panel').setAttribute('aria-hidden', 'true');
}
