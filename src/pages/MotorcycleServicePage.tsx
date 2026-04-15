import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService from '../services/OrderService';
import AddressSearchWithMap from '../components/AddressSearchWithMap';

const MotorcycleServicePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Datos del cliente
  const [clientName, setClientName] = useState(AuthService.getClientName() || '');
  const [clientPhone, setClientPhone] = useState(AuthService.getClientPhone() || '');
  const [clientEmail, setClientEmail] = useState(AuthService.getClientEmail() || '');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  
  // Descripción del viaje
  const [items, setItems] = useState('');
  
  // Dirección de entrega (nuevo)
  const [deliveryAddressInput, setDeliveryAddressInput] = useState('');
  const deliveryAutocompleteRef2 = React.useRef<google.maps.places.Autocomplete | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para "Otra dirección"
  const [useAlternativeAddress, setUseAlternativeAddress] = useState(false);
  const [alternativeAddressInput, setAlternativeAddressInput] = useState('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const deliveryAutocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);

  // 🛰️ Auto-obtener ubicación al cargar la página - TOTALMENTE AUTOMÁTICO
  useEffect(() => {
    console.log('🛰️ [MOTORCYCLE] INICIANDO PROCESO AUTOMÁTICO DE UBICACIÓN...');
    
    // Verificar si Google Maps ya está cargado
    if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      console.log('✅ [GOOGLE MAPS] Ya estaba cargado previamente');
      setIsGoogleLoaded(true);
      return;
    }
    
    // Cargar Google Maps para autocompletado
    const loadGoogleMaps = async () => {
      try {
        console.log('🔑 [GOOGLE MAPS] API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Configurada' : 'NO CONFIGURADA');
        
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        });
        
        console.log('⏳ [GOOGLE MAPS] Iniciando carga...');
        await loader.load();
        setIsGoogleLoaded(true);
        console.log('✅ [GOOGLE MAPS] API cargada correctamente');
        console.log('✅ [GOOGLE MAPS] window.google disponible:', !!(window as any).google);
        console.log('✅ [GOOGLE MAPS] google.maps.places disponible:', !!((window as any).google?.maps?.places));
      } catch (err) {
        console.error('❌ [GOOGLE MAPS] Error al cargar:', err);
      }
    };
    loadGoogleMaps();
    
    // Función para obtener ubicación con reintentos automáticos
    const obtenerUbicacionAutomatica = (intentos: number = 0) => {
      const MAX_INTENTOS = 3;
      
      if (intentos >= MAX_INTENTOS) {
        console.warn('⚠️ [MOTORCYCLE] Máximo de intentos alcanzado, usando coordenadas por defecto');
        console.log('ℹ️ [INFO] El usuario deberá seleccionar su ubicación manualmente en el mapa');
        return;
      }
      
      console.log(`🛰️ [MOTORCYCLE] Intento ${intentos + 1} de ${MAX_INTENTOS}...`);
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
              
            console.log('✅ [MOTORCYCLE] Ubicación obtenida en intento', intentos + 1, ':', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            
            // Guardar coordenadas en los estados
            setDeliveryLat(lat);
            setDeliveryLng(lng);
              
            try {
              // Obtener dirección usando Nominatim con más detalles
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
                {
                  headers: {
                    'User-Agent': 'MiAppDelivery/1.0'
                  }
                }
              );
              const data = await response.json();
                
              // Extraer información de la dirección
              const road = data.address?.road || data.address?.pedestrian || '';
              const hNumber = data.address?.house_number || '';
              const s = data.address?.suburb || data.address?.neighbourhood || data.address?.quarter || '';
              const c = data.address?.city || data.address?.town || data.address?.village || '';
              const p = data.address?.postcode || '';
              const st = data.address?.state || '';
                
              // NO llenar campos automáticamente - El usuario lo hará manualmente
              console.log('ℹ️ [MOTORCYCLE] Dirección obtenida (NO se llena automáticamente):', { road, city: c });
              
            } catch (err) {
              console.warn('⚠️ [MOTORCYCLE] No se pudo obtener la dirección exacta, pero las coordenadas están guardadas');
              console.error('   Error:', err);
            }
          },
          (error) => {
            console.warn('⚠️ [MOTORCYCLE] Error en intento', intentos + 1, ':', error.message);
            
            // Manejar diferentes tipos de error
            if (error.code === 1) {
              console.log('ℹ️ [MOTORCYCLE] Usuario denegó el permiso de ubicación');
              console.log('💡 [INFO] El usuario debe permitir el acceso a la ubicación en su navegador');
              // NO reintentar si el usuario denegó explícitamente
              usarCoordenadasPorDefecto();
              return;
            }
            
            // Reintentar automáticamente después de 2 segundos para otros errores
            setTimeout(() => {
              obtenerUbicacionAutomatica(intentos + 1);
            }, 2000);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      } else {
        console.warn('⚠️ [MOTORCYCLE] Geolocalización no disponible en este navegador');
        usarCoordenadasPorDefecto();
      }
    };
    
    // Función para usar coordenadas por defecto (Fresnillo, Zacatecas)
    const usarCoordenadasPorDefecto = () => {
      const defaultLat = 24.6536;
      const defaultLng = -102.8738;
      
      console.log('⚠️ [MOTORCYCLE] Usando coordenadas por defecto:', defaultLat, defaultLng);
      console.log('📍 [MOTORCYCLE] El usuario deberá seleccionar su ubicación en el mapa');
      
      // No establecemos las coordenadas para forzar que el usuario use el mapa
      // Opcionalmente podríamos establecerlas:
      // setDeliveryLat(defaultLat);
      // setDeliveryLng(defaultLng);
      
      setTimeout(() => {
        alert('⚠️ No se pudo obtener tu ubicación GPS automáticamente.\n\n💡 Por favor selecciona tu ubicación en el mapa interactivo que aparece abajo.\n\nEs fácil: solo haz clic en el mapa donde estás ubicado.');
      }, 1000);
    };
    
    // Iniciar proceso automático solo si no hay coordenadas
    if (deliveryLat === null && deliveryLng === null) {
      obtenerUbicacionAutomatica(0);
    } else {
      console.log('✅ [MOTORCYCLE] Ya hay coordenadas disponibles:', deliveryLat, deliveryLng);
    }
  }, []); // Solo se ejecuta una vez al montar el componente

  // Configurar autocompletado cuando el input esté disponible y Google cargado
  useEffect(() => {
    if (isGoogleLoaded && useAlternativeAddress) {
      const deliveryInput = document.getElementById('alternative-delivery-autocomplete') as HTMLInputElement;
      if (deliveryInput && !deliveryAutocompleteRef.current) {
        // Necesitamos acceder a google.maps, asumimos que está disponible globalmente tras la carga
        const google = (window as any).google;
        if (google) {
          deliveryAutocompleteRef.current = new google.maps.places.Autocomplete(deliveryInput, {
            componentRestrictions: { country: 'mx' },
            fields: ['geometry', 'formatted_address', 'address_components']
          });
          
          deliveryAutocompleteRef.current.addListener('place_changed', () => {
            const place = deliveryAutocompleteRef.current?.getPlace();
            if (place && place.geometry) {
              setDeliveryLat(place.geometry.location.lat());
              setDeliveryLng(place.geometry.location.lng());
              setAlternativeAddressInput(place.formatted_address || '');
              
              // Intentar llenar campos individuales si es posible
              const components = place.address_components;
              if (components) {
                let street = '', number = '', suburb = '', city = '', state = '', postcode = '';
                components.forEach((comp: any) => {
                  const types = comp.types;
                  if (types.includes('route')) street = comp.long_name;
                  if (types.includes('street_number')) number = comp.long_name;
                  if (types.includes('sublocality') || types.includes('neighborhood')) suburb = comp.long_name;
                  if (types.includes('locality')) city = comp.long_name;
                  if (types.includes('administrative_area_level_1')) state = comp.long_name;
                  if (types.includes('postal_code')) postcode = comp.long_name;
                });
                
                if (street) setStreet(street);
                if (number) setHouseNumber(number);
                if (suburb) setSuburb(suburb);
                if (city) setCity(city);
                if (state) setState(state);
                if (postcode) setPostcode(postcode);
              }
              console.log('✅ [ALTERNATIVA] Dirección seleccionada:', place.formatted_address);
            }
          });
        }
      }
    }
  }, [isGoogleLoaded, useAlternativeAddress]);

  // Configurar autocompletado para dirección de entrega (nuevo)
  useEffect(() => {
    if (!isGoogleLoaded) {
      console.log('⏳ [AUTOCOMPLETE] Esperando a que Google Maps cargue...');
      return;
    }

    console.log('🔧 [AUTOCOMPLETE] isGoogleLoaded = true, intentando inicializar...');
    
    // Función para inicializar el autocompletado con reintentos
    const initAutocomplete = (attempt: number = 0): boolean => {
      const MAX_ATTEMPTS = 10;
      
      if (attempt >= MAX_ATTEMPTS) {
        console.error('❌ [AUTOCOMPLETE] Máximo de intentos alcanzado');
        return false;
      }

      const deliveryInput = document.getElementById('delivery-destination-autocomplete') as HTMLInputElement;
      
      if (!deliveryInput) {
        console.log(`⏳ [AUTOCOMPLETE] Intento ${attempt + 1}/${MAX_ATTEMPTS}: Input no encontrado, reintentando en 200ms...`);
        setTimeout(() => initAutocomplete(attempt + 1), 200);
        return false;
      }

      if (deliveryAutocompleteRef2.current) {
        console.log('✅ [AUTOCOMPLETE] Ya está inicializado');
        return true;
      }

      const google = (window as any).google;
      if (!google || !google.maps || !google.maps.places) {
        console.log(`⏳ [AUTOCOMPLETE] Intento ${attempt + 1}/${MAX_ATTEMPTS}: Google Maps no disponible, reintentando...`);
        setTimeout(() => initAutocomplete(attempt + 1), 200);
        return false;
      }

      try {
        console.log('🎯 [AUTOCOMPLETE] Inicializando autocompletado...');
        deliveryAutocompleteRef2.current = new google.maps.places.Autocomplete(deliveryInput, {
          componentRestrictions: { country: 'mx' },
          fields: ['geometry', 'formatted_address', 'address_components']
        });
        
        deliveryAutocompleteRef2.current.addListener('place_changed', () => {
          console.log('🎯 [DESTINO] Evento place_changed disparado');
          const place = deliveryAutocompleteRef2.current?.getPlace();
          if (place && place.geometry && place.geometry.location) {
            console.log('✅ [DESTINO] Dirección seleccionada:', place.formatted_address);
            console.log('✅ [DESTINO] Coordenadas:', place.geometry.location.lat(), place.geometry.location.lng());
            setDeliveryAddressInput(place.formatted_address || '');
            setDestLat(place.geometry.location.lat());
            setDestLng(place.geometry.location.lng());
          } else {
            console.warn('⚠️ [DESTINO] Lugar seleccionado sin geometría');
          }
        });
        
        console.log('✅ [AUTOCOMPLETE] Inicializado correctamente en intento', attempt + 1);
        return true;
      } catch (err) {
        console.error('❌ [AUTOCOMPLETE] Error al inicializar:', err);
        setTimeout(() => initAutocomplete(attempt + 1), 200);
        return false;
      }
      
      return false;
    };

    // Iniciar inicialización con reintentos
    const success = initAutocomplete(0);
    
    if (!success) {
      console.log('⏳ [AUTOCOMPLETE] Inicialización en proceso con reintentos automáticos...');
    }
  }, [isGoogleLoaded]);

  // 🗺️ Calcular ruta y tarifa
  const handleCalculateRoute = async () => {
    if (!deliveryAddressInput) {
      alert('⚠️ Por favor escribe tu destino');
      return;
    }

    if (deliveryLat === null || deliveryLng === null) {
      alert('⚠️ Primero selecciona tu ubicación actual en el mapa de arriba');
      return;
    }

    // Usar coordenadas del autocompletado si están disponibles, sino geocodificar
    let finalDestLat = destLat;
    let finalDestLng = destLng;
    
    if (finalDestLat === null || finalDestLng === null) {
      console.log('⚠️ [RUTA] No hay coordenadas del autocompletado, intentando geocodificar...');
      
      setIsCalculatingRoute(true);
      
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddressInput)}&limit=1&countrycodes=mx`,
          {
            headers: {
              'User-Agent': 'MiAppDelivery/1.0'
            }
          }
        );
        
        const geocodeData = await geocodeResponse.json();
        
        console.log('Respuesta de geocodificación:', geocodeData);
        
        if (!geocodeData || geocodeData.length === 0) {
          setIsCalculatingRoute(false);
          alert('❌ No se pudo encontrar la dirección: ' + deliveryAddressInput + '\n\nIntenta con una dirección más específica.\nEjemplo: "Calle Maclovio Herrera 305, Fresnillo, Zacatecas"');
          return;
        }
        
        finalDestLat = parseFloat(geocodeData[0].lat);
        finalDestLng = parseFloat(geocodeData[0].lon);
        
        console.log('Coordenadas destino (geocoding):', { lat: finalDestLat, lng: finalDestLng });
      } catch (err) {
        setIsCalculatingRoute(false);
        console.error('❌ [RUTA] Error en geocodificación:', err);
        alert('❌ Error al buscar la dirección. Intenta de nuevo.');
        return;
      }
    } else {
      console.log('✅ [RUTA] Usando coordenadas del autocompletado:', { lat: finalDestLat, lng: finalDestLng });
    }

    setIsCalculatingRoute(true);
    
    try {
      console.log('=== CALCULANDO RUTA ===');
      console.log('Origen:', { lat: deliveryLat, lng: deliveryLng });
      console.log('Destino:', deliveryAddressInput);
      console.log('Coordenadas destino:', { lat: finalDestLat, lng: finalDestLng });
      
      // Calcular distancia usando fórmula Haversine
      const distance = calculateDistance(deliveryLat, deliveryLng, finalDestLat!, finalDestLng!);
      
      console.log('Distancia calculada:', distance, 'km');
      
      // Calcular tarifa según tabla de precios
      const price = calculatePriceFromDistance(distance);
      
      console.log('Tarifa calculada:', price, 'MXN');
      
      // Guardar resultados
      setDistance(distance);
      setPrice(price);
      
      setIsCalculatingRoute(false);
      
    } catch (err) {
      setIsCalculatingRoute(false);
      console.error('❌ [RUTA] Error:', err);
      alert('❌ Error al calcular la ruta. Intenta de nuevo.');
    }
  };

  // Fórmula Haversine para calcular distancia entre dos puntos
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Tabla de precios según distancia
  const calculatePriceFromDistance = (distanceKm: number): number => {
    if (distanceKm <= 0.1) return 30;      // 0.1 km o menos
    if (distanceKm <= 1) return 30;        // hasta 1 km
    if (distanceKm <= 2) return 35;        // hasta 2 km
    if (distanceKm <= 2.5) return 40;      // hasta 2.5 km
    if (distanceKm <= 3) return 45;        // hasta 3 km
    if (distanceKm <= 5) return 50;        // hasta 5 km
    
    // Para distancias mayores a 5 km, agregar $5 por cada km adicional
    const kmAdicionales = Math.ceil(distanceKm - 5);
    return 50 + (kmAdicionales * 5);
  };

  // Manejar cambio de casilla "Es otra dirección"
  const handleAlternativeAddressToggle = (checked: boolean) => {
    setUseAlternativeAddress(checked);
    if (checked) {
      // Limpiar campos manuales para evitar confusión
      setStreet('');
      setHouseNumber('');
      setSuburb('');
      setCity('');
      setState('');
      setPostcode('');
      setDeliveryLat(null);
      setDeliveryLng(null);
    } else {
      // Si desactiva, limpiar la alternativa
      setAlternativeAddressInput('');
      setDeliveryLat(null);
      setDeliveryLng(null);
    }
  };

  // Crear pedido de motocicleta
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar campos obligatorios de dirección
    if (!useAlternativeAddress && (!street || !houseNumber || !suburb || !city || !state || !postcode)) {
      setError('Por favor completa todos los campos de dirección (Calle, Número, Colonia, Ciudad, Estado, Código Postal)');
      return;
    }

    if (useAlternativeAddress && !alternativeAddressInput) {
      setError('Por favor selecciona una dirección de entrega usando el autocompletado de Google Maps');
      return;
    }

    // Validar coordenadas obligatorias
    if (deliveryLat === null || deliveryLng === null) {
      setError('Por favor obtén tu ubicación GPS presionando el botón "🛰️ Mi Ubicación"');
      return;
    }

    setLoading(true);

    try {
      // Si no hay clientId (usuario sin sesión), generar uno automático basado en timestamp
      let clientId = AuthService.getClientId();
      
      if (!clientId) {
        // Generar clientId automático para usuarios sin cuenta
        clientId = Date.now().toString();
        console.log('ℹ️ Usuario sin cuenta, generando clientId automático:', clientId);
      } else {
        console.log('✅ Cliente autenticado:', clientId);
      }

      // Coordenadas por defecto (Fresnillo, Zacatecas)
      const defaultLat = 24.6536;
      const defaultLng = -102.8738;
     
      // Usar coordenadas del GPS si están disponibles, sino usar las por defecto
      const lat = deliveryLat !== null ? deliveryLat : defaultLat;
      const lng = deliveryLng !== null ? deliveryLng : defaultLng;

      // Formatear el campo items con las direcciones de origen y destino
      const origenAddress = `${street}${houseNumber ? ' #' + houseNumber : ''}${suburb ? ', ' + suburb : ''}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${postcode ? ', ' + postcode : ''}`;
      const destinoAddress = deliveryAddressInput || 'Por definir';
      
      const itemsFormatted = `Servicio de Motocicleta
