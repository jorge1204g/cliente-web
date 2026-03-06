# Script para desplegar en Vercel automáticamente
Write-Host "Iniciando despliegue en Vercel..." -ForegroundColor Green

# Navegar a la carpeta cliente-web
cd "c:\1234\Nueva carpeta (22)\apl\Prueba New\cliente-web"

# Ejecutar vercel con 'Y' como respuesta automática
echo "Y" | vercel --yes

Write-Host "Despliegue completado!" -ForegroundColor Green
