@echo off
setlocal
cd /d "%~dp0"

set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%CODEX_NODE%" (
  set "NODE_EXE=%CODEX_NODE%"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo No se encontro Node.js.
    echo Instala Node.js 20 o superior desde https://nodejs.org y vuelve a intentarlo.
    pause
    exit /b 1
  )
  set "NODE_EXE=node"
)

start "" "http://127.0.0.1:4173"
echo.
echo Lectoguarida esta iniciando en http://127.0.0.1:4173
echo Mantén esta ventana abierta. Para cerrar la app, presiona Ctrl+C.
echo.
"%NODE_EXE%" server.mjs
pause
