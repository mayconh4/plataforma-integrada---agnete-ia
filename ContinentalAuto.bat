@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d "%~dp0"
title Continental (Viper) - Inicializador Automatico

echo ============================================
echo    Continental (Viper) - START AUTOMATICO
echo ============================================
echo.

REM 1) Encerra instancias antigas (backend na 8000 e tuneis ngrok)
echo [1/3] Encerrando instancias antigas...
taskkill /F /IM ngrok.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo       OK.
echo.

REM 2) Sobe o backend FastAPI (uvicorn :8000, modo hermes_cli)
echo [2/3] Subindo o backend na porta 8000...
start "Continental - Backend" "%~dp0backend\run-backend.bat"

REM Espera ate 25s o backend comecar a ouvir na :8000
set "BE_OK="
set "WAIT=0"
:wait_be
timeout /t 1 /nobreak >nul
set /a WAIT+=1
netstat -aon | findstr ":8000" | findstr "LISTENING" >nul
if not errorlevel 1 set "BE_OK=1"
if not defined BE_OK if !WAIT! LSS 25 goto wait_be

if defined BE_OK (
  echo       OK: backend ativo em :8000
) else (
  echo       ERRO: o backend nao subiu. Veja a janela "Continental - Backend".
  echo       Dica: confira o arquivo backend\.env e o ambiente .venv.
  pause
  exit /b 1
)
echo.

REM 3) Sobe o tunel ngrok com a URL fixa
echo [3/3] Abrindo o tunel ngrok (URL fixa)...
start "Continental - Tunel" "%~dp0run-tunnel.bat"

echo.
echo ============================================
echo   Continental no ar!
echo.
echo   URL fixa (ja salva no app):
echo   wss://strep-undocked-register.ngrok-free.dev/ws
echo.
echo   Nao feche as janelas "Backend" e "Tunel".
echo   Pode fechar ESTA janela.
echo ============================================
echo.
pause
