# 🎴 Tarjeta de Presentación con QR - Guía Completa

## 📱 ¿Qué es este archivo?

Es una tarjeta de presentación digital profesional que incluye:
- ✅ **Código QR automático** que dirige a tu app web
- ✅ **Diseño moderno y atractivo** listo para imprimir
- ✅ **Información completa** de tus servicios
- ✅ **2 diseños diferentes** para elegir o usar ambos

## 🔗 URL de la App en el QR

El código QR generado automáticamente apunta a:
```
https://cliente-rdeev05n4-jorge1204gs-projects.vercel.app
```

Esta es tu aplicación web desplegada en Vercel, accesible desde cualquier dispositivo.

## 🖨️ Cómo Imprimir las Tarjetas

### Opción 1: Impresión Casera (Rápido)
1. Abre el archivo `tarjeta-presentacion.html` en tu navegador (Chrome, Edge, Firefox)
2. Presiona `Ctrl + P` (Windows) o `Cmd + P` (Mac)
3. Configuración recomendada:
   - **Papel**: Cartulina o couché (180-300 g/m²)
   - **Tamaño**: Carta (8.5" x 11") o A4
   - **Calidad**: Alta (mínimo 300 DPI)
   - **Color**: Full color
   - **Márgenes**: Mínimos o "sin márgenes"
4. Click en "Imprimir"

### Opción 2: Imprenta Profesional (Recomendado)
1. Abre `tarjeta-presentacion.html` en tu navegador
2. Toma capturas de pantalla de alta calidad:
   - Windows: `Win + Shift + S` y selecciona la tarjeta
   - Mac: `Cmd + Shift + 4` y selecciona la tarjeta
3. Guarda las imágenes en formato PNG
4. Lleva las imágenes a una imprenta local y pide:
   - **Material**: Cartulina couché brillante o mate
   - **Cantidad**: Las que necesites (100, 250, 500, etc.)
   - **Acabado**: Opcionalmente laminado para mayor durabilidad

## 📲 Cómo Compartir Digitalmente

### Por WhatsApp:
1. Abre la tarjeta en tu navegador
2. Haz captura de pantalla (`Ctrl + Shift + S` en Windows)
3. Recorta la imagen para que solo se vea una tarjeta
4. Envía la imagen a tus clientes
5. Ellos pueden escanear el QR directamente desde su celular

### Por Email:
1. Sigue los mismos pasos que para WhatsApp
2. Adjunta la imagen en el correo
3. Incluye un mensaje como:
   ```
   ¡Hola! Te comparto nuestra nueva app de delivery.
   Escanea el código QR o visita:
   https://cliente-rdeev05n4-jorge1204gs-projects.vercel.app
   
   ¡Pide comida, gasolina, medicamentos y más!
   ```

### En Redes Sociales:
1. Facebook, Instagram, Twitter
2. Sube la imagen de la tarjeta
3. Usa hashtags como: #Delivery #Fresnillo #ComidaADomicilio
4. Incluye el link en la descripción

## ✨ Características del Diseño

### Diseño 1 (Verde):
- 🎨 Colores: Verde esmeralda (confianza y frescura)
- 🚚 Icono: Camión de reparto
- 📍 Enfoque: Servicio de delivery tradicional

### Diseño 2 (Morado):
- 🎨 Colores: Morado/violeta (tecnología e innovación)
- 📱 Icono: Smartphone
- 📍 Enfoque: App moderna y digital

Ambos diseños incluyen:
- ✅ Código QR funcional
- ✅ URL completa visible
- ✅ 4 características principales del servicio
- ✅ Llamado a la acción claro
- ✅ Información de contacto

## 🛠️ Personalización

### Cambiar Colores:
Edita el archivo `tarjeta-presentacion.html` y busca estas líneas:

```css
/* Para el diseño verde */
.card-header {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

/* Para el diseño morado */
.card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

Cambia los códigos de color hexadecimales por los que prefieras.

### Cambiar Logo/Icono:
Busca esta línea y cambia el emoji:

```html
<div class="logo">🚚</div>
```

Opciones: 🚚 📱 🍔 ⛽ 🎁 📦 🛵 🚴

### Agregar Tu Información de Contacto:
En el `card-footer`, agrega:

```html
<div class="contact-info">
    <span class="contact-label">📞</span>
    Tu número de teléfono
</div>
<div class="contact-info">
    <span class="contact-label">✉️</span>
    tu@email.com
