@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   DESPLEGUE COMPLETO CON ALIAS VERCEL
echo ========================================
echo.

echo [1/4] Limpiando cache de npm...
call npm cache clean --force

echo.
echo [2/4] Instalando dependencias...
call npm install

echo.
echo [3/4] Construyendo aplicacion...
call npm run build

echo.
echo [4/4] Desplegando a Vercel...
echo.

REM Ejecutar vercel deploy y capturar la URL
for /f "delims=" %%a in ('npx vercel --prod 2^>^&1') do (
    echo %%a
    echo %%a | findstr /C:"Production: https://" >nul
    if !errorlevel! equ 0 (
        for /f "tokens=2 delims=:" %%b in ("%%a") do (
            set DEPLOY_URL=https:%%b
        )
    )
)

echo.
echo ========================================
echo   CONFIGURANDO ALIAS
echo ========================================
echo.

if defined DEPLOY_URL (
    REM Limpiar espacios en blanco
    for /f "tokens=* delims= " %%c in ("%DEPLOY_URL%") do set DEPLOY_URL=%%c
    
    echo URL del deployment: %DEPLOY_URL%
    echo Estableciendo alias a cliente-web-mu.vercel.app...
    echo.
    call npx vercel alias set %DEPLOY_URL% cliente-web-mu.vercel.app
    
    echo.
    echo ========================================
    echo   DESPLEGUE COMPLETADO EXITOSAMENTE
    echo ========================================
    echo.
    echo URL: https://cliente-web-mu.vercel.app
    echo.
) else (
    echo ========================================
    echo   ATENCION - Configurar alias manualmente
    echo ========================================
    echo.
    echo No se pudo detectar automaticamente la URL del deployment.
    echo Por favor, configura el alias manualmente:
    echo.
    echo   npx vercel alias set ^<URL-TEMPORAL^> cliente-web-mu.vercel.app
    echo.
    echo Revisa el output de arriba para obtener la URL temporal.
    echo.
)

echo IMPORTANTE: Limpia el cache del navegador para ver los cambios:
echo   - Windows: Ctrl + Shift + R
echo   - Mac: Cmd + Shift + R
echo   - O abre DevTools (F12) y haz click derecho en Recargar -^> "Vaciar cache y recargar"
echo.
pause
