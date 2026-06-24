@echo off
title Continental - Tunel
echo Abrindo o tunel ngrok (URL FIXA) na porta 8000...
echo URL fixa: https://strep-undocked-register.ngrok-free.dev
echo.
"%LOCALAPPDATA%\ngrok-bin\ngrok.exe" http 8000 --domain=strep-undocked-register.ngrok-free.dev
echo.
echo O tunel encerrou.
pause
