# 🧹 CÓMO LIMPIAR TODA LA BASE DE DATOS DE PEDIDOS

## ⚠️ ADVERTENCIA IMPORTANTE

**ESTO ELIMINARÁ PERMANENTEMENTE:**
- ❌ Todos los pedidos de clientes
- ❌ Todos los pedidos manuales (admin)
- ❌ Todos los pedidos de restaurantes
- ❌ TODO en `/orders/` y `/client_orders/`

**SOLO ÚSALO EN:**
- ✅ Desarrollo
- ✅ Testing
- ✅ Demostraciones

**NO LO USES EN:**
- ❌ Producción
- ❌ Datos reales de clientes

---

## 🎯 MÉTODO 1: DESDE LA CONSOLA DEL NAVEGADOR (Rápido)

### Paso 1: Abre tu app del cliente

```
http://localhost:3004
```

### Paso 2: Abre la consola del navegador

Presiona **F12** o **Ctrl + Shift + I**

### Paso 3: Ve a la pestaña "Console"

### Paso 4: Copia y pega este código

```javascript
import('./services/ClearAllOrders.ts').then(m => m.clearAllOrders())
```

### Paso 5: Presiona Enter

Verás algo como:

```
🧹 INICIANDO LIMPIEZA DE BASE DE DATOS...
⚠️  ESTO ELIMINARÁ TODOS LOS PEDIDOS PERMANENTEMENTE

📦 Limpiando /client_orders/...
   Encontrados 5 pedidos de clientes
   ✅ Eliminado: 1715025600000
   ✅ Eliminado: 1715025700000
   ...

📦 Limpiando /orders/...
   Encontrados 8 pedidos totales
   ✅ Eliminado: 1715025600000 (CLIENT)
   ✅ Eliminado: 1715025700000 (MANUAL)
   ...

📊 RESUMEN POR TIPO:
   - CLIENT: 5
   - MANUAL: 2
   - RESTAURANT: 1
   - OTROS: 0

✅ Limpieza completada exitosamente!

📦 Pedidos eliminados:
   - client_orders: 5
   - orders: 8
   TOTAL: 13

🎉 ¡BASE DE DATOS LIMPIA!
```

### Paso 6: Recarga la página

Presiona **F5** o **Ctrl + R**

---

## 🎯 MÉTODO 2: DESDE FIREBASE CONSOLE (Manual)

### Paso 1: Abre Firebase Console

https://console.firebase.google.com/project/myappdelivery-4a576/database

### Paso 2: Ve a Realtime Database

Haz clic en **"Realtime Database"** en el menú izquierdo

### Paso 3: Elimina `/client_orders/`

1. Haz clic en `client_orders`
2. Verás una lista de IDs de pedidos
3. Haz clic en cada ID
4. Haz clic en el ícono de **papelera** 🗑️
5. Confirma eliminar

### Paso 4: Elimina `/orders/`

1. Haz clic en `orders`
2. Verás una lista de IDs de pedidos
3. Haz clic en cada ID
4. Haz clic en el ícono de **papelera** 🗑️
5. Confirma eliminar

### Paso 5: Verifica

Deberías ver:

```
tu-base-de-datos/
├── client_orders/     ← Vacío o sin datos
├── orders/            ← Vacío o sin datos
├── clients/           ← Esto SÍ se mantiene
├── delivery_persons/  ← Esto SÍ se mantiene
└── ...
```

---

## 🎯 MÉTODO 3: SCRIPT AUTOMÁTICO (Recomendado)

Crea un archivo HTML temporal:

### Crea: `limpiar-db.html`

