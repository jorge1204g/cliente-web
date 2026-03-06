# 🚀 Instrucciones de Despliegue - Click Entrega Cliente Web

## 📋 Requisitos Previos

1. Tener Node.js instalado (versión 16 o superior)
2. Tener una cuenta de Firebase configurada
3. Tener una cuenta de Vercel (para despliegue en producción)

---

## 🔧 Configuración Inicial

### Paso 1: Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Realtime Database**
4. Ve a la configuración del proyecto y copia las credenciales

5. En el archivo `src/services/Firebase.ts`, reemplaza las credenciales:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

O ejecuta el archivo `install.bat`

### Paso 3: Probar en Desarrollo

```bash
npm run dev
```

La aplicación se abrirá en: `http://localhost:3003`

---

## 🌐 Despliegue en Producción (Vercel)

### Opción A: Usando Vercel CLI (Recomendado)

1. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

2. **Iniciar sesión en Vercel:**
```bash
vercel login
```

3. **Desplegar:**
```bash
vercel --prod
```

4. **Configurar variables de entorno en Vercel:**
   - Ve al dashboard de Vercel
   - Selecciona tu proyecto
   - Ve a "Settings" → "Environment Variables"
   - Agrega las variables de Firebase

### Opción B: Usando GitHub + Vercel

1. **Sube tu código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/cliente-web.git
git push -u origin main
```

2. **Conecta Vercel con GitHub:**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Importa tu repositorio de GitHub
   - Configura las variables de entorno
   - Click en "Deploy"

---

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales reales de Firebase.

---

## 🔗 Reglas de Seguridad para Firebase

Agrega estas reglas en tu Firebase Realtime Database:

```json
{
  "rules": {
    "clients": {
      "$clientId": {
        ".read": "$clientId === auth.uid",
        ".write": "$clientId === auth.uid"
      }
    },
    "client_orders": {
      "$orderId": {
        ".read": "root.child('clients').child(auth.uid).exists()",
        ".write": "root.child('clients').child(auth.uid).exists()"
      }
    },
    "orders": {
      ".read": true,
      ".write": true
    }
  }
}
```

⚠️ **IMPORTANTE**: En producción, usa Firebase Authentication oficial en lugar de autenticación personalizada.

---

## ✅ Verificación Post-Despliegue

Después de desplegar, verifica:

1. ✅ El sitio carga correctamente
2. ✅ Puedes registrar nuevos usuarios
3. ✅ Puedes iniciar sesión
4. ✅ Puedes crear pedidos
5. ✅ Los pedidos aparecen en tiempo real
6. ✅ La geolocalización funciona
7. ✅ Las imágenes se cargan correctamente

---

## 🐛 Solución de Problemas

### Error: "Firebase not initialized"
- Verifica que las credenciales de Firebase sean correctas
- Asegúrate de haber habilitado Realtime Database

### Error: "Permission denied"
- Revisa las reglas de seguridad de Firebase
- Verifica que el usuario esté autenticado

### Error: "Module not found"
- Ejecuta `npm install` nuevamente
- Borra `node_modules` y `package-lock.json`, luego reinstala

---

## 📞 Soporte

Para problemas o dudas, contacta al equipo de desarrollo.

---

**© 2024 Click Entrega - Repartos Fresnillo**
