import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService, { ClientOrder } from '../services/OrderService';

// Componente de Timeline para el estado del pedido (especial para motocicleta)
const MotorcycleOrderTimeline: React.FC<{ status: string }> = ({ status }) => {
  // Estados SIMPLIFICADOS para servicio de motocicleta (tipo taxi/pasajero)
  const statusSteps = [
    { key: 'pending', label: 'Buscando repartidor', icon: '⏳' },
    { key: 'accepted', label: 'Repartidor asignado', icon: '✅' },
    { 
      key: 'on_the_way_to_pickup', 
      label: 'En camino por ti', 
      icon: '🏍️',
      description: 'El repartidor se dirige a tu ubicación'
    },
    { 
      key: 'arrived_at_pickup', 
      label: 'Repartidor llegó', 
      icon: '📍',
      description: 'Tu repartidor ha llegado, sube a la motocicleta'
    },
    { 
      key: 'on_the_way_to_destination', 
      label: 'En camino al destino', 
      icon: '🛣️',
      description: 'Viajando de forma segura hacia tu destino'
    },
    { 
      key: 'delivered', 
      label: '¡Viaje completado!', 
      icon: '🎯',
      description: 'Has llegado a tu destino'
    },
    { key: 'cancelled', label: 'Cancelado', icon: '❌' }
  ];

  // Normalizar el estado (simplificado)
  const normalizeStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'ACCEPTED': 'accepted',
      'ON_THE_WAY_TO_PICKUP': 'on_the_way_to_pickup',
      'ARRIVED_AT_PICKUP': 'arrived_at_pickup',
      'ON_THE_WAY_TO_DESTINATION': 'on_the_way_to_destination',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled'
    };
    return statusMap[status] || status.toLowerCase();
  };

  const normalizedStatus = normalizeStatus(status);
  
  // Si está cancelado, mostrar mensaje especial
  if (normalizedStatus === 'cancelled') {
    return (
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#fee2e2',
        borderRadius: '0.5rem',
        border: '1px solid #fecaca',
        textAlign: 'center'
      }}>
        <p style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '1rem' }}>
          {statusSteps.find(s => s.key === 'cancelled')?.icon} Viaje Cancelado
        </p>
      </div>
    );
  }

  // Encontrar el índice del estado actual
  const currentIndex = statusSteps.findIndex(step => step.key === normalizedStatus);
  
  // Si no se encuentra el estado, mostrar solo el estado actual
  if (currentIndex === -1) {
    return (
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#eff6ff',
        borderRadius: '0.5rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#1e40af', fontWeight: '600', fontSize: '0.875rem' }}>
          📊 Estado actual: {status}
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        Estado de tu Viaje
      </h3>
      
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Línea vertical */}
        <div style={{
          position: 'absolute',
          left: '0.75rem',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: '#e5e7eb'
        }} />

        {/* Pasos del timeline */}
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div
              key={step.key}
              style={{
                position: 'relative',
                marginBottom: '1.5rem',
                opacity: isCompleted ? 1 : 0.5
              }}
            >
              {/* Círculo */}
              <div
                style={{
                  position: 'absolute',
                  left: '-2rem',
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#10b981' : '#d1d5db',
                  border: isCurrent ? '3px solid #3b82f6' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: 'bold',
                  zIndex: 1
                }}
              >
                {isCompleted && '✓'}
              </div>

              {/* Contenido */}
              <div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrent ? 'bold' : 'normal',
                    color: isCurrent ? '#1e40af' : '#4b5563',
                    margin: 0
                  }}
                >
                  {step.icon} {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MotorcycleOrderTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  
  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [orderDeleted, setOrderDeleted] = useState(false);

  // Escuchar cambios en tiempo real del pedido
  useEffect(() => {
    if (!orderId) {
      setError('No se encontró el número de pedido');
      setLoading(false);
      return;
    }

    console.log('🔍 [TRACKING] Buscando pedido:', orderId);

    const unsubscribe = OrderService.observeOrder(orderId, (updatedOrder) => {
      console.log('🔄 [TRACKING] Pedido actualizado:', updatedOrder);
      if (updatedOrder) {
        console.log('📍 pickupAddress:', updatedOrder.pickupAddress);
        console.log('🏁 deliveryAddress:', updatedOrder.deliveryAddress);
        console.log('🏠 clientAddress:', updatedOrder.clientAddress);
        setOrder(updatedOrder);
      } else {
        // El pedido NO existe en Firebase (fue eliminado)
        console.warn('⚠️ [TRACKING] El pedido no existe en Firebase - probablemente fue eliminado');
        setOrderDeleted(true);
      }
      setLoading(false);
    });

    return () => {
      console.log('🛑 [TRACKING] Deteniendo observación del pedido');
      unsubscribe();
    };
  }, [orderId]);

  // Actualizar tiempo transcurrido
  useEffect(() => {
    if (order?.createdAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - order.createdAt!) / 1000);
        setTimeElapsed(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order?.createdAt]);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtener mensaje según el estado
  const getStatusMessage = () => {
    if (!order) return '';
    
    // Mapeo de emojis por estado
    const emojiMap: { [key: string]: string } = {
      'PENDING': '⏳',
      'ACCEPTED': '✅',
      'ON_THE_WAY_TO_PICKUP': '🏍️',
      'ARRIVED_AT_PICKUP': '📍',
      'ON_THE_WAY_TO_DESTINATION': '🛣️',
      'DELIVERED': '🎯',
      'CANCELLED': '❌'
    };
    
    const emoji = emojiMap[order.status?.toUpperCase()] || '📊';
    
    switch (order.status?.toUpperCase()) {
      case 'PENDING':
        return `${emoji} Buscando un repartidor cercano...`;
      case 'ACCEPTED':
        return `${emoji} ¡Repartidor asignado! Se dirige a tu ubicación.`;
      case 'ON_THE_WAY_TO_PICKUP':
        return `${emoji} Tu repartidor va en camino a recogerte.`;
      case 'ARRIVED_AT_PICKUP':
        return `${emoji} ¡Tu repartidor ha llegado! Sube a la motocicleta.`;
      case 'ON_THE_WAY_TO_DESTINATION':
        return `${emoji} Viajando hacia tu destino de forma segura.`;
      case 'DELIVERED':
        return `${emoji} ¡Has llegado a tu destino! Gracias por usar nuestro servicio.`;
      case 'CANCELLED':
        return `${emoji} El viaje ha sido cancelado.`;
      default:
        return `${emoji} Procesando tu solicitud...`;
    }
  };

  // Renderizar durante carga
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#eff6ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏍️</div>
          <p style={{ fontSize: '1.125rem', color: '#1f2937' }}>Cargando información del viaje...</p>
        </div>
      </div>
    );
  }

  // Renderizar si hay error
  if (error || !order) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#eff6ff',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '1rem' }}>
            {orderDeleted ? 'Pedido Eliminado' : 'Error al cargar el viaje'}
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {orderDeleted 
              ? 'Este pedido ha sido eliminado por el administrador y ya no está disponible.'
              : (error || 'Pedido no encontrado')}
          </p>
          <button
            onClick={() => navigate('/mis-pedidos')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#eff6ff',
      padding: '1rem'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '1rem',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => navigate('/mis-pedidos')}
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
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Seguimiento de tu Viaje
        </h1>
      </header>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Tarjeta principal del pedido */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '1rem'
        }}>
          {/* Estado actual destacado */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: getStatusColor(order.status),
            borderRadius: '0.75rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {getStatusIcon(order.status)}
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0.5rem 0'
            }}>
              {getStatusMessage()}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.5rem' }}>
              Tiempo transcurrido: {formatTime(timeElapsed)}
            </p>
          </div>

          {/* Información del viaje */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              📋 Detalles del Viaje
            </h3>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                Número de pedido: <strong>#{orderId?.slice(-6).toUpperCase()}</strong>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                Tarifa: <strong>${order.deliveryCost || 'N/A'} MXN</strong>
              </p>
              {order.distance && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                  Distancia: <strong>{order.distance} km</strong>
                </p>
              )}
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>
                Fecha: <strong>{new Date(order.createdAt!).toLocaleString()}</strong>
              </p>
            </div>

            {/* Ruta del viaje */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1rem'
            }}>
              {/* Punto de Partida - Priorizar pickupAddress sobre clientAddress */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Punto de Partida:
                </p>
                <p style={{ fontSize: '0.875rem', color: '#1f2937', margin: 0 }}>
                  {order.pickupAddress || order.clientAddress || 'Ubicación actual'}
                </p>
                {order.pickupAddress && order.clientAddress && order.pickupAddress !== order.clientAddress && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    (clientAddress: {order.clientAddress})
                  </p>
                )}
              </div>

              {/* Destino - Usar deliveryAddress, con fallback a items si está vacío */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Destino:
                </p>
                <p style={{ fontSize: '0.875rem', color: '#1f2937', margin: 0 }}>
                  {order.deliveryAddress || 'Por definir'}
                </p>
                {!order.deliveryAddress && order.items && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Información alternativa: {order.items}
                  </p>
                )}
              </div>
              
              {/* Debug: Mostrar todos los campos de dirección si están disponibles */}
              {(order.pickupAddress || order.deliveryAddress) && (
                <details style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
                  <summary style={{ fontSize: '0.75rem', color: '#6b7280', cursor: 'pointer' }}>
                    Ver detalles técnicos (debug)
                  </summary>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.5rem' }}>
                    <p style={{ margin: '0.25rem 0' }}>pickupAddress: {order.pickupAddress || 'No disponible'}</p>
                    <p style={{ margin: '0.25rem 0' }}>deliveryAddress: {order.deliveryAddress || 'No disponible'}</p>
                    <p style={{ margin: '0.25rem 0' }}>clientAddress: {order.clientAddress || 'No disponible'}</p>
                    <p style={{ margin: '0.25rem 0' }}>items: {order.items || 'No disponible'}</p>
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Timeline del estado */}
          <MotorcycleOrderTimeline status={order.status} />

          {/* Información del repartidor (si está asignado) */}
          {order.riderName && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#dbeafe',
              borderRadius: '0.5rem',
              border: '1px solid #93c5fd'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#1e40af',
                marginBottom: '0.5rem'
              }}>
                Tu Repartidor
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: '0.25rem 0' }}>
                Nombre: <strong>{order.riderName}</strong>
              </p>
              {order.riderPhone && (
                <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: '0.25rem 0' }}>
                  Teléfono: <strong>{order.riderPhone}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción rápida */}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
          }}>
            <button
              onClick={() => handleContactRider(order)}
              style={{
                padding: '1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Contactar Repartidor
            </button>
            <button
              onClick={() => handleCancelOrder(orderId!)}
              style={{
                padding: '1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Cancelar Viaje
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Funciones helper
  function getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#f59e0b',
      'ACCEPTED': '#10b981',
      'ON_THE_WAY_TO_PICKUP': '#3b82f6',
      'ARRIVED_AT_PICKUP': '#8b5cf6',
      'ON_THE_WAY_TO_DESTINATION': '#06b6d4',
      'DELIVERED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status?.toUpperCase()] || '#6b7280';
  }

  function getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PENDING': '⏳',
      'ACCEPTED': '✅',
      'ON_THE_WAY_TO_PICKUP': '🏍️',
      'ARRIVED_AT_PICKUP': '📍',
      'ON_THE_WAY_TO_DESTINATION': '🛣️',
      'DELIVERED': '🎯',
      'CANCELLED': '❌'
    };
    return icons[status?.toUpperCase()] || '📊';
  }

  function handleContactRider(currentOrder: ClientOrder) {
    if (currentOrder.riderPhone) {
      window.open(`tel:${currentOrder.riderPhone}`, '_self');
    } else {
      alert('ℹ️ El repartidor aún no ha compartido su número de teléfono');
    }
  }

  async function handleCancelOrder(id: string) {
    if (window.confirm('¿Estás seguro de que deseas cancelar este viaje?')) {
      try {
        await OrderService.cancelOrder(id);
        alert('✅ Viaje cancelado exitosamente');
      } catch (err) {
        alert('❌ Error al cancelar el viaje');
        console.error(err);
      }
    }
  }
};

export default MotorcycleOrderTrackingPage;
