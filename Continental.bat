@echo off
cd /d "%~dp0"
title Continental - Inicializador
echo ============================================
echo    Iniciando Continental (Hermes)
echo ============================================
echo.

REM 1) Encerra qualquer backend antigo preso na porta 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

REM 2) Encerra tuneis antigos (cloudflared e ngrok)
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1

REM 3) Sobe o backend (uvicorn) numa janela propria
start "Continental - Backend" "%~dp0backend\run-backend.bat"

REM 4) Sobe o tunel (ngrok, URL fixa) numa janela propria
start "Continental - Tunel" "%~dp0run-tunnel.bat"

echo Duas janelas foram abertas:
echo.
echo   [Continental - Backend]  espere aparecer:  Uvicorn running on http://0.0.0.0:8000
echo   [Continental - Tunel]    o ngrok sobe com a URL FIXA (sempre a mesma)
echo.
echo A URL ja esta salva no app (URL fixa). Nao precisa colar de novo:
echo   wss://strep-undocked-register.ngrok-free.dev/ws
echo.
echo Pode fechar ESTA janela. NAO feche as outras duas enquanto usar o app.
echo.
pause
