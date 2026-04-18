import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../services/Firebase';
import AuthService from '../services/AuthService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que los campos no estén vacíos
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo electrónico/teléfono y contraseña');
      return;
    }

    setLoading(true);

    try {
      const success = await AuthService.login(emailOrPhone, password);
      
      if (success) {
        // Obtener el ID del cliente autenticado
        const clientId = AuthService.getClientId() || '';
        
        if (clientId) {
          // Verificar si hay pedidos activos para este cliente
          const hasActiveOrder = await checkForActiveOrder(clientId);
          
          // Pequeño delay para asegurar que la sesión se guarde correctamente
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (hasActiveOrder) {
            // Si hay un pedido activo, redirigir al seguimiento
            console.log('🎯 Navegando a seguimiento:', hasActiveOrder);
            window.location.href = `/seguimiento?pedido=${hasActiveOrder}`;
          } else {
            // Si no hay pedido activo, ir a selección de servicios
            console.log('🎯 Navegando a servicios (sin pedidos activos)');
            window.location.href = '/servicios';
          }
        } else {
          // Si no hay clientId, ir a servicios por defecto
          window.location.href = '/servicios';
        }
      } else {
        setError('Correo o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si hay pedidos activos
  const checkForActiveOrder = async (clientId: string): Promise<string | null> => {
    try {
      console.log('=== INICIO VERIFICACIÓN DE PEDIDOS ===');
      console.log('Client ID:', clientId);
      console.log('Client Name:', AuthService.getClientName());
      
      const ordersRef = ref(database, 'orders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const allOrders = snapshot.val();
        const clientName = AuthService.getClientName() || '';
        
        console.log('Total de pedidos encontrados:', Object.keys(allOrders).length);
        
        // Buscar pedidos activos del cliente
        for (const orderId in allOrders) {
          const order = allOrders[orderId];
          
          console.log(`Pedido ${orderId}:`, {
            clientId: order.clientId,
            customerName: order.customer?.name,
            status: order.status,
            matchesById: order.clientId === clientId,
            matchesByName: order.customer?.name === clientName
          });
          
          // Verificar si es del cliente (por clientId o por nombre del cliente)
          const isClientOrder = order.clientId === clientId || 
                               (order.customer && order.customer.name === clientName);
          
          if (isClientOrder) {
            // Estados activos: todos excepto entregado, cancelado o completado
            const inactiveStatuses = ['delivered', 'cancelled', 'completed', 'DELIVERED', 'CANCELLED'];
            const isOrderActive = !inactiveStatuses.includes(order.status);
            
            console.log('Pedido del cliente encontrado - Activo:', isOrderActive);
            
            if (isOrderActive) {
              console.log('✅ REDIRIGIENDO AL PEDIDO ACTIVO:', orderId);
              return orderId; // Retornar el ID del pedido activo
            }
          }
        }
      } else {
        console.log('No hay pedidos en la base de datos');
      }
      
      console.log('=== NO SE ENCONTRARON PEDIDOS ACTIVOS ===');
      return null; // No hay pedidos activos
    } catch (error) {
      console.error('Error verificando pedidos activos:', error);
      return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Nota importante */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.9375rem',
            color: '#92400e',
            margin: '0 0 0.5rem 0',
            fontWeight: '600',
            lineHeight: '1.5'
          }}>
            ⚠️ ¡IMPORTANTE!
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: '#78350f',
            margin: '0',
            lineHeight: '1.5'
          }}>
            Debes crear tu cuenta para poder solicitar tu pedido de comida. 
            <strong> Sin registro no podrás utilizar el servicio ni ver tu pedido en vivo.</strong>
          </p>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#667eea',
            marginBottom: '0.5rem'
          }}>
            🚚 Click Entrega
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            ¡Nosotros sí te hacemos los mandados!
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Correo electrónico o Teléfono
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              placeholder="tu@correo.com o 492 123 4567"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              placeholder="••••••"
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Registro */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              style={{
                color: '#667eea',
                fontWeight: '700',
                textDecoration: 'none',
                fontSize: '1.25rem'
              }}
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
