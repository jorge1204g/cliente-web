# Script de Despliegue Automático para Cliente Web
Write-Host "🚀 Iniciando despliegue automático..." -ForegroundColor Cyan

# Cambiar al directorio del proyecto
Set-Location "$PSScriptRoot"

Write-Host "📁 Directorio: $(Get-Location)" -ForegroundColor Yellow

# Construir el proyecto
Write-Host "🔨 Construyendo proyecto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la construcción" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Construcción completada" -ForegroundColor Green

# Desplegar a Vercel
Write-Host "🌐 Desplegando a Vercel..." -ForegroundColor Yellow
vercel deploy --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el despliegue" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ¡Despliegue completado exitosamente!" -ForegroundColor Green
Write-Host "🎉 Tu aplicación está en línea" -ForegroundColor Cyan
