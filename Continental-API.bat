@echo off
cd /d "%~dp0"
title Continental - Inicializador (modo API / rapido + passos ao vivo)
echo ===================================================
echo    Continental (Hermes) - MODO RAPIDO (gateway)
echo ===================================================
echo.
echo Este modo usa o Hermes Agent JA LIGADO (gateway API Server),
echo igual ao Telegram: responde rapido e mostra os passos ao vivo.
echo.

REM 1) Encerra backend antigo preso na porta 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

REM 2) Encerra tuneis antigos
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1

REM 3) Sobe o Hermes Agent em modo API Server (porta 8642).
REM    Precisa do Hermes Agent (NousResearch) instalado e o api-server ativado
REM    no config (hermes setup). Se esta janela fechar com erro, o modo rapido
REM    nao vai funcionar -> use o Continental.bat normal.
start "Hermes Gateway (API Server :8642)" cmd /k "hermes gateway run"

REM 4) Da um tempo pro gateway subir
timeout /t 4 >nul

REM 5) Sobe o backend FastAPI ja no modo hermes_api
start "Continental - Backend (API)" "%~dp0backend\run-backend-api.bat"

REM 6) Sobe o tunel (ngrok, URL fixa)
start "Continental - Tunel" "%~dp0run-tunnel.bat"

echo Tres janelas foram abertas:
echo   [Hermes Gateway]          espere o gateway dizer que esta ouvindo em :8642
echo   [Continental - Backend]   espere:  Uvicorn running on http://0.0.0.0:8000
echo   [Continental - Tunel]     o ngrok sobe com a URL FIXA
echo.
echo Se a janela do Hermes Gateway fechar com erro, o Hermes Agent nao esta
echo instalado/configurado como api-server. Nesse caso, use o Continental.bat
echo normal (modo hermes_cli, funciona sempre, so mais lento).
echo.
pause
