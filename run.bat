@echo off
setlocal EnableDelayedExpansion

REM PVDP launcher (Windows). Installs requirements (idempotent) and starts jupyter notebook.
REM Usage:  run.bat           localhost only, browser opens automatically
REM         run.bat lan       bind 0.0.0.0 so other LAN devices can connect

set "ROOT=%~dp0"
set "REQ=%ROOT%requirements.txt"
set "NB=%ROOT%proiect_pvdp.ipynb"

REM Detect a Python that actually runs (not the Microsoft Store stub).
set "PY="
call :try_py "py -3"
if not defined PY call :try_py "python"
if not defined PY call :try_py "python3"
if not defined PY (
    echo [error] No working Python 3.x found on PATH.
    echo         Install from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
    exit /b 1
)
echo [info] using Python via: !PY!

echo [setup] ensuring requirements installed
!PY! -m pip install -q -r "%REQ%"
if errorlevel 1 ( echo [error] pip install failed & exit /b 1 )

if /i "%~1"=="lan" (
    echo [run] jupyter on localhost + LAN, port 8888
    !PY! -m jupyter notebook "%NB%" --ip=0.0.0.0 --port=8888 --ServerApp.allow_remote_access=True
) else (
    echo [run] jupyter on localhost, default port, browser opens
    !PY! -m jupyter notebook "%NB%"
)
exit /b 0

:try_py
%~1 -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=%~1"
exit /b 0
