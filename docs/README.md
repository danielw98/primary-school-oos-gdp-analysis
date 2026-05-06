# PVDP - GitHub Pages root

Continutul publicat la `https://danielw98.github.io/primary-school-oos-gdp-analysis/`.

Tool interactiv pentru explorat cele doua dataset-uri OWID folosite in `proiect_pvdp.ipynb`: 3 tab-uri (OOS, GDP, Joined), filtre live, multi-sort, drilldown pe tara. Pure-static (HTML + JS + CSS), niciun backend, niciun build pas.

## Local preview

Din root-ul repo-ului:
```
browse.bat                 # Windows
./browse.sh                # Unix
```

Servieste `docs/` pe `http://127.0.0.1:8000/` - identic cu ce va servi GitHub Pages.

## Structura

| Fisier | Rol |
|---|---|
| `index.html` | Schelet HTML: header, 3 tab-uri, country detail panel. Plus CDN-uri Tabulator + Plotly basic + noUiSlider. |
| `style.css` | Stiluri (filter bar, stats tiles, sparkline, scatter, detail panel, sort breadcrumb). |
| `app.js` | Entry point ES module. State, fetch CSV, build joined, setup tabs. |
| `charts.js` | Plotly: `renderScatter`, `renderSparkline`, `renderCountryDetail`. Pure functions. |
| `filters.js` | `createFilterBar`, `updateStatsTiles`, `attachSortBreadcrumb`. UI pe filter bar + sort breadcrumb. |
| `data/*.csv` | Copie a CSV-urilor (Pages serveste doar `/docs/`, deci redublata fata de `/data/` la root). |

`app.js` importa din `charts.js` si `filters.js` ca ES modules nativi. Niciun bundler.

## Tab-uri

### 1. OOS rate (primar)
Tabel `data/children-not-in-school-primary.csv` imbogatit cu `Region` (mapat din GDP). Filter bar (search + chips regiune + year slider + clear), 4 stats tiles, sparkline. Click pe rand -> country detail panel.

### 2. PIB per capita
Acelasi pattern peste `data/gdp-per-capita-worldbank.csv`. Plus filter de PIB (slider).

### 3. Joined (PIB vs OOS)
Inner join pe `(Entity, Year)` (~2-3k randuri). Plotly scatter PIB log vs OOS, color = regiune. **Filtrele tabelului actualizeaza scatter-ul live**. Plus filter de PIB.

## Country detail panel

Slide-in din dreapta. Plotly chart timeseries dual-axis: OOS (% pe stanga, portocaliu) + PIB/capita (USD log pe dreapta, albastru). Stats sumare sub chart.

Inchide cu `Esc`, click pe backdrop, sau butonul `x`.

## Multi-sort

Tabulator suporta nativ. Click pe coloana = sort dupa ea. **Shift+click pe alta coloana = sortare secundara** (then-by). Breadcrumb deasupra tabelului arata ordinea: "Sortat: An ↑ then by OOS ↓".

## Librarii (toate de la CDN)

- [Tabulator](https://tabulator.info/) 6.3 - tabele filtrabil/sortable, ~30 KB gzip
- [Plotly basic](https://plotly.com/javascript/) 2.35 - charts (scatter, line), ~700 KB gzip
- [noUiSlider](https://refreshless.com/nouislider/) 15.7 - dual-handle range slider, ~10 KB gzip
