# 🧪 PRUEBA DE DIAGNÓSTICO - MENSAJES

## 📋 Instrucciones Paso a Paso

### **Paso 1: Recargar App del Cliente**

1. **Abrir app web del cliente** en tu navegador
2. **Presionar F12** para abrir DevTools
3. **Ir a pestaña "Console"** (Consola)
4. **Recargar página** (F5 o Ctrl+R)
5. **Mantener la consola visible**

---

### **Paso 2: Ir al Chat**

1. En la app del cliente, ir a **"Mis Pedidos"**
2. Buscar el pedido con Jorge García
3. Click en botón **"Chat con repartidor"**
4. **Observar la consola** - debería mostrar:

```
🔍 [DEBUG] Datos del cliente:
   ├── clientId: ???
   └── clientName: ???
   └── currentUserId establecido a: ???

🔍 [DEBUG] Parámetros de URL:
   ├── deliveryId: ???
   ├── deliveryName: ???
   └── orderId: ???
   └── receiverId establecido a: ???
```

---

### **Paso 3: Enviar Mensaje desde Repartidor Móvil**

1. **Abrir app del repartidor móvil**
2. Ir a **pestaña "Clientes"**
3. Tocar cliente **Jorge García**
4. Enviar mensaje: **"PRUEBA 123"**
5. **Verificar Logcat** en Android Studio

---

### **Paso 4: Revisar Consola del Cliente**

Inmediatamente después de enviar el mensaje desde el repartidor, **revisar la consola del navegador del cliente**. Deberías ver algo como:

```
🔍 [listenMessages] userId1: Jorge García userId2: repartidor456
═══════════════════════════════════════════════
📦 [listenMessages] Total de mensajes en Firebase: 10

📨 Mensaje revisando:
   ID: -abc123
   senderId: ???
   receiverId: ???
   message: PRUEBA 123
   ¿Coincide? ❌ NO
   Comparación:
     - (senderId === userId1): false
     - (receiverId === userId2): false
     - (senderId === userId2): true
     - (receiverId === userId1): ???

❌ [NO MATCH] Mensaje descartado
```

---

## 🎯 Qué Buscar en los Logs

### **Escenario A: IDs Correctos pero No Coinciden**

```
userId1: Jorge García
receiverId: repartidor456

Mensaje:
   senderId: repartidor456      ✅ COINCIDE con receiverId
   receiverId: JORGE GARCIA     ❌ NO COINCIDE (diferente capitalización)
```

**Problema**: Case-sensitive  
**Solución**: Usar `.toLowerCase()` en comparación

---

### **Escenario B: Espacios en Blanco**

```
userId1: Jorge García
receiverId: repartidor456

Mensaje:
   senderId: repartidor456
   receiverId: Jorge García    ← tiene espacio extra al final
```

**Problema**: Espacios en blanco  
**Solución**: Usar `.trim()` en ambos lados

---

### **Escenario C: Nombre vs ID**

```
userId1: cliente123            ← ID real de Firebase
receiverId: repartidor456

Mensaje:
   senderId: repartidor456
   receiverId: Jorge García    ← NOMBRE en vez de ID
```

**Problema**: Mismatch entre ID y nombre  
**Solución**: Asegurar que ambos usen nombre O ambos usen ID

---

### **Escenario D: Funciona Correctamente** ✅

```
userId1: Jorge García
receiverId: repartidor456

Mensaje:
   senderId: repartidor456
   receiverId: Jorge García
   
✅ [MATCH] Mensaje que coincide:
   ├── senderId: repartidor456
   ├── receiverId: Jorge García
   └── message: PRUEBA 123

📊 [RESULTADO] Mensajes filtrados: 1
```

---

## 📸 Capturas Necesarias

Por favor comparte estas capturas:

### **1. Consola del Cliente (al recargar)**
- Mostrar logs iniciales con `clientId`, `clientName`, `currentUserId`
- Mostrar parámetros de URL (`deliveryId`, `deliveryName`)

### **2. Consola del Cliente (después de enviar mensaje)**
- Mostrar TODOS los logs de `listenMessages`
- Incluir comparaciones completas
- Mostrar resultado final (`Mensajes filtrados: X`)

### **3. Logcat del Repartidor (al enviar mensaje)**
- Mostrar logs de envío
- Incluir `senderId`, `receiverId` guardados en Firebase

---

## 🔧 Soluciones Rápidas Según Resultado

### Si ves esto en consola:

#### **Caso 1: `receiverId: Jorge García ` (con espacio)**
```typescript
// Solución en MessageService.ts línea ~95:
const match = (msg.senderId.trim().toLowerCase() === userId1.trim().toLowerCase() && 
               msg.receiverId.trim().toLowerCase() === userId2.trim().toLowerCase()) ||
              (msg.senderId.trim().toLowerCase() === userId2.trim().toLowerCase() && 
               msg.receiverId.trim().toLowerCase() === userId1.trim().toLowerCase());
```

---

#### **Caso 2: `receiverId: JORGE GARCIA` (mayúsculas)**
```typescript
// Misma solución que Caso 1 - usar toLowerCase()
```

---

#### **Caso 3: `receiverId: cliente123` (ID en vez de nombre)**
```typescript
// Solución: Cambiar ChatPage.tsx para usar clientId en vez de clientName
setCurrentUserId(clientId);  // Línea 31
```

---

## 📝 Ejemplo de Reporte Ideal

```
=== CONSOLA CLIENTE ===

🔍 [DEBUG] Datos del cliente:
   ├── clientId: abc123xyz
   └── clientName: Jorge García
   └── currentUserId establecido a: Jorge García

🔍 [DEBUG] Parámetros de URL:
   ├── deliveryId: repartidor456
   ├── deliveryName: Jose L
   └── orderId: 1774584080805
   └── receiverId establecido a: repartidor456

🔍 [listenMessages] userId1: Jorge García userId2: repartidor456
═══════════════════════════════════════════════
📦 Total mensajes en Firebase: 15

📨 Mensaje revisando:
   ID: -xyz789
   senderId: repartidor456
   receiverId: Jorge Garcia     ← ¡AHÍ ESTÁ EL PROBLEMA!
   message: PRUEBA 123
   ¿Coincide? ❌ NO
   Comparación:
     - (senderId === userId1): false
     - (receiverId === userId2): false
     - (senderId === userId2): true
     - (receiverId === userId1): false  ← 'Garcia' ≠ 'García'

❌ [NO MATCH] Mensaje descartado

📊 Mensajes filtrados: 0
```

---

## ✨ Siguiente Paso

**Después de compartir los logs completos**, podré decirte EXACTAMENTE:
1. Cuál es el problema específico
2. Qué archivo modificar
3. Qué cambio exacto hacer

¿Podrías hacer la prueba y compartir las capturas de pantalla de la consola?
