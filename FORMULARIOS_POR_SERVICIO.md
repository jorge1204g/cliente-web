# 🎯 Formularios Específicos por Tipo de Servicio

## ✅ Cambios Realizados

Se ha actualizado la página de creación de pedidos (`CreateOrderPage.tsx`) para que **cada tipo de servicio muestre su propio formulario específico** con los campos relevantes para ese servicio.

---

## 📋 Detalle de Campos por Servicio

### 🍔 **COMIDA (FOOD)**
- **Nombre del Restaurante o Local** * - Campo para ingresar el restaurante donde se recogerá la comida
- ℹ️ La comida será recogida en este lugar y entregada en tu domicilio

---

### ⛽ **GASOLINA (GASOLINE)**
- **Tipo de Combustible** * - Select con opciones: Magna, Premium, Diesel
- **Cantidad de Litros** * - Campo numérico para especificar los litros necesarios
- ℹ️ El repartidor irá a la gasolinera más cercana y entregará el combustible en tu domicilio

---

### 📝 **PAPELERÍA (STATIONERY)**
- **Artículos que Necesitas** * - Área de texto para listar artículos (carpetas, bolígrafos, hojas, etc.)
- **Servicios de Impresión** (opcional) - Área de texto para impresiones, engargolados, etc.
- **¿Alguna papelería en específico?** (opcional) - Campo para tienda preferida
- ℹ️ Los artículos serán comprados y entregados en tu domicilio

---

### 💊 **MEDICAMENTOS (MEDICINES)**
- **Medicamentos que Necesitas** * - Área de texto para listar medicamentos
- **¿Alguna farmacia en específico?** (opcional) - Campo para farmacia preferida
- **¿Requiere receta médica?** * - Select Sí/No
- **Si requiere receta:**
  - **¿Necesita pasar por la receta física?** * - Select Sí/No
  - **Si necesita recoger receta:** Dirección donde recoger la receta *
- ℹ️ Los medicamentos serán comprados y entregados en tu domicilio

---

### 🍺 **CERVEZAS Y CIGARROS (BEVERAGES)**
- **Marcas de Cerveza** * - Área de texto para listar cervezas (6-packs, marcas, etc.)
- **Marcas de Cigarros** * - Área de texto para listar cigarros (cajetillas, marcas, etc.)
- **Cantidades Totales** * - Campo para especificar cantidades
- ℹ️ Las cervezas y cigarros serán comprados y entregados en tu domicilio

---

### 💧 **GARRAFONES DE AGUA (WATER)**
- **Número de Garrafones** * - Campo numérico para especificar cantidad
- ℹ️ Los garrafones serán entregados en tu domicilio

---

### 🔥 **GAS LP (GAS)**
- **Monto a Cargar ($ pesos)** * - Campo numérico para el monto en pesos
- **Tamaño del Tanque** * - Select con opciones: 5kg, 10kg, 20kg, 30kg
- ℹ️ El gas será cargado en tu tanque y entregado en tu domicilio

---

### 📦 **PAGOS O COBROS (PAYMENTS)**
- **Tipo de Pago/Servicio** * - Select con opciones:
  - CFE - Luz
  - CFE - Gas
  - Agua Potable
  - Telcel
  - Movistar
  - AT&T
  - Izzi
  - Dish
  - Sky
  - Predial
  - Seguro
  - Otro
- **Proveedor del Servicio** * - Campo para especificar la compañía
- ℹ️ El pago se realizará y el comprobante será entregado en tu domicilio

---

### 🎁 **FAVORES/MANDADOS ESPECIALES (FAVORS)**
- **Tipo de Favor/Regalo** * - Select con opciones:
  - Flores
  - Pastel
  - Carta/Documento
  - Paquete
  - Comida Casera
  - Llaves
  - Ropa
  - Herramienta
  - Mascota
  - Otro
- **Descripción Detallada** * - Área de texto para describir el favor
- **Dirección de Recogida** * - Campo para dirección donde recoger
- ℹ️ El repartidor recogerá en la dirección indicada y entregará en tu domicilio

---

## 🔄 Funcionamiento General

1. **El usuario selecciona un tipo de servicio** haciendo clic en uno de los botones
2. **Automáticamente se muestra el formulario específico** para ese tipo de servicio
3. **El usuario llena los campos específicos** según corresponda
4. **Todos los servicios incluyen:**
   - 👤 Datos del Cliente (Nombre completo, Teléfono)
   - 📍 Dirección de Entrega completa (Calle, Número, Colonia, Ciudad, Estado, CP)
   - 🛰️ Botón "Mi Ubicación" para obtener coordenadas GPS automáticamente
   - 🎫 Código de Confirmación de 4 dígitos

---

## 💾 Almacenamiento de Datos

Cuando se crea el pedido, cada tipo de servicio guarda sus campos específicos en Firebase:

- **FOOD**: restaurantName
- **GASOLINE**: fuelType, fuelLiters
- **STATIONERY**: stationeryItems, printServices, specificStore
- **MEDICINES**: medicineList, hasPrescription, needToPickupPrescription, pharmacyName
- **BEVERAGES**: beerBrands, cigaretteBrands, quantities
- **WATER**: waterBottlesCount
- **GAS**: gasAmount, tankSize
- **PAYMENTS**: paymentType, serviceProvider
- **FAVORS**: favorType, pickupLocationForFavor

Todos estos campos se agregan al campo `items` del pedido con un formato legible.

---

## 🎨 Interfaz de Usuario

- Los formularios específicos aparecen **debajo de la selección del tipo de servicio**
- Tienen un encabezado verde: "📋 Detalles del Servicio Seleccionado"
- Solo se muestran cuando el usuario ha seleccionado un tipo de servicio
- Cada sección tiene íconos y colores distintivos
- Incluye textos de ayuda (ℹ️) para guiar al usuario

---

## ✅ Beneficios

1. **Experiencia personalizada** - Cada servicio muestra solo los campos relevantes
2. **Menos confusión** - Los usuarios no ven campos innecesarios
3. **Información completa** - Se capturan todos los detalles necesarios para cada tipo de servicio
4. **Mejor organización** - Los datos se guardan estructurados en Firebase
5. **Fácil de usar** - Interfaz intuitiva y guiada

---

## 📱 Uso en Dispositivos Móviles

La interfaz es completamente responsiva:
- Los campos se adaptan al tamaño de la pantalla
- Los selectores son fáciles de usar en pantallas táctiles
- Los botones tienen tamaños adecuados para dedos

---

## 🔜 Próximos Pasos Sugeridos

1. Agregar validaciones específicas para cada tipo de servicio
2. Mostrar ejemplos o sugerencias en cada campo
3. Agregar opción para guardar direcciones frecuentes
4. Implementar autocompletado para restaurantes y tiendas comunes

---

**Fecha de actualización:** Marzo 2026
**Archivo modificado:** `cliente-web/src/pages/CreateOrderPage.tsx`
