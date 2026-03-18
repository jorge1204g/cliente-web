# 🔒 Cómo Proteger tu API Key de Google Maps

## ⚠️ ¿Por qué es importante?

Si no proteges tu API Key, otras personas podrían usarla y consumir tu cuota, lo que podría generarte costos inesperados.

---

## 📋 Pasos para Configurar Restricciones

### 1️⃣ **Ve a la Consola de Google Cloud**
- Entra a: https://console.cloud.google.com/apis/credentials
- Selecciona tu proyecto
- Haz clic en tu API Key (AIzaSyCjqlvk5RqykmtVyjYwe6vF0QWxZ9RFRYE)

---

### 2️⃣ **Configura las Restricciones de Aplicación**

#### Opción Recomendada: **Restricción por HTTP Referrer**

Esto permite que tu API Key solo funcione en tu sitio web específico.

**Para tu aplicación web (cliente-web):**

```
Sitios web (HTTP referrers):
• https://tu-dominio.com/*
• https://www.tu-dominio.com/*
```

**Para desarrollo local:**
```
• http://localhost:*
• http://127.0.0.1:*
```

**Ejemplo completo:**
```
https://mi-app-repartidor.vercel.app/*
https://mi-restaurante.vercel.app/*
http://localhost:*
http://127.0.0.1:*
```

---

### 3️⃣ **Configura las Restricciones de API**

Marca: **"Restrict key"** y selecciona estas APIs:

✅ **APIs necesarias para tu aplicación:**

- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API
- ✅ Maps Static API (opcional, si usas mapas estáticos)

---

### 4️⃣ **Guarda los Cambios**

Haz clic en **"Save"** y espera 1-2 minutos para que los cambios surtan efecto.

---

## 🎯 Configuración Recomendada para tu Proyecto

### **Application Restrictions:**
```
Type: HTTP referrers (web sites)

Allowed referrers:
• https://*.vercel.app/*
• http://localhost:*
• http://127.0.0.1:*
```

### **API Restrictions:**
```
✓ Restrict key

Selected APIs:
☑ Maps JavaScript API
☑ Places API
☑ Geocoding API
```

---

## 🔍 Verificación Después de Configurar

Después de guardar, vuelve a tu página de prueba:
1. Abre `test-google-maps-api.html`
2. Ejecuta todas las pruebas
3. Si todo funciona → ¡Configuración correcta! ✅
4. Si hay error → Revisa los dominios permitidos

---

## 💡 Consejos Importantes

### ✅ **BUENAS PRÁCTICAS:**

1. **Nunca compartas tu API Key públicamente**
   - No la subas a GitHub sin restricciones
   - Usa variables de entorno (.env.local)

2. **Usa restricciones SIEMPRE**
   - Por dominio (HTTP referrers)
   - Por APIs específicas

3. **Monitorea el uso**
   - Revisa: https://console.cloud.google.com/apis/dashboard
   - Configura alertas de presupuesto

4. **Rotación de claves**
   - Si crees que tu clave fue comprometida, genera una nueva

### ❌ **QUÉ EVITAR:**

- ❌ No uses restricción "None" (sin restricciones)
- ❌ No permitas todos los dominios (*)
- ❌ No compartas la clave en foros o código público
- ❌ No la uses en aplicaciones móviles nativas (para eso usa API Keys separadas)

---

## 🚨 ¿Qué pasa si mi API Key ya fue comprometida?

1. **Genera una nueva API Key:**
   - Ve a Credentials → Create Credentials → API Key
   - Configura las restricciones INMEDIATAMENTE
   - Actualiza tu archivo .env.local con la nueva clave

2. **Elimina la clave anterior:**
   - En Credentials, haz clic en la clave comprometida
   - Selecciona "Delete API Key"

---

## 📊 Monitoreo de Uso

Revisa regularmente:
- **Dashboard:** https://console.cloud.google.com/apis/dashboard
- **Cuotas:** https://console.cloud.google.com/apis/api/maps.googleapis.com/quotas
- **Facturación:** https://console.cloud.google.com/billing

Configura alertas:
1. Ve a Billing → Budgets & alerts
2. Crea un presupuesto mensual
3. Configura alertas al 50%, 90%, 100% del presupuesto

---

## 🎯 Resumen de Configuración Óptima

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Application Type | HTTP Referrers |
| Allowed Referrers | `https://*.vercel.app/*`, `http://localhost:*` |
| API Restrictions | Sí (Restrict key) |
| Allowed APIs | Maps JavaScript, Places, Geocoding |
| Environment | Variables de entorno (.env) |

---

## ✅ Checklist Final

- [ ] Entré a Google Cloud Console
- [ ] Seleccioné mi API Key
- [ ] Configuré restricción por HTTP Referrers
- [ ] Agregué mis dominios (producción + localhost)
- [ ] Restringí las APIs (Maps, Places, Geocoding)
- [ ] Guardé los cambios
- [ ] Esperé 2 minutos
- [ ] Probé que todo funcione
- [ ] Configuré alertas de presupuesto

---

## 🆘 ¿Problemas?

Si después de configurar las restricciones algo no funciona:

1. **Verifica los dominios:**
   - Asegúrate de que el dominio desde donde pruebas esté en la lista de permitidos
   - Incluye siempre `http://localhost:*` para desarrollo

2. **Espera unos minutos:**
   - Los cambios pueden tardar 5-10 minutos en propagarse

3. **Limpia caché:**
   - Limpia el caché de tu navegador
   - Prueba en modo incógnito

4. **Revisa la consola:**
   - Abre DevTools (F12)
   - Revisa los errores en la consola

---

**📝 Nota:** Una vez configuradas las restricciones, tu API Key solo funcionará desde los dominios que especificaste, protegiéndote de usos no autorizados.
