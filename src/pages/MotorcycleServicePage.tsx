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
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  
  // Tipo de servicio - Forzado a MOTOCICLETA
  const [serviceType] = useState('MOTORCYCLE_TAXI');
  
  // Campos específicos para MOTOCICLETA - CON AUTOCOMPLETADO GOOGLE MAPS
  const [pickupAddress, setPickupAddress] = useState(''); // 🚩 Dirección de Recogida (autocompletado)
  const [deliveryAddressInput, setDeliveryAddressInput] = useState(''); // 🏁 Dirección de Entrega (autocompletado)
  const [distance, setDistance] = useState<number | null>(null); // 🗺️ Distancia calculada
  const [price, setPrice] = useState<number | null>(null); // 💰 Precio calculado
  const [isCalculating, setIsCalculating] = useState(false); // Estado de cálculo
  
  // Referencias para autocompletado
  const pickupAutocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const deliveryAutocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  // OCULTO - Variables necesarias para el código pero no usadas en UI visible
  const [_requiresPickup, _setRequiresPickup] = useState(false);
  const [_pickupAddress, _setPickupAddress] = useState('');
  const [_pickupName, _setPickupName] = useState('');
  const [_pickupUrl, _setPickupUrl] = useState('');
  const [_pickupLat, _setPickupLat] = useState<number | null>(null);
  const [_pickupLng, _setPickupLng] = useState<number | null>(null);
  
  // Detalles del pedido
  const [items, setItems] = useState(''); // Descripción del viaje
  const [_notes, _setNotes] = useState('');
  const [_confirmationCode, _setConfirmationCode] = useState('');
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🛰️ Auto-obtener ubicación al cargar la página - TOTALMENTE AUTOMÁTICO
  useEffect(() => {
    console.log('🛰️ [MOTORCYCLE] INICIANDO PROCESO AUTOMÁTICO DE UBICACIÓN...');
    
    // Función para obtener ubicación con reintentos automáticos
    const obtenerUbicacionAutomatica = (intentos: number = 0) => {
      const MAX_INTENTOS = 3;
      
      if (intentos >= MAX_INTENTOS) {
        console.warn('⚠️ [MOTORCYCLE] Máximo de intentos alcanzado, usando coordenadas por defecto');
        usarCoordenadasPorDefecto();
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
            
            // Reintentar automáticamente después de 2 segundos
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
  }, []);

  // 🗺️ Cargar Google Maps y configurar autocompletado
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        });
        
        const google = await loader.load();
        setIsGoogleLoaded(true);
        console.log('✅ [GOOGLE MAPS] API cargada correctamente');
        
        // Configurar autocompletado para recogida
        const pickupInput = document.getElementById('pickup-autocomplete') as HTMLInputElement;
        if (pickupInput) {
          pickupAutocompleteRef.current = new google.maps.places.Autocomplete(pickupInput, {
            componentRestrictions: { country: 'mx' },
            fields: ['geometry', 'formatted_address', 'name']
          });
          
          pickupAutocompleteRef.current.addListener('place_changed', () => {
            const place = pickupAutocompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              setPickupAddress(place.formatted_address);
              console.log('✅ [RECOGIDA] Dirección seleccionada:', place.formatted_address);
              
              // Calcular distancia si hay dirección de entrega
              if (deliveryAddressInput) {
                calculateDistance(pickupAddress, deliveryAddressInput);
              }
            }
          });
        }
        
        // Configurar autocompletado para entrega
        const deliveryInput = document.getElementById('delivery-autocomplete') as HTMLInputElement;
        if (deliveryInput) {
          deliveryAutocompleteRef.current = new google.maps.places.Autocomplete(deliveryInput, {
            componentRestrictions: { country: 'mx' },
            fields: ['geometry', 'formatted_address', 'name']
          });
          
          deliveryAutocompleteRef.current.addListener('place_changed', () => {
            const place = deliveryAutocompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              setDeliveryAddressInput(place.formatted_address);
              console.log('✅ [ENTREGA] Dirección seleccionada:', place.formatted_address);
              
              // Calcular distancia si hay dirección de recogida
              if (pickupAddress) {
                calculateDistance(pickupAddress, place.formatted_address);
              }
            }
          });
        }
        
      } catch (err) {
        console.error('❌ [GOOGLE MAPS] Error al cargar:', err);
      }
    };
    
    loadGoogleMaps();
  }, [pickupAddress, deliveryAddressInput]);

  // 🗺️ Calcular distancia entre dos direcciones
  const calculateDistance = async (origin: string, destination: string) => {
    if (!origin || !destination) {
      console.warn('⚠️ [DISTANCIA] Faltan direcciones para calcular');
      return;
    }

    setIsCalculating(true);
    
    try {
      const { Loader } = await import('@googlemaps/js-api-loader');
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places', 'geometry']
      });
      
      const google = await loader.load();
      const service = new google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC
        },
        (response, status) => {
          setIsCalculating(false);
          if (status === 'OK' && response) {
            const element = response.rows[0].elements[0];
            
            if (element.status === 'OK') {
              const distanceMeters = element.distance?.value || 0;
              const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
              setDistance(distanceKm);
              
              // Calcular precio automáticamente
              const calculatedPrice = calculatePriceFromDistance(distanceKm);
              setPrice(calculatedPrice);
              
              console.log('🗺️ [DISTANCIA]:', distanceKm, 'km');
              console.log('💰 [PRECIO]: $' + calculatedPrice, 'MXN');
            } else {
              console.error('❌ [DISTANCIA] Error en elemento:', element.status);
              alert('⚠️ No se pudo calcular la distancia. Verifica que ambas direcciones sean válidas.');
            }
          } else {
            console.error('❌ [DISTANCIA] Error:', status);
            alert('⚠️ Error al calcular distancia: ' + status);
          }
        }
      );
    } catch (err) {
      setIsCalculating(false);
      console.error('❌ [DISTANCIA] Error al calcular:', err);
      alert('❌ Error al calcular la distancia. Revisa tu conexión a internet.');
    }
  };

  // 💰 Calcular precio basado en la distancia (TABLA DE TARIFAS)
  const calculatePriceFromDistance = (distanceKm: number): number => {
    let price = 0;
    
    if (distanceKm <= 0.1) {
      // Hasta 100 metros
      price = 30;
    } else if (distanceKm <= 1) {
      // Hasta 1 km
      price = 30;
    } else if (distanceKm <= 2) {
      // Hasta 2 km
      price = 35;
    } else if (distanceKm <= 2.5) {
      // Hasta 2.5 km
      price = 40;
    } else if (distanceKm <= 3) {
      // Hasta 3 km
      price = 45;
    } else if (distanceKm <= 5) {
      // Hasta 5 km
      price = 50;
    } else {
      // Más de 5 km: $50 + $5 por cada km adicional
      const additionalKm = distanceKm - 5;
      const additionalCost = Math.ceil(additionalKm) * 5;
      price = 50 + additionalCost;
    }
    
    return price;
  };

  // Crear pedido de motocicleta
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar campos obligatorios de dirección
    if (!street || !houseNumber || !suburb || !city || !state || !postcode) {
      setError('Por favor completa todos los campos de dirección (Calle, Número, Colonia, Ciudad, Estado, Código Postal)');
      return;
    }

    // Validar coordenadas obligatorias
    if (deliveryLat === null || deliveryLng === null) {
      setError('Por favor obtén tu ubicación GPS presionando el botón "🛰️ Mi Ubicación"');
      return;
    }

    setLoading(true);

    try {
      const clientId = AuthService.getClientId();
      
      if (!clientId) {
        console.error('❌ No hay clientId en localStorage');
        setError('Error: No se encontró el ID del cliente. Intenta iniciar sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Cliente encontrado:', clientId);

      // Coordenadas por defecto (Fresnillo, Zacatecas)
      const defaultLat = 24.6536;
      const defaultLng = -102.8738;
     
      // Usar coordenadas del GPS si están disponibles, sino usar las por defecto
      const lat = deliveryLat !== null ? deliveryLat : defaultLat;
      const lng = deliveryLng !== null ? deliveryLng : defaultLng;

      const orderData = {
        clientId,
        clientName,
        clientPhone,
        // Construir dirección completa con todos los campos
        clientAddress: `${street}${houseNumber ? ' #' + houseNumber : ''}${suburb ? ', ' + suburb : ''}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${postcode ? ', ' + postcode : ''}`,
        clientLocation: {
          latitude: lat,
          longitude: lng
        },
        serviceType: 'MOTORCYCLE_TAXI',
        status: 'PENDING',
        createdAt: Date.now(),
        // Dirección de recogida (si aplica) - USANDO AUTOCOMPLETADO
        ...(pickupAddress && {
          pickupAddress: pickupAddress,
          items: `Recoger en: ${pickupAddress}\n${items}`
        }),
        // Construir dirección de entrega con todos los campos
        deliveryAddress: `${street}${houseNumber ? ' #' + houseNumber : ''}${suburb ? ', ' + suburb : ''}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${postcode ? ', ' + postcode : ''}`,
        deliveryLocation: {
          latitude: lat,
          longitude: lng
        },
        // Descripción del viaje
        items: items || 'Viaje en motocicleta',
        // Notas adicionales con precio
        notes: `Servicio de motocicleta - Viaje rápido y seguro. Distancia: ${distance || 'N/A'} km. Tarifa: $${price || 'N/A'} MXN`
      };

      console.log('📦 Creando pedido de motocicleta con datos:', {
        clientId,
        clientName,
        serviceType: 'MOTORCYCLE_TAXI',
        hasItems: !!items,
        orderData
      });

      try {
        const orderId = await OrderService.createOrder(orderData);
        
        console.log('✅ Pedido de motocicleta creado:', orderId);

        if (orderId) {
          alert('✅ Solicitud de viaje creada exitosamente\n\nNúmero de pedido: ' + orderId.slice(-6));
          navigate('/mis-pedidos');
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
      backgroundColor: '#eff6ff',
      padding: '1rem'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#3b82f6',
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
          
          {/* Datos del Cliente */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '0.5rem'
            }}>
              👤 Datos del Pasajero
            </h2>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label style={labelStyle}>Teléfono *</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="492 123 4567"
                />
              </div>
            </div>
          </section>

          {/* Información del Servicio - Motocicleta */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #f59e0b',
              paddingBottom: '0.5rem'
            }}>
              🏍️ Detalles del Viaje
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>🚩 Dirección de Recogida:</label>
                <input
                  type="text"
                  id="pickup-autocomplete"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  style={inputStyle}
                  placeholder="Ej: Av. Hidalgo, Fresnillo, Zac."
                  disabled={!isGoogleLoaded}
                />
                {isGoogleLoaded && (
                  <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                    ✨ Escribe y selecciona una dirección sugerida
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>🏁 Dirección de Entrega:</label>
                <input
                  type="text"
                  id="delivery-autocomplete"
                  value={deliveryAddressInput}
                  onChange={(e) => setDeliveryAddressInput(e.target.value)}
                  style={inputStyle}
                  placeholder="Ej: Juana Gallo, Fresnillo, Zac."
                  disabled={!isGoogleLoaded}
                />
                {isGoogleLoaded && (
                  <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                    ✨ Escribe y selecciona una dirección sugerida
                  </p>
                )}
              </div>

              {/* BOTÓN PARA CALCULAR DISTANCIA Y PRECIO */}
              <button
                type="button"
                onClick={() => calculateDistance(pickupAddress, deliveryAddressInput)}
                disabled={!pickupAddress || !deliveryAddressInput || isCalculating}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: (!pickupAddress || !deliveryAddressInput) ? '#9ca3af' : isCalculating ? '#fbbf24' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  cursor: (!pickupAddress || !deliveryAddressInput) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isCalculating ? (
                  <>
                    <span>⏳</span>
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    <span>🗺️</span>
                    <span>Calcular Distancia y Precio</span>
                  </>
                )}
              </button>

              {/* RESULTADOS DE DISTANCIA Y PRECIO */}
              {distance !== null && price !== null && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#d1fae5',
                  borderRadius: '0.5rem',
                  border: '2px solid #10b981',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: '#065f46',
                    margin: '0 0 0.5rem 0'
                  }}>
                    🗺️ Distancia: {distance} km
                  </p>
                  <p style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: '#047857',
                    margin: 0
                  }}>
                    💰 ${price} MXN
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#059669',
                    margin: '0.5rem 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    ✨ Tarifa calculada automáticamente
                  </p>
                </div>
              )}

              <div>
                <label style={labelStyle}>📝 Instrucciones adicionales (opcional)</label>
                <textarea
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px' }}
                  placeholder="Ej. Destino: Universidad Autónoma, llevar casco extra, pasar por Starbucks, etc."
                />
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#dbeafe',
                borderRadius: '0.5rem',
                border: '1px solid #93c5fd'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                  ℹ️ <strong>Información importante:</strong> El repartidor te recogerá en la ubicación marcada en el mapa y te llevará a tu destino de forma segura.
                </p>
              </div>
            </div>
          </section>

          {/* Dirección de Entrega (Destino del viaje) */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #10b981',
              paddingBottom: '0.5rem'
            }}>
              🎯 Tu Ubicación Actual (Para recogerte)
            </h2>
                     
            {/* Mensaje informativo - Se muestra SIEMPRE */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0',
              marginBottom: '1rem'
            }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#166534',
                margin: 0,
                lineHeight: '1.6'
              }}>
                💡 <strong>Importante:</strong> La dirección de recogida se tomará automáticamente de tu ubicación GPS o del mapa. Si deseas especificar un punto de recogida diferente, usa el campo "🚩 Dirección de Recogida" de arriba.
              </p>
            </div>
                     
            {/* Campos de dirección separados */}
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>🏠 Calle *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
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
                  required
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
                  required
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
                  required
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
                  required
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
                  required
                  style={inputStyle}
                  placeholder="Ej. 99000"
                />
              </div>
            </div>

            {/* Confirmación de Dirección - Mensaje Verde */}
            {(street && houseNumber && suburb && city && state && postcode) && (
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
                  ✅ TU UBICACIÓN PARA RECOGIDA ES:
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
                {pickupAddress && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#059669',
                    margin: '0.5rem 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    📍 Punto de referencia: {pickupAddress}
                  </p>
                )}
              </div>
            )}

            {/* Coordenadas GPS */}
            {(deliveryLat !== null || deliveryLng !== null) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#eff6ff',
                borderRadius: '0.5rem',
                border: '1px solid #bfdbfe'
              }}>
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
              ℹ️ Las coordenadas se obtendrán automáticamente al crear la solicitud
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
          </section>

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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? '⏳ Solicitando Viaje...' : '🏍️ Solicitar Viaje Ahora'}
          </button>
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
