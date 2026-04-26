import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService from '../services/OrderService';
import AddressSearchWithMap from '../components/AddressSearchWithMap';
import DeliveryTrackingMap from '../components/DeliveryTrackingMap';
import { getDatabase, ref, onValue } from 'firebase/database';

// Tipos para las pantallas
type Screen = 'client-info' | 'pickup-location' | 'destination';

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const MotorcycleServicePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estado para controlar las pantallas
  const [currentScreen, setCurrentScreen] = useState<Screen>('client-info');
  const [availableDrivers, setAvailableDrivers] = useState<number>(0);
  
  // Datos del cliente
  const [clientName, setClientName] = useState(AuthService.getClientName() || '');
  const [clientPhone, setClientPhone] = useState(AuthService.getClientPhone() || '');
  const [clientEmail, setClientEmail] = useState(AuthService.getClientEmail() || '');
  
  // Dirección de recogida
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  
  // Dirección de destino
  const [deliveryAddressInput, setDeliveryAddressInput] = useState('');
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  const deliveryAutocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  
  // Cálculo de ruta
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  
  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Cargar Google Maps
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      setIsGoogleLoaded(true);
      return;
    }
    
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
      } catch (err) {
        console.error('❌ Error al cargar Google Maps:', err);
      }
    };
    loadGoogleMaps();
  }, []);

  // Escuchar repartidores disponibles
  useEffect(() => {
    const database = getDatabase();
    const locationsRef = ref(database, 'delivery_locations');

    const unsubscribe = onValue(locationsRef, (snapshot: any) => {
      let count = 0;
      
      snapshot.forEach((child: any) => {
        const location = child.val() as DeliveryLocation;
        
        if (location && location.latitude && location.longitude) {
          const hasRecentLocation = (Date.now() - location.timestamp) < 300000;
          if (hasRecentLocation) {
            count++;
          }
        }
      });
      
      setAvailableDrivers(count);
    });

    return () => unsubscribe();
  }, []);

  // Configurar autocompletado para destino
  useEffect(() => {
    if (!isGoogleLoaded || currentScreen !== 'destination') return;

    const initAutocomplete = (attempt: number = 0): boolean => {
      const MAX_ATTEMPTS = 10;
      
      if (attempt >= MAX_ATTEMPTS) return false;

      const deliveryInput = document.getElementById('delivery-destination-autocomplete') as HTMLInputElement;
      
      if (!deliveryInput) {
        setTimeout(() => initAutocomplete(attempt + 1), 200);
        return false;
      }

      if (deliveryAutocompleteRef.current) return true;

      const google = (window as any).google;
      if (!google || !google.maps || !google.maps.places) {
        setTimeout(() => initAutocomplete(attempt + 1), 200);
        return false;
      }

      try {
        deliveryAutocompleteRef.current = new google.maps.places.Autocomplete(deliveryInput, {
          componentRestrictions: { country: 'mx' },
          fields: ['geometry', 'formatted_address']
        });
        
        if (deliveryAutocompleteRef.current) {
          deliveryAutocompleteRef.current.addListener('place_changed', () => {
            const place = deliveryAutocompleteRef.current?.getPlace();
            if (place && place.geometry?.location) {
              setDeliveryAddressInput(place.formatted_address || '');
              setDestLat(place.geometry.location.lat());
              setDestLng(place.geometry.location.lng());
              
              // Calcular ruta automáticamente cuando se selecciona una dirección
              console.log('✅ Dirección seleccionada, calculando ruta automáticamente...');
              setTimeout(() => {
                handleCalculateRoute();
              }, 500);
            }
          });
        }
        
        return true;
      } catch (err) {
        setTimeout(() => initAutocomplete(attempt + 1), 200);
        return false;
      }
    };

    initAutocomplete(0);
  }, [isGoogleLoaded, currentScreen]);

  // 🗺️ Calcular ruta y tarifa
  const handleCalculateRoute = async () => {
    if (!deliveryAddressInput) {
      alert('⚠️ Por favor escribe tu destino');
      return;
    }

    if (pickupLat === null || pickupLng === null) {
      alert('⚠️ Primero selecciona tu ubicación de recogida');
      return;
    }

    let finalDestLat = destLat;
    let finalDestLng = destLng;
    
    if (finalDestLat === null || finalDestLng === null) {
      setIsCalculatingRoute(true);
      
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddressInput)}&limit=1&countrycodes=mx`,
          {
            headers: { 'User-Agent': 'MiAppDelivery/1.0' }
          }
        );
        
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData || geocodeData.length === 0) {
          setIsCalculatingRoute(false);
          alert('❌ No se pudo encontrar la dirección. Intenta con una dirección más específica.');
          return;
        }
        
        finalDestLat = parseFloat(geocodeData[0].lat);
        finalDestLng = parseFloat(geocodeData[0].lon);
      } catch (err) {
        setIsCalculatingRoute(false);
        alert('❌ Error al buscar la dirección. Intenta de nuevo.');
        return;
      }
    }

    setIsCalculatingRoute(true);
    
    try {
      // Calcular distancia usando fórmula Haversine
      const R = 6371;
      const dLat = (finalDestLat! - pickupLat) * Math.PI / 180;
      const dLon = (finalDestLng! - pickupLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pickupLat * Math.PI / 180) * Math.cos(finalDestLat! * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = Math.round((R * c) * 100) / 100;
      
      // Calcular tarifa
      let priceMXN = 30;
      if (distanceKm > 0.1 && distanceKm <= 1) priceMXN = 30;
      else if (distanceKm <= 2) priceMXN = 35;
      else if (distanceKm <= 2.5) priceMXN = 40;
      else if (distanceKm <= 3) priceMXN = 45;
      else if (distanceKm <= 5) priceMXN = 50;
      else priceMXN = 50 + (Math.ceil(distanceKm - 5) * 5);
      
      setDistance(distanceKm);
      setPrice(priceMXN);
      setIsCalculatingRoute(false);
    } catch (err) {
      setIsCalculatingRoute(false);
      alert('❌ Error al calcular la ruta. Intenta de nuevo.');
    }
  };

  // Crear pedido
  const handleCreateOrder = async () => {
    setError('');
    setLoading(true);

    try {
      let clientId = AuthService.getClientId();
      
      if (!clientId) {
        clientId = Date.now().toString();
      }

      const origenAddress = `${street}${houseNumber ? ' #' + houseNumber : ''}${suburb ? ', ' + suburb : ''}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${postcode ? ', ' + postcode : ''}`;
      const destinoAddress = deliveryAddressInput || 'Por definir';
      
      const itemsFormatted = `Servicio de Motocicleta
