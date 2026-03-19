@echo off
REM Este script fuerza la actualizacion en Vercel
cd /d "c:\1234\Nueva carpeta (22)\apl\Prueba New\cliente-web"

REM Crear un archivo dummy para forzar commit
echo %date% %time% > .vercel-force-update

git add .
git commit -m "Force update vercel deployment"
git push origin main

echo Cambios subidos - esperando despliegue de Vercel...
timeout /t 5

REM Abrir la pagina en modo incognito
start chrome --incognito https://cliente-web-mu.vercel.app/crear-pedido

pause
