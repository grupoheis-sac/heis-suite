@echo off
title HEIS SUITE - Configuracion Base de Datos Multi-Tenant
cls

echo ========================================================
echo        HEIS SUITE - CONFIGURACION BASE DE DATOS
echo ========================================================
echo.

set "DIR_SUITE=%~dp0"
cd /d "%DIR_SUITE%server"

echo [1/2] Verificando estado del servicio MySQL...
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>nul
if errorlevel 1 (
    echo [ADVERTENCIA] MySQL no parece estar activo en el puerto 3306.
    echo Asegurate de abrir Laragon y presionar en Iniciar Todo.
    echo.
) else (
    echo [OK] Servicio MySQL detectado en puerto 3306.
    echo.
)

echo [2/2] Creando base de datos heis_suite_db y sembrando datos demo...
call node src/utils/seeder.js

echo.
echo ========================================================
echo   CONFIGURACION COMPLETADA
echo.
echo   SuperAdmin Plataforma: superadmin@heissuite.com / admin123
echo   Empresa Demo Admin:    admin@admin.com / admin123
echo   Caja POS:              caja@admin.com / caja123
echo   Mozo Salon:            mozo@admin.com / mozo123
echo ========================================================
echo.
pause
