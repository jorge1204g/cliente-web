# 📍 Dirección Guardada - Funcionalidad Mejorada

## ✨ Nueva Característica

Ahora los clientes pueden guardar su dirección habitual en el perfil y usarla para rellenar automáticamente los pedidos.

---

## 🎯 ¿Cómo Funciona?

### 1️⃣ **Guardar Dirección en el Perfil**

- Ve a **"👤 Mi Perfil"**
- En el campo **"Dirección de entrega habitual"**, escribe tu dirección completa:
  - Calle y número
  - Colonia
  - Ciudad
  - Código postal
- Haz clic en **"💾 Guardar Cambios"**

**Ejemplo:**
```
Calle Principal #123, Colonia Centro, Fresnillo, Zacatecas, C.P. 99300
```

---

### 2️⃣ **Usar Dirección Guardada al Crear Pedido**

- Al crear un nuevo pedido (**"📦 Crear Nuevo Pedido"**)
- En la sección **"📍 Dirección de Entrega"** verás:
  - Un botón verde **"📍 Usar Mi Dirección"**
  - Un mensaje: *"💡 Tienes una dirección guardada. Haz clic en '📍 Usar Mi Dirección' para rellenarla automáticamente"*

- **Haz clic en el botón** y automáticamente:
  - ✅ Se rellenará el campo de dirección con tu dirección guardada
  - ✅ Verás una confirmación con la dirección cargada

---

## 🔧 Aspectos Técnicos

### Archivos Modificados

1. **`AuthService.ts`**
   - Agregados métodos: `getClientAddress()`, `getClientLatitude()`, `getClientLongitude()`
   - Actualizado `login()` para cargar dirección y coordenadas
   - Actualizado `logout()` para limpiar dirección y coordenadas
   - Actualizado `updateProfile()` para guardar dirección y coordenadas

2. **`ProfilePage.tsx`**
   - Agregado campo `address` en el estado
   - Agregado textarea para dirección habitual
   - Actualizado `handleUpdateProfile()` para guardar dirección

3. **`CreateOrderPage.tsx`**
   - Inicializa `clientAddress` con la dirección guardada (si existe)
   - Agregado botón "📍 Usar Mi Dirección"
   - Mensaje de ayuda cuando hay dirección guardada

---

## 💡 Beneficios

✅ **Rapidez**: No necesitas escribir tu dirección cada vez  
✅ **Comodidad**: Un solo clic para rellenar  
✅ **Precisión**: Evitas errores de escritura  
✅ **Flexibilidad**: Puedes modificar la dirección si es necesario  

---

## 📝 Notas Importantes

- La dirección se guarda en **Firebase** y en **localStorage**
- Se sincroniza entre sesiones del navegador
- Puedes actualizarla cuando quieras desde tu perfil
- El botón solo aparece si tienes una dirección guardada
- Si no tienes dirección guardada, el campo se comporta normalmente

---

## 🚀 Próximas Mejoras (Opcional)

- [x] Geolocalización automática con GPS (implementado)
- [x] Conversión de coordenadas a dirección (OpenStreetMap)
- [ ] Guardar múltiples direcciones (casa, trabajo, etc.)
- [ ] Sugerir direcciones basadas en pedidos anteriores
- [ ] Validación de direcciones con API de Google Maps

---

## 🛠️ Soporte

Si tienes problemas con esta funcionalidad:
1. Limpia el caché del navegador
2. Cierra sesión y vuelve a iniciar
3. Verifica que guardaste cambios en tu perfil
4. Revisa la consola (F12) para mensajes de error

---

**Fecha de implementación:** 7 de marzo de 2026  
**Versión:** 1.0.0
