@echo off
echo ========================================
echo  Instalando Cliente Web - Click Entrega
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Limpiando cache de npm...
call npm cache clean --force

echo.
echo [2/3] Instalando dependencias...
call npm install

echo.
echo [3/3] Verificando instalacion...
if exist node_modules (
    echo.
    echo ========================================
    echo  !INSTALACION COMPLETADA EXITOSAMENTE!  
    echo ========================================
    echo.
    echo Para iniciar la app en modo desarrollo:
    echo   npm run dev
    echo.
    echo La aplicacion se abrira en:
    echo   http://localhost:3003
    echo.
) else (
    echo.
    echo ========================================
    echo  ERROR: No se pudo completar la instalacion
    echo ========================================
    echo.
    echo Intenta ejecutar manualmente:
    echo   npm install
    echo.
)

pause
