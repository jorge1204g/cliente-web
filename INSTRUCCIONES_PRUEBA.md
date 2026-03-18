# 🧪 INSTRUCCIONES DE PRUEBA - Nuevos Formularios

## 📋 ¿CÓMO PROBAR LOS NUEVOS FORMULARIOS?

Sigue estos pasos para verificar que cada botón muestra su formulario específico:

---

## 🔹 PASO 1: Abrir la Aplicación

1. Abre tu navegador (Chrome, Edge, Firefox)
2. Ve a la aplicación web de cliente:
   - **Local:** `http://localhost:5173` (o el puerto que uses)
   - **Producción:** La URL de tu sitio desplegado

3. Inicia sesión con una cuenta de prueba o crea una nueva

---

## 🔹 PASO 2: Ir a Crear Pedido

1. En el menú principal, haz clic en **"📦 Crear Pedido"**
2. Deberías ver la página con todos los botones de servicios

---

## 🔹 PASO 3: Probar CADA Botón

### ✅ Prueba #1: 🍔 COMIDA

**Acción:** Haz clic en el botón "🍔 Comida"

**Deberías ver:**
```
✅ El botón se marca con borde azul y fondo celeste
✅ Aparece un nuevo recuadro verde abajo que dice:
   "📋 Detalles del Servicio Seleccionado"
✅ Dentro del recuadro ves:
   - Campo: "🍽️ Nombre del Restaurante o Local *"
   - Texto de ayuda: "ℹ️ La comida será recogida..."
```

**❌ NO deberías ver:**
- Campos de gasolina, medicamentos, papelería, etc.

---

### ✅ Prueba #2: ⛽ GASOLINA

**Acción:** Haz clic en el botón "⛽ Gasolina"

**Deberías ver:**
```
✅ El botón cambia a Gasolina (borde azul + fondo celeste)
✅ El recuadro verde ahora muestra:
   - Select: "⛽ Tipo de Combustible *" (Magna/Premium/Diesel)
   - Campo: "📊 Cantidad de Litros *"
   - Texto: "ℹ️ El repartidor irá a la gasolinera..."
```

**Verificación:**
- [ ] ¿Desapareció el campo de restaurante? ✅
- [ ] ¿Aparecieron los campos de gasolina? ✅

---

### ✅ Prueba #3: 💊 MEDICAMENTOS

**Acción:** Haz clic en el botón "💊 Medicamentos"

**Deberías ver:**
```
✅ El recuadro verde muestra:
   - Área de texto: "💊 Medicamentos que Necesitas *"
   - Campo: "🏪 ¿Alguna farmacia en específico?"
   - Select: "💊 ¿Requiere receta médica? *"
   
PRUEBA ADICIONAL:
- Selecciona "Sí, requiere receta" en el select
✅ Debería aparecer OTRO select:
   "📄 ¿Necesita pasar por la receta física?"
   
- Selecciona "Sí, necesita recoger receta física"
✅ Debería aparecer campo:
   "📍 Dirección donde recoger la receta *"
```

**Verificación:**
- [ ] ¿Los campos cambian dinámicamente? ✅
- [ ] ¿La lógica de receta funciona? ✅

---

### ✅ Prueba #4: 🍺 CERVEZAS Y CIGARROS

**Acción:** Haz clic en "🍺 Cervezas y Cigarros"

**Deberías ver:**
```
✅ Tres campos en línea:
   - "🍺 Marcas de Cerveza *"
   - "🚬 Marcas de Cigarros *"
   - "📊 Cantidades Totales *"
```

---

### ✅ Prueba #5: 🔥 GAS

**Acción:** Haz clic en "🔥 Gas"

**Deberías ver:**
```
✅ Dos campos:
   - "🔥 Monto a Cargar ($ pesos) *"
   - "📏 Tamaño del Tanque *" (Select: 5kg/10kg/20kg/30kg)
```

---

### ✅ Prueba #6: 📦 PAGOS O COBROS

**Acción:** Haz clic en "📦 Pagos o Cobros"

