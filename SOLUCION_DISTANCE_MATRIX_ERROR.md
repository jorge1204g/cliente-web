# 🔧 SOLUCIÓN: Error REQUEST_DENIED - Distance Matrix API

## ❌ Problema Actual

Al calcular la ruta, aparece el error:
```
❌ [DISTANCIA] Error: REQUEST_DENIED
Distance Matrix Service: This API key is not authorized to use this service or API.
```

## 🎯 Causa

La API Key de Google Maps (`AIzaSyCjqlvk5RqykmtVyjYwe6vF0QWxZ9RFRYE`) **NO tiene habilitada** la **Distance Matrix API** en Google Cloud Console.

## ✅ Solución Paso a Paso

### Opción 1: Habilitar Distance Matrix API (Recomendado)

1. **Ir a Google Cloud Console**
   - https://console.cloud.google.com/apis/dashboard

2. **Seleccionar el proyecto correcto**
   - El mismo donde creaste la API Key

3. **Habilitar Distance Matrix API**
   - Click en "ENABLE APIS AND SERVICES" o "+ ENABLE APIS AND SERVICES"
   - Buscar: **"Distance Matrix API"**
   - Click en "Enable"

4. **Verificar que también estén habilitadas:**
   - ✅ Maps JavaScript API (ya debe estar)
   - ✅ Places API (ya debe estar)
   - ✅ **Distance Matrix API** ← ¡NUEVA!
   - ✅ Geocoding API (opcional pero recomendada)

5. **Esperar 1-2 minutos** para que los cambios surtan efecto

6. **Probar nuevamente** en: https://cliente-web-mu.vercel.app/servicio-motocicleta

### Opción 2: Usar Routes API (Alternativa Moderna)

Google está migrando de Distance Matrix a **Routes API**. Si prefieres usar la nueva API:

1. **Habilitar Routes API** en Google Cloud Console
2. **Modificar el código** para usar `google.maps.routes.RouteMatrix` en lugar de `DistanceMatrixService`

### Opción 3: Calcular Distancia con Geocoding + Haversine (Sin APIs de pago)

Si no quieres habilitar más APIs, podemos calcular la distancia en línea recta usando:
- Geocoding API (para obtener coordenadas del destino)
- Fórmula Haversine (para calcular distancia entre 2 puntos GPS)

**Ventaja**: No requiere Distance Matrix API
**Desventaja**: La distancia es en línea recta, no por calles

## 🔍 Verificación del Estado

Para verificar si la API está habilitada:

1. Ir a: https://console.cloud.google.com/apis/api/distancematrix.googleapis.com/metrics
2. Debería mostrar gráficas de uso (incluso si es 0)
3. Si dice "API not enabled", click en "ENABLE"

## ⚠️ Importante

**Las APIs necesarias para la funcionalidad completa son:**

| API | Estado | Uso |
|-----|--------|-----|
| Maps JavaScript API | ✅ Habilitada | Mapa y autocompletado |
| Places API | ✅ Habilitada | Autocompletado de direcciones |
| **Distance Matrix API** | ❌ **POR HABILITAR** | **Calcular distancia real** |
| Geocoding API | ⚠️ Opcional | Convertir dirección a coordenadas |

## 💰 Costos Aproximados (Google Maps Platform)

Google ofrece **$200 USD de crédito mensual gratuito** que cubre aproximadamente:

- **Distance Matrix**: 28,571 requests al mes (gratis hasta ese monto)
- **Places Autocomplete**: 100,000 requests al mes (gratis hasta ese monto)
- **Maps JavaScript**: 28,571 cargas de mapa al mes (gratis hasta ese monto)

**Para tu caso de uso**: Probablemente nunca pagues nada, ya que el volumen será bajo.

## 🚀 Después de Habilitar la API

Una vez habilitada la Distance Matrix API:

1. **Esperar 2-3 minutos** para propagación
2. **Limpiar caché del navegador** (Ctrl + Shift + Delete)
3. **Recargar la página**: https://cliente-web-mu.vercel.app/servicio-motocicleta
4. **Probar el cálculo** de una ruta

Debería funcionar sin errores. ✅

## 📞 Soporte Adicional

Si después de habilitar la API sigue el error:

1. Verificar que la API Key sea la correcta
2. Verificar que no haya restricciones de HTTP referrer
3. Verificar que la facturación esté habilitada en Google Cloud
4. Revisar logs en: https://console.cloud.google.com/logs

---

**Resumen**: Solo necesitas habilitar la **Distance Matrix API** en Google Cloud Console. ¡Es gratis hasta ~28k peticiones mensuales! 🎉
