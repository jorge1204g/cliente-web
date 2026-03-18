# 🔥 Configuración Rápida de Firebase - cliente-web

## ⚠️ Problema Actual

Tu aplicación está mostrando este error:
```
❌ API key not valid. Please pass a valid API key.
```

**Solución:** Necesitas configurar las credenciales de Firebase en `.env.local`

---

## 📋 Pasos Rápidos (5 minutos)

### 1️⃣ Ve a Firebase Console

👉 **Abre:** https://console.firebase.google.com/

### 2️⃣ Selecciona o Crea tu Proyecto

- Si ya tienes proyecto → Haz clic en él
- Si no tienes → **"Create project"** y sigue los pasos

### 3️⃣ Obtén las Credenciales

1. Haz clic en el **engranaje ⚙️** (esquina superior izquierda)
2. Selecciona **"Project settings"**
3. Baja hasta **"Your apps"**
4. Si no hay app web registrada:
   - Haz clic en icono **"</>"** (Web)
   - Nickname: `cliente-web`
   - Registra la app
5. Copia las credenciales que aparecen en `firebaseConfig`

Verás algo como esto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

## ✏️ Edita .env.local

Abre el archivo: **`cliente-web/.env.local`**

Reemplaza los valores con TUS credenciales:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCjqlvk5RqykmtVyjYwe6vF0QWxZ9RFRYE
```

---

## 🔄 Reinicia el Servidor

Después de guardar `.env.local`:

1. **Detén el servidor actual** (Ctrl+C en la terminal)
2. **Vuelve a iniciar:**

```bash
cd cliente-web
npm run dev
```

3. **Refresca el navegador:** http://localhost:3003/login

---

## ✅ Verificación

Después de reiniciar, abre la consola del navegador (F12) y verifica:

### ✅ Sin Errores:
- ❌ ~~API key not valid~~
- ❌ ~~Failed to load resource~~

### ✅ Deberías Ver:
- Mensajes de Firebase inicializado correctamente
- La página de login debería cargar sin errores

---

## 🎯 Ejemplo de Cómo Debe Quedar

Tu archivo `.env.local` debe verse así (con valores REALES):

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=click-entrega.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://click-entrega-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=click-entrega
VITE_FIREBASE_STORAGE_BUCKET=click-entrega.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCjqlvk5RqykmtVyjYwe6vF0QWxZ9RFRYE
```

---

## 🆘 ¿Problemas Comunes?

### Error: "Database not found"
- Verifica que habilitaste **Realtime Database** en Firebase
- Revisa que `VITE_FIREBASE_DATABASE_URL` sea correcta

### Error: "Invalid API key"
- Copia exactamente las credenciales de Firebase Console
- No agregues espacios ni comillas extra
- Reinicia el servidor después de cambiar `.env.local`

### Error: "App not registered"
- Registra la app web en Firebase Console
- Asegúrate de usar el `projectId` correcto

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Revisa la consola del navegador (F12)** - Ahí verás errores específicos
2. **Verifica Firebase Console** - Asegúrate de que el proyecto existe
3. **Comparte el error exacto** - Con esa información puedo ayudarte mejor

---

## 🎉 Después de Configurar

Una vez que Firebase funcione:

1. ✅ Podrás iniciar sesión con `cliente@demo.com` / `123456`
2. ✅ El formulario de pedidos funcionará
3. ✅ Google Maps ya está configurado y probado
4. ✅ Todo estará listo para usar

---

**¡Configura Firebase y todo funcionará!** 🚀
