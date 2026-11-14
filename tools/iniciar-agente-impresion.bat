@echo off
title HEIS Suite - Agente Local de Impresion ESC/POS
cd /d "%~dp0"
echo ===================================================
echo   HEIS SUITE - AGENTE LOCAL DE IMPRESION ESC/POS
echo ===================================================
echo.
echo Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instale Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Iniciando micro-agente en http://127.0.0.1:9101 ...
echo Puerto: 9101 (PNA y CORS habilitados para SaaS https://suite.grupoheis.com)
echo Mantenga esta ventana abierta o minimizada en segundo plano.
echo.
node "%~dp0heis-print-agent.mjs"
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] El proceso del agente se ha detenido.
    pause
)
