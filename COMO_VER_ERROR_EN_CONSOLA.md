# 🔍 CÓMO VER EL ERROR ESPECÍFICO EN TU NAVEGADOR

## PASO 1: ABRIR HERRAMIENTAS DE DESARROLLADOR

### En tu navegador (Chrome, Edge, Firefox):

**Opción 1:** Presiona la tecla **F12**

**Opción 2:** Presiona **Ctrl + Shift + I**

**Opción 3:** 
- Haz clic derecho en cualquier parte de la página
- Selecciona **"Inspeccionar"** o **"Inspect"**

---

## PASO 2: IR A LA CONSOLA

En la ventana que se abrió:

1. Busca la pestaña que dice **"Console"** o **"Consola"**
2. Haz clic ahí

Verás algo como esto:

```
=== TEST DE FIREBASE ===
Ejecutando en 2 segundos...
🔍 Probando conexión a Firebase...
1. Database: ✅ OK
...
```

---

## PASO 3: INTENTA CREAR EL PEDIDO NUEVAMENTE

1. Con la consola abierta (F12)
2. Ve a "Crear Pedido" en tu app
3. Llena los datos del pedido
4. Haz clic en "Crear Pedido"

---

## PASO 4: BUSCA LOS MENSAJES DE ERROR

En la consola verás varios mensajes:

### ✅ Si todo está bien:
```
🔍 Probando conexión a Firebase antes de crear pedido...
✅ Cliente encontrado: cliente_default_001
📦 Creando pedido con datos: {...}
✅ Pedido creado: 1234567890
```

### ❌ Si hay error de Firebase:
```
❌ ERROR DE CONEXIÓN A FIREBASE:
FirebaseError: Firebase: Error connecting to database.
- code: 'database/unavailable'
```

### ❌ Si no hay cliente:
```
❌ No hay clientId en localStorage
localStorage: {clientId: null, clientEmail: null}
```

### ❌ Si falla al crear el pedido:
```
❌ ERROR AL CREAR PEDIDO: FirebaseError: permission_denied
```

---

## PASO 5: COPIA EL ERROR Y BÚSCALO AQUÍ

Dependiendo del error que veas, sigue estas instrucciones:

---

## ERRORES COMUNES Y SOLUCIONES:

### ❌ Error: "permission_denied"

**Significa:** Firebase no permite escritura

**Solución:**
1. Ve a https://console.firebase.google.com/project/myappdelivery-4a576/database
2. Haz clic en **"Reglas"** (Rules)
3. Cambia las reglas a:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. Haz clic en **"Publicar"**

---

### ❌ Error: "Firebase not initialized" o "No Firebase App"

**Significa:** Las credenciales de Firebase no están cargadas

**Solución:**
1. Verifica que `.env.local` existe en `cliente-web/`
2. Verifica que tiene las credenciales correctas
3. Reinicia el servidor:
   - Ctrl+C en la terminal
   - Ejecuta: `npm run dev`

---

### ❌ Error: "Network error" o "Failed to fetch"

**Significa:** No hay conexión a internet o Firebase está bloqueado

**Solución:**
1. Verifica tu conexión a internet
2. Desactiva temporalmente antivirus/firewall
3. Intenta en otro navegador

---

### ❌ Error: "No hay clientId en localStorage"

**Significa:** No has iniciado sesión o la sesión expiró

**Solución:**
1. Cierra sesión (si estás logueado)
2. Ve a "Login" o "Inicio"
3. Inicia sesión nuevamente
4. El auto-login debería funcionar automáticamente

---

### ❌ Error: "Client doesn't exist" o "Cliente no encontrado"

**Significa:** La cuenta virtual no se creó en Firebase

**Solución:**
1. Abre la consola (F12)
2. Escribe esto y presiona Enter:

```javascript
import('./services/TestFirebaseConnection.ts').then(m => m.testFirebaseConnection())
```

3. O recarga la página forzosamente: **Ctrl + F5**

---

## 📋 MENSAJE IMPORTANTE

La consola ahora muestra **MUCHA INFORMACIÓN** útil:

- 🔍 Pruebas de conexión
- ✅ Confirmaciones de cada paso
- 📦 Datos del pedido
- ❌ Errores específicos con detalles

**TODO lo que necesitas saber está en la consola.**

---

## 🎯 QUÉ HACER AHORA:

1. **Abre la consola** (F12)
2. **Recarga la página** (Ctrl+F5 para limpiar caché)
3. **Intenta crear el pedido** nuevamente
4. **Busca el mensaje de error** en rojo
5. **Copia el error** y dime qué dice

Con esa información puedo ayudarte mejor.

---

## 📸 OPCIONAL: TOMA UNA CAPTURA

Si quieres, toma una captura de pantalla de la consola (con F12 abierto) y muéstramela.

---

**Archivos actualizados:**
- `src/pages/CreateOrderPage.tsx` - Ahora con logs detallados
- `src/services/TestFirebaseConnection.ts` - Test de diagnóstico

**Fecha:** Marzo 6, 2026  
**Estado:** 🔍 Depuración activada
