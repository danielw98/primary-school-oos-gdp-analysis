#!/usr/bin/env bash
# PVDP launcher (Linux / macOS). Installs requirements (idempotent) and starts jupyter notebook.
# Usage:  ./run.sh         localhost only, browser opens automatically
#         ./run.sh lan     bind 0.0.0.0 so other LAN devices can connect

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
REQ="$ROOT/requirements.txt"
NB="$ROOT/proiect_pvdp.ipynb"

if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    echo "[error] Python 3.x not found on PATH. Install Python 3.10+."
    exit 1
fi
echo "[info] using: $PY"

echo "[setup] ensuring requirements installed"
"$PY" -m pip install -q -r "$REQ"

if [ "${1:-}" = "lan" ]; then
    echo "[run] jupyter on localhost + LAN, port 8888"
    "$PY" -m jupyter notebook "$NB" --ip=0.0.0.0 --port=8888 --ServerApp.allow_remote_access=True
else
    echo "[run] jupyter on localhost, default port, browser opens"
    "$PY" -m jupyter notebook "$NB"
fi
