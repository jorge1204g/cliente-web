import React, { useState, useRef, useEffect } from 'react';

interface AddressSearchProps {
  onAddressSelect: (data: {
    street: string;
    houseNumber: string;
    suburb: string;
    city: string;
    state: string;
    postcode: string;
    lat: number;
    lng: number;
  }) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const center = {
  lat: 24.6536,
  lng: -102.8738
};

const AddressSearchWithMap: React.FC<AddressSearchProps> = ({ onAddressSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [coordinatesInput, setCoordinatesInput] = useState('');
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const autocompleteInstance = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  // Estados para campos separados de latitud y longitud
  const [latitudeInput, setLatitudeInput] = useState('');
  const [longitudeInput, setLongitudeInput] = useState('');
  const [isEditingLatitude, setIsEditingLatitude] = useState(false);

  // Cargar librería de Places
  useEffect(() => {
    const loadPlacesLibrary = async () => {
      try {
        // Importar la librería de places dinámicamente
        await import('@googlemaps/js-api-loader').then(async ({ Loader }) => {
          const loader = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: 'beta',
            libraries: ['places']
          });
          
          await loader.load();
          setIsLibraryLoaded(true);
          console.log('✅ Librería de Google Places cargada exitosamente');
        });
      } catch (error) {
        console.error('❌ Error al cargar Google Places:', error);
      }
    };

    loadPlacesLibrary();
  }, []);

  // Inicializar PlaceAutocompleteElement
  useEffect(() => {
    if (isLibraryLoaded && autocompleteRef.current && google.maps.places.PlaceAutocompleteElement) {
      try {
        // Crear elemento de autocompletado
        const autocompleteOptions = {
          componentRestrictions: { country: 'mx' },
          fields: ['geometry', 'formatted_address', 'address_components'],
        };

        autocompleteInstance.current = new google.maps.places.PlaceAutocompleteElement(
          autocompleteOptions
        );

        // Renderizar en el contenedor - PlaceAutocompleteElement se renderiza automáticamente
        // cuando se appendea al DOM
        if (autocompleteRef.current && autocompleteInstance.current) {
          autocompleteRef.current.innerHTML = '';
          autocompleteRef.current.appendChild(autocompleteInstance.current);
        }

        // Escuchar cuando se selecciona un lugar usando el nuevo sistema de eventos
        autocompleteInstance.current.addEventListener('gmp-placeselect', async (event: any) => {
          const place = await event.place;
          
          if (place.location && place.formattedAddress) {
            const lat = place.location.latitude;
            const lng = place.location.longitude;
            
            // Extraer componentes de dirección
            let road = '';
            let houseNumber = '';
            let suburb = '';
            let city = '';
            let state = '';
            let postcode = '';

            // Usar addressComponents si están disponibles
            if (place.addressComponents) {
              place.addressComponents.forEach((component: any) => {
                const types = component.types;
                if (types.includes('route')) road = component.longName;
                if (types.includes('street_number')) houseNumber = component.shortName;
                if (types.includes('sublocality') || types.includes('neighborhood')) suburb = component.longName;
                if (types.includes('locality')) city = component.longName;
                if (types.includes('administrative_area_level_1')) state = component.shortName;
                if (types.includes('postal_code')) postcode = component.shortName;
              });
            }

            // Actualizar estado
            setSelectedLocation({ lat, lng });

            // Mover el mapa
            if (mapInstance) {
              mapInstance.panTo({ lat, lng });
              mapInstance.setZoom(16);
            }

            // Pasar datos al componente padre
            onAddressSelect({
              street: road,
              houseNumber: houseNumber,
              suburb: suburb,
              city: city,
              state: state,
              postcode: postcode,
              lat,
              lng
            });

            console.log('✅ Lugar seleccionado con nueva API:', place.formattedAddress);
          }
        });

        console.log('✅ PlaceAutocompleteElement inicializado correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar PlaceAutocompleteElement:', error);
      }
    }
  }, [isLibraryLoaded, mapInstance]);

