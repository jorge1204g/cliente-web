# 🔥 GUÍA COMPLETA: VINCULAR FIREBASE PARA CUENTA VIRTUAL

## 📋 ¿QUÉ NECESITAS VINCULAR?

Para que la cuenta virtual funcione, necesitas configurar **Firebase Realtime Database**.

---

## 🚀 PASO A PASO

### PASO 1: Crear/Seleccionar Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. **Si ya tienes proyecto:** Haz clic en él
4. **Si no tienes proyecto:** 
   - Clic en **"Agregar proyecto"**
   - Ponle nombre (ej: `click-entrega`)
   - Sigue el asistente
   - ¡Listo!

---

### PASO 2: Activar Realtime Database

1. En el menú izquierdo → **Compilación** → **Realtime Database**
2. Clic en **"Crear base de datos"**
3. **Selecciona ubicación:**
   - Estados Unidos (recomendado para Latam)
   - Europa
   - Asia
4. Clic en **Siguiente**

5. **Configuración de seguridad** (IMPORTANTE):
   
   **Para DESARROLLO (temporal):**
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   
   ⚠️ **ADVERTENCIA:** Esto permite lectura/escritura pública. Solo usar en desarrollo.

6. Clic en **Listo**

---

### PASO 3: Registrar Aplicación Web en Firebase

1. En Project Overview (visión general del proyecto)
2. Haz clic en el ícono **Web** (`</>`)
3. **Registra tu app:**
   - Apodo: `cliente-web`
   - También puedes marcar "Set up Firebase Hosting" si quieres
4. Clic en **Registrar app**

5. **Firebase te mostrará la configuración:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "tu-proyecto.firebaseapp.com",
     databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
     projectId: "tu-proyecto-id",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

6. **COPIA ESTA INFORMACIÓN** - La necesitarás ahora

---

### PASO 4: Actualizar Configuración en tu Proyecto

#### A. Para cliente-web:

1. Abre el archivo: `cliente-web/.env.local`

2. Reemplaza los valores con los de Firebase:

