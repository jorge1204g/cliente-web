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
  const [hasGPSCoords, setHasGPSCoords] = useState(false);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [showAutoClickNotification, setShowAutoClickNotification] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const autocompleteInstance = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

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
        // Nueva API de Google Maps - sin property 'fields'
        const autocompleteOptions = {
          componentRestrictions: { country: 'mx' },
        };

        autocompleteInstance.current = new google.maps.places.PlaceAutocompleteElement(
          autocompleteOptions
        );

        // Renderizar en el contenedor
        if (autocompleteRef.current && autocompleteInstance.current) {
          autocompleteRef.current.innerHTML = '';
          autocompleteRef.current.appendChild(autocompleteInstance.current);
        }

        // Escuchar cuando se selecciona un lugar
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

            setSelectedLocation({ lat, lng });

            if (mapInstance) {
              mapInstance.panTo({ lat, lng });
              mapInstance.setZoom(16);
            }

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

            console.log('✅ Lugar seleccionado:', place.formattedAddress);
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
      // Evitar múltiples llamadas con coordenadas muy similares (menos de 1 metro de diferencia)
      if (selectedLocation) {
        const latDiff = Math.abs(selectedLocation.lat - lat);
        const lngDiff = Math.abs(selectedLocation.lng - lng);
        
        // Si la diferencia es menor a 0.00001 (~1 metro), no hacer geocodificación
        if (latDiff < 0.00001 && lngDiff < 0.00001) {
          console.log('ℹ️ [REVERSE GEOCODE] Coordenadas muy similares, omitiendo:', { lat, lng });
          return;
        }
      }
      
      console.log('🗺️ [REVERSE GEOCODE] Iniciando geocodificación:', { lat, lng });
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

            console.log('✅ [REVERSE GEOCODE] Dirección enviada al padre:', {
              street: road,
              city: city,
              lat, lng
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

  // Obtener ubicación actual por GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('⚠️ Tu navegador no soporta geolocalización GPS');
      return;
    }

    console.log('🛰️ Solicitando permisos de GPS...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        console.log('✅ GPS exitoso - Lat:', lat, 'Lng:', lng);
        
        // Poner coordenadas en el campo
        setCoordinatesInput(`${lat}, ${lng}`);
        setHasGPSCoords(true);
        
        // Mover el mapa
        setSelectedLocation({ lat, lng });
        
        if (mapInstance) {
          mapInstance.panTo({ lat, lng });
          mapInstance.setZoom(16);
        }
        
        // Hacer geocodificación inversa
        reverseGeocode(lat, lng);
        
        console.log('💡 Coordenadas GPS establecidas - Búsqueda automática iniciada');
      },
      (error) => {
        console.error('❌ Error GPS:', error);
        let mensaje = '⚠️ No se pudo obtener tu ubicación.\n\n';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            mensaje += 'Permiso de GPS denegado. Por favor activa los permisos de ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje += 'Información de GPS no disponible.';
            break;
          case error.TIMEOUT:
            mensaje += 'Tiempo de espera agotado. Intenta de nuevo.';
            break;
          default:
            mensaje += 'Error desconocido.';
        }
        
        alert(mensaje);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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

  // OCULTO - Función ya no usada porque ocultamos el botón Eliminar
  // const handleDeleteLastDigit = () => {...}

  // Función expuesta para actualizar coordenadas desde fuera (GPS)
  useEffect(() => {
    // Escuchar eventos personalizados para actualización forzada
    const handleForceUpdate = (event: CustomEvent<{ value: string }>) => {
      console.log('🔄 Evento personalizado recibido:', event.detail.value);
      setCoordinatesInput(event.detail.value);
      setHasGPSCoords(true); // Activar mensaje
    };
    
    window.addEventListener('force-coordinates-update' as any, handleForceUpdate as any);
    return () => window.removeEventListener('force-coordinates-update' as any, handleForceUpdate as any);
  }, []);

  // OCULTO - Funciones ya no usadas porque ocultamos los campos separados
  // const handleLatitudeChange = (value: string) => {...}
  // const handleLongitudeChange = (value: string) => {...}
  // const handleLatitudeBlur = () => {...}
  // const handleLongitudeBlur = () => {...}
  // OCULTO - useEffect ya no usado

  // 🛰️ Auto-obtener ubicación al cargar el componente - TOTALMENTE AUTOMÁTICO
  useEffect(() => {
    console.log('🛰️ [ADDRESS MAP] INICIANDO PROCESO AUTOMÁTICO DE UBICACIÓN...');
    
    // Función para obtener ubicación con reintentos automáticos
    const obtenerUbicacionAutomatica = (intentos: number = 0) => {
      const MAX_INTENTOS = 3;
      
      if (intentos >= MAX_INTENTOS) {
        console.warn('⚠️ [ADDRESS MAP] Máximo de intentos alcanzado');
        return;
      }
      
      console.log(`🛰️ [ADDRESS MAP] Intento ${intentos + 1} de ${MAX_INTENTOS}...`);
      
      if (!navigator.geolocation) {
        console.warn('⚠️ [ADDRESS MAP] Geolocalización no disponible en este navegador');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log('✅ [ADDRESS MAP] Ubicación obtenida en intento', intentos + 1, ':', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          
          // Poner coordenadas en el campo
          setCoordinatesInput(`${lat}, ${lng}`);
          setHasGPSCoords(true);
          
          // Mover el mapa
          setSelectedLocation({ lat, lng });
          
          if (mapInstance) {
            mapInstance.panTo({ lat, lng });
            mapInstance.setZoom(16);
          } else {
            // Si el mapa aún no está listo, esperar un poco y reintentar
            setTimeout(() => {
              const mapElement = document.getElementById('map');
              if (mapElement && google.maps.Map) {
                const map = new google.maps.Map(mapElement, {
                  center: { lat, lng },
                  zoom: 16
                });
                setMapInstance(map);
              }
            }, 500);
          }
          
          // Hacer geocodificación inversa
          reverseGeocode(lat, lng);
          
          console.log('💡 [ADDRESS MAP] Coordenadas GPS establecidas - Búsqueda automática iniciada');
        },
        (error) => {
          console.warn('⚠️ [ADDRESS MAP] Error en intento', intentos + 1, ':', error.message);
          
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
    };
    
    // Iniciar proceso automático con pequeño delay para asegurar que el componente esté listo
    const timer = setTimeout(() => {
      // Primero intentar obtener ubicación directamente
      obtenerUbicacionAutomatica(0);
      
      // Simultáneamente, buscar y hacer click en el botón azul si existe
      setTimeout(() => {
        const botonAzulGPS = document.querySelector('button[textContent*="🛰️ Usar mi ubicación actual"]') as HTMLButtonElement;
        
        if (botonAzulGPS) {
          console.log('🔵 [ADDRESS MAP] Botón azul encontrado, haciendo click automático...');
          
          // Verificar si el botón está habilitado
          if (!botonAzulGPS.disabled) {
            botonAzulGPS.click();
            console.log('✅ [ADDRESS MAP] Click automático realizado en botón azul');
          } else {
            console.log('⚠️ [ADDRESS MAP] Botón azul está deshabilitado');
          }
        } else {
          console.log('ℹ️ [ADDRESS MAP] Botón azul no encontrado en el DOM');
        }
      }, 1500); // Esperar 1.5 segundos para que el botón esté renderizado
    }, 800);
    
    return () => clearTimeout(timer);
  }, []); // Solo se ejecuta al montar

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
      {/* LEYENDA FLOTANTE - CLICKS AUTOMÁTICOS */}
      {showAutoClickNotification && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(34, 197, 94, 0.95)',
          color: 'white',
          padding: '1.5rem 2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          zIndex: 99999,
          fontSize: '1.1rem',
          fontWeight: '700',
          textAlign: 'center',
          border: '3px solid #16a34a',
          minWidth: '300px'
        }}>
          🟢 <strong>BUSCANDO DIRECCIÓN...</strong><br/>
          <span style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'block' }}>Click automático en proceso</span>
        </div>
      )}
      
      {/* OCULTO - Campos de coordenadas separadas (pero funcionan) */}
      <div style={{ display: 'none' }}>
      <div style={{
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '0.5rem',
        border: '2px solid #22c55e',
        marginBottom: '1rem'
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#16a34a',
          marginBottom: '0.75rem'
        }}>
          📍 O ingresa coordenadas exactas:
        </label>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input
            type="text"
            value={coordinatesInput}
            onChange={(e) => setCoordinatesInput(e.target.value)}
            placeholder="Ej: 23.156, -102.345"
            style={{
              flex: 1,
              padding: '0.625rem',
              border: '1px solid #22c55e',
              borderRadius: '0.375rem',
              fontSize: '0.95rem'
            }}
          />
          <button
            type="button"
            onClick={handleCoordinatesSearch}
            style={{
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '0.625rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            📍 Buscar
          </button>
        </div>

        {/* OCULTO - Botón azul de GPS ya no es necesario porque todo es automático
        <button
          type="button"
          onClick={getCurrentLocation}
          style={{
            width: '100%',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          🛰️ Usar mi ubicación actual
        </button>
        */}

        {hasGPSCoords && (
          <p style={{
            fontSize: '0.75rem',
            color: '#16a34a',
            marginTop: '0.5rem',
            fontWeight: '600'
          }}>
            💡 Coordenadas obtenidas por GPS - Se buscará automáticamente
          </p>
        )}

        <p style={{
          fontSize: '0.65rem',
          color: '#6b7280',
          marginTop: '0.5rem'
        }}>
          💡 Formato: latitud, longitud (ejemplo: 23.156, -102.345). Presiona Enter para buscar.
        </p>
      </div>
      </div>
      {/* FIN DE OCULTO - Ahora se muestra el mapa */}

      {/* OCULTO - Sección de coordenadas separadas ya no usada */}
      {/*
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

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              if (latitudeInput && longitudeInput) {
                setCoordinatesInput(`${latitudeInput},${longitudeInput}`);
                setTimeout(() => {
                  _handleCoordinatesSearch();
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
      */}

      {/* Mapa interactivo de Google Maps */}
      <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            📍 MUEVE EL MAPA HASTA LA UBICACIÓN EXACTA DE TU DOMICILIO:
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
