# Configuración de Alias en Vercel - Cliente Web

## Problema
Vercel por defecto crea URLs temporales como:
- `cliente-2sh8xrzib-jorge1204gs-projects.vercel.app`
- `cliente-lmmoum45j-jorge1204gs-projects.vercel.app`

Pero necesitamos que la URL sea siempre:
- **`https://cliente-web-mu.vercel.app`**

## Solución

### Después de cada despliegue, ejecutar:

```bash
# 1. Hacer el deploy normal (sin --force)
npx vercel --prod

# 2. Obtener la URL temporal del output (ejemplo: cliente-xxxxx-jorge1204gs-projects.vercel.app)

# 3. Establecer el alias correcto
npx vercel alias set <URL-TEMPORAL> cliente-web-mu.vercel.app
```

### Ejemplo completo:

```bash
npx vercel --prod
# Output: Production: https://cliente-xxxxx-jorge1204gs-projects.vercel.app

npx vercel alias set cliente-xxxxx-jorge1204gs-projects.vercel.app cliente-web-mu.vercel.app
# Output: Success! https://cliente-web-mu.vercel.app now points to...
```

## Script automatizado

Para no olvidar este paso, usa el script `deploy-con-alias.bat` que incluye recordatorios, o crea uno nuevo:

### deploy-con-alias.bat

```batch
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
```

## Configuración alternativa en Vercel Dashboard

Puedes configurar el dominio principal directamente en Vercel:

1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto "cliente-web"
3. Ve a "Settings" → "Domains"
4. Agrega `cliente-web-mu.vercel.app` como dominio principal
5. Configúralo para que apunte automáticamente al último deployment de producción

De esta forma, no necesitarás ejecutar el comando de alias manualmente.

## Verificar alias configurados

```bash
# Ver todos los aliases
npx vercel alias ls

# Ver deployments recientes
npx vercel ls
```

## Resumen del proceso correcto

✅ **CORRECTO:**
```bash
npm run build
npx vercel --prod
npx vercel alias set <URL-TEMPORAL> cliente-web-mu.vercel.app
```

❌ **INCORRECTO:**
```bash
npx vercel --prod --force
# Esto crea nuevos deployments sin actualizar el alias principal
```

## Notas importantes

- El alias debe establecerse **después** de cada deployment
- La URL temporal cambia en cada deployment
- Sin el alias, los cambios quedan en URLs temporales inaccesibles
- Siempre verifica que `https://cliente-web-mu.vercel.app` muestre los cambios
