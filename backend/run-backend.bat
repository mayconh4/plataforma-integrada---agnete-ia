@echo off
title Continental - Backend
cd /d "%~dp0"
echo Ativando ambiente e subindo o backend...
call .venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000
echo.
echo O backend encerrou. Veja a mensagem acima se foi erro.
pause
