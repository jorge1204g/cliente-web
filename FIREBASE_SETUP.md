# 🔥 Configuración de Firebase - Click Entrega Cliente Web

## Paso a Paso para Configurar Firebase

### 1️⃣ Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Add project"** o **"Crear proyecto"**
3. Ingresa un nombre para tu proyecto (ej: "click-entrega")
4. Desactiva Google Analytics (opcional)
5. Haz clic en **"Create project"**
6. Espera a que se cree el proyecto
7. Haz clic en **"Continue"**

---

### 2️⃣ Habilitar Realtime Database

1. En el menú lateral izquierdo, haz clic en **"Build"** → **"Realtime Database"**
2. Haz clic en **"Create database"**
3. Selecciona la ubicación más cercana a ti (ej: United States)
4. Haz clic en **"Next"**
5. **IMPORTANTE**: Selecciona **"Start in test mode"** (modo prueba)
   - Esto permitirá leer/escribir sin autenticación por ahora
   - ⚠️ En producción deberás cambiar las reglas de seguridad
6. Haz clic en **"Enable"**
7. Espera a que se cree la base de datos

---

### 3️⃣ Obtener Credenciales de Firebase

1. En la esquina superior izquierda, haz clic en el icono de engranaje ⚙️
2. Selecciona **"Project settings"**
3. Baja hasta la sección **"Your apps"**
4. Haz clic en el icono de web **"</>"**
5. Registra tu app con el nickname: "cliente-web"
6. Copia las credenciales que aparecen en `firebaseConfig`

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

### 4️⃣ Configurar Credenciales en el Proyecto

Tienes DOS opciones:

#### Opción A: Usando Variables de Entorno (Recomendado)

1. Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

2. Edita `.env.local` y pega tus credenciales:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

3. Guarda el archivo

#### Opción B: Editando Directamente Firebase.ts

1. Abre el archivo `src/services/Firebase.ts`
2. Reemplaza las credenciales de ejemplo con las tuyas:

```typescript
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

3. Guarda el archivo

---

### 5️⃣ Configurar Reglas de Seguridad

1. En Firebase Console, ve a **"Realtime Database"**
2. Haz clic en la pestaña **"Rules"**
3. Reemplaza las reglas existentes con estas:

```json
{
  "rules": {
    "clients": {
      "$clientId": {
        ".read": true,
        ".write": true
      }
    },
    "client_orders": {
      ".read": true,
      ".write": true,
      "$orderId": {
        ".read": true,
        ".write": true
      }
    },
    "orders": {
      ".read": true,
      ".write": true
    }
  }
}
```

4. Haz clic en **"Publish"**

⚠️ **ADVERTENCIA**: Estas reglas son para desarrollo. En producción, implementa autenticación real.

---

### 6️⃣ Probar la Conexión

1. Ejecuta la aplicación en modo desarrollo:

```bash
npm run dev
```

2. Abre tu navegador en `http://localhost:3003`
3. Intenta registrar un nuevo usuario
4. Si no hay errores en la consola y el usuario se crea, ¡funciona! ✅

---

### 7️⃣ Verificar Datos en Firebase

1. En Firebase Console, ve a **"Realtime Database"**
2. Deberías ver los datos creados:

```
tu-base-de-datos/
├── clients/
│   └── ID_DEL_CLIENTE/
│       ├── email: "cliente@email.com"
│       ├── name: "Juan Pérez"
│       ├── phone: "492 123 4567"
│       └── createdAt: 1234567890
└── client_orders/
    └── ID_DEL_PEDIDO/
        ├── clientId: "ID_DEL_CLIENTE"
        ├── clientName: "Juan Pérez"
        ├── serviceType: "FOOD"
        └── status: "pending"
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Firebase not initialized"
- Verifica que las credenciales sean correctas
- Asegúrate de haber copiado TODAS las credenciales
- Reinicia el servidor de desarrollo (`Ctrl+C` y `npm run dev`)

### Error: "Permission denied"
- Verifica que las reglas de seguridad estén configuradas correctamente
- Asegúrate de estar usando la URL correcta de `databaseURL`

### Error: "Network error"
- Verifica tu conexión a internet
- Asegúrate de que Firebase Realtime Database esté habilitado
- Revisa que el `projectId` sea correcto

### Los datos no aparecen en Firebase
- Verifica que estás escribiendo en la ruta correcta
- Revisa la consola del navegador para ver errores
- Asegúrate de que las reglas de seguridad permitan escritura

---

## 🔐 Consideraciones de Seguridad para Producción

### LO QUE DEBES HACER ANTES DE PRODUCIR:

1. **Implementar Firebase Authentication oficial**
   - No uses autenticación personalizada
   - Usa email/password con Firebase Auth

2. **Actualizar las reglas de seguridad**
   ```json
   {
     "rules": {
       "clients": {
         "$userId": {
           ".read": "$userId === auth.uid",
           ".write": "$userId === auth.uid"
         }
       },
       "client_orders": {
         "$orderId": {
           ".read": "root.child('clients').child(auth.uid).exists()",
           ".write": "root.child('clients').child(auth.uid).exists()"
         }
       }
     }
   }
   ```

3. **Habilitar Email/Password en Firebase Authentication**
   - Ve a **"Authentication"** → **"Sign-in method"**
   - Habilita **"Email/Password"**

4. **Validar datos del lado del servidor**
   - No confíes únicamente en la validación del cliente

---

## ✅ Checklist de Configuración

- [ ] Proyecto de Firebase creado
- [ ] Realtime Database habilitado
- [ ] Credenciales obtenidas
- [ ] Credenciales configuradas en el proyecto
- [ ] Reglas de seguridad configuradas (modo prueba)
- [ ] Aplicación probada exitosamente
- [ ] Datos verificados en Firebase Console

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica Firebase Console
3. Consulta la documentación oficial de Firebase
4. Contacta al equipo de desarrollo

---

**© 2024 Click Entrega - Repartos Fresnillo**