En la raíz de `cliente-web/`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Limpiar Base de Datos</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #d32f2f; }
    button {
      background: #d32f2f;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      margin: 10px 5px;
    }
    button:hover { background: #b71c1c; }
    button.cancel { background: #757575; }
    #result {
      margin-top: 20px;
      padding: 15px;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      display: none;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧹 Limpiar Base de Datos de Pedidos</h1>
    
    <div style="background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
      <strong>⚠️ ADVERTENCIA:</strong> Esto eliminará PERMANENTEMENTE todos los pedidos.
      <br><br>
      ¿Estás seguro de continuar?
    </div>

    <button onclick="limpiar()">🧹 Sí, limpiar todo</button>
    <button class="cancel" onclick="window.close()">❌ Cancelar</button>

    <div id="result"></div>
  </div>

  <script type="module">
    import { clearAllOrders } from './src/services/ClearAllOrders.ts';

    window.limpiar = async () => {
      const resultDiv = document.getElementById('result');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<p>🔄 Limpiando...</p>';

      try {
        const result = await clearAllOrders();
        
        resultDiv.innerHTML = `
          <pre>${result.message}</pre>
          <p><strong>¿Qué sigue?</strong></p>
          <ul>
            <li>Recarga la página para ver los cambios</li>
            <li>Los repartidores ya no verán pedidos cancelados</li>
            <li>Puedes crear nuevos pedidos de prueba</li>
          </ul>
        `;
      } catch (error) {
        resultDiv.innerHTML = `
          <pre style="background: #ffebee; color: #c62828;">
❌ Error: ${error.message}
          </pre>
        `;
      }
    };
  </script>
</body>
</html>
```

### Ejecuta:

Abre en tu navegador:

```
http://localhost:3004/limpiar-db.html
```

Haz clic en **"🧹 Sí, limpiar todo"**

---

## 📊 ¿QUÉ SE ELIMINA?

### ✅ SÍ se elimina:
- `/client_orders/{id}` ← Todos los pedidos de clientes
- `/orders/{id}` ← Todos los pedidos (sin importar el tipo)
  - CLIENT
  - MANUAL
  - RESTAURANT
  - Cualquier otro tipo

### ❌ NO se elimina:
- `/clients/` ← Usuarios clientes
- `/delivery_persons/` ← Repartidores
- `/restaurants/` ← Restaurantes
- `/users/` ← Usuarios del sistema
- `/messages/` ← Mensajes
- `/presence/` ← Estados de conexión

---

## 🔍 VERIFICAR DESPUÉS DE LIMPIAR

### En Firebase Console:

1. Abre: https://console.firebase.google.com/project/myappdelivery-4a576/database
2. Verifica:
   ```
   client_orders/     ← Debería estar vacío
   orders/            ← Debería estar vacío
   ```

### En las apps:

**Cliente Web:**
- Ve a "Mis Pedidos"
- Debería decir "No tienes pedidos"

**Repartidor Web:**
- Ve a "Pedidos Disponibles"
- Debería decir "No hay pedidos disponibles"

**Admin:**
- Debería ver 0 pedidos en todas las pestaillas

---

## 🎯 CASOS DE USO

### ✅ Cuándo SÍ usar:

1. **Desarrollo:** Limpiar después de pruebas
2. **Testing:** Empezar con base de datos limpia
3. **Demostraciones:** Mostrar flujo desde cero
4. **Debugging:** Aislar problemas específicos

### ❌ Cuándo NO usar:

1. **Producción:** Hay datos reales de clientes
2. **Ambiente compartido:** Otros desarrolladores lo usan
3. **Datos importantes:** Pedidos que necesitas conservar

---

## 💡 CONSEJOS

### Tip 1: Backup antes de limpiar

Si quieres guardar los datos:

```bash
# Exporta desde Firebase Console
# Realtime Database → Menú (⋮) → Export JSON
```

### Tip 2: Usa en desarrollo local

Siempre prueba primero en localhost:

```bash
npm run dev
```

### Tip 3: Notifica al equipo

Si trabajas en equipo, avisa antes de limpiar:

> "Voy a limpiar la BD de pedidos en 5 minutos"

### Tip 4: Crea un botón de acceso rápido

Puedes agregar un botón en tu app solo para desarrollo:

```tsx
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => clearAllOrders()}>
    🧹 Limpiar DB
  </button>
)}
```

---

## 🚨 PROBLEMAS COMUNES

### Error: "Permission denied"

**Causa:** Reglas de Firebase muy restrictivas

**Solución:**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Error: "Network error"

**Causa:** Problemas de conexión

**Solución:**
- Verifica internet
- Revisa que Firebase esté activo
- Recarga la página

### Los pedidos siguen apareciendo

**Causa:** Caché del navegador

**Solución:**
- Hard refresh: **Ctrl + F5**
- Limpia caché del navegador
- Cierra y abre el navegador

---

## 📝 RESUMEN RÁPIDO

```bash
# Método más rápido (desde consola del navegador):
1. Abre http://localhost:3004
2. Presiona F12
3. Pega: import('./services/ClearAllOrders.ts').then(m => m.clearAllOrders())
4. Presiona Enter
5. Espera confirmación
6. Recarga página (F5)
```

**¡Listo!** Base de datos limpia ✅

---

**Fecha:** Marzo 6, 2026  
**Estado:** ✅ Script listo para usar  
**Tiempo estimado:** 30 segundos

---

## ✨ ¡LISTO PARA LIMPIAR!

Usa el método que prefieras:
- 🖱️ **Consola del navegador** (más rápido)
- 🔥 **Firebase Console** (manual pero visual)
- 📄 **HTML temporal** (más amigable)

**¿Cuál vas a usar?**
