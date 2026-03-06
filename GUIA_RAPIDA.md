# 🚀 GUÍA RÁPIDA DE INICIO - Click Entrega Cliente Web

## ⚡ Empezar en 5 Minutos

### Paso 1: Instalar (2 minutos)

```bash
cd "c:\1234\Nueva carpeta (22)\apl\Prueba New\cliente-web"
npm install
```

O simplemente ejecuta `install.bat`

---

### Paso 2: Configurar Firebase (3 minutos)

1. Ve a https://console.firebase.google.com/
2. Crea un proyecto nuevo
3. Habilita Realtime Database (modo prueba)
4. Copia las credenciales
5. Crea un archivo `.env.local` y pega:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_id
VITE_FIREBASE_APP_ID=tu_app_id
```

📖 **O lee** `FIREBASE_SETUP.md` para instrucciones detalladas

---

### Paso 3: Ejecutar (1 minuto)

```bash
npm run dev
```

¡Listo! Abre http://localhost:3003

---

## 🎯 Primeros Pasos en la App

### 1️⃣ Regístrate

1. Haz clic en **"Regístrate aquí"**
2. Llena el formulario:
   - Nombre completo
   - Correo electrónico
   - Teléfono
   - Contraseña
3. Haz clic en **"Crear Cuenta"**
4. ¡Automáticamente entrarás a la app! ✅

---

### 2️⃣ Explora el Dashboard

Verás:
- Mensaje de bienvenida
- Botones: **"📦 Crear Pedido"**, **"📋 Mis Pedidos"**, **"👤 Perfil"**
- 9 tipos de servicios disponibles
- Información de Click Entrega

---

### 3️⃣ Crea Tu Primer Pedido

1. Haz clic en **"📦 Crear Pedido"** o en algún servicio

2. **Llena tus datos:**
   - Nombre (ya debería estar lleno)
   - Teléfono (ya debería estar lleno)

3. **Dirección de entrega:**
   - Escribe tu dirección completa
   - Haz clic en **"🛰️ Obtener Mi Ubicación GPS"**
   - Haz clic en **"📏 Calcular Distancia y Costo"**
   - Verás la distancia y el costo del envío 💰

4. **Selecciona el tipo de servicio:**
   - Haz clic en uno de los 9 servicios
   - 🍔 Comida, ⛽ Gasolina, 💊 Medicamentos, etc.

5. **¿Requiere recogida?** (Opcional)
   - Activa el checkbox si necesitas recoger en otro lugar
   - Llena la dirección, nombre del lugar y URL (si tiene)

6. **Detalles del pedido:**
   - Describe lo que necesitas (sé específico)
   - Agrega notas adicionales (opcional)
   - Sube una foto (opcional)

7. **Haz clic en "✅ Crear Pedido"**

¡Listo! Tu pedido ha sido creado 🎉

---

### 4️⃣ Sigue Tu Pedido

Después de crear el pedido, automáticamente irás a **"Mis Pedidos"**

Verás:
- Código único del pedido (ej: PED-123456)
- Estado actual (🟡 Pendiente, 🟢 Aceptado, etc.)
- Dirección de entrega
- Descripción del pedido
- Distancia y costo
- Repartidor asignado (cuando lo haya)

**Estados del pedido:**
- ⏳ **Pendiente** - Esperando asignación de repartidor
- ✅ **Aceptado** - Buscando repartidor
- 🚗 **En camino a recoger** - El repartidor va por tu pedido
- 📦 **Pedido recogido** - Ya recogieron tu pedido
- 🚚 **En camino a entregar** - Va en camino a ti
- ✅ **Entregado** - ¡Ya llegó!
- ❌ **Cancelado** - Pedido cancelado

---

### 5️⃣ Actualiza Tu Perfil

1. Ve a **"👤 Perfil"**
2. Puedes editar:
   - Tu nombre
   - Tu teléfono
3. Haz clic en **"💾 Guardar Cambios"**

---

## 📱 ¿Qué Puedes Pedir?

### 🍔 Comida
- De cualquier restaurante de la ciudad
- Especifica: Restaurante, menú, cantidades

### ⛽ Gasolina
- Te llevamos gasolina a domicilio
- Ideal para emergencias

### 📝 Papelería
- Artículos de oficina
- Tareas escolares
- Copias e impresiones

### 💊 Medicamentos
- Farmacia a domicilio
- Especifica medicamento y cantidad

### 🍺 Cervezas y Cigarros
- Para tu fiesta o reunión
- Especifica marcas y cantidades

### 💧 Garrafones de Agua
- Hidratación garantizada
- Especifica número de garrafones

### 🔥 Gas
- Gas LP para tu hogar
- Renueva tu cilindro

### 📦 Pagos o Cobros
- Gestiones administrativas
- Pagos de servicios

### 🎁 Favores
- Mandados especiales
- Recados personalizados

---

## 💡 Consejos Útiles

### Para Pedidos Más Rápidos:
1. ✅ Sé específico en la descripción
2. ✅ Usa la geolocalización automática
3. ✅ Sube una foto si es relevante
4. ✅ Revisa bien la dirección de entrega
5. ✅ Mantén tu teléfono cerca por si te llaman

### Para Mejor Experiencia:
1. ✅ Guarda direcciones frecuentes en notas
2. ✅ Revisa el costo antes de crear el pedido
3. ✅ Monitorea tu pedido en tiempo real
4. ✅ Ten listo el código de confirmación

---

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta el envío?
El cálculo es automático:
- $15 pesos base
- + $8 pesos por kilómetro
- Se calcula al momento de crear el pedido

### ¿Puedo cancelar mi pedido?
Sí, siempre y cuando esté **"Pendiente"** (no se haya asignado repartidor aún)

### ¿Cómo sé quién es mi repartidor?
Cuando te asignen un repartidor, verás su nombre en la tarjeta de tu pedido

### ¿El repartidor me puede llamar?
Sí, por eso es importante poner tu teléfono correcto

### ¿Qué pasa si no estoy en casa?
Puedes especificar en las notas dónde dejar tu pedido o dar instrucciones especiales

### ¿Aceptan propinas?
Sí, puedes darle propina en efectivo al repartidor cuando entregue

---

## 🆘 Problemas Comunes

### "No puedo registrarme"
- Verifica tu conexión a internet
- Asegúrate de haber configurado Firebase correctamente
- Revisa la consola del navegador (F12) para ver errores

### "Mi pedido no aparece"
- Verifica que estás logueado
- Revisa tu conexión a internet
- Intenta recargar la página

### "No calcula la distancia"
- Asegúrate de obtener tu ubicación GPS
- Verifica que la dirección esté completa
- Intenta manualmente con coordenadas aproximadas

### "La imagen no se carga"
- Verifica que el archivo sea JPG o PNG
- Asegúrate que no pese más de 5MB
- Intenta con otra imagen

---

## 📞 Contacto y Soporte

¿Tienes problemas o dudas?

1. Revisa este archivo primero
2. Lee `README.md` para información general
3. Consulta `FIREBASE_SETUP.md` para problemas de Firebase
4. Contacta al equipo de desarrollo

---

## 🎉 ¡Disfruta la App!

Ya estás listo para usar Click Entrega.

**Recuerda:**
- ✅ Solo cobramos 10% de comisión
- ✅ Servicio 24/7
- ✅ Repartidores verificados
- ✅ Seguridad garantizada

---

**© 2024 Click Entrega - Repartos Fresnillo**

*¡Nosotros sí te hacemos los mandados!*
