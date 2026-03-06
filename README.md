# 🚚 Click Entrega - App Cliente Web

## Descripción
Aplicación web para que los clientes puedan solicitar pedidos de diversos servicios (comida, gasolina, medicamentos, etc.) con cálculo automático de distancia y costo de envío.

## Características Principales

### ✅ Funcionalidades Implementadas

1. **Autenticación**
   - Registro de nuevos clientes
   - Inicio de sesión
   - Gestión de perfil

2. **Crear Pedidos**
   - Formulario completo con:
     - Nombre del cliente
     - Dirección de entrega con geolocalización
     - Tipo de servicio (filtro)
     - Dirección de recogida (si aplica)
     - Nombre y URL de referencia
     - Fotografía del producto/servicio
     - Número de teléfono
     - Código de pedido único
   - Cálculo automático de distancia (kilometraje)
   - Cálculo de costo de envío

3. **Seguimiento de Pedidos**
   - Lista de todos los pedidos del cliente
   - Estado en tiempo real
   - Información del repartidor asignado
   - Fecha y hora de creación
   - Código de seguimiento

4. **Servicios Disponibles**
   - 🍔 Comida (de cualquier restaurante)
   - ⛽ Gasolina
   - 📝 Papelería
   - 💊 Medicamentos
   - 🍺 Cervezas y Cigarros
   - 💧 Garrafones de Agua
   - 🔥 Gas
   - 📦 Pagos o Cobros
   - 🎁 Favores

5. **Integración**
   - Los pedidos se sincronizan automáticamente con:
     - App del Administrador
     - App del Repartidor
   - Actualización en tiempo real del estado

## Instalación

### Requisitos Previos
- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Firebase configurada

### Pasos de Instalación

1. **Instalar dependencias**
```bash
cd cliente-web
npm install
```

2. **Configurar Firebase**

Edita el archivo `src/services/Firebase.ts` con tus credenciales:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

3. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

La aplicación se abrirá automáticamente en `http://localhost:3003`

4. **Compilar para producción**
```bash
npm run build
```

5. **Desplegar a Vercel**
```bash
npm install -g vercel
vercel --prod
```

## Estructura del Proyecto

```
cliente-web/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CreateOrderPage.tsx
│   │   ├── MyOrdersPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/        # Servicios y utilidades
│   │   ├── Firebase.ts
│   │   ├── AuthService.ts
│   │   └── OrderService.ts
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Punto de entrada
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Tecnologías Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **React Router DOM** - Navegación
- **Firebase Realtime Database** - Base de datos en tiempo real

## Fórmulas de Cálculo

### Distancia (Fórmula Haversine)
```javascript
R = 6371 km (radio terrestre)
dLat = lat2 - lat1 (en radianes)
dLon = lon2 - lon1 (en radianes)

a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2)
c = 2 * atan2(√a, √(1−a))
distance = R * c
```

### Costo de Envío
```
costo = $15 (base) + ($8 × kilómetros)
```

## Flujo de Pedido

1. Cliente crea pedido → Se guarda en Firebase
2. Admin recibe notificación → Asigna repartidor
3. Repartidor acepta → Cambia estado a "ACCEPTED"
4. Repartidor recoge → Cambia estado a "PICKED_UP"
5. Repartidor entrega → Cambia estado a "DELIVERED"
6. Cliente ve actualizaciones en tiempo real

## Seguridad

⚠️ **IMPORTANTE**: En producción, implementar:
- Encriptación de contraseñas
- Firebase Authentication oficial
- Validación de tokens
- HTTPS obligatorio

## Soporte

Para dudas o problemas, contactar al equipo de desarrollo.

---

**© 2024 Click Entrega - Repartos Fresnillo**

*Somos una empresa comprometida con el cliente y la seguridad de tus paquetes o entregas*
