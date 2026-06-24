@echo off
cd /d "%~dp0"
title Continental - Inicializador
echo ============================================
echo    Iniciando Continental (Hermes)
echo ============================================
echo.

REM 1) Encerra qualquer backend antigo preso na porta 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

REM 2) Encerra tuneis antigos do cloudflared
taskkill /F /IM cloudflared.exe >nul 2>&1

REM 3) Sobe o backend (uvicorn) numa janela propria
start "Continental - Backend" "%~dp0backend\run-backend.bat"

REM 4) Sobe o tunel (cloudflared) numa janela propria
start "Continental - Tunel" "%~dp0run-tunnel.bat"

echo Duas janelas foram abertas:
echo.
echo   [Continental - Backend]  espere aparecer:  Uvicorn running on http://0.0.0.0:8000
echo   [Continental - Tunel]    copie a URL:       https://....trycloudflare.com
echo.
echo No app: toque na engrenagem, troque https por wss, adicione /ws no final, ex.:
echo   wss://....trycloudflare.com/ws
echo e toque em Salvar e conectar.
echo.
echo Pode fechar ESTA janela. NAO feche as outras duas enquanto usar o app.
echo.
pause
