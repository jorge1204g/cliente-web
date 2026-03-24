import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService from '../services/OrderService';
import { ClientOrder } from '../services/OrderService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState<string>('');
  const [hasActiveOrder, setHasActiveOrder] = useState<boolean>(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const name = AuthService.getClientName();
    setClientName(name || 'Cliente');

    // Verificar si hay pedidos en curso
    const clientId = AuthService.getClientId();
    if (clientId) {
      const unsubscribe = OrderService.listenToClientOrders(clientId, (orders: ClientOrder[]) => {
        // Filtrar pedidos que están en curso (no cancelados ni entregados)
        // Verificar múltiples formatos de estado (minúsculas, mayúsculas, etc.)
        const activeOrders = orders.filter(order => {
          const statusLower = order.status.toLowerCase();
          return (
            statusLower !== 'cancelled' &&
            statusLower !== 'cancelado' &&
            statusLower !== 'delivered' &&
            statusLower !== 'entregado' &&
            statusLower !== 'completed' &&
            statusLower !== 'completado'
          );
        });
        
        setHasActiveOrder(activeOrders.length > 0);
        setActiveOrdersCount(activeOrders.length);
      });

      return () => {
        // Cleanup subscription si es necesario
      };
    }
  }, [navigate]);

  const services = [
    {
      icon: '🍔',
      title: 'Comida',
      description: 'De cualquier restaurante',
      color: '#f59e0b'
    },
    {
      icon: '⛽',
      title: 'Gasolina',
      description: 'Te llevamos tu combustible',
      color: '#ef4444'
    },
    {
      icon: '📝',
      title: 'Papelería',
      description: 'Todo para tu oficina',
      color: '#3b82f6'
    },
    {
      icon: '💊',
      title: 'Medicamentos',
      description: 'Farmacia a domicilio',
      color: '#10b981'
    },
    {
      icon: '🍺',
      title: 'Cervezas y Cigarros',
      description: 'Para tu fiesta',
      color: '#8b5cf6'
    },
    {
      icon: '💧',
      title: 'Garrafones de Agua',
      description: 'Hidratación garantizada',
      color: '#06b6d4'
    },
    {
      icon: '🔥',
      title: 'Gas',
      description: 'Para tu hogar',
      color: '#f97316'
    },
    {
      icon: '📦',
      title: 'Pagos o Cobros',
      description: 'Gestiones rápidas',
      color: '#ec4899'
    },
    {
      icon: '🎁',
      title: 'Favores',
      description: 'Directo a tu puerta',
      color: '#6366f1'
    }
  ];

  const handleCreateOrder = () => {
    navigate('/crear-pedido');
  };

  const handleMyOrders = () => {
    navigate('/mis-pedidos');
  };

  const handleProfile = () => {
    navigate('/perfil');
  };

  const handlePruebas = () => {
    // Abrir la página de pruebas en una nueva pestaña
    window.open('/test-maps-simple.html', '_blank');
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  // Agregar estilos de animación
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              🚚 Click Entrega
            </h1>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              ¡Bienvenido, {clientName}!
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🚪 Salir
          </button>
        </div>
      </header>

      {/* Notificación de Pedido en Curso */}
      {hasActiveOrder && (
        <section style={{
          backgroundColor: '#dbeafe',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          borderBottom: '2px solid #3b82f6',
          animation: 'fadeInDown 0.5s ease-in'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '0.5rem'
            }}>
              🎉
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e40af',
              marginBottom: '0.5rem'
            }}>
              {activeOrdersCount === 1 
                ? '¡Tienes un pedido en curso!' 
                : `¡Tienes ${activeOrdersCount} pedidos en curso!`}
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#1e3a8a',
              marginBottom: '1rem'
            }}>
              Consulta el estado de tu pedido ahora mismo
            </p>
            <button
              onClick={handleMyOrders}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '2rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📋 Ver Mi Pedido Ahora
            </button>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section style={{
        backgroundColor: 'white',
        padding: '2rem 1rem',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          Te traemos o enviamos todo lo que quieras
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          De donde quieras, a la hora que quieras. ¡Nosotros sí te hacemos los mandados!
        </p>

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleCreateOrder}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            📦 Crear Pedido
          </button>
          <button
            onClick={handleMyOrders}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            📋 Mis Pedidos
          </button>
          <button
            onClick={handleProfile}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            👤 Perfil
          </button>
          <button
            onClick={handlePruebas}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(245, 158, 11, 0.4)'
            }}
          >
            🧪 Pruebas
          </button>
        </div>
      </section>

      {/* Servicios */}
      <section style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Nuestros Servicios
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {services.map((service, index) => (
            <div
              key={index}
              onClick={handleCreateOrder}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                border: `2px solid ${service.color}`
              }}
            >
              <div style={{
                fontSize: '3rem',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                {service.icon}
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: service.color,
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                {service.title}
              </h4>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section style={{
        backgroundColor: 'white',
        margin: '2rem 1rem',
        padding: '2rem 1rem',
        borderRadius: '0.75rem',
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          ¿Por qué elegir Click Entrega?
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{ padding: '1rem' }}>
            <h4 style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
              ✅ Sin comisiones ocultas
            </h4>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Solo cobramos el 10% de comisión en los productos. ¡Transparente y justo!
            </p>
          </div>
          <div style={{ padding: '1rem' }}>
            <h4 style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
              🕐 Servicio 24/7
            </h4>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Atención al cliente las 24 horas. Siempre disponibles para ti.
            </p>
          </div>
          <div style={{ padding: '1rem' }}>
            <h4 style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
              🔒 Seguridad total
            </h4>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Repartidores independientes verificados. Tus paquetes están seguros con nosotros.
            </p>
          </div>
          <div style={{ padding: '1rem' }}>
            <h4 style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
              💳 Todos los métodos de pago
            </h4>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Aceptamos todas las tarjetas. Fácil y conveniente.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '2rem 1rem',
        marginTop: '3rem',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          © 2024 Click Entrega - Repartos Fresnillo
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
          Somos una empresa comprometida con el cliente y la seguridad de tus paquetes o entregas
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
