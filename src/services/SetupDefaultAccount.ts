import { ref, set } from 'firebase/database';
import { database } from './Firebase';

/**
 * CREA CUENTA VIRTUAL POR DEFECTO EN FIREBASE
 * Ejecutar una sola vez para crear la cuenta demo
 */

const DEFAULT_ACCOUNT = {
  id: "cliente_default_001",
  email: "cliente@demo.com",
  password: "123456",
  name: "Cliente Demo",
  phone: "+57 300 123 4567",
  createdAt: Date.now(),
  status: 'active',
  address: "Dirección de prueba, Ciudad"
};

export async function createDefaultAccount(): Promise<boolean> {
  try {
    console.log('🔄 Creando cuenta virtual por defecto...');
    
    const userRef = ref(database, `clients/${DEFAULT_ACCOUNT.id}`);
    
    await set(userRef, DEFAULT_ACCOUNT);
    
    console.log('✅ Cuenta creada exitosamente!');
    console.log('📧 Email:', DEFAULT_ACCOUNT.email);
    console.log('🔑 Contraseña:', DEFAULT_ACCOUNT.password);
    console.log('👤 Nombre:', DEFAULT_ACCOUNT.name);
    
    return true;
  } catch (error) {
    console.error('❌ Error al crear cuenta:', error);
    return false;
  }
}

// Función auto-ejecutable para crear la cuenta inmediatamente
(async () => {
  if (typeof window !== 'undefined') {
    const success = await createDefaultAccount();
    if (success) {
      alert('✅ Cuenta virtual creada!\n\nEmail: cliente@demo.com\nContraseña: 123456\n\nAhora puedes iniciar sesión automáticamente.');
    } else {
      alert('❌ Error al crear la cuenta. Revisa la consola para más detalles.');
    }
  }
})();
