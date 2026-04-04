import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService from '../services/OrderService';
import AddressSearchWithMap from '../components/AddressSearchWithMap';

const CreateOrderPage: React.FC = () => {
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
  
  // Tipo de servicio
  const [serviceType, setServiceType] = useState('');
  
  // Campos específicos por tipo de servicio
  // 🍔 FOOD - Restaurante
  const [restaurantName, setRestaurantName] = useState('');
  
  // ⛽ GASOLINE - Gasolina
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelType, setFuelType] = useState('Magna');
  
  // 📝 STATIONERY - Papelería
  const [stationeryItems, setStationeryItems] = useState('');
  const [printServices, setPrintServices] = useState('');
  const [specificStore, setSpecificStore] = useState('');
  
  // 💊 MEDICINES - Medicamentos
  const [medicineList, setMedicineList] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [needToPickupPrescription, setNeedToPickupPrescription] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('');
  
  // 🍺 BEVERAGES - Cervezas y Cigarros
  const [beerBrands, setBeerBrands] = useState('');
  const [cigaretteBrands, setCigaretteBrands] = useState('');
  const [quantities, setQuantities] = useState('');
  
  // 💧 WATER - Garrafones
  const [waterBottlesCount, setWaterBottlesCount] = useState('');
  
  // 🔥 GAS - Gas LP
  const [gasAmount, setGasAmount] = useState('');
  const [tankSize, setTankSize] = useState('');
  
  // 📦 PAYMENTS - Pagos o Cobros
  const [paymentType, setPaymentType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  
  // 🎁 FAVORS - Favores
  const [favorType, setFavorType] = useState('');
  const [pickupLocationForFavor, setPickupLocationForFavor] = useState('');
  const [_pickupLat, _setPickupLat] = useState<number | null>(null);
  const [_pickupLng, _setPickupLng] = useState<number | null>(null);
  
  // OCULTO - Variables necesarias para el código pero no usadas en UI visible
  const [_requiresPickup, _setRequiresPickup] = useState(false);
  const [_pickupAddress, _setPickupAddress] = useState('');
  const [_pickupName, _setPickupName] = useState('');
  const [_pickupUrl, _setPickupUrl] = useState('');
  
  // Detalles del pedido
  const [items, setItems] = useState('');
  const [_notes, _setNotes] = useState('');
  const [_confirmationCode, _setConfirmationCode] = useState('');
  
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
    console.log('🛰️ [CREATE ORDER] INICIANDO PROCESO AUTOMÁTICO DE UBICACIÓN...');
    
    // Cargar Google Maps para autocompletado
    const loadGoogleMaps = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        });
        await loader.load();
        setIsGoogleLoaded(true);
        console.log('✅ [GOOGLE MAPS] API cargada correctamente');
      } catch (err) {
        console.error('❌ [GOOGLE MAPS] Error al cargar:', err);
      }
    };
    loadGoogleMaps();
    
    // Función para obtener ubicación con reintentos automáticos
    const obtenerUbicacionAutomatica = (intentos: number = 0) => {
      const MAX_INTENTOS = 3;
      
      if (intentos >= MAX_INTENTOS) {
        console.warn('⚠️ [CREATE ORDER] Máximo de intentos alcanzado, usando coordenadas por defecto');
        console.log('ℹ️ [INFO] El usuario deberá seleccionar su ubicación manualmente en el mapa');
        return;
      }
      
      console.log(`🛰️ [CREATE ORDER] Intento ${intentos + 1} de ${MAX_INTENTOS}...`);
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
              
            console.log('✅ [CREATE ORDER] Ubicación obtenida en intento', intentos + 1, ':', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            
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
              console.log('ℹ️ [CREATE ORDER] Dirección obtenida (NO se llena automáticamente):', { road, city: c });
              
            } catch (err) {
              console.warn('⚠️ [CREATE ORDER] No se pudo obtener la dirección exacta, pero las coordenadas están guardadas');
              console.error('   Error:', err);
            }
          },
          (error) => {
            console.warn('⚠️ [CREATE ORDER] Error en intento', intentos + 1, ':', error.message);
            
            // Manejar diferentes tipos de error
            if (error.code === 1) {
              console.log('ℹ️ [CREATE ORDER] Usuario denegó el permiso de ubicación');
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
        console.warn('⚠️ [CREATE ORDER] Geolocalización no disponible en este navegador');
        usarCoordenadasPorDefecto();
      }
    };
    
    // Función para usar coordenadas por defecto (Fresnillo, Zacatecas)
    const usarCoordenadasPorDefecto = () => {
      const defaultLat = 24.6536;
      const defaultLng = -102.8738;
      
      console.log('⚠️ [CREATE ORDER] Usando coordenadas por defecto:', defaultLat, defaultLng);
      console.log('📍 [CREATE ORDER] El usuario deberá seleccionar su ubicación en el mapa');
      
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
      console.log('✅ [CREATE ORDER] Ya hay coordenadas disponibles:', deliveryLat, deliveryLng);
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

  const serviceTypes = [
    { value: 'FOOD', label: '🍔 Comida', icon: 'Comida de restaurante' },
    { value: 'GASOLINE', label: '⛽ Gasolina', icon: 'Combustible' },
    { value: 'STATIONERY', label: '📝 Papelería', icon: 'Artículos de oficina' },
    { value: 'MEDICINES', label: '💊 Medicamentos', icon: 'Farmacia' },
    { value: 'BEVERAGES', label: '🍺 Cervezas y Cigarros', icon: 'Bebidas y tabaco' },
    { value: 'WATER', label: '💧 Garrafones de Agua', icon: 'Agua purificada' },
    { value: 'GAS', label: '🔥 Gas', icon: 'Gas LP' },
    { value: 'PAYMENTS', label: '📦 Pagos o Cobros', icon: 'Gestiones' },
    { value: 'FAVORS', label: '🎁 Favores', icon: 'Mandados especiales' }
  ];

  // Crear pedido
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!serviceType) {
      setError('Por favor selecciona un tipo de servicio');
      return;
    }

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

    // OCULTO - Validación de recogida ya no necesaria
    // if (requiresPickup && !pickupAddress) {
    //   setError('Por favor ingresa la dirección de recogida');
    //   return;
    // }

    setLoading(true);

    try {
      // Test de conexión a Firebase
      console.log('🔍 Probando conexión a Firebase antes de crear pedido...');
      
      const clientId = AuthService.getClientId();
      
      if (!clientId) {
        console.error('❌ No hay clientId en localStorage');
        console.log('localStorage:', {
          clientId: localStorage.getItem('clientId'),
          clientEmail: localStorage.getItem('clientEmail')
        });
        setError('Error: No se encontró el ID del cliente. Intenta iniciar sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Cliente encontrado:', clientId);

      // Coordenadas por defecto (Fresnillo, Zacatecas)
    const defaultLat= 24.6536;
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
      serviceType,
      status: 'PENDING',
      createdAt: Date.now(),
      // OCULTO - Datos de recogida ya no se envían
      // ...(requiresPickup && {
      //   pickupAddress,
      //   pickupName,
      //   pickupUrl
      // }),
      // Construir dirección de entrega con todos los campos
      deliveryAddress: `${street}${houseNumber ? ' #' + houseNumber : ''}${suburb ? ', ' + suburb : ''}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${postcode ? ', ' + postcode : ''}`,
      deliveryLocation: {
        latitude: lat,
       longitude: lng
      },
      // Campos específicos por tipo de servicio
      ...(serviceType === 'FOOD' && {
        restaurantName,
        items: `Restaurante: ${restaurantName}\n${items}`
      }),
      ...(serviceType === 'GASOLINE' && {
        fuelType,
        fuelLiters,
        items: `Combustible: ${fuelType}\nCantidad: ${fuelLiters} litros\n${items}`
      }),
      ...(serviceType === 'STATIONERY' && {
        stationeryItems,
        printServices,
        specificStore,
        items: `Artículos: ${stationeryItems}\n${printServices ? 'Impresiones: ' + printServices + '\n' : ''}${specificStore ? 'Tienda: ' + specificStore + '\n' : ''}${items}`
      }),
      ...(serviceType === 'MEDICINES' && {
        medicineList,
        hasPrescription,
        needToPickupPrescription,
        pharmacyName,
        items: `Medicamentos: ${medicineList}${pharmacyName ? '\nFarmacia: ' + pharmacyName : ''}${hasPrescription ? '\nRequiere receta: Si' : ''}${needToPickupPrescription ? '\nRecoger receta fisica: Si' : ''}\n${items}`
      }),
      ...(serviceType === 'BEVERAGES' && {
        beerBrands,
        cigaretteBrands,
        quantities,
        items: `Cervezas: ${beerBrands}\nCigarros: ${cigaretteBrands}\nCantidades: ${quantities}\n${items}`
      }),
      ...(serviceType === 'WATER' && {
        waterBottlesCount,
        items: `Garrafones: ${waterBottlesCount}\n${items}`
      }),
      ...(serviceType === 'GAS' && {
        gasAmount,
        tankSize,
        items: `Monto: $${gasAmount} pesos\nTanque: ${tankSize}\n${items}`
      }),
      ...(serviceType === 'PAYMENTS' && {
        paymentType,
        serviceProvider,
        items: `Tipo de pago: ${paymentType}\nProveedor: ${serviceProvider}\n${items}`
      }),
      ...(serviceType === 'FAVORS' && {
        favorType,
        pickupLocationForFavor,
        items: `Tipo de favor: ${favorType}\nDescripción: ${items}\nRecoger en: ${pickupLocationForFavor}\n${items}`
      }),
      // Si no es ningún tipo específico, usar items genérico
      ...(!['FOOD', 'GASOLINE', 'STATIONERY', 'MEDICINES', 'BEVERAGES', 'WATER', 'GAS', 'PAYMENTS', 'FAVORS'].includes(serviceType) && {
        items
      })
      // OCULTO - Notas y código ya no se incluyen
    };

      console.log('📦 Creando pedido con datos:', {
        clientId,
        clientName,
        serviceType,
        hasItems: !!items,
        orderData
      });

      try {
        const orderId = await OrderService.createOrder(orderData);
        
        console.log('✅ Pedido creado:', orderId);

        if (orderId) {
          alert('✅ Pedido creado exitosamente\n\nNúmero de pedido: ' + orderId.slice(-6));
          navigate('/mis-pedidos');
        } else {
          console.error('❌ OrderService retornó null');
          setError('Error al crear el pedido. Intenta de nuevo.');
        }
      } catch (orderError) {
        console.error('❌ ERROR AL CREAR PEDIDO:', orderError);
        const errorMessage = orderError instanceof Error ? orderError.message : 'Error desconocido';
        setError(`Error al crear el pedido: ${errorMessage}. Revisa la consola (F12) para más detalles.`);
      }
    } catch (err) {
      console.error('❌ ERROR GENERAL:', err);
      setError('Error general al crear el pedido. Revisa la consola (F12).');
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
          onClick={() => navigate(-1)}
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
          📦 Crear Nuevo Pedido
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
          
          {/* Botón de Datos de Prueba - OCULTO */}
          {/* 
          <div style={{
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '2px dashed #0ea5e9',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#0369a1',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              🧪 ¿Quieres probar rápidamente?
            </p>
            <button
              type="button"
              onClick={fillTestData}
              style={{
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
            >
              ⚡ Llenar Datos de Prueba Automáticamente
            </button>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.5rem'
            }}>
              Llena todos los campos obligatorios con datos realistas
            </p>
          </div>
          */}

          {/* Datos del Cliente */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #667eea',
              paddingBottom: '0.5rem'
            }}>
              👤 Datos del Cliente
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

          {/* Tipo de Servicio - MOVIDO DESPUÉS DE DATOS DEL CLIENTE */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #f59e0b',
              paddingBottom: '0.5rem'
            }}>
              🎯 Tipo de Servicio
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {serviceTypes.map((service) => {
                const isSelected = serviceType === service.value;
                
                // Si ya hay un servicio seleccionado y este no es, no lo mostrar
                if (serviceType && !isSelected) {
                  return null;
                }
                
                return (
                  <div
                    key={service.value}
                    onClick={() => {
                      // Toggle: si ya está seleccionado, deseleccionar
                      setServiceType(isSelected ? '' : service.value);
                    }}
                    style={{
                      padding: '1rem',
                      border: isSelected 
                        ? '2px solid #667eea' 
                        : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: isSelected 
                        ? '#eff6ff' 
                        : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {service.label.split(' ')[0]}
                    </div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {service.label.split(' ').slice(1).join(' ')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {service.icon}
                    </div>
                    {isSelected && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.75rem', 
                        color: '#667eea',
                        fontWeight: 'bold'
                      }}>
                        ✓ Seleccionado - Click para quitar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Campos Específicos por Tipo de Servicio */}
          {serviceType && (
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem',
                borderBottom: '2px solid #10b981',
                paddingBottom: '0.5rem'
              }}>
                📋 Detalles del Servicio Seleccionado
              </h2>

              {/* 🍔 FOOD - Comida */}
              {serviceType === 'FOOD' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>🍽️ Nombre del Restaurante o Local *</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Ej. Tacos Don Pancho, KFC, etc."
                    />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ℹ️ La comida será recogida en este lugar y entregada en tu domicilio
                  </p>
                </div>
              )}

              {/* ⛽ GASOLINE - Gasolina */}
              {serviceType === 'GASOLINE' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>⛽ Tipo de Combustible *</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="Magna">Magna (Verde)</option>
                      <option value="Premium">Premium (Roja)</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>📊 Cantidad de Litros *</label>
                    <input
                      type="number"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Ej. 20"
                      step="0.1"
                    />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ℹ️ El repartidor irá a la gasolinera más cercana y entregará el combustible en tu domicilio
                  </p>
                </div>
              )}

              {/* 📝 STATIONERY - Papelería */}
              {serviceType === 'STATIONERY' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>📝 Artículos que Necesitas *</label>
                    <textarea
                      value={stationeryItems}
                      onChange={(e) => setStationeryItems(e.target.value)}
                      required
                      style={{ ...inputStyle, minHeight: '80px' }}
                      placeholder="Ej. 5 carpetas amarillas, 10 bolígrafos azules, 100 hojas carta..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🖨️ Servicios de Impresión (opcional)</label>
                    <textarea
                      value={printServices}
                      onChange={(e) => setPrintServices(e.target.value)}
                      style={{ ...inputStyle, minHeight: '60px' }}
                      placeholder="Ej. 10 impresiones blanco y negro, 5 a color, engargolados, etc."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🏪 ¿Alguna papelería en específico? (opcional)</label>
                    <input
                      type="text"
                      value={specificStore}
                      onChange={(e) => setSpecificStore(e.target.value)}
                      style={inputStyle}
                      placeholder="Ej. Office Depot, Papelería López, etc."
                    />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ℹ️ Los artículos serán comprados y entregados en tu domicilio
                  </p>
                </div>
              )}

              {/* 💊 MEDICINES - Medicamentos */}
              {serviceType === 'MEDICINES' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>💊 Medicamentos que Necesitas *</label>
                    <textarea
                      value={medicineList}
                      onChange={(e) => setMedicineList(e.target.value)}
                      required
                      style={{ ...inputStyle, minHeight: '80px' }}
                      placeholder="Ej. Paracetamol 500mg, Ibuprofeno 400mg, Amoxicilina 500mg..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🏪 ¿Alguna farmacia en específico? (opcional)</label>
                    <input
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      style={inputStyle}
                      placeholder="Ej. Farmacias Guadalajara, Del Ahorro, etc."
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#dc2626', fontWeight: 'bold' }}>
                      💊 ¿Requiere receta médica?
                    </label>
                    <select
                      value={hasPrescription ? 'yes' : 'no'}
                      onChange={(e) => setHasPrescription(e.target.value === 'yes')}
                      required
                      style={inputStyle}
                    >
                      <option value="no">No, es sin receta</option>
                      <option value="yes">Sí, requiere receta</option>
                    </select>
                  </div>
                  {hasPrescription && (
                    <div>
                      <label style={{ ...labelStyle, color: '#dc2626', fontWeight: 'bold' }}>
                        📄 ¿Necesita pasar por la receta física?
                      </label>
                      <select
                        value={needToPickupPrescription ? 'yes' : 'no'}
                        onChange={(e) => setNeedToPickupPrescription(e.target.value === 'yes')}
                        required
                        style={inputStyle}
                      >
                        <option value="no">No, ya tengo la receta digital/foto</option>
                        <option value="yes">Sí, necesita recoger la receta física en otro domicilio</option>
                      </select>
                    </div>
                  )}
                  {needToPickupPrescription && (
                    <div>
                      <label style={labelStyle}>📍 Dirección donde recoger la receta *</label>
                      <input
                        type="text"
                        value={_pickupAddress}
                        onChange={(e) => _setPickupAddress(e.target.value)}
                        required
                        style={inputStyle}
                        placeholder="Dirección completa donde recoger la receta"
                      />
                    </div>
                  )}
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ℹ️ Los medicamentos serán comprados y entregados en tu domicilio
                  </p>
                </div>
              )}

              {/* 🍺 BEVERAGES - Cervezas y Cigarros */}
              {serviceType === 'BEVERAGES' && (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <div>
                    <label style={labelStyle}>🍺 Marcas de Cerveza *</label>
                    <textarea
                      value={beerBrands}
                      onChange={(e) => setBeerBrands(e.target.value)}
                      required
                      style={{ ...inputStyle, minHeight: '60px' }}
                      placeholder="Ej. Corona 6-pack, Modelo 12-pack, Indio 6-pack..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>🚬 Marcas de Cigarros (opcional)</label>
                    <textarea
                      value={cigaretteBrands}
                      onChange={(e) => setCigaretteBrands(e.target.value)}
                      style={{ ...inputStyle, minHeight: '60px' }}
                      placeholder="Ej. Marlboro rojo 2 cajas, Camel blue 1 caja..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>📊 Cantidades Totales *</label>
                    <input
                      type="text"
                      value={quantities}
                      onChange={(e) => setQuantities(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Ej. 3 six-packs, 2 cajetillas"
                    />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', gridColumn: '1 / -1' }}>
                    ℹ️ Las cervezas y cigarros serán comprados y entregados en tu domicilio
                  </p>
                </div>
              )}

              {/* 💧 WATER - Garrafones de Agua */}
              {serviceType === 'WATER' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>💧 Número de Garrafones *</label>
                    <input
                      type="number"
                      value={waterBottlesCount}
                      onChange={(e) => setWaterBottlesCount(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Ej. 2"
                      min="1"
                    />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ℹ️ Los garrafones serán entregados en tu domicilio
                  </p>
                </div>
              )}

              {/* 🔥 GAS - Gas LP */}
              {serviceType === 'GAS' && (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <div>
                    <label style={labelStyle}>🔥 Monto a Cargar ($ pesos) *</label>
                    <input
                      type="number"
                      value={gasAmount}
                      onChange={(e) => setGasAmount(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Ej. 150"
                      min="1"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>📏 Tamaño del Tanque *</label>
                    <select
                      value={tankSize}
                      onChange={(e) => setTankSize(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Selecciona el tamaño</option>
                      <option value="5kg">Tanque pequeño (5kg)</option>
                      <option value="10kg">Tanque mediano (10kg)</option>
                      <option value="20kg">Tanque grande (20kg)</option>
                      <option value="30kg">Tanque industrial (30kg)</option>
                    </select>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', gridColumn: '1 / -1' }}>
                    ℹ️ El gas será cargado en tu tanque y entregado en tu domicilio
                  </p>
                </div>
              )}

              {/* 📦 PAYMENTS - Pagos o Cobros */}
              {serviceType === 'PAYMENTS' && (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <div>
                    <label style={labelStyle}>📄 Tipo de Pago/Servicio *</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Selecciona el tipo de pago</option>
                      <option value="CFE_Luz">CFE - Luz</option>
                      <option value="CFE_Gas">CFE - Gas</option>
                      <option value="Agua">Agua Potable</option>
                      <option value="Telcel">Telcel</option>
                      <option value="Movistar">Movistar</option>
                      <option value="AT&T">AT&T</option>
                      <option value="Izzi">Izzi</option>
                      <option value="Dish">Dish</option>
                      <option value="Sky">Sky</option>
                      <option value="Predial">Predial</option>
                      <option value="Seguro">Seguro</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>🏢 Proveedor del Servicio (opcional)</label>
                    <input
                      type="text"
                      value={serviceProvider}
                      onChange={(e) => setServiceProvider(e.target.value)}
                      style={inputStyle}
                      placeholder="Ej. CFE, Telcel, Municipio, etc."
                    />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', gridColumn: '1 / -1' }}>
                    ℹ️ El pago se realizará y el comprobante será entregado en tu domicilio
                  </p>
                </div>
              )}

              {/* 🎁 FAVORS - Favores/Mandados Especiales */}
              {serviceType === 'FAVORS' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>🎁 Tipo de Favor/Regalo *</label>
                    <select
                      value={favorType}
                      onChange={(e) => setFavorType(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Selecciona el tipo de favor</option>
                      <option value="Flores">Flores</option>
                      <option value="Pastel">Pastel</option>
                      <option value="Carta">Carta/Documento</option>
                      <option value="Paquete">Paquete</option>
                      <option value="Comida_Casera">Comida Casera</option>
                      <option value="Llaves">Llaves</option>
                      <option value="Ropa">Ropa</option>
                      <option value="Herramienta">Herramienta</option>
                      <option value="Mascota">Mascota</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>📝 Descripción Detallada *</label>
                    <textarea
                      value={items}
                      onChange={(e) => setItems(e.target.value)}
                      required
                      style={{ ...inputStyle, minHeight: '80px' }}
                      placeholder="Describe el favor o regalo que necesitas..."
                    />
                  </div>
                            
                  {/* Campo de dirección de recogida manual */}
                  <div>
                    <label style={{ ...labelStyle, color: '#10b981', fontWeight: 'bold' }}>
                      📍 Dirección de Recogida (escribe manualmente) *
                    </label>
                    <input
                      type="text"
                      value={pickupLocationForFavor}
                      onChange={(e) => setPickupLocationForFavor(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Ej. Av. Hidalgo #123, Colonia Centro, Fresnillo, Zac."
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      💡 Escribe la dirección completa donde debe recoger el repartidor
                    </p>
                  </div>
              
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ℹ️ El repartidor recogerá en la dirección indicada y entregará en tu domicilio
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Dirección de Entrega - MOVIDA DESPUÉS DE TIPO DE SERVICIO */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #10b981',
              paddingBottom: '0.5rem'
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
              /* Campos manuales originales */
              <>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1rem' }}>
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
                  ℹ️ Las coordenadas se obtendrán automáticamente al crear el pedido
                </p>

                {/* Componente de búsqueda de dirección con mapa - MOVIDO AL FINAL */}
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
                    disabled={!isGoogleLoaded}
                  />
                  {isGoogleLoaded && (
                    <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                      ✨ Escribe y selecciona una dirección sugerida por Google Maps
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

          {/* OCULTO - Recogida (Opcional) */}
          {/* <section style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={requiresPickup}
                onChange={(e) => setRequiresPickup(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                🏪 ¿Requiere recogida en otro lugar?
              </span>
            </label>

            {requiresPickup && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Dirección de recogida</label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    style={inputStyle}
                    placeholder="Dirección donde recoger"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nombre del lugar</label>
                  <input
                    type="text"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej. Restaurante, Farmacia, etc."
                  />
                </div>
                <div>
                  <label style={labelStyle}>URL de referencia (opcional)</label>
                  <input
                    type="url"
                    value={pickupUrl}
                    onChange={(e) => setPickupUrl(e.target.value)}
                    style={inputStyle}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </section> */}

          {/* OCULTO - Detalles del Pedido */}
          {/* <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '2px solid #8b5cf6',
              paddingBottom: '0.5rem'
            }}>
              📝 Detalles del Pedido
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Descripción de lo que necesitas *</label>
              <textarea
                value={items}
                onChange={(e) => setItems(e.target.value)}
                required
                style={{ ...inputStyle, minHeight: '100px' }}
                placeholder="Describe los productos, cantidades, marcas, etc. (OBLIGATORIO)"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Notas adicionales (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...inputStyle, minHeight: '80px' }}
                placeholder="Instrucciones especiales, referencias, etc."
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...labelStyle, color: '#6f42c1', fontWeight: 'bold' }}>
                🎫 Código de Confirmación (4 dígitos)
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, ''); // Solo números
                  if (value.length <= 4) {
                    setConfirmationCode(value);
                  }
                }}
                maxLength={4}
                style={{
                  ...inputStyle,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  backgroundColor: '#f8f0ff',
                  border: '2px solid #6f42c1'
                }}
                placeholder="0000"
              />
              <p style={{ fontSize: '0.75rem', color: '#6f42c1', marginTop: '0.5rem' }}>
                ℹ️ Este código de 4 dígitos será necesario para que el repartidor pueda finalizar la entrega
              </p>
              {!confirmationCode && (
                <button
                  type="button"
                  onClick={() => setConfirmationCode(Math.floor(1000 + Math.random() * 9000).toString())}
                  style={{
                    marginTop: '0.5rem',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  🎲 Generar Código Aleatorio
                </button>
              )}
            </div>
          </section> */}

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
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? '⏳ Creando Pedido...' : '✅ Crear Pedido'}
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

export default CreateOrderPage;
