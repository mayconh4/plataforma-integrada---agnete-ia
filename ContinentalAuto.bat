@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d "%~dp0"
title Continental (Viper) - Inicializador Automatico

echo ============================================
echo    Continental (Viper) - START AUTOMATICO
echo ============================================
echo.

REM ------------------------------------------------------------------
REM 1) Encerra backend antigo (:8000) e tuneis ngrok. O gateway fica.
REM ------------------------------------------------------------------
echo [1/4] Encerrando instancias antigas...
taskkill /F /IM ngrok.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo       OK.
echo.

REM ------------------------------------------------------------------
REM 2) Modo rapido (gateway Hermes na 8642). NAO FATAL: se nao subir,
REM    o backend cai sozinho para o modo CLI.
REM ------------------------------------------------------------------
echo [2/4] Verificando o modo rapido (gateway 8642)...
set "GW_UP="
netstat -aon | findstr ":8642" | findstr "LISTENING" >nul && set "GW_UP=1"
if defined GW_UP goto gw_done
echo       Tentando subir o gateway...
start "Continental - Gateway" cmd /c "hermes gateway start"
set "WAIT=0"
:wait_gw
timeout /t 1 /nobreak >nul
set /a WAIT+=1
netstat -aon | findstr ":8642" | findstr "LISTENING" >nul && set "GW_UP=1"
if not defined GW_UP if %WAIT% LSS 20 goto wait_gw
:gw_done
if defined GW_UP (echo       OK: modo RAPIDO disponivel.) else (echo       Modo COMPATIVEL ^(CLI^) - funciona, so mais lento.)
echo.

REM ------------------------------------------------------------------
REM 3) Backend FastAPI (:8000).
REM ------------------------------------------------------------------
echo [3/4] Subindo o backend na porta 8000...
start "Continental - Backend" "%~dp0backend\run-backend.bat"
set "BE_UP="
set "WAIT=0"
:wait_be
timeout /t 1 /nobreak >nul
set /a WAIT+=1
netstat -aon | findstr ":8000" | findstr "LISTENING" >nul && set "BE_UP=1"
if not defined BE_UP if %WAIT% LSS 25 goto wait_be
if not defined BE_UP goto be_fail
echo       OK: backend ativo em 8000.
echo.

REM ------------------------------------------------------------------
REM 4) Tunel ngrok (URL fixa).
REM ------------------------------------------------------------------
echo [4/4] Abrindo o tunel ngrok (URL fixa)...
start "Continental - Tunel" "%~dp0run-tunnel.bat"
echo.
echo ============================================
echo   Continental no ar!
if defined GW_UP (echo   Modo: RAPIDO) else (echo   Modo: COMPATIVEL)
echo.
echo   URL fixa (ja salva no app):
echo   wss://strep-undocked-register.ngrok-free.dev/ws
echo.
echo   Nao feche as janelas Backend/Tunel. Pode fechar ESTA.
echo ============================================
echo.
pause
exit /b 0

:be_fail
echo       ERRO: o backend nao subiu. Veja a janela "Continental - Backend".
echo       Confira backend\.env e o ambiente .venv.
pause
exit /b 1
