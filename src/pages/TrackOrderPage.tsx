import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/Firebase';

interface Location {
  latitude: number;
  longitude: number;
}

interface Order {
  id: string;
  orderCode: string;
  status: string;
  customer?: {
    name: string;
    phone: string;
    address: string;
    location?: Location;
  };
  clientName?: string;
  clientPhone?: string;
  deliveryAddress?: string;
  deliveryPersonName?: string;
  assignedToDeliveryName?: string;
  assignedToDeliveryId?: string;
  createdAt: number;
  serviceType?: string;
  confirmationCode?: string;
  customerCode?: string;
  pickupName?: string;
  restaurantName?: string;
  restaurantLocation?: Location;
  deliveryLocation?: Location;
  customerLocation?: Location;
  driverLocation?: Location;
  items?: string | Array<{ name: string; quantity: number; price: number }>;
  statusHistory?: Array<{
    status: string;
    timestamp: number;
    note?: string;
  }>;
}

const TrackOrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);

  const orderId = searchParams.get('pedido');
  const phone = searchParams.get('telefono');
  const orderCode = searchParams.get('codigo');
  
  // Obtener API key de Google Maps
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    console.log('🔍 Iniciando búsqueda...');
    console.log('📋 Parámetros:', { orderId, phone, orderCode });
    
    if (!orderId && !phone && !orderCode) {
      console.error('❌ No se proporcionó información del pedido');
      setError('No se proporcionó información del pedido');
      setLoading(false);
      return;
    }

    // Solicitar permisos de ubicación al cargar el seguimiento
    const requestLocationPermission = async () => {
      console.log('📍 [PERMISOS] Iniciando solicitud de permiso...');
      
      if ('geolocation' in navigator) {
        try {
          console.log('📍 [PERMISOS] Geolocalización disponible en este navegador');
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          
          console.log('📊 [PERMISOS] Estado actual del permiso:', permission.state);
          
          if (permission.state === 'granted') {
            console.log('✅ [PERMISOS] Ya tienes permiso concedido anteriormente');
            console.log('💡 [INFO] Por eso no ves el prompt - el navegador recordó tu decisión');
            // Obtener ubicación actual para centrar el mapa
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('✅ [UBICACIÓN] Ubicación obtenida:', position.coords);
              },
              (error) => {
                console.warn('⚠️ [ERROR] No se pudo obtener ubicación:', error.message);
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          } else if (permission.state === 'prompt') {
            console.log('⏳ [PERMISOS] Mostrando prompt al usuario...');
            console.log('💡 [INFO] Deberías ver un mensaje del navegador preguntando si permites la ubicación');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('✅ [UBICACIÓN] Permiso concedido. Ubicación:', position.coords);
                console.log('🎉 [INFO] Ahora el mapa puede centrarse en tu ubicación');
              },
              (error) => {
                console.warn('⚠️ [PERMISOS] Usuario denegó el permiso:', error.code, error.message);
                if (error.code === 1) {
                  console.log('ℹ️ [INFO] Puedes cambiar esta decisión en la configuración del navegador');
                }
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
          } else if (permission.state === 'denied') {
            console.warn('❌ [PERMISOS] Permiso denegado previamente por el usuario');
            console.log('💡 [INFO] El navegador recordó que bloqueaste el permiso');
            console.log('ℹ️ [INFO] Para cambiar: Configuración → Privacidad → Ubicación');
          }
          
          // Mostrar información útil para debugging
          console.group('🔍 [DEBUG] Cómo verificar permisos');
          console.log('1. Abre la consola (F12)');
          console.log('2. Busca los mensajes con [PERMISOS]');
          console.log('3. El estado debería ser: "granted", "prompt", o "denied"');
          console.log('4. Si es "granted" o "denied", el navegador recordó tu decisión anterior');
          console.groupEnd();
          
        } catch (err: any) {
          console.error('❌ [ERROR] Error al solicitar permiso:', err.message);
        }
      } else {
        console.warn('⚠️ [COMPATIBILIDAD] Geolocalización no soportada en este navegador');
      }
      
      console.log('─────────────────────────────────────');
    };

    requestLocationPermission();

    try {
      console.log('🔥 Conectando a Firebase...');
      const ordersRef = ref(database, 'orders');
      
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        console.log('📦 Snapshot recibido:', snapshot.exists());
        
        if (snapshot.exists()) {
          const orders = snapshot.val();
          console.log('📋 Pedidos en BD:', Object.keys(orders).length);
          console.log('📋 Primeros 3 orderCodes:', Object.values(orders).slice(0, 3).map((o: any) => o.orderCode));
          
          let foundOrder: Order | null = null;

          if (orderId && orders[orderId]) {
            console.log('✅ Encontrado por ID:', orderId);
            foundOrder = { id: orderId, ...orders[orderId] };
          } else if (orderCode) {
            console.log('🔍 Buscando por código:', orderCode);
            for (const id in orders) {
              const o = orders[id];
              const code = o.orderCode || '';
              const searchCode = orderCode || '';
              
              console.log('Comparando orderCode:', code, 'vs', searchCode);
              
              // Buscar por orderCode exacto
              if (code === searchCode) {
                console.log('✅ Coincidencia exacta orderCode!');
                foundOrder = { id, ...o };
                break;
              }
              // Buscar por ID de Firebase (para pedidos antiguos sin orderCode)
              if (id === searchCode) {
                console.log('✅ Coincidencia por ID de Firebase!');
                foundOrder = { id, ...o };
                break;
              }
              // Si el código buscado tiene PED- pero el guardado no
              if (code === `PED-${searchCode}`) {
                console.log('✅ Coincidencia con PED-!');
                foundOrder = { id, ...o };
                break;
              }
              if (searchCode.startsWith('PED-') && code === searchCode) {
                console.log('✅ Coincidencia exacta PED-!');
                foundOrder = { id, ...o };
                break;
              }
            }
          } else if (phone) {
            console.log('🔍 Buscando por teléfono:', phone);
            for (const id in orders) {
              const o = orders[id];
              if (o.customer?.phone === phone || o.clientPhone === phone) {
                if (!foundOrder || o.createdAt > foundOrder.createdAt) {
                  foundOrder = { id, ...o };
                }
              }
            }
          }

          if (foundOrder) {
            console.log('✅ Pedido encontrado:', foundOrder);
            setOrder(foundOrder);
          } else {
            console.error('❌ No se encontró el pedido');
            setError('No se encontró el pedido con ese código');
          }
          setLoading(false);
        } else {
          console.error('❌ No hay datos en la BD');
          setError('No hay pedidos en la base de datos');
          setLoading(false);
        }
      }, (error) => {
        console.error('❌ Error de Firebase:', error);
        setError('Error al conectar con la base de datos');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error general:', err);
      setError('Error al cargar el pedido');
      setLoading(false);
    }
  }, [orderId, phone, orderCode]);

  // Escuchar ubicacion del repartidor en tiempo real
  useEffect(() => {
    if (!order?.assignedToDeliveryId || !order?.id) return;
    
    // Solo escuchar ubicacion cuando el pedido esta en ciertos estados
    const activeStatuses = ['ACCEPTED', 'ON_THE_WAY_TO_STORE', 'ARRIVED_AT_STORE', 'PICKING_UP_ORDER', 'ON_THE_WAY_TO_CUSTOMER'];
    if (!activeStatuses.includes(order.status)) return;
    
    console.log('🗺️ Escuchando ubicacion del repartidor:', order.assignedToDeliveryId);
    
    const driverLocationRef = ref(database, `delivery_users/${order.assignedToDeliveryId}/location`);
    const unsubscribe = onValue(driverLocationRef, (snapshot) => {
      const location = snapshot.val();
      console.log('📍 Ubicacion repartidor:', location);
      if (location && location.latitude && location.longitude) {
        setDriverLocation({ latitude: location.latitude, longitude: location.longitude });
      }
    });
    
    return () => unsubscribe();
  }, [order?.assignedToDeliveryId, order?.status, order?.id]);

  // Cargar mapa UNA SOLA VEZ cuando hay pedido
  useEffect(() => {
    if (!order || !mapRef.current || !GOOGLE_MAPS_API_KEY) return;
    
    // Evitar recargar el mapa si ya está cargado
    if (mapInstanceRef.current) return;
    
    const loadMap = async () => {
      try {
        console.log('🗺️ Cargando mapa...');
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });
        
        const google = await loader.load();
        setGoogleLoaded(google);
        console.log('✅ Google Maps API cargada');
        
        if (!mapRef.current) return;
        
        // Centro inicial: México
        const centerLat = 23.6345;
        const centerLng = -102.5528;
        
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 15,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });
        
        mapInstanceRef.current = map;
        console.log('✅ Mapa creado');
        setMapLoaded(true);
        
        // Marcador del cliente (destino) - solo si existe
        const customerLocation = order.customerLocation || order.deliveryLocation || order.customer?.location;
        if (customerLocation?.latitude) {
          new google.maps.Marker({
            position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
            map: map,
            title: 'Tu ubicacion',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          });
          // Centrar en cliente
          map.setCenter({ lat: customerLocation.latitude, lng: customerLocation.longitude });
          console.log('✅ Marcador cliente agregado');
        }
        
        // Marcador del restaurante si existe
        if (order.restaurantLocation) {
          new google.maps.Marker({
            position: { lat: order.restaurantLocation.latitude, lng: order.restaurantLocation.longitude },
            map: map,
            title: order.restaurantName || 'Restaurante',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          });
          console.log('✅ Marcador restaurante agregado');
        }
      } catch (err) {
        console.error('❌ Error cargando mapa:', err);
      }
    };
    
    loadMap();
  }, [order, GOOGLE_MAPS_API_KEY]);

  // Actualizar marcador del repartidor en tiempo real
  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation || !googleLoaded) return;
    
    console.log('🚴 Actualizando marcador repartidor:', driverLocation);
    
    // Crear o actualizar marcador del repartidor
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new googleLoaded.maps.Marker({
        position: { lat: driverLocation.latitude, lng: driverLocation.longitude },
        map: mapInstanceRef.current,
        title: 'Tu repartidor',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new googleLoaded.maps.Size(48, 48)
        }
      });
      console.log('✅ Marcador repartidor creado');
    } else {
      driverMarkerRef.current.setPosition({ lat: driverLocation.latitude, lng: driverLocation.longitude });
      console.log('✅ Marcador repartidor actualizado');
    }
    
    // Centrar mapa en el repartidor
    mapInstanceRef.current.panTo({ lat: driverLocation.latitude, lng: driverLocation.longitude });
    
  }, [driverLocation, googleLoaded]);

  const getStatusInfo = (status: string) => {
    const deliveryName = order?.deliveryPersonName || order?.assignedToDeliveryName || 'tu repartidor';
    
    const statusMap: { [key: string]: { emoji: string; title: string; description: string; color: string } } = {
      'pending': {
        emoji: '⏳',
        title: 'Buscando repartidor',
        description: 'Tu pedido está esperando ser asignado.',
        color: '#f59e0b'
      },
      'MANUAL_ASSIGNED': {
        emoji: '⏳',
        title: 'Pendiente de asignación',
        description: 'Estamos buscando un repartidor para tu pedido.',
        color: '#f59e0b'
      },
      'accepted': {
        emoji: '✅',
        title: '¡Pedido aceptado!',
        description: `Tu repartidor es ${deliveryName}.`,
        color: '#10b981'
      },
      'ACCEPTED': {
        emoji: '✅',
        title: '¡Pedido aceptado!',
        description: `Tu repartidor es ${deliveryName}.`,
        color: '#10b981'
      },
      'ON_THE_WAY_TO_STORE': {
        emoji: '🚗',
        title: 'En camino a recoger',
        description: `${deliveryName} va a recoger tu pedido.`,
        color: '#3b82f6'
      },
      'ARRIVED_AT_STORE': {
        emoji: '📍',
        title: 'Llegó al lugar',
        description: `${deliveryName} está en el lugar de recogida.`,
        color: '#8b5cf6'
      },
      'PICKING_UP_ORDER': {
        emoji: '📦',
        title: 'Recogiendo pedido',
        description: `${deliveryName} está recogiendo tu pedido.`,
        color: '#ec4899'
      },
      'ON_THE_WAY_TO_CUSTOMER': {
        emoji: '🚴',
        title: '¡En camino a tu domicilio!',
        description: `${deliveryName} ya viene con tu pedido.`,
        color: '#10b981'
      },
      'DELIVERED': {
        emoji: '✅',
        title: '¡Entregado!',
        description: 'Tu pedido fue entregado. ¡Gracias!',
        color: '#059669'
      },
      'CANCELLED': {
        emoji: '❌',
        title: 'Cancelado',
        description: 'Este pedido fue cancelado.',
        color: '#ef4444'
      }
    };
    
    return statusMap[status] || { 
      emoji: '📦', 
      title: status, 
      description: 'Estado del pedido',
      color: '#6b7280'
    };
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0fdf4'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
        <p style={{ color: '#166534' }}>Cargando tu pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Pedido no encontrado</h2>
          <p style={{ color: '#6b7280' }}>{error || 'Verifica el código del pedido'}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>
            Código buscado: {orderCode || orderId || phone}
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const confirmationCode = order.confirmationCode || order.customerCode || '----';

  // Convertir items a texto
  const getItemsText = () => {
    if (!order?.items) return 'N/A';
    if (typeof order.items === 'string') return order.items;
    if (Array.isArray(order.items)) {
      return order.items.map(item => item.name).join(', ');
    }
    return 'N/A';
  };

  // Obtener historial de estados completo (todos los estados posibles)
  const getFullStatusHistory = (): Array<{ status: string; label: string; completed: boolean; timestamp?: number }> => {
    const history = order?.statusHistory || [];
    const currentStatus = order?.status || 'pending';
    
    // Definir todos los estados posibles en orden
    const allStatuses = [
      { key: 'pending', label: 'Pedido creado' },
      { key: 'PENDING', label: 'Pedido creado' },
      { key: 'MANUAL_ASSIGNED', label: 'Asignación manual' },
      { key: 'accepted', label: 'Pedido aceptado' },
      { key: 'ACCEPTED', label: 'Pedido aceptado' },
      { key: 'ON_THE_WAY_TO_STORE', label: 'En camino a recoger' },
      { key: 'ARRIVED_AT_STORE', label: 'Llegó al lugar' },
      { key: 'PICKING_UP_ORDER', label: 'Recogiendo pedido' },
      { key: 'ON_THE_WAY_TO_CUSTOMER', label: 'En camino a entregar' },
      { key: 'DELIVERED', label: 'Pedido entregado' }
    ];
    
    // Encontrar el índice del estado actual
    const currentIndex = allStatuses.findIndex(s => 
      s.key === currentStatus || 
      history.some(h => h.status === s.key)
    );
    
    // Crear mapa de timestamps del historial real
    const historyMap = new Map<string, number>();
    history.forEach(h => {
      historyMap.set(h.status, h.timestamp);
    });
    
    // Si no hay historial pero hay createdAt
    if (history.length === 0 && order?.createdAt) {
      historyMap.set('pending', order.createdAt);
      historyMap.set('PENDING', order.createdAt);
    }
    
    // Estados únicos para mostrar (evitar duplicados pending/PENDING)
    const uniqueStatuses = [
      { key: 'pending', label: 'Pedido creado' },
      { key: 'MANUAL_ASSIGNED', label: 'Asignado a repartidor' },
      { key: 'ACCEPTED', label: 'Pedido aceptado' },
      { key: 'ON_THE_WAY_TO_STORE', label: 'En camino a recoger' },
      { key: 'ARRIVED_AT_STORE', label: 'Llegó al lugar' },
      { key: 'PICKING_UP_ORDER', label: 'Recogiendo pedido' },
      { key: 'ON_THE_WAY_TO_CUSTOMER', label: 'En camino a entregar' },
      { key: 'DELIVERED', label: 'Pedido entregado' }
    ];
    
    // Determinar cuál es el estado actual en nuestro flujo
    let actualCurrentIndex = -1;
    for (let i = 0; i < uniqueStatuses.length; i++) {
      if (uniqueStatuses[i].key === currentStatus || 
          (currentStatus === 'pending' && uniqueStatuses[i].key === 'pending') ||
          (currentStatus === 'PENDING' && uniqueStatuses[i].key === 'pending') ||
          (currentStatus === 'accepted' && uniqueStatuses[i].key === 'ACCEPTED') ||
          (currentStatus === 'ACCEPTED' && uniqueStatuses[i].key === 'ACCEPTED')) {
        actualCurrentIndex = i;
        break;
      }
    }
    
    // Si no encontramos el estado actual, buscar en el historial
    if (actualCurrentIndex === -1 && history.length > 0) {
      const lastHistoryStatus = history[history.length - 1].status;
      for (let i = 0; i < uniqueStatuses.length; i++) {
        if (uniqueStatuses[i].key === lastHistoryStatus) {
          actualCurrentIndex = i;
          break;
        }
      }
    }
    
    // Si aún no lo encontramos, asumir que está pendiente
    if (actualCurrentIndex === -1) {
      actualCurrentIndex = 0;
    }
    
    return uniqueStatuses.map((status, index) => {
      const isCompleted = index < actualCurrentIndex;
      const isCurrent = index === actualCurrentIndex;
      
      // Buscar timestamp en el historial
      let timestamp = historyMap.get(status.key);
      
      // Si no hay timestamp pero está completado o es actual, usar createdAt o aproximado
      if (!timestamp && (isCompleted || isCurrent) && order?.createdAt) {
        if (index === 0) {
          timestamp = order.createdAt;
        } else if (isCompleted) {
          // Estimar tiempo basado en el índice (cada estado ~5 min)
          timestamp = order.createdAt + (index * 5 * 60 * 1000);
        }
      }
      
      return {
        status: status.key,
        label: status.label,
        completed: isCompleted || isCurrent,
        timestamp: timestamp
      };
    });
  };

  const statusHistory = getFullStatusHistory();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0fdf4',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#166534' }}>
            📦 Mi Pedido
          </h1>
        </div>

        {/* Código de confirmación */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Código de tu pedido
          </p>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#166534',
            letterSpacing: '0.5rem',
            fontFamily: 'monospace'
          }}>
            {confirmationCode}
          </div>
        </div>

        {/* Estado actual */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          borderLeft: `4px solid ${statusInfo.color}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>{statusInfo.emoji}</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {statusInfo.title}
            </h2>
          </div>
          <p style={{ color: '#4b5563', margin: 0 }}>
            {statusInfo.description}
          </p>
        </div>

        {/* Repartidor */}
        {(order.deliveryPersonName || order.assignedToDeliveryName) && (
          <div style={{
            backgroundColor: '#ecfdf5',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '1rem',
            border: '1px solid #a7f3d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🚴
              </div>
              <div>
                <p style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  TU REPARTIDOR
                </p>
                <p style={{ color: '#047857', fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>
                  {order.deliveryPersonName || order.assignedToDeliveryName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mapa de seguimiento en tiempo real */}
        {(order.customerLocation || order.deliveryLocation || order.customer?.location || driverLocation) ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🗺️ Seguimiento en tiempo real
              {driverLocation && (
                <span style={{ 
                  backgroundColor: '#10b981', 
                  color: 'white', 
                  fontSize: '0.625rem', 
                  padding: '0.125rem 0.5rem', 
                  borderRadius: '9999px',
                  animation: 'pulse 2s infinite'
                }}>
                  EN VIVO
                </span>
              )}
            </h3>
            <div 
              ref={mapRef}
              style={{ 
                width: '100%', 
                height: '250px', 
                borderRadius: '0.75rem',
                backgroundColor: '#f3f4f6'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
              {(order.customerLocation || order.deliveryLocation || order.customer?.location) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  <span>Tu ubicacion</span>
                </div>
              )}
              {order.restaurantLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                  <span>Restaurante</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                <span>Repartidor</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #fcd34d'
          }}>
            <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
              📍 El seguimiento en el mapa no esta disponible para este pedido.
            </p>
          </div>
        )}

        {/* Historial de Estados */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
            📜 Historial del pedido
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {statusHistory.map((item, index) => {
              const isLast = index === statusHistory.length - 1;
              const hasTimestamp = item.timestamp !== undefined;
              const dateStr = hasTimestamp 
                ? new Date(item.timestamp!).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                : '--';
              const timeStr = hasTimestamp
                ? new Date(item.timestamp!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                : '--:--';
              
              return (
                <div key={index} style={{ display: 'flex' }}>
                  {/* Línea y punto */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    marginRight: '0.75rem'
                  }}>
                    <div style={{ 
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: item.completed ? '#10b981' : '#e5e7eb',
                      border: `2px solid ${item.completed ? '#10b981' : '#d1d5db'}`,
                      flexShrink: 0
                    }} />
                    {!isLast && (
                      <div style={{
                        width: '2px',
                        flex: 1,
                        backgroundColor: '#e5e7eb',
                        margin: '4px 0'
                      }} />
                    )}
                  </div>
                  
                  {/* Contenido */}
                  <div style={{ 
                    flex: 1, 
                    paddingBottom: isLast ? '0' : '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <p style={{ 
                        fontWeight: item.completed ? '600' : '400', 
                        color: item.completed ? '#111827' : '#9ca3af',
                        margin: 0,
                        fontSize: '0.875rem'
                      }}>
                        {item.completed ? '✓ ' : '○ '}{item.label}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        {dateStr}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.125rem 0 0 0' }}>
                        {timeStr}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalles */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
            📋 Detalles del pedido
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Cliente:</span>
              <span style={{ fontWeight: '500' }}>{order.customer?.name || order.clientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Dirección:</span>
              <span style={{ fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>
                {order.customer?.address || order.deliveryAddress}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Artículos:</span>
              <span style={{ fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>
                {getItemsText()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Fecha:</span>
              <span style={{ fontWeight: '500' }}>
                {new Date(order.createdAt).toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>MyAppDelivery 📦</p>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