**Deberías ver:**
```
✅ Dos campos:
   - "📄 Tipo de Pago/Servicio *" 
     (Lista: CFE-Luz, Agua, Telcel, etc.)
   - "🏢 Proveedor del Servicio *"
```

---

### ✅ Prueba #7: 🎁 FAVORES

**Acción:** Haz clic en "🎁 Favores"

**Deberías ver:**
```
✅ Tres campos:
   - "🎁 Tipo de Favor/Regalo *"
     (Lista: Flores, Pastel, Carta, etc.)
   - "📝 Descripción Detallada *"
   - "📍 Dirección de Recogida *"
```

---

## 🔹 PASO 4: Verificar Datos Comunes

**IMPORTANTE:** Todos los servicios deben mostrar:

```
✅ SECCIÓN 1: 👤 Datos del Cliente
   - Nombre completo *
   - Teléfono *

✅ SECCIÓN 2: 📍 Dirección de Entrega
   - Botón: 🛰️ Mi Ubicación
   - Calle *
   - Número *
   - Colonia *
   - Ciudad *
   - Estado *
   - Código Postal *

✅ SECCIÓN 3: 🎫 Código de Confirmación
   - Campo numérico de 4 dígitos
   - Botón: 🎲 Generar Código Aleatorio
```

**Estas secciones SIEMPRE están visibles**, sin importar el servicio seleccionado.

---

## 🔹 PASO 5: Probar Creación de Pedido

### Ejemplo de Prueba Completa:

1. **Selecciona:** 🍔 Comida
2. **Llena:**
   ```
   Restaurante: Tacos Don Pancho
   Nombre: Juan Pérez
   Teléfono: 492 123 4567
   ```
3. **Dirección:** Usa el botón GPS o llena manualmente
4. **Código:** Genera uno aleatorio
5. **Click:** ✅ Crear Pedido

**Verifica en Firebase Console:**
```
El pedido debe incluir:
- serviceType: "FOOD"
- restaurantName: "Tacos Don Pancho"
- items: "Restaurante: Tacos Don Pancho\n[lo que escribiste]"
- Todos los demás campos (cliente, dirección, etc.)
```

---

## 🔹 PASO 6: Verificar en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Busca la colección `orders`
5. Encuentra el pedido que acabas de crear
6. Verifica que tenga los campos específicos:

**Para Comida:**
```javascript
{
  serviceType: "FOOD",
  restaurantName: "Tacos Don Pancho",
  items: "Restaurante: Tacos Don Pancho\n2 órdenes de tacos..."
}
```

**Para Gasolina:**
```javascript
{
  serviceType: "GASOLINE",
  fuelType: "Magna",
  fuelLiters: "20",
  items: "Combustible: Magna\nCantidad: 20 litros\n..."
}
```

