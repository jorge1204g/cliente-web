import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { ref, onValue, getDatabase } from 'firebase/database';

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  deliveryId: string;
  updatedAt: number;
  speed?: number;
  heading?: number;
}

interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  isActive: boolean;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 23.1837, // Fresnillo, Zacatecas
  lng: -102.8639
};

const DeliveryTrackingMap: React.FC = () => {
  const [locations, setLocations] = useState<Map<string, DeliveryLocation>>(new Map());
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Escuchar ubicaciones de Firebase
  useEffect(() => {
    if (!isLoaded) return;

    console.log('🎯 [TRACKING CLIENTE] Iniciando escucha de ubicaciones...');
    const database = getDatabase();
    const locationsRef = ref(database, 'delivery_locations');

    const unsubscribe = onValue(locationsRef, (snapshot) => {
      console.log('📍 [TRACKING CLIENTE] onDataChange - children:', snapshot.childrenCount);
      const locationsMap = new Map<string, DeliveryLocation>();
      
      snapshot.forEach((child) => {
        const deliveryId = child.key || '';
        const location = child.val() as DeliveryLocation;
        
        if (location && location.latitude && location.longitude) {
          const hasRecentLocation = (Date.now() - location.timestamp) < 300000; // 5 minutos
          
          if (hasRecentLocation) {
            console.log(`📍 [TRACKING CLIENTE] ${deliveryId}: ${location.latitude}, ${location.longitude}`);
            locationsMap.set(deliveryId, location);
          }
        }
      });
      
      console.log(`✅ [TRACKING CLIENTE] Total repartidores activos: ${locationsMap.size}`);
      setLocations(locationsMap);
    });

    return () => unsubscribe();
  }, [isLoaded]);

  // Escuchar repartidores de Firebase
  useEffect(() => {
    if (!isLoaded) return;

    console.log('👥 [TRACKING CLIENTE] Cargando repartidores...');
    const database = getDatabase();
    const deliveryPersonsRef = ref(database, 'delivery_persons');

    const unsubscribe = onValue(deliveryPersonsRef, (snapshot) => {
      const persons: DeliveryPerson[] = [];
      
      snapshot.forEach((child) => {
        const person = child.val() as DeliveryPerson;
        if (person && person.isApproved !== false) { // Solo repartidores aprobados
          persons.push({
            id: child.key || '',
            name: person.name || 'Repartidor',
            phone: person.phone || '',
            isOnline: person.isOnline || false,
            isActive: person.isActive || false
          });
        }
      });
      
      console.log(`✅ [TRACKING CLIENTE] Repartidores cargados: ${persons.length}`);
      setDeliveryPersons(persons);
    });

    return () => unsubscribe();
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem'
      }}>
        <p style={{ fontSize: '1.5rem' }}>🗺️</p>
        <p>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Header colapsable - Ahora siempre visible pero sin información de repartidores */}
      <div
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🗺️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>
              Repartidores Disponibles
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
              {locations.size} repartidor{locations.size !== 1 ? 'es' : ''} en línea
            </p>
          </div>
        </div>
      </div>

      {/* Solo Mapa - Sin lista de repartidores */}
      <div style={{ animation: 'slideIn 0.3s ease-out' }}>
        {/* Mapa */}
        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={14}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true
            }}
          >
            {Array.from(locations.entries()).map(([deliveryId, location]) => {
              const person = deliveryPersons.find(p => p.id === deliveryId);
              const hasRecentLocation = (Date.now() - location.timestamp) < 300000;
              
              return (
                <Marker
                  key={deliveryId}
                  position={{ lat: location.latitude, lng: location.longitude }}
                  title={person?.name || 'Repartidor'}
                  icon={{
                    url: hasRecentLocation
                      ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                            <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
                            <text x="20" y="26" text-anchor="middle" font-size="18">🏍️</text>
                          </svg>
                        `)
                      : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                            <circle cx="20" cy="20" r="18" fill="#6b7280" stroke="white" stroke-width="3"/>
                            <text x="20" y="26" text-anchor="middle" font-size="18">🏍️</text>
                          </svg>
                        `),
                    scaledSize: new google.maps.Size(40, 40)
                  }}
                />
              );
            })}
          </GoogleMap>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `Hace ${seconds}s`;
  if (minutes < 60) return `Hace ${minutes}m`;
  return `Hace ${hours}h`;
}

export default DeliveryTrackingMap;
