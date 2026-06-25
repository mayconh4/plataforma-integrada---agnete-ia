@echo off
title Continental - Backend (modo API / gateway quente)
cd /d "%~dp0"

REM Forca o modo rapido (gateway do Hermes), sem precisar editar o .env.
REM O python-dotenv NAO sobrescreve variaveis ja definidas, entao estes "set" vencem.
set "HERMES_BACKEND=hermes_api"
set "HERMES_API_URL=http://localhost:8642"
REM Se voce mudou a chave do API Server, ajuste aqui (padrao local do Hermes):
set "API_SERVER_KEY=change-me-local-dev"

echo Modo: hermes_api  (gateway quente = rapido + passos ao vivo, igual ao Telegram)
echo Gateway esperado em: %HERMES_API_URL%
echo.
echo Ativando ambiente e subindo o backend...
call .venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000
echo.
echo O backend encerrou. Veja a mensagem acima se foi erro.
pause