**Para Medicamentos:**
```javascript
{
  serviceType: "MEDICINES",
  medicineList: "Paracetamol 500mg",
  hasPrescription: true,
  pharmacyName: "Farmacias Guadalajara",
  items: "Medicamentos: Paracetamol...\nFarmacia: Farmacias Guadalajara\n..."
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Marca cada ítem conforme lo pruebes:

### Interfaz Gráfica
- [ ] Cada botón tiene ícono y etiqueta correcta
- [ ] Al hacer clic, el botón se selecciona (borde azul + fondo celeste)
- [ ] Aparece sección "📋 Detalles del Servicio Seleccionado"
- [ ] Los campos específicos cambian según el servicio
- [ ] Los datos del cliente siempre están visibles
- [ ] La dirección siempre está visible
- [ ] El código de confirmación siempre está visible

### Funcionalidad por Servicio
- [ ] 🍔 Comida → Muestra campo de restaurante
- [ ] ⛽ Gasolina → Muestra tipo y litros
- [ ] 📝 Papelería → Muestra artículos e impresiones
- [ ] 💊 Medicamentos → Muestra medicinas y opciones de receta
- [ ] 🍺 Cervezas → Muestra marcas y cantidades
- [ ] 💧 Agua → Muestra número de garrafones
- [ ] 🔥 Gas → Muestra monto y tamaño de tanque
- [ ] 📦 Pagos → Muestra tipo y proveedor
- [ ] 🎁 Favores → Muestra tipo, descripción y recogida

### Validaciones
- [ ] Los campos obligatorios tienen asterisco (*)
- [ ] No se puede crear pedido sin servicio seleccionado
- [ ] Los campos específicos son obligatorios según corresponda
- [ ] El código de confirmación solo acepta 4 dígitos

### Firebase
- [ ] Los pedidos se guardan correctamente
- [ ] Los campos específicos aparecen en Firebase
- [ ] El campo `items` incluye la información formateada
- [ ] Todos los datos del cliente se guardan
- [ ] Las coordenadas GPS se guardan

---

## 🐛 ¿QUÉ HACER SI ALGO FALLA?

### Problema: Los campos no cambian
**Solución:**
1. Recarga la página (F5 o Ctrl+R)
2. Limpia caché del navegador (Ctrl+Shift+Supr)
3. Verifica la consola del navegador (F12)

### Problema: Error al crear pedido
**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Revisa que todos los campos obligatorios estén llenos
5. Verifica que las coordenadas GPS estén capturadas

### Problema: No veo los datos en Firebase
**Solución:**
1. Espera 5-10 segundos y actualiza la vista en Firebase
2. Verifica que el pedido se haya creado (deberías recibir confirmación)
3. Revisa la colección correcta (`orders`)
4. Verifica que estás en el proyecto correcto de Firebase

---

## 📸 CAPTURA DE PANTALLA ESPERADA

Tu pantalla debería verse así cuando selecciones un servicio:

```
┌─────────────────────────────────────────────┐
│  📦 Crear Nuevo Pedido                      │
├─────────────────────────────────────────────┤
│  👤 Datos del Cliente                       │
│  [Nombre] [Teléfono]                        │
├─────────────────────────────────────────────┤
│  📍 Dirección de Entrega                    │
│  [🛰️ Mi Ubicación]                          │
│  [Calle] [Número] [Colonia]...              │
├─────────────────────────────────────────────┤
│  🎯 Tipo de Servicio                        │
│  [🍔] [⛽] [📝] [💊] [🍺] [💧] [🔥] [📦] [🎁]│
│     ↑                                       │
│     Click aquí                              │
├─────────────────────────────────────────────┤
│  📋 Detalles del Servicio Seleccionado      │
│  ┌───────────────────────────────────────┐ │
│  │ 🍽️ Nombre del Restaurante o Local *   │ │
│  │ [Ej. Tacos Don Pancho, KFC, etc.]    │ │
│  │                                        │ │
│  │ ℹ️ La comida será recogida...         │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  📝 Detalles del Pedido                     │
│  [Descripción] [Notas] [Código 0000]       │
├─────────────────────────────────────────────┤
│  ✅ Crear Pedido                            │
└─────────────────────────────────────────────┘
```

---

## 🎯 RESULTADO ESPERADO

Después de completar todas las pruebas, deberías poder confirmar:

✅ **CADA BOTÓN MUESTRA UN FORMULARIO DIFERENTE**  
✅ **LOS CAMPOS SON ESPECÍFICOS PARA CADA SERVICIO**  
✅ **LOS DATOS SE GUARDAN CORRECTAMENTE EN FIREBASE**  
✅ **LA EXPERIENCIA ES FLUIDA E INTUITIVA**  

---

## 📞 SOPORTE

Si encuentras algún problema después de seguir estas instrucciones:

1. **Documenta el error:**
   - ¿Qué botón presionaste?
   - ¿Qué esperabas ver?
   - ¿Qué viste realmente?
   
2. **Captura pantallas:**
   - Toma screenshots del error
   
3. **Revisa la consola:**
   - Abre F12 → Console
   - Copia cualquier error en rojo
   
4. **Verifica Firebase:**
   - ¿El pedido se creó?
   - ¿Los datos están correctos?

---

**Fecha:** Marzo 2026  
**Versión:** 2.0 - Con formularios dinámicos por servicio  
**Estado:** ✅ Listo para probar
