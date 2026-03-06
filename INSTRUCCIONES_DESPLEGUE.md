# 🚀 Despliegue de la App del Cliente - Instrucciones Finales

## ⚠️ Situación Actual

El proyecto anterior fue eliminado permanentemente de Vercel. Necesitas hacer un **nuevo despliegue** para obtener una URL.

---

## 📋 Pasos Manuales para Desplegar (ÚNICA FORMA)

Debido a que Vercel requiere interacción humana para configurar proyectos nuevos, necesitas seguir estos pasos:

### **Paso 1: Abre tu Terminal PowerShell**
- Presiona `Windows + R`
- Escribe: `powershell`
- Presiona Enter

### **Paso 2: Navega a la carpeta del cliente**
```powershell
cd "c:\1234\Nueva carpeta (22)\apl\Prueba New\cliente-web"
```

### **Paso 3: Ejecuta el comando de despliegue**
```powershell
vercel
```

### **Paso 4: Responde las preguntas** (IMPORTANTE)

Cuando ejecutes `vercel`, te hará estas preguntas. Responde exactamente así:

1. **¿Set up and deploy "C:\...\cliente-web"? (Y/n)**
   - Escribe: `Y` y presiona Enter

2. **¿Which scope do you want to deploy to?**
   - Verás una lista con tu cuenta `jorge1204g`
   - Usa las flechas ↑↓ para seleccionarla
   - Presiona Enter

3. **¿Link to existing project?**
   - Escribe: `N` y presiona Enter (es un proyecto NUEVO)

4. **¿What's your project's name?**
   - Escribe: `cliente-web` y presiona Enter

5. **¿In which directory is your code located?**
   - Escribe: `./` y presiona Enter

6. **(Opcional) Want to override the settings?**
   - Escribe: `N` y presiona Enter

### **Paso 5: Espera a que termine**
- Vercel comenzará a construir tu app
- Esto toma 2-5 minutos
- Al final verás algo como:
  ```
  ✔ Production: https://cliente-web.vercel.app
  ```

### **Paso 6: ¡Listo!**
- Copia la URL que te dé Vercel
- Ábrela en tu navegador
- ¡Tu app está en línea!

---

## 🎯 URLs Esperadas

Dependiendo del nombre que elijas, obtendrás una URL como:

- `https://cliente-web.vercel.app` ⭐ (Recomendada)
- `https://cliente-web-app.vercel.app`
- `https://delivery-cliente.vercel.app`

---

## 🔧 Si Hay Errores

### Error: "You cannot set your Personal Account as the scope"
- **Solución**: No uses la bandera `--scope`. Solo ejecuta `vercel` sin parámetros adicionales.

### Error: "Command not found" o "vercel no se reconoce"
- **Solución**: Instala Vercel CLI primero:
  ```powershell
  npm install -g vercel
  ```

### Error: "Not logged in"
- **Solución**: Inicia sesión:
  ```powershell
  vercel login
  ```
  - Te dará una URL para autenticarte en el navegador
  - Sigue las instrucciones

---

## ✅ Verificación Final

Después del despliegue, verifica que funcione:

1. Abre tu navegador
2. Ve a la URL que te dio Vercel
3. Deberías ver la app del cliente funcionando
4. Prueba crear un pedido de prueba

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas con el despliegue:

1. Revisa los errores en la terminal
2. Asegúrate de estar logueado en Vercel (`vercel whoami`)
3. Verifica que tengas permisos en la cuenta
4. Intenta nuevamente siguiendo los pasos exactos

---

**Nota Importante:** Este proceso manual es necesario porque:
- Vercel requiere configuración interactiva para proyectos nuevos
- No se puede automatizar completamente sin intervención humana
- Es un proceso de seguridad de Vercel

¡Una vez completado, tendrás tu URL permanente y funcional! 🎉
