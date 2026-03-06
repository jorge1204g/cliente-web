# 🎯 CUENTA VIRTUAL POR DEFECTO

## Credenciales de Acceso

Se ha creado una cuenta virtual para demostración y pruebas:

- **Email:** `cliente@demo.com`
- **Contraseña:** `123456`
- **Nombre:** Cliente Demo
- **Teléfono:** +57 300 123 4567

## Funcionamiento

### Web (Cliente)

1. **Auto-login automático:** Al abrir la aplicación web, se intentará iniciar sesión automáticamente con las credenciales por defecto.

2. **Botón de entrada rápida:** En la pantalla de login hay un botón "⚡ Entrada Rápida (Demo)" que inicia sesión inmediatamente.

3. **Login manual:** También puedes ingresar manualmente las credenciales en los campos de texto.

### Configuración

La cuenta se crea automáticamente en Firebase la primera vez que se ejecuta la aplicación gracias al archivo `SetupDefaultAccount.ts`.

## Cambiar las Credenciales

Para cambiar las credenciales predeterminadas:

1. Abre `cliente-web/src/pages/Login.tsx`
2. Modifica las constantes:
   ```typescript
   const DEFAULT_EMAIL = 'tu_nuevo_email@ejemplo.com';
   const DEFAULT_PASSWORD = 'tu_nueva_contraseña';
   ```

3. Para actualizar la cuenta en Firebase:
   - Abre Firebase Console
   - Ve a Realtime Database
   - Navega a `/clients/cliente_default_001`
   - Actualiza los campos `email` y `password`

## Eliminar Auto-Login

Si deseas eliminar el auto-login:

1. Abre `cliente-web/src/pages/Login.tsx`
2. Elimina o comenta el `useEffect` que realiza el auto-login (líneas ~18-48)

## Seguridad

⚠️ **IMPORTANTE:** Esta cuenta es solo para desarrollo y pruebas. En producción:
- No uses cuentas por defecto
- Implementa autenticación segura con Firebase Auth
- Encripta las contraseñas
- Requiere registro obligatorio de usuarios

## Estructura en Firebase

```json
{
  "clients": {
    "cliente_default_001": {
      "id": "cliente_default_001",
      "email": "cliente@demo.com",
      "password": "123456",
      "name": "Cliente Demo",
      "phone": "+57 300 123 4567",
      "createdAt": 1234567890,
      "status": "active",
      "address": "Dirección de prueba, Ciudad"
    }
  }
}
```
