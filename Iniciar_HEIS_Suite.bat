@echo off
title HEIS SUITE - Servidores Enterprise
cls

echo ========================================================
echo          INICIANDO HEIS SUITE PLATFORM
echo ========================================================
echo.
echo  Backend Multi-Tenant: http://localhost:4000
echo  Frontend Shell Suite: http://localhost:5173
echo.
echo  Credenciales Demo:
echo   - SuperAdmin:  superadmin@heissuite.com  / admin123
echo   - Empresa:     admin@admin.com          / admin123
echo   - Cajero POS:  caja@admin.com           / caja123
echo   - Mozo Salon:  mozo@admin.com           / mozo123
echo ========================================================
echo.

set "DIR_SUITE=%~dp0"

echo [1/3] Verificando servicio MySQL...
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>nul
if errorlevel 1 (
    echo [ADVERTENCIA] MySQL no parece estar activo en el puerto 3306.
    echo Asegurate de abrir Laragon y presionar en Iniciar Todo.
    echo.
) else (
    echo [OK] MySQL activo.
    echo.
)

echo [2/3] Iniciando Backend Multi-Tenant en puerto 4000...
start "HEIS Suite Backend" cmd /k "cd /d %DIR_SUITE%server && npm.cmd run dev"

:: Esperar 2 segundos antes de iniciar frontend
ping 127.0.0.1 -n 3 > nul

echo [3/3] Iniciando Frontend Shell en puerto 5173...
start "HEIS Suite Frontend" cmd /k "cd /d %DIR_SUITE%apps\shell && npm.cmd run dev"

:: Esperar 3 segundos para que Vite compile e inicie
ping 127.0.0.1 -n 4 > nul

echo Abriendo navegador en http://localhost:5173...
start "" "http://localhost:5173"

echo.
echo ========================================================
echo  HEIS Suite se encuentra en ejecucion en segundo plano.
echo  Para detener el sistema, cierra las ventanas de consola.
echo ========================================================
echo.
pause
