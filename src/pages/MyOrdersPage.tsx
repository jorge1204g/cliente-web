import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService, { ClientOrder } from '../services/OrderService';

// Componente de Timeline para el estado del pedido
const OrderStatusTimeline: React.FC<{ status: string; serviceType?: string }> = ({ status, serviceType }) => {
  // Determinar el tipo de servicio para personalizar textos
  const isGasoline = serviceType === 'GASOLINE';
  const isFood = serviceType === 'FOOD';
  const isMedicines = serviceType === 'MEDICINES';
  const isStationery = serviceType === 'STATIONERY';
  const isBeverages = serviceType === 'BEVERAGES';
  const isWater = serviceType === 'WATER';
  const isGas = serviceType === 'GAS';
  const isPayments = serviceType === 'PAYMENTS';
  const isFavors = serviceType === 'FAVORS';
  
  // Definir los estados en orden con textos personalizados por servicio
  const statusSteps = [
    { key: 'pending', label: '⏳ Pendiente', icon: '⏳' },
    { key: 'accepted', label: '✅ Aceptado', icon: '✅' },
    {
      key: 'on_the_way_to_store',
      label: isGasoline ? '🚗⛽ En camino a recoger tu gasolina' : 
             isFood ? '🚗🍔 En camino al restaurante' :
             isMedicines ? '🚗💊 En camino a la farmacia' :
             isStationery ? '🚗📝 En camino a la papelería' :
             isBeverages ? '🚗🍺 En camino a recoger bebidas' :
             isWater ? '🚗💧 En camino por garrafones' :
             isGas ? '🚗🔥 En camino por gas' :
             isPayments ? '🚗📦 En camino a realizar pago' :
             isFavors ? '🚗🎁 En camino a recoger favor' :
             '🚗 En camino a recoger',
      icon: isGasoline ? '🚗⛽' : '🚗'
    },
    {
      key: 'arrived_at_store',
      label: isGasoline ? '⛽ Llegó a la gasolinera tu repartidor' :
             isFood ? '🍔 Llegó al restaurante' :
             isMedicines ? '💊 Llegó a la farmacia' :
             isStationery ? '📝 Llegó a la papelería' :
             isBeverages ? '🍺 Llegó a la tienda' :
             isWater ? '💧 Llegó por el agua' :
             isGas ? '🔥 Llegó por el gas' :
             isPayments ? '📦 Llegó a realizar el pago' :
             isFavors ? '🎁 Llegó a recoger el favor' :
             '🛍️ Llegó al restaurante',
      icon: isGasoline ? '⛽' : '🛍️'
    },
    {
      key: 'picking_up_order',
      label: isGasoline ? '⛽ Repartidor con tu gasolina' :
             isFood ? '🍔 Repartidor con alimentos' :
             isMedicines ? '💊 Repartidor con medicamentos' :
             isStationery ? '📝 Repartidor con papelería' :
             isBeverages ? '🍺 Repartidor con bebidas' :
             isWater ? '💧 Repartidor con garrafones' :
             isGas ? '🔥 Repartidor con gas' :
             isPayments ? '📦 Repartidor realizando pago' :
             isFavors ? '🎁 Repartidor con tu favor' :
             '🎒 Repartidor con alimentos',
      icon: isGasoline ? '⛽' : '🎒'
    },
    {
      key: 'on_the_way_to_customer',
      label: isGasoline ? '🚴⛽ En camino a tu domicilio - Estate pendiente' :
             isFood ? '🚴🍔 En camino a tu domicilio' :
             isMedicines ? '🚴💊 En camino a tu domicilio' :
             isStationery ? '🚴📝 En camino a tu domicilio' :
             isBeverages ? '🚴🍺 En camino a tu domicilio' :
             isWater ? '🚴💧 En camino a tu domicilio' :
             isGas ? '🚴🔥 En camino a tu domicilio' :
             isPayments ? '🚴📦 En camino a entregarte comprobante' :
             isFavors ? '🚴🎁 En camino a entregarte tu favor' :
             '🚴 En camino al cliente',
      icon: isGasoline ? '🚴⛽' : '🚴'
    },
    {
      key: 'delivered',
      label: isGasoline ? '⛽ Gasolina entregada exitosamente' :
             isFood ? '🍔 Comida entregada' :
             isMedicines ? '💊 Medicamentos entregados' :
             isStationery ? '📝 Papelería entregada' :
             isBeverages ? '🍺 Bebidas entregadas' :
             isWater ? '💧 Garrafones entregados' :
             isGas ? '🔥 Gas entregado' :
             isPayments ? '📦 Pago realizado con éxito' :
             isFavors ? '🎁 Favor completado' :
             '✅ Entregado',
      icon: isGasoline ? '⛽' : '✅'
    }
  ];

  // Mapear estados equivalentes desde la app del repartidor a la app del cliente
  const normalizeStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      // Estados desde la app del repartidor
      'ACCEPTED': 'accepted',
      'ON_THE_WAY_TO_STORE': 'on_the_way_to_store',
      'ARRIVED_AT_STORE': 'arrived_at_store',
      'PICKING_UP_ORDER': 'picking_up_order',
      'ON_THE_WAY_TO_CUSTOMER': 'on_the_way_to_customer',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
      // Estados legacy o alternativos
      'MANUAL_ASSIGNED': 'pending',
      'ASSIGNED': 'pending',
      'PENDING': 'pending',
      // Mapeo alternativo por si viene en otro formato
      'IN_ROUTE_PICKUP': 'on_the_way_to_store',
      'PICKED_UP': 'picking_up_order',
      'IN_ROUTE_DELIVERY': 'on_the_way_to_customer'
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
        <p style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '0.875rem' }}>
          ❌ Pedido Cancelado
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
          {status}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1.5rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        📍 Seguimiento del Pedido en Tiempo Real
      </h4>
      
      {/* Timeline vertical */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}>
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <React.Fragment key={step.key}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                opacity: isCompleted ? 1 : 0.5
              }}>
                {/* Icono */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#10b981' : '#d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  ...(isCurrent && { boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)' })
                }}>
                  {step.icon}
                </div>
                
                {/* Texto */}
                <div style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  fontWeight: isCurrent ? '600' : '400',
                  color: isCompleted ? '#1f2937' : '#9ca3af'
                }}>
                  {step.label}
                  {isCurrent && (
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#10b981'
                    }}>
                      (Actual)
                    </span>
                  )}
                </div>
                
                {/* Checkmark si está completado */}
                {isCompleted && index < currentIndex && (
                  <div style={{
                    fontSize: '1.25rem',
                    color: '#10b981'
                  }}>
                    ✓
                  </div>
                )}
              </div>
              
              {/* Línea conectora (excepto en el último elemento) */}
              {index < statusSteps.length - 1 && (
                <div style={{
                  width: '2px',
                  height: '20px',
                  backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                  marginLeft: '19px',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Mensaje final */}
      {currentIndex === statusSteps.length - 1 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#d1fae5',
          borderRadius: '0.5rem',
          textAlign: 'center',
          border: '1px solid #10b981'
        }}>
          <p style={{
            color: '#065f46',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}>
            🎉 ¡Pedido entregado exitosamente!
          </p>
        </div>
      )}
    </div>
  );
};

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active'); // Pestaña activa

  // Función para calcular el tiempo restante (5 minutos desde la creación)
  const calculateTimeRemaining = (createdAt: number): number => {
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
    const now = Date.now();
    const createdAtTime = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
    const elapsed = now - createdAtTime;
    const remaining = Math.max(0, fiveMinutes - elapsed);
    return remaining;
  };

  // Formatear tiempo restante a MM:SS
  const formatTimeRemaining = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const clientId = AuthService.getClientId();
    if (!clientId) return;

    // Escuchar pedidos en tiempo real
    OrderService.listenToClientOrders(clientId, (clientOrders) => {
      setOrders(clientOrders);
      setLoading(false);
    });

    return () => {
      // Cleanup si es necesario
    };
  }, [navigate]);

  // Efecto para actualizar el temporizador cada segundo
  useEffect(() => {
    // Calcular tiempo restante inicial
    const initialTimes: { [key: string]: number } = {};
    orders.forEach(order => {
      if ((order.status === 'pending' || order.status === 'PENDING' || order.status === 'MANUAL_ASSIGNED') && !order.assignedToDeliveryId) {
        initialTimes[order.id!] = calculateTimeRemaining(order.createdAt);
      }
    });
    setTimeRemaining(initialTimes);

    // Actualizar cada segundo
    const interval = setInterval(() => {
      const updatedTimes: { [key: string]: number } = {};
      orders.forEach(order => {
        if ((order.status === 'pending' || order.status === 'PENDING' || order.status === 'MANUAL_ASSIGNED') && !order.assignedToDeliveryId) {
          updatedTimes[order.id!] = calculateTimeRemaining(order.createdAt);
        }
      });
      setTimeRemaining(updatedTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
      case 'ACCEPTED':
        return '#3b82f6';
      case 'picked_up':
      case 'PICKED_UP':
        return '#8b5cf6';
      case 'delivered':
      case 'DELIVERED':
        return '#10b981';
      case 'cancelled':
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pendiente de asignación';
      case 'accepted':
      case 'ACCEPTED':
        return '✅ Aceptado - Buscando repartidor';
      case 'in_route_pickup':
      case 'IN_ROUTE_PICKUP':
        return '🚗 En camino a recoger';
      case 'picked_up':
      case 'PICKED_UP':
        return '📦 Pedido recogido';
      case 'in_route_delivery':
      case 'IN_ROUTE_DELIVERY':
        return '🚚 En camino a entregar';
      case 'delivered':
      case 'DELIVERED':
        return '✅ Entregado';
      case 'cancelled':
      case 'CANCELLED':
        return '❌ Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'FOOD':
        return '🍔';
      case 'GASOLINE':
        return '⛽';
      case 'STATIONERY':
        return '📝';
      case 'MEDICINES':
        return '💊';
      case 'BEVERAGES':
        return '🍺';
      case 'WATER':
        return '💧';
      case 'GAS':
        return '🔥';
      case 'PAYMENTS':
        return '📦';
      case 'FAVORS':
        return '🎁';
      default:
        return '📋';
    }
  };

  const getServiceTypeText = (serviceType: string): string => {
    switch (serviceType) {
      case 'FOOD':
        return '🍔 Comida';
      case 'GASOLINE':
        return '⛽ Gasolina';
      case 'STATIONERY':
        return '📝 Papelería';
      case 'MEDICINES':
        return '💊 Medicamentos';
      case 'BEVERAGES':
        return '🍺 Cervezas y Cigarros';
      case 'WATER':
        return '💧 Garrafones de Agua';
      case 'GAS':
        return '🔥 Gas';
      case 'PAYMENTS':
        return '📦 Pagos o Cobros';
      case 'FAVORS':
        return '🎁 Favores';
      default:
        return 'Servicio';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

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
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            📋 Mis Pedidos
          </h1>
        </div>
        <button
          onClick={() => navigate('/crear-pedido')}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ➕ Crear Nuevo Pedido
        </button>
      </header>

      {/* Lista de Pedidos */}
      {orders.length === 0 ? (
        <div style={{
          maxWidth: '800px',
          margin: '3rem auto',
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '0.75rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            No tienes pedidos aún
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            ¡Crea tu primer pedido y nosotros nos encargamos del resto!
          </p>
          <button
            onClick={() => navigate('/crear-pedido')}
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            🚀 Crear Mi Primer Pedido
          </button>
        </div>
      ) : (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Pestañas de navegación */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            backgroundColor: 'white',
            padding: '0.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                flex: 1,
                padding: '0.875rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'active' ? '#667eea' : 'transparent',
                color: activeTab === 'active' ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              🚀 Pedidos en Curso
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'DELIVERED' && o.status !== 'cancelled' && o.status !== 'CANCELLED').length > 0 && (
                <span style={{
                  marginLeft: '0.5rem',
                  backgroundColor: activeTab === 'active' ? 'rgba(255,255,255,0.3)' : '#667eea',
                  color: activeTab === 'active' ? 'white' : 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  {orders.filter(o => o.status !== 'delivered' && o.status !== 'DELIVERED' && o.status !== 'cancelled' && o.status !== 'CANCELLED').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '0.875rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'history' ? '#667eea' : 'transparent',
                color: activeTab === 'history' ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              📜 Historial
              {orders.filter(o => o.status === 'delivered' || o.status === 'DELIVERED').length > 0 && (
                <span style={{
                  marginLeft: '0.5rem',
                  backgroundColor: activeTab === 'history' ? 'rgba(255,255,255,0.3)' : '#6b7280',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  {orders.filter(o => o.status === 'delivered' || o.status === 'DELIVERED').length}
                </span>
              )}
            </button>
          </div>

          {/* Lista de pedidos filtrados */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orders
              .filter(order => {
                if (activeTab === 'active') {
                  // Mostrar solo pedidos activos (no entregados ni cancelados)
                  return order.status !== 'delivered' && order.status !== 'DELIVERED' && order.status !== 'cancelled' && order.status !== 'CANCELLED';
                } else {
                  // Mostrar solo pedidos entregados
                  return order.status === 'delivered' || order.status === 'DELIVERED';
                }
              })
              .sort((a, b) => {
                // Ordenar por fecha más reciente
                return b.createdAt - a.createdAt;
              })
              .map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getStatusColor(order.status)}`
              }}
            >
              {/* Header del Pedido */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {getServiceIcon(order.serviceType)}
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        Pedido #{order.orderCode}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  {/* Tipo de Servicio Seleccionado */}
                  {order.serviceType && (
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #bfdbfe',
                      marginTop: '0.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1e40af',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getServiceTypeText(order.serviceType)}
                      </p>
                    </div>
                  )}
                  
                  {/* TEMPORIZADOR DE 5 MINUTOS - Solo para pedidos pendientes */}
                  {((order.status === 'pending' || order.status === 'PENDING' || order.status === 'MANUAL_ASSIGNED') && !order.assignedToDeliveryId && timeRemaining[order.id!] !== undefined) && (
                    <div style={{
                      display: 'inline-block',
                      padding: '0.75rem 1rem',
                      backgroundColor: timeRemaining[order.id!] === 0 
                        ? '#fee2e2'  // Rojo si expiró
                        : timeRemaining[order.id!] < 120000  // Menos de 2 minutos
                          ? '#fef3c7'  // Amarillo si queda poco tiempo
                          : '#eff6ff', // Azul normal
                      borderRadius: '0.5rem',
                      border: `1px solid ${timeRemaining[order.id!] === 0 
                        ? '#fecaca' 
                        : timeRemaining[order.id!] < 120000 
                          ? '#fcd34d' 
                          : '#bfdbfe'}`,
                      marginTop: '0.5rem'
                    }}>
                      {timeRemaining[order.id!] === 0 ? (
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#991b1b',
                            margin: '0 0 0.25rem 0'
                          }}>
                            ⚠️ Tiempo de espera agotado
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#991b1b',
                            margin: 0,
                            maxWidth: '400px'
                          }}>
                            En este momento no contamos con repartidores disponibles para aceptar tu orden. 
                            Por favor, intenta más tarde o contacta a soporte.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: timeRemaining[order.id!] < 120000 ? '#92400e' : '#1e40af',
                            margin: '0 0 0.25rem 0'
                          }}>
                            ⏱️ Tiempo estimado de aceptación:
                          </p>
                          <p style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: timeRemaining[order.id!] < 120000 ? '#b45309' : '#1e40af',
                            margin: 0,
                            fontFamily: 'monospace'
                          }}>
                            {formatTimeRemaining(timeRemaining[order.id!]!)}
                          </p>
                          {timeRemaining[order.id!]! < 120000 && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#b45309',
                              margin: '0.25rem 0 0 0'
                            }}>
                              ⚠️ ¡Queda poco tiempo!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: getStatusColor(order.status),
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}>
                  {getStatusText(order.status)}
                </div>
              </div>

              {/* INFORMACIÓN IMPORTANTE - Costo, Repartidor y Código */}
              {(order.deliveryCost || order.assignedToDeliveryId || order.confirmationCode) && (
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Costo de envío y Distancia */}
                  {(order.distanceKm || order.deliveryCost) && (
                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #bfdbfe'
                    }}>
                      {order.distanceKm && (
                        <div>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#1e40af',
                            fontWeight: '600'
                          }}>
                            📏 Distancia
                          </p>
                          <p style={{
                            color: '#1e40af',
                            fontWeight: 'bold'
                          }}>
                            {order.distanceKm.toFixed(2)} km
                          </p>
                        </div>
                      )}
                      {/* OCULTO - Costo de envío ya no se muestra al cliente */}
                      {/* 
                      {order.deliveryCost && (
                        <div>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#1e40af',
                            fontWeight: '600'
                          }}>
                            💰 Costo de envío
                          </p>
                          <p style={{
                            color: '#1e40af',
                            fontWeight: 'bold'
                          }}>
                            ${order.deliveryCost.toFixed(2)}
                          </p>
                        </div>
                      )}
                      */}
                    </div>
                  )}

                  {/* Repartidor asignado */}
                  {order.assignedToDeliveryId && order.deliveryPersonName && (
                    <div style={{
                      display: 'grid',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '0.5rem',
                        border: '1px solid #10b981'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#065f46',
                          fontWeight: '600',
                          marginBottom: '0.25rem'
                        }}>
                          🚚 Repartidor asignado
                        </p>
                        <p style={{ color: '#065f46', fontWeight: 'bold' }}>
                          {order.deliveryPersonName}
                        </p>
                      </div>
                      
                      {/* Botón para chatear con el repartidor */}
                      <button
                        onClick={() => {
                          const dId = order.assignedToDeliveryId || '';
                          const dName = order.deliveryPersonName || '';
                          const oCode = order.orderCode;
                          navigate(`/chat?deliveryId=${dId}&deliveryName=${encodeURIComponent(dName)}&orderId=${oCode}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#5568d3';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#667eea';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        💬 Chatear con tu repartidor
                      </button>
                    </div>
                  )}

                  {/* Código de Confirmación */}
                  {order.confirmationCode && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f8f0ff',
                      borderRadius: '0.5rem',
                      border: '2px solid #6f42c1',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6f42c1',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        🎫 Código de Confirmación del Pedido
                      </p>
                      <p style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#6f42c1',
                        letterSpacing: '0.75rem',
                        margin: '0.5rem 0'
                      }}>
                        {order.confirmationCode}
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6f42c1',
                        marginTop: '0.5rem'
                      }}>
                        ℹ️ Proporciona este código al repartidor para finalizar la entrega
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline de Estado del Pedido */}
              <OrderStatusTimeline status={order.status} serviceType={order.serviceType} />

              {/* Información del Pedido */}
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>
                    📍 Dirección de entrega
                  </p>
                  <p style={{ color: '#1f2937', fontSize: '0.875rem' }}>
                    {order.deliveryAddress}
                  </p>
                </div>

                {/* Botón de compartir seguimiento */}
                <button
                  onClick={() => {
                    const trackingUrl = `https://cliente-web-mu.vercel.app/seguimiento?codigo=${order.orderCode}`;
                    const message = `¡Hola! Tu pedido #${order.orderCode} está en proceso.\nCódigo de confirmación: ${order.confirmationCode || 'N/A'}\n\nSíguelo en tiempo real:\n${trackingUrl}`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: `Mi Pedido #${order.orderCode}`,
                        text: message,
                        url: trackingUrl
                      }).catch(() => {
                        navigator.clipboard.writeText(trackingUrl);
                        alert('Link copiado al portapapeles!');
                      });
                    } else {
                      navigator.clipboard.writeText(message);
                      alert('Mensaje copiado al portapapeles!');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    marginTop: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  📤 Compartir Link de Seguimiento
                </button>

                {order.items && (
                  <div>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      📝 Descripción
                    </p>
                    <p style={{ color: '#1f2937', fontSize: '0.875rem' }}>
                      {order.items}
                    </p>
                  </div>
                )}

                {order.image && (
                  <div>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      📸 Imagen del pedido
                    </p>
                    <img
                      src={order.image}
                      alt="Pedido"
                      style={{
                        maxWidth: '200px',
                        borderRadius: '0.5rem',
                        border: '2px solid #e5e7eb'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Botón de Cancelar (solo si está pendiente) */}
              {order.status === 'pending' && (
                <button
                  onClick={async () => {
                    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
                      if (order.id) {
                        await OrderService.cancelOrder(order.id);
                        alert('Pedido cancelado exitosamente');
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  ❌ Cancelar Pedido
                </button>
              )}

              {/* Botón de Eliminar (si está pendiente o cancelado) */}
              {(order.status === 'pending' || order.status === 'cancelled') && (
                <button
                  onClick={async () => {
                    if (confirm('⚠️ ¿Estás SEGURO de que deseas ELIMINAR este pedido permanentemente? Esta acción no se puede deshacer.')) {
                      if (order.id) {
                        const success = await OrderService.deleteOrder(order.id);
                        if (success) {
                          alert('🗑️ Pedido eliminado permanentemente');
                        } else {
                          alert('Error al eliminar el pedido');
                        }
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#dc2626', // Rojo más oscuro
                    color: 'white',
                    border: '2px solid #991b1b',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '0.75rem'
                  }}
                >
                  🗑️ ELIMINAR PEDIDO PERMANENTEMENTE
                </button>
              )}
            </div>
          ))}
            
            {/* Mensaje cuando no hay pedidos en la pestaña seleccionada */}
            {orders.filter(order => {
              if (activeTab === 'active') {
                return order.status !== 'delivered' && order.status !== 'DELIVERED' && order.status !== 'cancelled' && order.status !== 'CANCELLED';
              } else {
                return order.status === 'delivered' || order.status === 'DELIVERED';
              }
            }).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  {activeTab === 'active' ? '📦' : '📜'}
                </div>
                <h3 style={{ 
                  color: '#374151', 
                  marginBottom: '0.5rem',
                  fontSize: '1.25rem'
                }}>
                  {activeTab === 'active' 
                    ? 'No hay pedidos en curso' 
                    : 'No hay historial de pedidos'
                  }
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  {activeTab === 'active' 
                    ? '¡Crea un nuevo pedido para comenzar!' 
                    : 'Los pedidos entregados aparecerán aquí.'
                  }
                </p>
                {activeTab === 'active' && (
                  <button
                    onClick={() => navigate('/crear-pedido')}
                    style={{
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🚀 Crear Pedido
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
