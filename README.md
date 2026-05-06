# Rata copiilor neinscrisi la scoala si dezvoltarea economica

Proiect master TCSI (Politehnica Bucuresti, FSA), curs **Procesarea si Vizualizarea Datelor in Python**, 2025-2026.

Analiza relatiei dintre rata copiilor de varsta scolara primara neinscrisi la scoala (UNESCO via OWID, 1998-2024) si PIB per capita (World Bank).

## Ipoteza

1. Rata copiilor neinscrisi este mai mare in tari cu PIB/capita mai scazut.
2. Rata scade in timp odata cu dezvoltarea economica.

## Continut

- `proiect_pvdp.ipynb` - analiza completa: 6 vizualizari (choropleth, box plot, top/bottom 15, scatter+LOWESS, evolutie temporala, dumbbell), teste Pearson/Spearman, interpretare.
- `data/` - snapshot CSV-uri OWID (~400 KB), citite de notebook.
- `docs/` - landing page + data browser interactiv, publicat via GitHub Pages.
- `run.bat` / `run.sh` - launchere care instaleaza dependentele si pornesc jupyter.

## Rulare

Necesar: Python 3.10+ in PATH.

```
run.bat                # Windows
./run.sh               # Linux / macOS
run.bat lan            # bind 0.0.0.0 pentru LAN
```

Manual:
```
pip install -r requirements.txt
jupyter notebook proiect_pvdp.ipynb
```

## Vizualizare online

**Notebook (analiza completa)**: randat de [nbviewer.org](https://nbviewer.org/github/danielw98/primary-school-oos-gdp-analysis/blob/main/proiect_pvdp.ipynb) - graficele Plotly (harti choropleth, scatter, box plot etc.) sunt navigabile in browser fara clonarea repo-ului.

**Data browser interactiv (GitHub Pages)**: pagina HTML de explorare a celor doua dataset-uri, cu filtre live (an, regiune, PIB, search), multi-sort (Shift+click) si drilldown pe tara. URL: `https://danielw98.github.io/primary-school-oos-gdp-analysis/`.
