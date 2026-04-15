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
    email?: string;
    address: string;
    location?: Location;
  };
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientLocation?: Location;
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
  riderName?: string;
  riderPhone?: string;
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
  const deliveryPersonMarkerRef = useRef<any>(null); // Marcador del repartidor

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
          
          // SIEMPRE solicitar ubicación, sin importar permisos previos
          console.log('⏳ [PERMISOS] Solicitando ubicación actual al usuario...');
          console.log('💡 [INFO] Debería aparecer el prompt del navegador preguntando si permites la ubicación');
          
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              
              console.log('✅ [UBICACIÓN] Permiso concedido. Ubicación:', coords);
              console.log('🎉 [INFO] Ahora el mapa puede centrarse en tu ubicación');
              
              // GUARDAR coordenadas en Firebase para este pedido
              if (order?.id) {
                try {
                  const { ref, update } = await import('firebase/database');
                  const orderRef = ref(database, `orders/${order.id}`);
                  
                  console.log('💾 [FIREBASE] Guardando coordenadas del cliente en Firebase...');
                  
                  await update(orderRef, {
                    'customerLocation.latitude': coords.latitude,
                    'customerLocation.longitude': coords.longitude,
                    'customerLocation.timestamp': Date.now(),
                    'customerLocation.accuracy': coords.accuracy
                  });
                  
                  console.log('✅ [FIREBASE] Coordenadas guardadas exitosamente en Firebase');
                  console.log('📊 [INFO] El restaurante ahora puede ver la ubicación exacta del cliente');
                  
                } catch (error: any) {
                  console.error('❌ [FIREBASE] Error al guardar coordenadas:', error.message);
                  // NO mostrar error al usuario - Es solo informativo
                }
              }
            },
            (error) => {
              console.warn('⚠️ [PERMISOS] Usuario denegó el permiso:', error.code, error.message);
              
              let mensajeError = '';
              if (error.code === 1) {
                console.log('ℹ️ [INFO] El usuario bloqueó el permiso. Puedes cambiar esta decisión en la configuración del navegador');
                mensajeError = 'Has bloqueado el acceso a la ubicación. Si quieres ver el mapa con tu repartidor, permite el acceso a la ubicación en la configuración de tu navegador.';
              } else if (error.code === 2) {
                console.log('ℹ️ [INFO] Posición no disponible');
                mensajeError = 'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.';
              } else if (error.code === 3) {
                console.log('ℹ️ [INFO] Tiempo de espera agotado');
                mensajeError = 'Se agotó el tiempo para obtener tu ubicación. Recarga la página para intentar de nuevo.';
              } else {
                console.log('ℹ️ [INFO] Error desconocido');
                mensajeError = 'No se pudo obtener tu ubicación.';
              }
              
              // Mostrar mensaje informativo al usuario (NO como error crítico)
              console.log('📱 Mostrando mensaje al usuario:', mensajeError);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
          
        } catch (err: any) {
          console.error('❌ [ERROR] Error al solicitar permiso:', err.message);
          // NO lanzar error - Solo loguear para diagnóstico
        }
      } else {
        console.warn('⚠️ [COMPATIBILIDAD] Geolocalización no soportada en este navegador');
      }
      
      console.log('─────────────────────────────────────');
    };

    requestLocationPermission();

    try {
      console.log('🔥 Conectando a Firebase...');
      
      // Escuchar AMBAS colecciones y combinar datos
      const clientOrdersRef = ref(database, 'client_orders');
      const ordersRef = ref(database, 'orders');
      
      let latestClientOrder: Order | null = null;
      let latestOrdersOrder: Order | null = null;
      let unsubscribeClientOrders: (() => void) | null = null;
      let unsubscribeOrders: (() => void) | null = null;
      
      // Función para actualizar el pedido combinando ambas fuentes
      const updateOrderFromSources = () => {
        if (latestClientOrder && latestOrdersOrder) {
          // Combinar ambas fuentes: usar client_orders como base pero actualizar status desde orders
          const combinedOrder = {
            ...latestClientOrder,
            // Actualizar campos que pueden cambiar en orders
            status: latestOrdersOrder.status || latestClientOrder.status,
            assignedToDeliveryId: latestOrdersOrder.assignedToDeliveryId || latestClientOrder.assignedToDeliveryId,
            assignedToDeliveryName: latestOrdersOrder.assignedToDeliveryName || latestClientOrder.assignedToDeliveryName,
            deliveryPersonName: latestOrdersOrder.deliveryPersonName || latestClientOrder.deliveryPersonName,
          };
          console.log('🔄 Combinando datos - Status:', combinedOrder.status);
          setOrder(combinedOrder);
          setLoading(false);
        } else if (latestClientOrder) {
          // Usar client_orders como fuente principal
          console.log('✅ Usando client_orders - Status:', latestClientOrder.status);
          setOrder(latestClientOrder);
          setLoading(false);
        } else if (latestOrdersOrder) {
          // Fallback a orders si no hay client_orders
          console.log('⚠️ Usando orders como fallback - Status:', latestOrdersOrder.status);
          setOrder(latestOrdersOrder);
          setLoading(false);
        }
      };
      
      // Escuchar client_orders
      unsubscribeClientOrders = onValue(clientOrdersRef, (snapshot) => {
        console.log('📦 [CLIENT_ORDERS] Snapshot recibido:', snapshot.exists());
        
        if (snapshot.exists()) {
          const orders = snapshot.val();
          console.log('📋 [CLIENT_ORDERS] Pedidos encontrados:', Object.keys(orders).length);
          
          let foundOrder: Order | null = null;

          if (orderId && orders[orderId]) {
            console.log('✅ [CLIENT_ORDERS] Encontrado por ID:', orderId);
            foundOrder = { id: orderId, ...orders[orderId] };
          } else if (orderCode) {
            console.log('🔍 [CLIENT_ORDERS] Buscando por código:', orderCode);
            for (const id in orders) {
              const o = orders[id];
              const code = o.orderCode || '';
              const searchCode = orderCode || '';
              
              if (code === searchCode || id === searchCode || code === `PED-${searchCode}` || (searchCode.startsWith('PED-') && code === searchCode)) {
                console.log('✅ [CLIENT_ORDERS] Pedido encontrado!');
                foundOrder = { id, ...o };
                break;
              }
            }
          } else if (phone) {
            console.log('🔍 [CLIENT_ORDERS] Buscando por teléfono:', phone);
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
            console.log('✅ [CLIENT_ORDERS] Pedido actualizado:', foundOrder.status);
            latestClientOrder = foundOrder;
            updateOrderFromSources();
          }
        }
      }, (error) => {
        console.error('❌ Error en client_orders:', error);
      });
      
      // También escuchar orders como respaldo y para combinar datos
      unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        console.log('📦 [ORDERS] Snapshot recibido:', snapshot.exists());
        
        if (snapshot.exists()) {
          const orders = snapshot.val();
          console.log('📋 [ORDERS] Pedidos encontrados:', Object.keys(orders).length);
          
          let foundOrder: Order | null = null;

          if (orderId && orders[orderId]) {
            console.log('✅ [ORDERS] Encontrado por ID:', orderId);
            foundOrder = { id: orderId, ...orders[orderId] };
          } else if (orderCode) {
            console.log('🔍 [ORDERS] Buscando por código:', orderCode);
            for (const id in orders) {
              const o = orders[id];
              const code = o.orderCode || '';
              const searchCode = orderCode || '';
              
              if (code === searchCode || id === searchCode || code === `PED-${searchCode}` || (searchCode.startsWith('PED-') && code === searchCode)) {
                console.log('✅ [ORDERS] Pedido encontrado!');
                foundOrder = { id, ...o };
                break;
              }
            }
          } else if (phone) {
            console.log('🔍 [ORDERS] Buscando por teléfono:', phone);
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
            console.log('✅ [ORDERS] Pedido encontrado:', foundOrder.status);
            latestOrdersOrder = foundOrder;
            
            // Si no tenemos client_orders, usar orders
            if (!latestClientOrder) {
              updateOrderFromSources();
            } else {
              // Combinar: usar client_orders como base, pero actualizar campos desde orders
              const combinedOrder = {
                ...latestClientOrder,
                // IMPORTANTE: Actualizar el status desde orders (cambia frecuentemente)
                status: foundOrder.status || latestClientOrder.status,
                assignedToDeliveryId: foundOrder.assignedToDeliveryId || latestClientOrder.assignedToDeliveryId,
                // Rellenar campos faltantes desde orders
                confirmationCode: latestClientOrder.confirmationCode || foundOrder.confirmationCode,
                customerCode: latestClientOrder.customerCode || foundOrder.customerCode,
                orderCode: latestClientOrder.orderCode || foundOrder.orderCode,
                deliveryPersonName: latestClientOrder.deliveryPersonName || foundOrder.deliveryPersonName,
                assignedToDeliveryName: latestClientOrder.assignedToDeliveryName || foundOrder.assignedToDeliveryName,
                riderName: latestClientOrder.riderName || foundOrder.riderName,
                riderPhone: latestClientOrder.riderPhone || foundOrder.riderPhone,
              };
              
              console.log('🔄 Combinando datos de ambas colecciones');
              console.log('   Status desde orders:', foundOrder.status);
              console.log('   Status combinado:', combinedOrder.status);
              setOrder(combinedOrder);
            }
          } else if (!latestClientOrder) {
            console.error('❌ No se encontró el pedido en ninguna colección');
            setError('No se encontró el pedido con ese código');
            setLoading(false);
          }
        }
      }, (error) => {
        console.error('❌ Error en orders:', error);
        if (!latestClientOrder) {
          setError('Error al conectar con la base de datos');
          setLoading(false);
        }
      });

      return () => {
        if (unsubscribeClientOrders) unsubscribeClientOrders();
        if (unsubscribeOrders) unsubscribeOrders();
      };
    } catch (err) {
      console.error('❌ Error general:', err);
      setError('Error al cargar el pedido');
      setLoading(false);
    }
  }, [orderId, phone, orderCode]);

  // Escuchar ubicacion del repartidor en tiempo real
  useEffect(() => {
    if (!order?.assignedToDeliveryId || !order?.id) {
      console.log('⚠️ No hay assignedToDeliveryId o id, no se escucha ubicación');
      return;
    }
    
    // Solo escuchar ubicacion cuando el pedido esta en ciertos estados
    const activeStatuses = [
      'ACCEPTED', 
      'ON_THE_WAY_TO_STORE', 
      'ARRIVED_AT_STORE', 
      'PICKING_UP_ORDER', 
      'ON_THE_WAY_TO_CUSTOMER',
      // Estados para motocicleta
      'ON_THE_WAY_TO_PICKUP',
      'ARRIVED_AT_PICKUP',
      'ON_THE_WAY_TO_DESTINATION'
    ];
    
    console.log('📊 Estado actual:', order.status);
    console.log('✅ Estados activos para seguimiento:', activeStatuses);
    console.log('👤 ID del repartidor:', order.assignedToDeliveryId);
    
    if (!order.assignedToDeliveryId) {
      console.error('❌ ERROR: No hay ID de repartidor asignado. No se puede rastrear la ubicación.');
      return;
    }
    
    if (!activeStatuses.includes(order.status)) {
      console.warn('⚠️ ADVERTENCIA: El estado actual del pedido no permite seguimiento en vivo.');
      console.log('📋 Estado actual:', order.status);
      return;
    }
    
    console.log('🎯 INICIANDO SEGUIMIENTO EN VIVO del repartidor...');
    console.log('🔗 Rutas Firebase:');
    console.log('   - delivery_locations/' + order.assignedToDeliveryId);
    console.log('   - delivery_users/' + order.assignedToDeliveryId + '/location');
    
    // PRIMERO: Intentar leer desde delivery_locations (nuevo formato)
    const deliveryLocationRef = ref(database, `delivery_locations/${order.assignedToDeliveryId}`);
    console.log('📡 [LISTENER 1] Conectando a delivery_locations...');
    
    const unsubscribeDeliveryLocation = onValue(deliveryLocationRef, (snapshot) => {
      const location = snapshot.val();
      const timestamp = new Date().toLocaleTimeString();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 [NUEVO FORMATO] ${timestamp}`);
      console.log('📦 Datos recibidos:', location);
      
      if (!location) {
        console.warn('⚠️ La ubicación está vacía o no existe');
      } else if (!location.latitude || !location.longitude) {
        console.warn('⚠️ Datos de ubicación incompletos (faltan lat/lng)');
        console.log('   latitude:', location.latitude);
        console.log('   longitude:', location.longitude);
      } else {
        console.log('✅ UBICACIÓN VÁLIDA RECIBIDA');
        console.log('   🌍 Latitud:', location.latitude);
        console.log('   🌍 Longitud:', location.longitude);
        console.log('   📍 Coordenadas:', `${location.latitude}, ${location.longitude}`);
        
        if (location.timestamp) {
          const locTime = new Date(location.timestamp).toLocaleTimeString();
          console.log('   ⏰ Timestamp del repartidor:', locTime);
        }
        
        console.log('🔄 Actualizando estado driverLocation en React...');
        setDriverLocation({ latitude: location.latitude, longitude: location.longitude });
        console.log('✅ Marcador del repartidor actualizado en el mapa');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }, (error) => {
      console.error('❌ ERROR al escuchar delivery_locations:', error);
      console.error('   Código:', error.code);
      console.error('   Mensaje:', error.message);
    });
    
    // SEGUNDO: También escuchar delivery_users (formato anterior como respaldo)
    const driverLocationRef = ref(database, `delivery_users/${order.assignedToDeliveryId}/location`);
    console.log('📡 [LISTENER 2] Conectando a delivery_users como respaldo...');
    
    const unsubscribeDriverLocation = onValue(driverLocationRef, (snapshot) => {
      const location = snapshot.val();
      const timestamp = new Date().toLocaleTimeString();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 [FORMATO ANTIGUO - RESPALDO] ${timestamp}`);
      console.log('📦 Datos recibidos:', location);
      
      if (!location) {
        console.warn('⚠️ La ubicación está vacía o no existe');
      } else if (!location.latitude || !location.longitude) {
        console.warn('⚠️ Datos de ubicación incompletos (faltan lat/lng)');
      } else {
        console.log('✅ UBICACIÓN VÁLIDA RECIBIDA (formato antiguo)');
        console.log('   🌍 Latitud:', location.latitude);
        console.log('   🌍 Longitud:', location.longitude);
        console.log('   📍 Coordenadas:', `${location.latitude}, ${location.longitude}`);
        
        console.log('🔄 Actualizando estado driverLocation en React (solo si no hay nuevo formato)...');
        setDriverLocation(prev => {
          if (prev) {
            console.log('   ⏭️ Ya existe ubicación del nuevo formato, omitiendo');
            return prev;
          } else {
            console.log('   ✅ Aplicando ubicación de respaldo');
            return { latitude: location.latitude, longitude: location.longitude };
          }
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }, (error) => {
      console.error('❌ ERROR al escuchar delivery_users:', error);
      console.error('   Código:', error.code);
      console.error('   Mensaje:', error.message);
    });
    
    console.log('✅ ✅ ✅ LISTENERS ACTIVOS - Esperando actualizaciones del repartidor...');
    console.log('💡 Cada vez que el repartidor se mueva, verás los logs arriba');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return () => {
      console.log('\n🛑 🛑 🛑 DETENIENDO SEGUIMIENTO');
      console.log('   Limpiando listeners de Firebase...');
      unsubscribeDeliveryLocation();
      unsubscribeDriverLocation();
      console.log('✅ Listeners eliminados correctamente\n');
    };
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
        
        // Recopilar todas las ubicaciones para ajustar el zoom
        const bounds = new google.maps.LatLngBounds();
        let hasMarkers = false;
        
        // Marcador del cliente (destino de entrega) - solo si existe
        console.log('🔍 [DEBUG] order.deliveryLocation:', order.deliveryLocation);
        console.log('🔍 [DEBUG] order.customer?.location:', order.customer?.location);
        console.log('🔍 [DEBUG] order.clientLocation:', order.clientLocation);
        console.log('🔍 [DEBUG] order.customerLocation:', order.customerLocation);
        console.log('🔍 [DEBUG] order completo:', order);
        
        const deliveryLocation = order.deliveryLocation || order.customer?.location;
        if (deliveryLocation?.latitude) {
          console.log('✅ [MAPA] Coordenadas de DESTINO encontradas:', deliveryLocation);
          // Crear marcador personalizado con emoji
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 60;
          canvas.height = 60;
          
          if (ctx) {
            // Fondo circular verde
            ctx.beginPath();
            ctx.arc(30, 30, 25, 0, 2 * Math.PI);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Emoji bandera de llegada
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏁', 30, 30);
          }
          
          new google.maps.Marker({
            position: { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude },
            map: map,
            title: 'Destino de entrega',
            icon: {
              url: canvas.toDataURL(),
              scaledSize: new google.maps.Size(50, 50)
            }
          });
          bounds.extend({ lat: deliveryLocation.latitude, lng: deliveryLocation.longitude });
          hasMarkers = true;
          console.log('✅ Marcador DESTINO DE ENTREGA agregado en:', deliveryLocation.latitude, deliveryLocation.longitude);
        } else {
          console.warn('⚠️ [MAPA] No se encontraron coordenadas para el destino de entrega');
        }
        
        // Marcador de dirección del cliente (ubicación actual del cliente/ORIGEN) - solo si es diferente
        // IMPORTANTE: Usar clientLocation PRIMERO porque customerLocation puede tener coordenadas incorrectas
        const customerLocation = order.clientLocation || order.customerLocation;
        console.log('🔍 [DEBUG] customerLocation final:', customerLocation);
        console.log('🔍 [DEBUG] deliveryLocation para comparar:', deliveryLocation);
        
        if (customerLocation?.latitude) {
          console.log('✅ [MAPA] Coordenadas de ORIGEN encontradas:', customerLocation);
          
          // Verificar si son diferentes al destino
          const esDiferente = !deliveryLocation || 
                             customerLocation.latitude !== deliveryLocation.latitude || 
                             customerLocation.longitude !== deliveryLocation.longitude;
          
          console.log('🔍 [DEBUG] ¿Es diferente al destino?', esDiferente);
          
          if (esDiferente) {
            // Crear marcador personalizado con emoji
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 60;
            canvas.height = 60;
            
            if (ctx) {
              // Fondo circular rojo
              ctx.beginPath();
              ctx.arc(30, 30, 25, 0, 2 * Math.PI);
              ctx.fillStyle = '#ef4444';
              ctx.fill();
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 3;
              ctx.stroke();
              
              // Emoji casa
              ctx.font = '24px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🏠', 30, 30);
            }
            
            new google.maps.Marker({
              position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
              map: map,
              title: 'Dirección del Cliente',
              icon: {
                url: canvas.toDataURL(),
                scaledSize: new google.maps.Size(50, 50)
              }
            });
            bounds.extend({ lat: customerLocation.latitude, lng: customerLocation.longitude });
            hasMarkers = true;
            console.log('✅ Marcador DIRECCIÓN DEL CLIENTE (ORIGEN) agregado en:', customerLocation.latitude, customerLocation.longitude);
          } else {
            console.log('ℹ️ [MAPA] Las coordenadas del ORIGEN son IGUALES al DESTINO, no se agrega marcador duplicado');
          }
        } else {
          console.warn('⚠️ [MAPA] No se encontraron coordenadas para la dirección del cliente (ORIGEN)');
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
          bounds.extend({ lat: order.restaurantLocation.latitude, lng: order.restaurantLocation.longitude });
          hasMarkers = true;
          console.log('✅ Marcador restaurante agregado');
        }
        
        // Ajustar el zoom para mostrar todos los marcadores
        if (hasMarkers) {
          // Agregar padding para que los marcadores no queden en los bordes
          map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
          console.log('✅ Mapa ajustado para mostrar todos los marcadores');
          console.log('📊 Bounds calculados:', bounds.getNorthEast().lat(), bounds.getNorthEast().lng(), 'a', bounds.getSouthWest().lat(), bounds.getSouthWest().lng());
        }
      } catch (err) {
        console.error('❌ Error cargando mapa:', err);
      }
    };
    
    loadMap();
  }, [order, GOOGLE_MAPS_API_KEY]);

  // Actualizar marcador del repartidor en tiempo real
  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation || !googleLoaded) {
      if (!mapInstanceRef.current) console.warn('⚠️ Mapa no está listo todavía');
      if (!driverLocation) console.warn('⚠️ No hay ubicación del repartidor para actualizar');
      if (!googleLoaded) console.warn('⚠️ Google Maps API no está cargada');
      return;
    }
    
    console.log('\n🚴 🚴 🚴 ACTUALIZANDO MARCADOR DEL REPARTIDOR EN EL MAPA');
    console.log('   📍 Nueva ubicación:', driverLocation);
    console.log('   🌍 Latitud:', driverLocation.latitude);
    console.log('   🌍 Longitud:', driverLocation.longitude);
    console.log('   ⏰ Hora de actualización:', new Date().toLocaleTimeString());
    
    // Crear o actualizar marcador del repartidor
    if (!driverMarkerRef.current) {
      // Crear marcador personalizado con emoji
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 60;
      canvas.height = 60;
      
      if (ctx) {
        // Fondo circular azul
        ctx.beginPath();
        ctx.arc(30, 30, 25, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Emoji según tipo de servicio
        const emoji = order?.serviceType === 'MOTORCYCLE_TAXI' ? '🏍️' : '🚴';
        console.log('🎨 Dibujando emoji:', emoji, 'para serviceType:', order?.serviceType);
        
        ctx.font = 'bold 32px Arial, Segoe UI Emoji, Apple Color Emoji, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 30, 32); // Ajustar posición Y para centrar mejor
        
        console.log('✅ Canvas creado con emoji');
      }
      
      driverMarkerRef.current = new googleLoaded.maps.Marker({
        position: { lat: driverLocation.latitude, lng: driverLocation.longitude },
        map: mapInstanceRef.current,
        title: 'Tu repartidor',
        icon: {
          url: canvas.toDataURL(),
          scaledSize: new googleLoaded.maps.Size(50, 50)
        }
      });
      console.log('✅ ✅ ✅ Marcador del repartidor CREADO en el mapa');
    } else {
      // Animación suave: mover el marcador gradualmente
      const currentPos = driverMarkerRef.current.getPosition();
      const targetPos = { lat: driverLocation.latitude, lng: driverLocation.longitude };
      
      console.log('   📍 Posición actual del marcador:', currentPos.lat(), currentPos.lng());
      console.log('   🎯 Posición objetivo:', targetPos.lat, targetPos.lng);
      
      // Calcular distancia del movimiento
      const distance = Math.sqrt(
        Math.pow(targetPos.lat - currentPos.lat(), 2) + 
        Math.pow(targetPos.lng - currentPos.lng(), 2)
      );
      console.log('   📏 Distancia a mover:', (distance * 111000).toFixed(2), 'metros aproximadamente');
      
      // Interpolar para movimiento suave
      const steps = 10;
      const latStep = (targetPos.lat - currentPos.lat()) / steps;
      const lngStep = (targetPos.lng - currentPos.lng()) / steps;
      
      console.log('   🎬 Iniciando animación suave (' + steps + ' pasos)...');
      
      let step = 0;
      const animate = () => {
        if (step < steps) {
          const newPos = {
            lat: currentPos.lat() + (latStep * (step + 1)),
            lng: currentPos.lng() + (lngStep * (step + 1))
          };
          driverMarkerRef.current.setPosition(newPos);
          step++;
          requestAnimationFrame(animate);
        } else {
          driverMarkerRef.current.setPosition(targetPos);
          console.log('   ✅ Animación completada - Marcador en posición final');
        }
      };
      
      animate();
      console.log('✅ ✅ ✅ Marcador del repartidor ACTUALIZADO con animación suave');
    }
    
    // Centrar mapa en el repartidor
    console.log('   🗺️ Centrando mapa en la nueva posición del repartidor...');
    mapInstanceRef.current.panTo({ lat: driverLocation.latitude, lng: driverLocation.longitude });
    console.log('✅ ✅ ✅ ACTUALIZACIÓN DEL MAPA COMPLETADA\n');
    
  }, [driverLocation, googleLoaded]);

  const getStatusInfo = (status: string) => {
    const deliveryName = order?.deliveryPersonName || order?.assignedToDeliveryName || 'tu repartidor';
    
    const statusMap: { [key: string]: { emoji: string; title: string; description: string; color: string; mapMessage: string } } = {
      'pending': {
        emoji: '⏳',
        title: 'Buscando repartidor',
        description: 'Tu pedido está esperando ser asignado.',
        color: '#f59e0b',
        mapMessage: '🔍 Estamos buscando al repartidor ideal para ti... ¡Pronto tendremos noticias!'
      },
      'MANUAL_ASSIGNED': {
        emoji: '⏳',
        title: 'Pendiente de asignación',
        description: 'Estamos buscando un repartidor para tu pedido.',
        color: '#f59e0b',
        mapMessage: '🔍 Estamos buscando al repartidor ideal para ti... ¡Pronto tendremos noticias!'
      },
      'accepted': {
        emoji: '✅',
        title: '¡Pedido aceptado!',
        description: `Tu repartidor es ${deliveryName}.`,
        color: '#10b981',
        mapMessage: '🎉 ¡Tu pedido ya fue recibido por uno de nuestros repartidores! Pronto comenzará tu entrega.'
      },
      'ACCEPTED': {
        emoji: '✅',
        title: '¡Pedido aceptado!',
        description: `Tu repartidor es ${deliveryName}.`,
        color: '#10b981',
        mapMessage: '🎉 ¡Tu pedido ya fue recibido por uno de nuestros repartidores! Pronto comenzará tu entrega.'
      },
      'ON_THE_WAY_TO_STORE': {
        emoji: '🚗',
        title: 'En camino a recoger',
        description: `${deliveryName} va a recoger tu pedido.`,
        color: '#3b82f6',
        mapMessage: `🚗 ${deliveryName} está en camino a recoger tu orden. ¡Todo va perfecto!`
      },
      'ARRIVED_AT_STORE': {
        emoji: '📍',
        title: 'Llegó al lugar',
        description: `${deliveryName} está en el lugar de recogida.`,
        color: '#8b5cf6',
        mapMessage: `📍 ${deliveryName} ya llegó al punto de recogida. ¡Está por obtener tu pedido!`
      },
      'PICKING_UP_ORDER': {
        emoji: '📦',
        title: 'Recogiendo pedido',
        description: `${deliveryName} está recogiendo tu pedido.`,
        color: '#ec4899',
        mapMessage: `📦 ${deliveryName} está recogiendo tu pedido con mucho cuidado. ¡Ya casi!`
      },
      'ON_THE_WAY_TO_CUSTOMER': {
        emoji: '🚴',
        title: '¡En camino a tu domicilio!',
        description: `${deliveryName} ya viene con tu pedido.`,
        color: '#10b981',
        mapMessage: `🚴💨 ¡${deliveryName} está en camino a tu domicilio! Prepárate para recibir tu pedido.`
      },
      'DELIVERED': {
        emoji: '✅',
        title: '¡Entregado!',
        description: 'Tu pedido fue entregado. ¡Gracias!',
        color: '#059669',
        mapMessage: '🎊 ¡Tu pedido ha sido entregado exitosamente! Gracias por confiar en nosotros. ¡Que lo disfrutes! 😊'
      },
      'CANCELLED': {
        emoji: '❌',
        title: 'Cancelado',
        description: 'Este pedido fue cancelado.',
        color: '#ef4444',
        mapMessage: '❌ Este pedido ha sido cancelado. Si tienes dudas, contáctanos.'
      },
      // Estados específicos para MOTOCICLETA
      'ON_THE_WAY_TO_PICKUP': {
        emoji: '🏍️',
        title: 'En camino a recogerte',
        description: `${deliveryName} va en camino a tu ubicación.`,
        color: '#3b82f6',
        mapMessage: `🏍️ ${deliveryName} está en camino a recogerte. ¡Prepárate!`
      },
      'ARRIVED_AT_PICKUP': {
        emoji: '📍',
        title: '¡Llegó por ti!',
        description: `${deliveryName} llegó al punto de recogida.`,
        color: '#10b981',
        mapMessage: `📍 ${deliveryName} ya llegó. ¡Sube a la motocicleta!`
      },
      'ON_THE_WAY_TO_DESTINATION': {
        emoji: '🛣️',
        title: 'En camino al destino',
        description: `${deliveryName} te lleva a tu destino.`,
        color: '#f59e0b',
        mapMessage: `🛣️ ${deliveryName} te está llevando a tu destino. ¡Buen viaje!`
      }
    };
    
    return statusMap[status] || { 
      emoji: '📦', 
      title: status, 
      description: 'Estado del pedido',
      color: '#6b7280',
      mapMessage: '📦 Seguimiento del pedido en proceso.'
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
    
    // Estados únicos para mostrar (sin duplicados)
    const uniqueStatuses = [
      { key: 'pending', label: 'Pedido creado' },
      { key: 'MANUAL_ASSIGNED', label: 'Asignado a repartidor' },
      { key: 'ACCEPTED', label: 'Pedido aceptado' },
      { key: 'ON_THE_WAY_TO_PICKUP', label: 'En camino a recogerte' },
      { key: 'ARRIVED_AT_PICKUP', label: 'Repartidor llegó' },
      { key: 'ON_THE_WAY_TO_DESTINATION', label: 'En camino al destino' },
      { key: 'DELIVERED', label: 'Viaje completado' }
    ];
    
    // Determinar cuál es el estado actual en nuestro flujo
    let actualCurrentIndex = -1;
    for (let i = 0; i < uniqueStatuses.length; i++) {
      if (uniqueStatuses[i].key === currentStatus || 
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
                {order.serviceType === 'MOTORCYCLE_TAXI' ? '🏍️' : '🚴'}
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
            
            {/* Botón Chatear con tu repartidor */}
            <a
              href={`/chat?deliveryId=${order.assignedToDeliveryId || ''}&deliveryName=${encodeURIComponent(order.deliveryPersonName || order.assignedToDeliveryName || '')}&orderId=${order.orderCode || order.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              💬 Chatear con tu repartidor
            </a>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280', flexWrap: 'wrap', gap: '0.5rem' }}>
              {order.customerLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                  <span>📍 Dirección del Cliente</span>
                </div>
              )}
              {(order.deliveryLocation || order.customer?.location) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  <span>📍 Destino de entrega</span>
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

        {/* Mensaje dinámico debajo del mapa */}
        <div style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '1rem',
          padding: '1.25rem',
          marginBottom: '1rem',
          border: '2px solid #86efac',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#166534', 
            fontSize: '1rem',
            fontWeight: '600',
            lineHeight: '1.5'
          }}>
            {statusInfo.mapMessage}
          </p>
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
              <span style={{ color: '#6b7280' }}>👤 Cliente:</span>
              <span style={{ fontWeight: '500' }}>{order.customer?.name || order.clientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>📞 Teléfono:</span>
              <span style={{ fontWeight: '500' }}>{order.customer?.phone || order.clientPhone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>📧 Email:</span>
              <span style={{ fontWeight: '500' }}>{order.customer?.email || order.clientEmail || 'No proporcionado'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>📍 Dirección:</span>
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
