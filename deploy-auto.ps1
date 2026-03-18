# Deploy automático a Vercel - Cliente Web
Write-Host "🚀 Iniciando despliegue a Vercel..." -ForegroundColor Cyan

# Navegar al directorio del cliente-web
Set-Location "c:\1234\Nueva carpeta (22)\apl\Prueba New\cliente-web"

# Hacer build del proyecto
Write-Host "📦 Construyendo proyecto..." -ForegroundColor Yellow
npm run build

# Desplegar a producción
Write-Host "☁️  Desplegando a Vercel..." -ForegroundColor Green
npx vercel --prod

Write-Host "✅ ¡Despliegue completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Tu aplicación ahora está disponible en:" -ForegroundColor Cyan
Write-Host "https://cliente-web.vercel.app" -ForegroundColor White