🚩 Origen: ${origenAddress}
🏁 Destino: ${destinoAddress}
${items ? `📝 Descripción: ${items}` : ''}`;

      const orderData = {
        clientId,
        clientName,
        clientPhone,
        clientEmail,
        // Construir dirección completa con todos los campos (ORIGEN)
        clientAddress: origenAddress,
        clientLocation: {
          latitude: lat,
          longitude: lng
        },
        serviceType: 'MOTORCYCLE_TAXI',
        status: 'PENDING',
        createdAt: Date.now(),
        // Dirección de DESTINO (la que escribió el usuario)
        pickupAddress: origenAddress,
        deliveryAddress: destinoAddress,
        deliveryLocation: {
          latitude: destLat !== null ? destLat : lat,
          longitude: destLng !== null ? destLng : lng
        },
        items: itemsFormatted,
        notes: `Servicio de motocicleta - Viaje rápido y seguro`,
        distance: distance || undefined,
        deliveryCost: price || undefined
      };

      console.log('📦 Creando pedido de motocicleta:', orderData);

      try {
        const orderId = await OrderService.createOrder(orderData);
        
        console.log('✅ Pedido creado:', orderId);

        if (orderId) {
          alert('✅ Solicitud de viaje creada exitosamente\n\nNúmero de pedido: ' + orderId.slice(-6));
          navigate(`/seguimiento?pedido=${orderId}`);
        } else {
          console.error('❌ OrderService retornó null');
          setError('Error al crear la solicitud de viaje. Intenta de nuevo.');
        }
      } catch (orderError) {
        console.error('❌ ERROR AL CREAR PEDIDO:', orderError);
        const errorMessage = orderError instanceof Error ? orderError.message : 'Error desconocido';
        setError(`Error al crear la solicitud: ${errorMessage}. Revisa la consola (F12) para más detalles.`);
      }
    } catch (err) {
      console.error('❌ ERROR GENERAL:', err);
      setError('Error general al crear la solicitud. Revisa la consola (F12).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '1rem'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => navigate('/servicios')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ← Regresar
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          🏍️ Solicitud de Viaje en Motocicleta
        </h1>
      </header>

      <form onSubmit={handleCreateOrder}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          
          {/* SECCIÓN 0: Información del Cliente */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#667eea',
              marginBottom: '1.5rem',
              borderBottom: '3px solid #667eea',
              paddingBottom: '0.75rem'
            }}>
              👤 Información del Cliente
            </h2>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>👤 Nombre Completo *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Ej: Juan Pérez García"
                />
              </div>

              <div>
                <label style={labelStyle}>📞 Teléfono *</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Ej: 4921234567"
                />
              </div>

              <div>
                <label style={labelStyle}>📧 Correo Electrónico *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Ej: juan@correo.com"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 1: Dirección de Entrega (con mapa) - AHORA PRIMERO */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '3px solid #10b981',
              paddingBottom: '0.75rem'
            }}>
              📍 Dirección de Entrega
            </h2>

            {/* Casilla "Es otra dirección diferente" */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useAlternativeAddress}
                  onChange={(e) => handleAlternativeAddressToggle(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: '600', color: '#374151' }}>¿Es otra dirección diferente a mi ubicación actual?</span>
              </label>
            </div>

            {!useAlternativeAddress ? (
              /* Campos manuales originales - OCULTOS PERO FUNCIONALES */
              <>
                <div style={{ display: 'none' }}>
                  <div>
                    <label style={labelStyle}>🏠 Calle *</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required={!useAlternativeAddress}
                      style={inputStyle}
                      placeholder="Ej. Av. Hidalgo"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🔢 Número *</label>
                    <input
                      type="text"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      required={!useAlternativeAddress}
                      style={inputStyle}
                      placeholder="Ej. 123"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🏘️ Colonia *</label>
                    <input
                      type="text"
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                      required={!useAlternativeAddress}
                      style={inputStyle}
                      placeholder="Ej. Centro"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🏙️ Ciudad *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required={!useAlternativeAddress}
                      style={inputStyle}
                      placeholder="Ej. Fresnillo"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>📍 Estado *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required={!useAlternativeAddress}
                      style={inputStyle}
                      placeholder="Ej. Zacatecas"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>📬 Código Postal *</label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      required={!useAlternativeAddress}
                      style={inputStyle}
                      placeholder="Ej. 99000"
                    />
                  </div>
                </div>

                {/* Confirmación de Dirección - Mensaje Verde - OCULTO */}
                {(street && houseNumber && suburb && city && state && postcode) && (
                  <div style={{ display: 'none' }}>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#065f46',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      ✅ ¡TU DIRECCIÓN ES:
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      color: '#047857',
                      margin: '0.75rem 0 0 0',
                      fontWeight: '600'
                    }}>
                      {street} #{houseNumber}, {suburb}
                      <br />
                      {city}, {state} {postcode}
                    </p>
                  </div>
                )}

                {/* Coordenadas GPS - OCULTAS */}
                {(deliveryLat !== null || deliveryLng !== null) && (
                  <div style={{ display: 'none' }}>
                    <div>
                      <label style={{ ...labelStyle, color: '#1e40af', fontWeight: 'bold' }}>
                        🌎 Latitud
                      </label>
                      <input
                        type="text"
                        value={deliveryLat !== null ? deliveryLat.toString() : ''}
                        readOnly
                        style={{
                          ...inputStyle,
                          backgroundColor: '#dbeafe',
                          border: '1px solid #93c5fd',
                          fontWeight: '600',
                          color: '#1e40af'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, color: '#1e40af', fontWeight: 'bold' }}>
                        🧭 Longitud
                      </label>
                      <input
                        type="text"
                        value={deliveryLng !== null ? deliveryLng.toString() : ''}
                        readOnly
                        style={{
                          ...inputStyle,
                          backgroundColor: '#dbeafe',
                          border: '1px solid #93c5fd',
                          fontWeight: '600',
                          color: '#1e40af'
                        }}
                      />
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>
                  ℹ️ Las coordenadas se obtendrán automáticamente al crear el pedido
                </p>

                {/* Componente de búsqueda de dirección con mapa */}
                <AddressSearchWithMap
                  onAddressSelect={(data) => {
                    setDeliveryLat(data.lat);
                    setDeliveryLng(data.lng);
                    setStreet(data.street);
                    setHouseNumber(data.houseNumber);
                    setSuburb(data.suburb);
                    setCity(data.city);
                    setState(data.state);
                    setPostcode(data.postcode);
                  }}
                />
              </>
            ) : (
              /* Nueva interfaz de búsqueda estilo motocicleta */
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>🏁 Escribe tu dirección de entrega:</label>
                  <input
                    type="text"
                    id="alternative-delivery-autocomplete"
                    value={alternativeAddressInput}
                    onChange={(e) => setAlternativeAddressInput(e.target.value)}
                    required={useAlternativeAddress}
                    style={inputStyle}
                    placeholder="Ej: Juana Gallo, Fresnillo, Zac."
                  />
                  {isGoogleLoaded ? (
                    <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                      ✨ Escribe y selecciona una dirección sugerida por Google Maps
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                      ⚠️ Escribe tu dirección manualmente (Google Maps no disponible)
                    </p>
                  )}
                </div>

                {/* Mapa visualizador de la dirección seleccionada */}
                {deliveryLat && deliveryLng && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: '#d1fae5',
                    borderRadius: '0.5rem',
                    border: '2px solid #10b981',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#065f46',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      ✅ ¡TU DIRECCIÓN ES:
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      color: '#047857',
                      margin: '0.75rem 0 0 0',
                      fontWeight: '600'
                    }}>
                      {alternativeAddressInput || `${street} ${houseNumber}, ${suburb}`}
                      <br />
                      {city}, {state} {postcode}
                    </p>
                    <div style={{ marginTop: '1rem', height: '200px', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${deliveryLng - 0.005},${deliveryLat - 0.005},${deliveryLng + 0.005},${deliveryLat + 0.005}&layer=mapnik&marker=${deliveryLat},${deliveryLng}`}
                        style={{ border: '1px solid #ccc' }}
                      ></iframe>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem' }}>
                      📍 Punto exacto en el mapa
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECCIÓN 2: ¿Cuál es tu destino? */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#667eea',
              marginBottom: '1.5rem',
              textAlign: 'center',
              borderBottom: '3px solid #667eea',
              paddingBottom: '0.75rem'
            }}>
              🎯 ¿Cuál es tu destino?
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ ...labelStyle, fontSize: '1rem', fontWeight: 'bold' }}>🏁 Dirección de Entrega:</label>
              <input
                type="text"
                id="delivery-destination-autocomplete"
                value={deliveryAddressInput}
                onChange={(e) => setDeliveryAddressInput(e.target.value)}
                style={{ ...inputStyle, fontSize: '1.1rem', padding: '1rem' }}
                placeholder="Ej: Juana Gallo, Fresnillo, Zac."
              />
              {isGoogleLoaded ? (
                <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  ✨ Escribe y selecciona una dirección sugerida por Google Maps
                </p>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  ⚠️ Cargando Google Maps...
                </p>
              )}
            </div>

            {/* Botón Calcular Ruta y Tarifa */}
            <button
              type="button"
              onClick={handleCalculateRoute}
              disabled={!deliveryAddressInput || isCalculatingRoute}
              style={{
                width: '100%',
                padding: '1.25rem',
                backgroundColor: (!deliveryAddressInput) ? '#9ca3af' : isCalculatingRoute ? '#fbbf24' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                cursor: (!deliveryAddressInput) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              {isCalculatingRoute ? (
                <>
                  <span>⏳</span>
                  <span>Calculando tu ruta...</span>
                </>
              ) : (
                <>
                  <span>🗺️</span>
                  <span>Calcular Ruta y Tarifa</span>
                </>
              )}
            </button>
          </section>

          {/* SECCIÓN 3: Resultado del cálculo (solo aparece después de calcular) */}
          {distance !== null && price !== null && (
            <section style={{ 
              marginBottom: '2rem',
              padding: '2rem 1rem',
              backgroundColor: '#d1fae5',
              borderRadius: '1rem',
              border: '2px solid #10b981',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: '#065f46',
                margin: '0 0 1.5rem 0'
              }}>
                ✅ ¡Ruta calculada!
              </p>
              
              {/* Precio destacado */}
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                color: '#047857',
                margin: '1.5rem 0',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '2px dashed #10b981'
              }}>
                💰 ${price} MXN
              </div>
              
              {/* Distancia */}
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#059669',
                margin: '0 0 1.5rem 0',
                fontWeight: '600'
              }}>
                🗺️ Distancia: {distance.toFixed(2)} km
              </p>

              {/* Origen y Destino */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '2px solid #10b981',
                textAlign: 'left'
              }}>
                {/* Origen */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    fontWeight: 'bold',
                    margin: '0 0 0.5rem 0',
                    textTransform: 'uppercase'
                  }}>
                    🚩 Mi Ubicación:
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    margin: 0,
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    {street} #{houseNumber}, {suburb}
                    <br />
                    {city}, {state} {postcode}
                  </p>
                </div>

                {/* Línea divisoria */}
                <div style={{
                  height: '2px',
                  backgroundColor: '#e5e7eb',
                  margin: '1rem 0'
                }}></div>

                {/* Destino */}
                <div>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    fontWeight: 'bold',
                    margin: '0 0 0.5rem 0',
                    textTransform: 'uppercase'
                  }}>
                    📍 Destino:
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    margin: 0,
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    {deliveryAddressInput}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? '⏳ Creando Pedido...' : '✅ Confirmar Pedido'}
              </button>
            </section>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

// Estilos reutilizables
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '0.5rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  fontSize: '1rem'
};

export default MotorcycleServicePage;
