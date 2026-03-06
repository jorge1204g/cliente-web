# 🔍 CÓMO VERIFICAR PEDIDOS EN FIREBASE

## 📊 TU ESTRUCTURA ACTUAL EN FIREBASE:

Tienes esto en Firebase Console:

```
tu-base-de-datos/
├── client_orders/     ← Aquí se guardan los pedidos del cliente
├── clients/           ← Aquí están los clientes (usuarios)
├── delivery_persons/  ← Repartidores registrados
├── messages/          ← Mensajes
├── orders/            ← ⚠️ AQUÍ DEBEN ESTAR LOS PEDIDOS PARA EL REPARTIDOR
├── presence/          ← Estados de conexión
├── restaurants/       ← Restaurantes
└── users/             ← Usuarios del sistema
```

---

## ✅ PASOS PARA VERIFICAR:

### PASO 1: Crea un Pedido Nuevo

1. Abre tu app: http://localhost:3004/crear-pedido
2. Haz clic en **"⚡ Llenar Datos de Prueba Automáticamente"**
3. Haz clic en **"Crear Pedido"**
4. Espera el mensaje de éxito

---

### PASO 2: Verifica en Firebase Console

1. Abre: https://console.firebase.google.com/project/myappdelivery-4a576/database
2. Haz clic en **"Realtime Database"**
3. Verifica estas DOS rutas:

#### A. Ruta `/client_orders/`:
```
client_orders/
  └── {id_del_pedido}/
      ├── id: "1234567890"
      ├── clientId: "cliente_default_001"
      ├── clientName: "Juan Pérez González"
      ├── items: "2 tacos al pastor..."
      └── status: "pending"
```

✅ **¿Existe esta ruta?** Debería haber un pedido aquí.

---

#### B. Ruta `/orders/`:
```
orders/
  └── {id_del_pedido}/
      ├── id: "1234567890"
      ├── orderCode: "PED-567890"
      ├── orderType: "CLIENT"
      ├── status: "PENDING"
      ├── customer: {
      │   ├── name: "Juan Pérez González"
      │   ├── phone: "492 123 4567"
      │   ├── address: "Calle Principal #123..."
      │   └── location: { latitude: 24.6536, longitude: -102.8738 }
      │   }
      ├── items: [{ name: "...", quantity: 1, price: 0 }]
      ├── paymentMethod: "EFFECTIVE"
      ├── dateTime: "2026-03-06T..."
      └── ...todos los demás campos
```

✅ **¿Existe esta ruta?** Aquí es donde el repartidor debería ver el pedido.

---

### PASO 3: Compara Ambas Rutas

**Deberías tener:**
- `client_orders/{id}` ← Para que el cliente vea SUS pedidos
- `orders/{id}` ← Para que admin y repartidores vean TODOS los pedidos

**Si SOLO existe `client_orders/` pero NO `orders/`:**
❌ Hay un error al guardar en `/orders/`
❌ Revisa la consola del navegador (F12) cuando creas el pedido

---

## 🔍 DIAGNÓSTICO RÁPIDO:

### Ejecuta esto en la consola del navegador (F12):

Abre la consola (F12) y pega este código:

```javascript
// Verificar Firebase
import('./services/Firebase.ts').then(({ database }) => {
  console.log('✅ Firebase DB:', database ? 'OK' : 'ERROR');
  
  // Leer pedidos recientes
  import('firebase/database').then(({ ref, get }) => {
    const ordersRef = ref(database, 'orders');
    get(ordersRef).then(snapshot => {
      if (snapshot.exists()) {
        const orders = snapshot.val();
        console.log('📦 Pedidos en /orders/:', Object.keys(orders).length);
        console.log('IDs:', Object.keys(orders));
        console.log('Último pedido:', orders[Object.keys(orders)[Object.keys(orders).length - 1]]);
      } else {
        console.log('❌ No hay pedidos en /orders/');
      }
    }).catch(err => {
      console.error('❌ Error leyendo /orders/:', err);
    });
  });
});
```

