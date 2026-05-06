#!/usr/bin/env bash
# Local preview pentru GitHub Pages. Bind pe 127.0.0.1 = doar acest calculator.
# Servieste docs/ exact ca GitHub Pages: localhost:8000/ = landing, localhost:8000/data-browser/ = explorator.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    echo "[browse] ERROR: python nu e in PATH"
    exit 1
fi

URL="http://127.0.0.1:8000/"
echo "[browse] $URL              landing"
echo "[browse] ${URL}data-browser/   data browser"
echo

if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1 &
fi

"$PY" -m http.server 8000 --bind 127.0.0.1 -d "$ROOT/docs"
