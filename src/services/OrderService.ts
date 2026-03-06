import { ref, set, onValue, get } from 'firebase/database';
import { database } from './Firebase';

export interface ClientOrder {
  id?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientLocation?: {
    latitude: number;
    longitude: number;
  };
  serviceType: string;
  pickupAddress?: string;
  pickupName?: string;
  pickupUrl?: string;
  deliveryAddress: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  items?: string;
  image?: string;
  distanceKm?: number;
  deliveryCost?: number;
  orderCode: string;
  status: string;
  assignedToDeliveryId?: string;
  deliveryPersonName?: string;
  createdAt: number;
  notes?: string;
  confirmationCode?: string; // Código de confirmación de 4 dígitos
}

class OrderService {
  private static instance: OrderService;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // Calcular distancia entre dos puntos (Fórmula Haversine)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Calcular costo del envío
  calculateDeliveryCost(distanceKm: number): number {
    const baseRate = 15; // $15 pesos base
    const perKmRate = 8; // $8 pesos por km
    
    const cost = baseRate + (distanceKm * perKmRate);
    return Math.round(cost); // Redondear al entero más cercano
  }

  // Crear pedido
  async createOrder(orderData: Omit<ClientOrder, 'id' | 'orderCode'>): Promise<string | null> {
    try {
      const orderId = Date.now().toString();
      const orderCode = `PED-${orderId.slice(-6)}`;
      
      const orderRef = ref(database, `client_orders/${orderId}`);
      await set(orderRef, {
        ...orderData,
        id: orderId,
        orderCode,
        createdAt: Date.now(),
        status: 'pending'
      });

      // También guardar en orders para que lo vean admin y repartidores
      const adminOrderRef = ref(database, `orders/${orderId}`);
      await set(adminOrderRef, {
        ...orderData,
        id: orderId,
        orderId: orderId, // Agregar orderId explícito como en restaurante
        orderCode,
        orderType: 'MANUAL', // Usar MANUAL como los pedidos del restaurante para consistencia
        // Estructura compatible con la app del repartidor y restaurante
        customer: {
          name: orderData.clientName,
          phone: orderData.clientPhone,
          address: orderData.deliveryAddress,
          location: orderData.deliveryLocation || { latitude: 24.6536, longitude: -102.8738 }
        },
        items: orderData.items && orderData.items.trim() ? [{ 
          name: orderData.items, 
          quantity: 1,
          price: 0,
          subtotal: 0,
          productId: '' // Agregar productId vacío para compatibilidad
        }] : [],
        subtotal: 0,
        deliveryCost: 0,
        total: 0,
        customerLocation: orderData.deliveryLocation || { latitude: 24.6536, longitude: -102.8738 },
        pickupLocationUrl: orderData.pickupUrl || 'Dirección de Prueba',
        deliveryAddress: orderData.deliveryAddress,
        customerUrl: '',
        deliveryReferences: orderData.notes || '',
        customerCode: orderData.confirmationCode || orderCode, // Usar el código de confirmación del cliente o el orderCode
        status: 'MANUAL_ASSIGNED', // Cambiar a MANUAL_ASSIGNED como los pedidos del restaurante
        assignedToDeliveryId: '',
        assignedToDeliveryName: '',
        candidateDeliveryIds: [], // Array vacío = visible para todos los repartidores
        createdAt: Date.now(),
        deliveredAt: null,
        restaurantMapUrl: '',
        paymentMethod: 'CASH',
        dateTime: new Date().toISOString(),
        restaurantName: orderData.pickupName || 'Por asignar',
        // NO agregar restaurantId - Este es un pedido del CLIENTE, no del restaurante
        // Los repartidores lo verán porque tiene status MANUAL_ASSIGNED y candidateDeliveryIds vacío
        // Campos adicionales para compatibilidad total con restaurante
        whoPaysDelivery: 'customer', // Cambiar a 'customer' como el ejemplo
        specialRequests: orderData.notes || '',
        deliveryTimeEstimate: '35-45 minutos' // Tiempo estimado por defecto como el ejemplo
      });

      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  // Escuchar pedidos de un cliente en tiempo real
  listenToClientOrders(clientId: string, callback: (orders: ClientOrder[]) => void) {
    // Escuchar tanto de client_orders como de orders para sincronización en tiempo real
    const ordersRef = ref(database, 'orders');
    
    onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allOrders = snapshot.val();
        const clientOrders: ClientOrder[] = [];
        
        // Filtrar pedidos del cliente y convertirlos al formato ClientOrder
        for (const orderId in allOrders) {
          const order = allOrders[orderId];
          
          // Verificar si este pedido pertenece al cliente (por clientId o por tener los datos del cliente)
          if (order.clientId === clientId || 
              (order.customer && order.customer.name === this.getClientNameById(clientId))) {
            
            // Convertir del formato orders al formato ClientOrder
            const clientOrder: ClientOrder = {
              id: order.id || orderId,
              clientId: clientId,
              clientName: order.clientName || order.customer?.name || '',
              clientPhone: order.clientPhone || order.customer?.phone || '',
              clientAddress: order.clientAddress || order.customer?.address || '',
              clientLocation: order.clientLocation || order.customer?.location,
              serviceType: order.serviceType || 'FOOD',
              pickupAddress: order.pickupAddress || order.pickupLocationUrl || '',
              pickupName: order.pickupName || order.restaurantName || '',
              pickupUrl: order.pickupUrl || '',
              deliveryAddress: order.deliveryAddress || '',
              deliveryLocation: order.deliveryLocation || order.customerLocation,
              items: order.items ? order.items.map((item: any) => item.name).join(', ') : '',
              distanceKm: order.distanceKm,
              deliveryCost: order.deliveryCost,
              orderCode: order.orderCode || `PED-${orderId.slice(-6)}`,
              status: order.status || 'pending',
              assignedToDeliveryId: order.assignedToDeliveryId || '',
              deliveryPersonName: order.assignedToDeliveryName || '',
              createdAt: order.createdAt || Date.now(),
              notes: order.notes || order.deliveryReferences || '',
              confirmationCode: order.confirmationCode || order.customerCode || ''
            };
            
            clientOrders.push(clientOrder);
          }
        }
        
        // Ordenar por fecha descendente
        clientOrders.sort((a, b) => b.createdAt - a.createdAt);
        callback(clientOrders);
      } else {
        callback([]);
      }
    });
  }
  
  // Método auxiliar para obtener nombre del cliente por ID (para compatibilidad)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getClientNameById(_clientId: string): string {
    // Este método se puede implementar para buscar el nombre del cliente por ID
    // Por ahora retorna vacío ya que la comparación principal es por clientId
    return '';
  }

  // Actualizar estado del pedido
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const orderRef = ref(database, `client_orders/${orderId}`);
      await set(orderRef, {
        ...await this.getOrderById(orderId),
        status,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Obtener pedido por ID
  async getOrderById(orderId: string): Promise<ClientOrder | null> {
    try {
      const orderRef = ref(database, `client_orders/${orderId}`);
      const snapshot = await get(orderRef);
      
      if (snapshot.exists()) {
        return snapshot.val() as ClientOrder;
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  // Cancelar pedido
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const orderRef = ref(database, `client_orders/${orderId}`);
      await set(orderRef, {
        ...await this.getOrderById(orderId),
        status: 'cancelled',
        cancelledAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  // Eliminar pedido permanentemente
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      console.log('Eliminando pedido:', orderId);
      
      // Eliminar de client_orders
      const clientOrderRef = ref(database, `client_orders/${orderId}`);
      await set(clientOrderRef, null);
      
      // Eliminar de orders (donde lo ven los repartidores)
      const orderRef = ref(database, `orders/${orderId}`);
      await set(orderRef, null);
      
      console.log('✅ Pedido eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }
}

export default OrderService.getInstance();