```bash
# CAMBIA ESTOS VALORES POR LOS DE TU PROYECTO
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

3. Guarda el archivo

4. **NO subas este archivo a GitHub** (ya está en `.gitignore`)

---

### PASO 5: Verificar Instalación de Dependencias

En tu terminal:

```bash
cd cliente-web
npm install
```

Las dependencias de Firebase deberían estar en `package.json`:
```json
{
  "dependencies": {
    "firebase": "^10.x.x",
    ...
  }
}
```

Si no están, instálalas:
```bash
npm install firebase
```

---

### PASO 6: Probar que Funciona

1. **Inicia la aplicación web:**
```bash
cd cliente-web
npm run dev
```

2. **Abre el navegador:** http://localhost:5173

3. **Debería pasar esto:**
   - El archivo `SetupDefaultAccount.ts` se ejecuta
   - Crea la cuenta `cliente_default_001` en Firebase
   - El auto-login intenta ingresar
   - Si todo está bien, entras al dashboard

4. **Verifica en Firebase Console:**
   - Ve a Realtime Database
   - Deberías ver:
   ```
   clients/
     └── cliente_default_001/
         ├── id: "cliente_default_001"
         ├── email: "cliente@demo.com"
         ├── password: "123456"
         ├── name: "Cliente Demo"
         └── ...
   ```

---

### PASO 7: Configurar Android (Opcional - si usas la app móvil)

Para la app de Android también necesitas configurar Firebase:

#### A. Descargar google-services.json:

1. Firebase Console → Project Overview → ícono **Android**
2. Registra tu app Android:
   - Nombre del paquete: `com.example.aplicacionnuevaprueba1`
   - Apodo: `app-cliente-android`
3. Descarga `google-services.json`

#### B. Colocar el archivo:

1. Copia `google-services.json` en:
   ```
   app/google-services.json
   ```

#### C. Actualizar build.gradle.kts (app):

Asegúrate que tenga:
```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services") // ← Importante
}
```

#### D. Agregar dependencias:

En `app/build.gradle.kts`:
```kotlin
dependencies {
    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-database-ktx")
    implementation("com.google.firebase:firebase-auth-ktx")
    
    // ... otras dependencias
}
```

---

## 🔍 VERIFICACIÓN DE ERRORES COMUNES

### Error: "Firebase not initialized" o "No Firebase App"

**Causa:** No configuraste las variables de entorno

**Solución:**
1. Verifica que `.env.local` existe en `cliente-web/`
2. Verifica que todos los valores están completos
3. Reinicia el servidor de desarrollo

---

### Error: "permission_denied" o "insufficient permissions"

**Causa:** Reglas de seguridad muy restrictivas

**Solución:**
1. Firebase Console → Realtime Database → Reglas
2. Para desarrollo, usa:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

### Error: "Network error" o "Failed to fetch"

**Causas posibles:**
1. Internet desconectado
2. URL de database incorrecta
3. CORS bloqueando peticiones

**Soluciones:**
1. Verifica tu conexión a internet
2. Revisa `VITE_FIREBASE_DATABASE_URL` en `.env.local`
3. Abre DevTools (F12) → Consola para ver errores específicos

---

### La cuenta no se crea en Firebase

**Causas:**
1. Error en la configuración
2. Reglas de seguridad bloquean escritura
3. Error en el código

**Solución:**
1. Abre DevTools (F12) → Consola
2. Busca errores rojos
3. Verifica Firebase Console → Realtime Database
4. Revisa las reglas de seguridad

---

## 🎯 RESUMEN RÁPIDO

### Mínimo necesario para que funcione:

1. ✅ Proyecto creado en Firebase
2. ✅ Realtime Database activada
3. ✅ Reglas de seguridad permiten escritura (para desarrollo)
4. ✅ Archivo `.env.local` con credenciales correctas
5. ✅ Dependencias de Firebase instaladas
6. ✅ Servidor de desarrollo reiniciado

---

## 📁 ESTRUCTURA QUE SE DEBE CREAR EN FIREBASE

Después de ejecutar la app, deberías ver esto en Firebase Realtime Database:

```
tu-base-de-datos/
├── clients/
│   └── cliente_default_001/
│       ├── id: "cliente_default_001"
│       ├── email: "cliente@demo.com"
│       ├── password: "123456"
│       ├── name: "Cliente Demo"
│       ├── phone: "+57 300 123 4567"
│       ├── createdAt: 1234567890
│       ├── status: "active"
│       └── address: "Dirección de prueba, Ciudad"
```

---

## 🔒 REGLAS DE SEGURIDAD RECOMENDADAS

### Para DESARROLLO (temporal):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Para PRODUCCIÓN (recomendado):
```json
{
  "rules": {
    "clients": {
      "$clientId": {
        ".read": "$clientId === auth.uid",
        ".write": "$clientId === auth.uid"
      }
    }
  }
}
```

---

## 📞 CHECKLIST FINAL

Antes de probar, verifica:

- [ ] Proyecto Firebase creado
- [ ] Realtime Database activada
- [ ] App web registrada en Firebase
- [ ] Archivo `.env.local` creado con credenciales reales
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor de desarrollo reiniciado después de cambiar `.env`
- [ ] Navegador actualizado (Ctrl+F5)

---

## 🎉 ¡LISTO!

Si seguiste todos los pasos, tu cuenta virtual debería funcionar:

- ✅ Auto-login automático
- ✅ Cuenta creada en Firebase
- ✅ Credenciales: `cliente@demo.com` / `123456`

---

## 📚 RECURSOS ADICIONALES

- Documentación Firebase: https://firebase.google.com/docs
- Realtime Database: https://firebase.google.com/docs/database
- Firebase Console: https://console.firebase.google.com/

---

**¿Dudas?** Revisa la consola del navegador (F12) para ver errores específicos.