</div>
```

### Cambiar el QR para otra URL:
Busca esta línea y cambia el parámetro `data`:

```html
<img 
    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://TU-NUEVA-URL.com" 
    alt="QR Code" 
    class="qr-code"
/>
```

## 📊 Tamaño Estándar de Tarjetas

### Tamaño Profesional Recomendado:
- **Ancho**: 3.5 pulgadas (8.9 cm)
- **Alto**: 2 pulgadas (5.1 cm)
- **Relación de aspecto**: 1.75:1

### Para Imprimir en Casa:
Configura tu impresora para imprimir varias tarjetas por hoja:
- 2 tarjetas horizontalmente
- 3-4 tarjetas verticalmente
- Así aprovechas mejor el papel

## 💡 Ideas de Uso

### Presencial:
1. ✅ Dásela a clientes satisfechos
2. ✅ Déjala en restaurantes aliados
3. ✅ En comercios locales (con su permiso)
4. ✅ En eventos y ferias comerciales
5. ✅ Al entregar un pedido

### Digital:
1. ✅ Firma de email
2. ✅ Estados de WhatsApp
3. ✅ Historias de Instagram
4. ✅ Posts de Facebook
5. ✅ Grupos locales de tu ciudad

## 🔍 Verificación del QR

Antes de imprimir muchas copias:

1. **Prueba el QR**:
   - Abre la tarjeta en tu computadora
   - Con tu celular, escanea el QR
   - Verifica que abra correctamente la app

2. **Prueba con diferentes apps**:
   - Cámara nativa del celular (iPhone/Android)
   - Google Lens
   - Lectores de QR específicos

3. **Verifica en diferentes condiciones**:
   - Con buena luz
   - Con poca luz
   - Desde diferentes ángulos
   - A diferentes distancias

## 📈 Consejos de Marketing

### Mensaje Efectivo:
Cuando entregues la tarjeta, di algo como:
> "¡Escanea este QR y pide lo que quieras desde tu celular! Comida, gasolina, medicinas... ¡nosotros te lo llevamos!"

### Incentivo de Primera Compra:
Considera agregar:
> "🎉 20% de descuento en tu primer pedido"
> "Envío gratis en pedidos mayores a $200"

### Llamado a la Acción:
Frases que funcionan:
- "¡Pide ahora en 30 segundos!"
- "Tu tiempo vale, nosotros te servimos"
- "¿Hambre? ¡Nosotros vamos por ti!"

## 🎁 Bonus: Generar Múltiples QRs

Si quieres crear QRs personalizados para diferentes propósitos:

### Herramientas Gratuitas:
1. **QR Server** (usado en la tarjeta): https://api.qrserver.com
2. **QR Code Generator**: https://www.qr-code-generator.com
3. **Google Chart API**: https://developers.google.com/chart/

### Ejemplo de URL personalizada:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://cliente-rdeev05n4-jorge1204gs-projects.vercel.app?ref=tarjeta
```

El parámetro `?ref=tarjeta` te ayuda a rastrear cuántos vienen de las tarjetas.

## 🆘 Solución de Problemas

### El QR no escanea:
- ✅ Verifica que la URL sea correcta
- ✅ Aumenta el tamaño del QR al imprimir
- ✅ Usa mayor contraste de colores
- ✅ Prueba con otro lector de QR

### Los colores se ven apagados:
- ✅ Usa papel de mayor calidad
- ✅ Activa "alta calidad" en la impresora
- ✅ Calibra los colores de tu monitor
- ✅ Considera impresión profesional

### El texto no se lee bien:
- ✅ Aumenta el tamaño de fuente en el CSS
- ✅ Usa fuentes más legibles (Arial, Helvetica)
- ✅ Mejora el contraste fondo/texto

## 📞 Soporte

Si necesitas ayuda para:
- Personalizar el diseño
- Cambiar la URL del QR
- Adaptar a otro idioma
- Crear versiones alternativas

Solo edita el archivo HTML o contacta a tu equipo de desarrollo.

---

## ✅ Checklist Antes de Imprimir

- [ ] Probé el código QR con mi celular
- [ ] Revisé que la URL sea correcta
- [ ] Verifiqué ortografía y datos de contacto
- [ ] Elegí el diseño que más me gusta
- [ ] Seleccioné el tipo de papel adecuado
- [ ] Confirmé los colores de impresión
- [ ] Tengo aprobado el diseño final

---

**¡Listo! Ya tienes tu tarjeta de presentación profesional lista para compartir con tus clientes.** 🎉

Recuerda: ¡La clave es hacerla llegar a la mayor cantidad de personas posible!
