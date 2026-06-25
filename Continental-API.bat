@echo off
cd /d "%~dp0"
title Continental - Modo rapido (api-server)
echo ===================================================
echo    Continental (Hermes) - MODO RAPIDO (api-server)
echo ===================================================
echo.

REM 1) Encerra backend antigo preso na porta 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

REM 2) Encerra tuneis antigos
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1

REM 3) Confere se o api-server do Hermes ja esta no ar (porta 8642).
REM    NAO subimos um gateway aqui: o seu gateway (o mesmo do Telegram) ja roda
REM    sozinho. Basta ter o api-server HABILITADO nele (hermes gateway setup).
netstat -ano | findstr ":8642" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo [ATENCAO] Nada escutando na porta 8642 = api-server DESLIGADO.
  echo.
  echo Para ligar o modo rapido + passos ao vivo:
  echo    1^) hermes gateway setup      ^(habilite "API Server"^)
  echo    2^) hermes gateway restart
  echo    3^) confira: netstat -ano ^| findstr :8642   ^(tem que dizer LISTENING^)
  echo.
  echo O backend vai subir mesmo assim: sem o api-server, ele cai pro CLI
  echo automaticamente ^(funciona, so mais lento e sem passos ao vivo^).
  echo.
) else (
  echo [OK] api-server detectado na porta 8642. Modo rapido ativo.
  echo.
)

REM 4) Sobe o backend FastAPI no modo hermes_api (com fallback pro CLI)
start "Continental - Backend (API)" "%~dp0backend\run-backend-api.bat"

REM 5) Sobe o tunel (ngrok, URL fixa)
start "Continental - Tunel" "%~dp0run-tunnel.bat"

echo Duas janelas foram abertas (Backend e Tunel).
echo Use o app normalmente. Para voltar ao modo simples, use o Continental.bat.
echo.
pause
