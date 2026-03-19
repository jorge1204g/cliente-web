import React, { useState } from 'react';
import { LoadScript, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';

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

const libraries: ('places')[] = ['places'];

const AddressSearchWithMap: React.FC<AddressSearchProps> = ({ onAddressSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [coordinatesInput, setCoordinatesInput] = useState('');

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

            setSearchQuery(`${road}${houseNumber ? ' #' + houseNumber : ''}, ${suburb}`);
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

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        reverseGeocode(lat, lng);
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      reverseGeocode(lat, lng);
    }
  };

  // Manejar entrada de coordenadas
  const handleCoordinatesSearch = () => {
    try {
      console.log('🔍 Coordenadas a validar:', coordinatesInput);
      
      // Limpiar espacios y dividir por coma o espacio
      const cleanInput = coordinatesInput.trim();
      
      // Intentar múltiples formatos
      let lat: number, lng: number;
      
      // Formato 1: "lat,lng" o "lat, lng" (con o sin espacio)
      if (cleanInput.includes(',')) {
        const parts = cleanInput.split(',');
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
        alert('⚠️ Formato incorrecto. Usa: latitud, longitud (ejemplo: 23.156, -102.345)');
        return;
      }
      
      console.log('✅ Latitud parseada:', lat, 'Longitud parseada:', lng);
      
      // Validar que sean números válidos
      if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ Coordenadas inválidas - NaN detected');
        alert('⚠️ Por favor ingresa coordenadas válidas (ejemplo: 23.156, -102.345)');
        return;
      }
      
      // Validar rangos
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('❌ Coordenadas fuera de rango:', lat, lng);
        alert('⚠️ Coordenadas inválidas. Latitud debe estar entre -90 y 90, Longitud entre -180 y 180.');
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
      alert('❌ Error al procesar las coordenadas. Verifica el formato.');
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <div style={{ marginTop: '1rem' }}>
        {/* Campo de búsqueda con autocompletado de Google Places */}
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
          
          <Autocomplete
            onLoad={(auto) => setAutocomplete(auto)}
            onPlaceChanged={handlePlaceChanged}
            options={{
              componentRestrictions: { country: 'mx' },
              fields: ['geometry', 'formatted_address', 'address_components']
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej. Av. Hidalgo 123, Centro, Fresnillo..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </Autocomplete>

          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            💡 Escribe tu dirección y selecciona de las sugerencias
          </p>
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
          
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={selectedLocation || center}
            zoom={selectedLocation ? 16 : 13}
            onClick={handleMapClick}
            onLoad={(map) => setMapInstance(map)}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true
            }}
          >
            {selectedLocation && (
              <Marker
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
              />
            )}
          </GoogleMap>
          
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
    </LoadScript>
  );
};

export default AddressSearchWithMap;