🚩 Origen: ${origenAddress}
🏁 Destino: ${destinoAddress}`;

      const orderData = {
        clientId,
        clientName,
        clientPhone,
        clientEmail,
        clientAddress: origenAddress,
        clientLocation: {
          latitude: pickupLat || 0,
          longitude: pickupLng || 0
        },
        serviceType: 'MOTORCYCLE_TAXI',
        status: 'PENDING',
        createdAt: Date.now(),
        pickupAddress: origenAddress,
        deliveryAddress: destinoAddress,
        deliveryLocation: {
          latitude: destLat !== null ? destLat : (pickupLat || 0),
          longitude: destLng !== null ? destLng : (pickupLng || 0)
        },
        items: itemsFormatted,
        notes: `Servicio de motocicleta - Viaje rápido y seguro`,
        distance: distance || undefined,
        deliveryCost: price || undefined
      };

      const orderId = await OrderService.createOrder(orderData);
      
      if (orderId) {
        alert('✅ Solicitud de viaje creada exitosamente\n\nNúmero de pedido: ' + orderId.slice(-6));
        navigate(`/seguimiento?pedido=${orderId}`);
      } else {
        setError('Error al crear la solicitud de viaje. Intenta de nuevo.');
      }
    } catch (orderError) {
      const errorMessage = orderError instanceof Error ? orderError.message : 'Error desconocido';
      setError(`Error al crear la solicitud: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Validar y avanzar a siguiente pantalla
  const handleNextScreen = () => {
    setError('');
    
    if (currentScreen === 'client-info') {
      if (!clientName || !clientPhone || !clientEmail) {
        setError('Por favor completa todos los campos de información del cliente');
        return;
      }
      if (availableDrivers === 0) {
        setError('No hay repartidores disponibles en este momento. Por favor intenta más tarde.');
        return;
      }
      setCurrentScreen('pickup-location');
    } else if (currentScreen === 'pickup-location') {
      if (!street || !houseNumber || !suburb || !city || !state || !postcode) {
        setError('Por favor completa todos los campos de dirección o selecciona tu ubicación en el mapa');
        return;
      }
      if (pickupLat === null || pickupLng === null) {
        setError('Por favor selecciona tu ubicación en el mapa');
        return;
      }
      setCurrentScreen('destination');
    } else if (currentScreen === 'destination') {
      if (!deliveryAddressInput) {
        setError('Por favor escribe tu destino');
        return;
      }
      handleCalculateRoute();
    }
  };

  // Renderizar pantallas
  const renderScreen = () => {
    switch (currentScreen) {
      case 'client-info':
        return (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
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

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={labelStyle}>👤 Nombre Completo *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
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
                  style={inputStyle}
                  placeholder="Ej: juan@correo.com"
                />
              </div>
            </div>

            {/* Mapa de repartidores disponibles */}
            <div style={{ marginBottom: '2rem' }}>
              <DeliveryTrackingMap />
            </div>

            {/* Nota si no hay repartidores */}
            {availableDrivers === 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca',
                marginBottom: '1rem'
              }}>
                <p style={{ color: '#991b1b', fontWeight: 'bold', margin: 0 }}>
                  ⚠️ Tu viaje no puede ser obtenido porque no tenemos repartidores conectados en este momento. Por favor intenta más tarde.
                </p>
              </div>
            )}

            {/* Botón para avanzar */}
            <button
              onClick={handleNextScreen}
              disabled={availableDrivers === 0}
              style={{
                width: '100%',
                padding: '1.25rem',
                backgroundColor: availableDrivers === 0 ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                cursor: availableDrivers === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
            >
              🚀 Pedir Viaje
            </button>
          </div>
        );

      case 'pickup-location':
        return (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              borderBottom: '3px solid #10b981',
              paddingBottom: '0.75rem'
            }}>
              📍 Dirección de Recogida
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>
              ℹ️ Las coordenadas se obtendrán automáticamente al seleccionar tu ubicación
            </p>

            <AddressSearchWithMap
              onAddressSelect={(data) => {
                setPickupLat(data.lat);
                setPickupLng(data.lng);
                setStreet(data.street);
                setHouseNumber(data.houseNumber);
                setSuburb(data.suburb);
                setCity(data.city);
                setState(data.state);
                setPostcode(data.postcode);
              }}
            />

            {pickupLat && pickupLng && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#d1fae5',
                borderRadius: '0.5rem',
                border: '1px solid #10b981'
              }}>
                <p style={{ color: '#065f46', fontWeight: 'bold', margin: 0 }}>
                  ✅ Ubicación seleccionada:
                </p>
                <p style={{ color: '#059669', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                  📍 {pickupLat.toFixed(6)}, {pickupLng.toFixed(6)}
                </p>
              </div>
            )}

            <button
              onClick={handleNextScreen}
              style={{
                width: '100%',
                padding: '1.25rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginTop: '1.5rem'
              }}
            >
              ✓ Confirmar Dirección
            </button>
          </div>
        );

      case 'destination':
        return (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
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
              <label style={{ ...labelStyle, fontSize: '1rem', fontWeight: 'bold' }}>
                🏁 Dirección de Entrega:
              </label>
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

            {/* Indicador de cálculo automático */}
            {deliveryAddressInput && distance === null && price === null && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.5rem',
                border: '1px solid #fbbf24',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#92400e', fontWeight: 'bold', margin: 0 }}>
                  {isCalculatingRoute ? '⏳ Calculando ruta y tarifa...' : '🗺️ Selecciona una dirección para calcular automáticamente'}
                </p>
              </div>
            )}

            {/* Resultado del cálculo */}
            {distance !== null && price !== null && (
              <div style={{
                marginTop: '2rem',
                padding: '2rem 1rem',
                backgroundColor: '#d1fae5',
                borderRadius: '1rem',
                border: '2px solid #10b981',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46', margin: '0 0 1.5rem 0' }}>
                  ✅ ¡Ruta calculada!
                </p>
                
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
                
                <p style={{ fontSize: '1.1rem', color: '#059669', margin: '0 0 1.5rem 0', fontWeight: '600' }}>
                  🗺️ Distancia: {distance.toFixed(2)} km
                </p>

                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '2px solid #10b981',
                  textAlign: 'left'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                      🚩 Origen:
                    </p>
                    <p style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0 }}>
                      {street} #{houseNumber}, {suburb}, {city}
                    </p>
                  </div>
                  
                  <div style={{
                    height: '2px',
                    backgroundColor: '#e5e7eb',
                    margin: '1rem 0'
                  }}></div>
                  
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                      🏁 Destino:
                    </p>
                    <p style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0 }}>
                      {deliveryAddressInput}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCreateOrder}
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
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? '⏳ Creando Viaje...' : '✅ Confirmar Viaje'}
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
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
          onClick={() => {
            if (currentScreen === 'client-info') {
              navigate('/servicios');
            } else if (currentScreen === 'pickup-location') {
              setCurrentScreen('client-info');
            } else if (currentScreen === 'destination') {
              setCurrentScreen('pickup-location');
            }
          }}
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

      {/* Indicador de pantalla */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 1.5rem auto',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        {(['client-info', 'pickup-location', 'destination'] as Screen[]).map((screen, index) => (
          <div
            key={screen}
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: currentScreen === screen ? '#10b981' : '#d1d5db',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 1rem auto',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '0.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Renderizar pantalla actual */}
      {renderScreen()}
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
