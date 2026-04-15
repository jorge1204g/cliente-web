# 🚀 Despliegue Rápido - Cliente Web

## ⚡ Forma más fácil (Recomendada)

Ejecuta este script que hace TODO automáticamente:

```bash
deploy-con-alias.bat
```

Este script:
1. ✅ Limpia el caché
2. ✅ Instala dependencias
3. ✅ Construye la aplicación
4. ✅ Despliega a Vercel
5. ✅ **Configura el alias automáticamente** ← ¡IMPORTANTE!

## 📝 Forma manual

Si prefieres hacerlo paso a paso:

```bash
# 1. Build
npm run build

# 2. Deploy
npx vercel --prod

# 3. Copiar la URL temporal del output (ejemplo: cliente-xxxxx.vercel.app)

# 4. Configurar alias
npx vercel alias set <URL-TEMPORAL> cliente-web-mu.vercel.app
```

## 🌐 URL Final

Siempre verifica en: **https://cliente-web-mu.vercel.app**

## 🔄 Después de desplegar

Limpia el caché del navegador:
- **Windows:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

## ⚠️ IMPORTANTE

- **NO uses** `npx vercel --prod --force` (crea URLs temporales sin alias)
- **SIEMPRE** configura el alias después de cada deploy
- El alias asegura que los cambios se vean en `cliente-web-mu.vercel.app`

## 📚 Más información

- [CONFIGURACION_ALIAS_VERCEL.md](CONFIGURACION_ALIAS_VERCEL.md) - Documentación detallada
