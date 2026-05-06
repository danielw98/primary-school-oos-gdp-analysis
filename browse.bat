@echo off
REM Local preview pentru GitHub Pages. Bind pe 127.0.0.1 = doar acest calculator.
REM Servieste docs/ exact ca GitHub Pages: localhost:8000/ = landing, localhost:8000/data-browser/ = explorator.

set "ROOT=%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY (
    echo [browse] ERROR: python nu e in PATH
    exit /b 1
)

echo [browse] http://127.0.0.1:8000/                landing
echo [browse] http://127.0.0.1:8000/data-browser/   data browser
echo.
start "" "http://127.0.0.1:8000/"
%PY% -m http.server 8000 --bind 127.0.0.1 -d "%ROOT%\docs"
