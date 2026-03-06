import { ref, get, remove } from 'firebase/database';
import { database } from './Firebase';

/**
 * 🧹 SCRIPT PARA LIMPIAR TODA LA BASE DE DATOS DE PEDIDOS
 * 
 * ADVERTENCIA: Esto eliminará TODOS los pedidos permanentemente.
 * Solo úsalo en desarrollo/testing.
 * 
 * Ejecutar en la consola del navegador (F12):
 * - Abre: http://localhost:3004 (o tu app)
 * - Presiona F12
 * - Ve a Console
 * - Pega este código y presiona Enter
 */

export async function clearAllOrders(): Promise<{
  clientOrdersCleared: number;
  allOrdersCleared: number;
  success: boolean;
  message: string;
}> {
  console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS...');
  console.log('⚠️  ESTO ELIMINARÁ TODOS LOS PEDIDOS PERMANENTEMENTE\n');

  const result = {
    clientOrdersCleared: 0,
    allOrdersCleared: 0,
    success: true,
    message: ''
  };

  try {
    // 1. Limpiar client_orders
    console.log('📦 Limpiando /client_orders/...');
    const clientOrdersRef = ref(database, 'client_orders');
    const clientSnapshot = await get(clientOrdersRef);
    
    if (clientSnapshot.exists()) {
      const clientOrders = clientSnapshot.val();
      const clientOrderIds = Object.keys(clientOrders);
      console.log(`   Encontrados ${clientOrderIds.length} pedidos de clientes`);
      
      for (const orderId of clientOrderIds) {
        await remove(ref(database, `client_orders/${orderId}`));
        result.clientOrdersCleared++;
        console.log(`   ✅ Eliminado: ${orderId}`);
      }
    } else {
      console.log('   ℹ️  No hay pedidos de clientes');
    }

    // 2. Limpiar orders (todos los tipos de pedidos)
    console.log('\n📦 Limpiando /orders/...');
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);
    
    if (ordersSnapshot.exists()) {
      const orders = ordersSnapshot.val();
      const orderIds = Object.keys(orders);
      console.log(`   Encontrados ${orderIds.length} pedidos totales`);
      
      // Contar por tipo
      let clientCount = 0;
      let manualCount = 0;
      let restaurantCount = 0;
      let otherCount = 0;
      
      for (const orderId of orderIds) {
        const order = orders[orderId];
        const type = order.orderType || 'UNKNOWN';
        
        if (type === 'CLIENT') clientCount++;
        else if (type === 'MANUAL') manualCount++;
        else if (type === 'RESTAURANT') restaurantCount++;
        else otherCount++;
        
        await remove(ref(database, `orders/${orderId}`));
        result.allOrdersCleared++;
        console.log(`   ✅ Eliminado: ${orderId} (${type})`);
      }
      
      console.log('\n📊 RESUMEN POR TIPO:');
      console.log(`   - CLIENT: ${clientCount}`);
      console.log(`   - MANUAL: ${manualCount}`);
      console.log(`   - RESTAURANT: ${restaurantCount}`);
      console.log(`   - OTROS: ${otherCount}`);
    } else {
      console.log('   ℹ️  No hay pedidos en /orders/');
    }

    // Resultado final
    result.message = `✅ Limpieza completada exitosamente!\n\n` +
                     `📦 Pedidos eliminados:\n` +
                     `   - client_orders: ${result.clientOrdersCleared}\n` +
                     `   - orders: ${result.allOrdersCleared}\n` +
                     `   TOTAL: ${result.clientOrdersCleared + result.allOrdersCleared}`;

    console.log('\n' + result.message);
    console.log('\n🎉 ¡BASE DE DATOS LIMPIA!');
    console.log('💡 Recarga la página para ver los cambios\n');

    return result;

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA LIMPIEZA:');
    console.error(error);
    
    result.success = false;
    result.message = `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    
    return result;
  }
}

// Función para ejecutar desde la consola
if (typeof window !== 'undefined') {
  console.log('=== 🧹 SCRIPT DE LIMPIEZA CARGADO ===');
  console.log('Ejecuta: clearAllOrders() para limpiar toda la base de datos de pedidos\n');
  
  // Hacer la función disponible globalmente
  (window as any).clearAllOrders = clearAllOrders;
}
