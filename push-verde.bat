@echo off
cd /d "c:\1234\Nueva carpeta (22)\apl\Prueba New\cliente-web"
git add src/pages/CreateOrderPage.tsx
git commit -m "🟢 Cambiar boton ubicacion a verde #10b981"
git push origin main
echo Cambios subidos exitosamente!
pause
