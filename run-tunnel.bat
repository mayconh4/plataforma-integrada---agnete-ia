@echo off
title Continental - Tunel
echo Abrindo o tunel Cloudflare (porta 8000)...
echo Copie a URL https://....trycloudflare.com que aparecer abaixo.
echo.
cloudflared tunnel --url http://localhost:8000
echo.
echo O tunel encerrou.
pause