Esto te dirá cuántos pedidos hay en `/orders/`.

---

## ❌ POSIBLES PROBLEMAS Y SOLUCIONES:

### Problema 1: Solo existe `/client_orders/` pero NO `/orders/`

**Causa:** Error al guardar en la segunda ruta

**Solución:**
1. Abre la consola (F12)
2. Intenta crear un pedido
3. Busca errores en rojo
4. Probablemente diga "permission_denied" o algo similar

**Si dice "permission_denied":**
- Ve a Firebase Console → Realtime Database → Reglas
- Cambia a:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

### Problema 2: Existe `/orders/` pero está vacío

**Causa:** Los pedidos no se están guardando ahí

**Solución:**
1. Crea un pedido nuevo
2. Inmediatamente ve a Firebase Console
3. Recarga la página (F5)
4. Expande `/orders/`
5. ¿Apareció el pedido?

**Si no aparece:**
- Revisa la consola (F12) en busca de errores
- Verifica que estés logueado como cliente
- Revisa `OrderService.ts` línea 93-130

---

### Problema 3: El pedido SÍ está en `/orders/` pero el repartidor no lo ve

**Causa:** El repartidor está filtrando mal o buscando en otro lado

**Verifica en la app del repartidor:**
1. ¿Está logueado como repartidor?
2. ¿Qué ruta está leyendo? (`OrderService.getAssignedOrders()`)
3. ¿Qué filtros aplica? (status, assignedToDeliveryId, etc.)

**Revisa el código del repartidor:**
```typescript
// En repartidor-web/src/services/OrderService.ts
const snapshot = await get(child(dbRef, 'orders'));

// Filtra por:
// - status === 'PENDING' || 'ASSIGNED' || 'MANUAL_ASSIGNED'
// - assignedToDeliveryId === deliveryId (si está asignado)
```

**Si el estado no es correcto:**
- El pedido debe tener `status: "PENDING"` (mayúsculas)
- No debe tener `assignedToDeliveryId` (vacío)

---

## 📋 CHECKLIST DE VERIFICACIÓN:

Marca lo que ya verificaste:

- [ ] Abrí Firebase Console → Realtime Database
- [ ] Vi la ruta `/client_orders/` con al menos un pedido
- [ ] Vi la ruta `/orders/` con al menos un pedido
- [ ] Ambos pedidos tienen el mismo ID
- [ ] El pedido en `/orders/` tiene `status: "PENDING"`
- [ ] El pedido en `/orders/` tiene `customer.location.latitude`
- [ ] El pedido en `/orders/` tiene `items[]` como array
- [ ] El pedido en `/orders/` tiene `paymentMethod: "EFFECTIVE"`

**Si todas las casillas están marcadas:** ✅ Todo está bien
**Si falta alguna:** ❌ Ahí está el problema

---

## 🎯 RESUMEN:

### Lo que DEBERÍAS ver:

```
Firebase Realtime Database:
├── client_orders/
│   └── 1715025600000/
│       ├── id: "1715025600000"
│       ├── clientName: "Juan Pérez González"
│       └── status: "pending"
│
└── orders/
    └── 1715025600000/
        ├── id: "1715025600000"
        ├── orderCode: "PED-025600"
        ├── orderType: "CLIENT"
        ├── status: "PENDING"
        ├── customer: { name, phone, address, location }
        ├── items: [...]
        ├── paymentMethod: "EFFECTIVE"
        └── ...todos los campos
```

---

## 🧪 PRUEBA AHORA:

1. **Crea un pedido** usando el botón azul de datos de prueba
2. **Inmediatamente** ve a Firebase Console
3. **Recarga** la página de Firebase (F5)
4. **Expande** `/orders/`
5. **¿Ves el pedido?**

**SI:** ✅ Perfecto, el problema está en el repartidor
**NO:** ❌ El problema está al guardar en `/orders/`

---

**Dime qué ves en Firebase Console** y te ayudo a solucionarlo.

¿Ves `/orders/` con pedidos dentro? ¿O solo ves `/client_orders/`?
