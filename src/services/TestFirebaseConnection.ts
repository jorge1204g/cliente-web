import { ref, set, get } from 'firebase/database';
import { database } from './Firebase';

/**
 * TEST DE CONEXIÓN A FIREBASE
 * Ejecutar en la consola del navegador (F12)
 */

export async function testFirebaseConnection() {
  console.log('🔍 Probando conexión a Firebase...');
  
  try {
    // Test 1: Verificar si database está inicializado
    console.log('1. Database:', database ? '✅ OK' : '❌ ERROR');
    
    if (!database) {
      console.error('❌ Firebase Database no está inicializado');
      console.error('Revisa tu archivo .env.local');
      return false;
    }
    
    // Test 2: Intentar leer datos
    console.log('\n2. Intentando leer de Firebase...');
    const testRef = ref(database, 'test_connection');
    const snapshot = await get(testRef);
    console.log('   Lectura:', snapshot.exists() ? '✅ OK' : '⚠️ Sin datos (normal)');
    
    // Test 3: Intentar escribir datos
    console.log('\n3. Intentando escribir en Firebase...');
    const writeRef = ref(database, 'test_connection');
    await set(writeRef, {
      message: 'Test de conexión exitoso',
      timestamp: Date.now()
    });
    console.log('   Escritura: ✅ OK');
    
    // Test 4: Verificar si puede crear la cuenta virtual
    console.log('\n4. Verificando cuenta virtual...');
    const clientsRef = ref(database, 'clients');
    const clientsSnapshot = await get(clientsRef);
    
    if (clientsSnapshot.exists()) {
      const clients = clientsSnapshot.val();
      console.log('   Clients existentes:', Object.keys(clients).length);
      
      // Buscar cuenta demo
      const hasDemoAccount = Object.values(clients as any).some((c: any) => 
        c.email === 'cliente@demo.com'
      );
      console.log('   Cuenta demo:', hasDemoAccount ? '✅ Existe' : '⚠️ No existe');
    } else {
      console.log('   Clients: ⚠️ No hay clientes (primera vez)');
    }
    
    console.log('\n✅ ¡CONEXIÓN A FIREBASE FUNCIONA CORRECTAMENTE!');
    console.log('\n📝 Ahora intenta crear un pedido nuevamente.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN A FIREBASE:');
    console.error(error);
    
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verifica que Realtime Database esté activada en Firebase Console');
    console.log('2. Revisa las reglas de seguridad (deben permitir escritura)');
    console.log('3. Verifica que .env.local tenga las credenciales correctas');
    console.log('4. Recarga la página (Ctrl+F5)');
    
    return false;
  }
}

// Auto-ejecutar si estamos en navegador
if (typeof window !== 'undefined') {
  console.log('=== TEST DE FIREBASE ===');
  console.log('Ejecutando en 2 segundos...');
  setTimeout(() => {
    testFirebaseConnection();
  }, 2000);
}