  // Geocodificación inversa con Google Maps
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      
      await new Promise<void>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].address_components;
            
            // Extraer datos de dirección
            let road = '';
            let houseNumber = '';
            let suburb = '';
            let city = '';
            let state = '';
            let postcode = '';

            address.forEach((component: any) => {
              const types = component.types;
              if (types.includes('route')) road = component.long_name;
              if (types.includes('street_number')) houseNumber = component.short_name;
              if (types.includes('sublocality') || types.includes('neighborhood')) suburb = component.long_name;
              if (types.includes('locality')) city = component.long_name;
              if (types.includes('administrative_area_level_1')) state = component.short_name;
              if (types.includes('postal_code')) postcode = component.short_name;
            });

            setSelectedLocation({ lat, lng });

            // Mover el mapa a la nueva ubicación
            if (mapInstance) {
              mapInstance.panTo({ lat, lng });
              mapInstance.setZoom(16);
            }

            // Pasar datos al componente padre
            onAddressSelect({
              street: road,
              houseNumber: houseNumber,
              suburb: suburb,
              city: city,
              state: state,
              postcode: postcode,
              lat,
              lng
            });

            resolve();
          } else {
            console.error('Geocoding failed:', status);
            reject(new Error('Geocoding failed'));
          }
        });
      });
    } catch (error) {
      console.error('Error al obtener dirección:', error);
    }
  };

  // Manejar entrada de coordenadas
  const handleCoordinatesSearch = () => {
    try {
      // Limpiar espacios y dividir por coma o espacio
      const cleanInput = coordinatesInput.trim();
      
      console.log('📝 Input limpio:', cleanInput);
      
      // Intentar múltiples formatos
      let lat: number, lng: number;
      
      // Formato 1: "lat,lng" o "lat, lng" (con o sin espacio) - SOPORTA CUALQUIER CANTIDAD DE DÍGITOS
      if (cleanInput.includes(',')) {
        const parts = cleanInput.split(',');
        console.log('📊 Formato detectado: lat,lng con', parts.length, 'partes');
        console.log('   Parte 1 (lat):', parts[0].trim());
        console.log('   Parte 2 (lng):', parts[1].trim());
        
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      } 
      // Formato 2: "lat lng" (solo espacio)
      else if (cleanInput.includes(' ')) {
        const parts = cleanInput.split(/\s+/);
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
      else {
        console.error('❌ Formato no reconocido. Input:', cleanInput);
        alert('⚠️ Formato incorrecto. Usa: latitud, longitud (ejemplo: 23.156, -102.345)\n\nFormatos válidos:\n- Con coma: 23.174246,-102.845922\n- Con coma y espacio: 23.174246, -102.845922\n- Con espacio: 23.174246 -102.845922\n\nTu input: ' + cleanInput);
        return;
      }
      
      console.log('✅ Latitud parseada:', lat, 'Longitud parseada:', lng);
      
      // Validar que sean números válidos
      if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ Coordenadas inválidas - NaN detected');
        const parts = cleanInput.split(',');
        alert('⚠️ Por favor ingresa coordenadas válidas (ejemplo: 23.156, -102.345)\n\nSe intentó parsear:\n- Latitud: ' + parts[0]?.trim() + ' = ' + lat + '\n- Longitud: ' + parts[1]?.trim() + ' = ' + lng);
        return;
      }
      
      // Validar rangos
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('❌ Coordenadas fuera de rango:', lat, lng);
        alert('⚠️ Coordenadas inválidas. Latitud debe estar entre -90 y 90, Longitud entre -180 y 180.\n\nCoordenadas recibidas:\n- Latitud: ' + lat + '\n- Longitud: ' + lng);
        return;
      }
      
      // Mover el mapa a las coordenadas
      setSelectedLocation({ lat, lng });
      
      if (mapInstance) {
        mapInstance.panTo({ lat, lng });
        mapInstance.setZoom(16);
      }
      
      // Hacer geocodificación inversa para obtener la dirección
      reverseGeocode(lat, lng);
      
      console.log(`✅ Coordenadas exitosas: ${lat}, ${lng}`);
    } catch (error) {
      console.error('❌ Error al procesar coordenadas:', error);
      alert('❌ Error al procesar las coordenadas. Verifica el formato.\n\nError: ' + (error instanceof Error ? error.message : String(error)) + '\n\nInput: ' + coordinatesInput);
    }
  };

  // Eliminar último dígito de las coordenadas
  const handleDeleteLastDigit = () => {
    if (coordinatesInput.length > 0) {
      const newValue = coordinatesInput.slice(0, -1);
      setCoordinatesInput(newValue);
      
      console.log(`✂️ Último dígito eliminado: "${coordinatesInput}" → "${newValue}"`);
      
      // Actualizar también los campos separados si existen
      const lastCommaIndex = newValue.lastIndexOf(',');
      if (lastCommaIndex !== -1) {
        const lat = newValue.substring(0, lastCommaIndex).trim();
        const lng = newValue.substring(lastCommaIndex + 1).trim();
        
        setLatitudeInput(lat);
        setLongitudeInput(lng);
        
        console.log(`📊 Campos actualizados: Lat=${lat}, Lng=${lng}`);
      }
    }
  };

  // Manejar campos separados de latitud y longitud
  const handleLatitudeChange = (value: string) => {
    setLatitudeInput(value);
    setIsEditingLatitude(true);
    
    // Si el valor es válido, actualizar también el campo combinado
    const lat = parseFloat(value);
    const lng = parseFloat(longitudeInput);
    
    if (!isNaN(lat) && !isNaN(lng) && longitudeInput) {
      setCoordinatesInput(`${value},${longitudeInput}`);
    }
  };

  const handleLongitudeChange = (value: string) => {
    setLongitudeInput(value);
    
    // Si el valor es válido, actualizar también el campo combinado
    const lat = parseFloat(latitudeInput);
    const lng = parseFloat(value);
    
    if (!isNaN(lat) && !isNaN(lng) && latitudeInput) {
      setCoordinatesInput(`${latitudeInput},${value}`);
    }
  };

  // Manejar borrado del último dígito de latitud para moverlo a longitud
  const handleLatitudeBlur = () => {
    if (isEditingLatitude && latitudeInput.length > 0) {
      const lastChar = latitudeInput.slice(-1);
      const newLat = latitudeInput.slice(0, -1);
      
      // Solo mover si el último caracter es un dígito
      if (/[0-9]/.test(lastChar)) {
        // Mover el último dígito al inicio de la longitud
        const newLng = lastChar + longitudeInput;
        
        setLatitudeInput(newLat);
        setLongitudeInput(newLng);
        setCoordinatesInput(`${newLat},${newLng}`);
        
        console.log(`🔄 Dígito movido: ${lastChar} de latitud a longitud`);
        console.log(`Nueva latitud: ${newLat}, Nueva longitud: ${newLng}`);
        
        // Buscar automáticamente después de mover el dígito
        setTimeout(() => {
          handleCoordinatesSearch();
        }, 300);
      }
    }
    setIsEditingLatitude(false);
  };

  const handleLongitudeBlur = () => {
    // No action needed
  };

  // Actualizar campos separados cuando cambian las coordenadas combinadas
  useEffect(() => {
    if (coordinatesInput && coordinatesInput.includes(',')) {
      const parts = coordinatesInput.split(',');
      if (parts.length === 2) {
        setLatitudeInput(parts[0].trim());
        setLongitudeInput(parts[1].trim());
      }
    }
  }, [coordinatesInput]);

  // Cargar mapa manualmente
  useEffect(() => {
    if (isLibraryLoaded && !mapInstance) {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const map = new google.maps.Map(mapElement, {
          center: center,
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true
        });
        setMapInstance(map);
        console.log('✅ Mapa inicializado correctamente');
        
        // Agregar listener para clicks en el mapa
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            reverseGeocode(lat, lng);
          }
        });
      }
    }
  }, [isLibraryLoaded]);

  // Actualizar marcador cuando cambia la ubicación
  useEffect(() => {
    if (mapInstance && selectedLocation) {
      // Eliminar marcador anterior si existe
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      
      // Crear nuevo marcador
      markerRef.current = new google.maps.Marker({
        position: selectedLocation,
        map: mapInstance,
        title: 'Ubicación seleccionada'
      });
    }
  }, [selectedLocation, mapInstance]);

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Campo de búsqueda con autocompletado de Google Places (NUEVA API) */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          🔍 O busca tu dirección manualmente:
        </label>
        
        {/* Contenedor para PlaceAutocompleteElement */}
        <div ref={autocompleteRef} id="place-autocomplete"></div>

        <p style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          marginTop: '0.5rem'
        }}>
          💡 Escribe tu dirección y selecciona de las sugerencias
        </p>
      </div>

      {/* Filtro de coordenadas separadas - Latitud y Longitud */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '0.5rem', 
        border: '1px solid #bae6fd',
        marginBottom: '1rem'
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#0369a1',
          marginBottom: '0.75rem'
        }}>
          🌎 Separar Coordenadas por Campos:
        </label>
        
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {/* Campo de Latitud */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#0369a1',
              marginBottom: '0.25rem'
            }}>
              🌎 Latitud
            </label>
            <input
              type="text"
              value={latitudeInput}
              onChange={(e) => handleLatitudeChange(e.target.value)}
              onBlur={handleLatitudeBlur}
              placeholder="Ej: 23.174257"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #7dd3fc',
                borderRadius: '0.375rem',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                backgroundColor: '#ecfeff',
                color: '#0e7490'
              }}
            />
            <p style={{
              fontSize: '0.65rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              💡 Borra el último dígito para moverlo a longitud
            </p>
          </div>

          {/* Campo de Longitud */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#0369a1',
              marginBottom: '0.25rem'
            }}>
              🧭 Longitud
            </label>
            <input
              type="text"
              value={longitudeInput}
              onChange={(e) => handleLongitudeChange(e.target.value)}
              onBlur={handleLongitudeBlur}
              placeholder="Ej: -102.845951"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #7dd3fc',
                borderRadius: '0.375rem',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                backgroundColor: '#ecfeff',
                color: '#0e7490'
              }}
            />
            <p style={{
              fontSize: '0.65rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              💡 Recibe el dígito movido de la latitud
            </p>
          </div>
        </div>

        {/* Botón de acción rápida */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              if (latitudeInput && longitudeInput) {
                setCoordinatesInput(`${latitudeInput},${longitudeInput}`);
                setTimeout(() => {
                  handleCoordinatesSearch();
                }, 100);
              } else {
                alert('⚠️ Por favor ingresa ambas coordenadas');
              }
            }}
            style={{
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
          >
            🔗 Unir Coordenadas y Buscar
          </button>
          <p style={{
            fontSize: '0.65rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            💡 Las coordenadas se unirán automáticamente en el campo de abajo
          </p>
        </div>
      </div>

      {/* Campo de coordenadas */}
      <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            📍 O ingresa coordenadas exactas:
          </label>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={coordinatesInput}
              onChange={(e) => setCoordinatesInput(e.target.value)}
              placeholder="Ej: 23.156, -102.345"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontFamily: 'monospace'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCoordinatesSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={handleDeleteLastDigit}
              title="Eliminar último dígito"
              disabled={!coordinatesInput}
              style={{
                backgroundColor: !coordinatesInput ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: coordinatesInput ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (coordinatesInput) e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseOut={(e) => {
                if (coordinatesInput) e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              ✂️ Eliminar
            </button>
            <button
              type="button"
              onClick={handleCoordinatesSearch}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              📍 Buscar
            </button>
          </div>

          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            💡 Formato: latitud, longitud (ejemplo: 23.156, -102.345). Presiona Enter para buscar.
          </p>
        </div>

      {/* Mapa interactivo de Google Maps */}
      <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            📍 O haz clic en el mapa para seleccionar tu ubicación:
          </label>
          
          <div
            id="map"
            style={containerStyle}
          ></div>
          
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            💡 Haz clic en cualquier parte del mapa para seleccionar esa ubicación
          </p>
        </div>

      {/* Ubicación seleccionada */}
      {selectedLocation && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.5rem',
            border: '1px solid #bfdbfe',
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#1e40af',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              ✅ Ubicación seleccionada:
            </div>
            <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
              📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              ℹ️ Los campos de dirección se han llenado automáticamente
            </div>
          </div>
        )}
    </div>
  );
};

export default AddressSearchWithMap;
