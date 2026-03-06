# Script para desplegar en Vercel automáticamente
$env:VERCEL_ORG_ID = ""
$env:VERCEL_PROJECT_ID = ""

# Ejecutar vercel con opciones por defecto
vercel deploy --prod --yes

Write-Host "Despliegue completado!"
