import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import OrderService from '../services/OrderService';

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Datos del cliente
  const [clientName, setClientName] = useState(AuthService.getClientName() || '');
  const [clientPhone, setClientPhone] = useState(AuthService.getClientPhone() || '');
  const [clientAddress, setClientAddress] = useState('');
  
  // Tipo de servicio
  const [serviceType, setServiceType] = useState('');
  
  // ¿Requiere recogida?
  const [requiresPickup, setRequiresPickup] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [pickupUrl, setPickupUrl] = useState('');
  
  // Detalles del pedido
  const [items, setItems] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Llenar datos de prueba automáticamente
  const fillTestData = () => {
    setClientName('Juan Pérez González');
    setClientPhone('492 123 4567');
    setClientAddress('Calle Principal #123, Colonia Centro, Fresnillo, Zacatecas');
    setServiceType('FOOD');
    setItems('2 tacos al pastor (uno con extra de cilantro), 1 orden de papas fritas, 1 refresco de cola mediano. Por favor no ponerle limón a los tacos.');
    setConfirmationCode(Math.floor(1000 + Math.random() * 9000).toString()); // Generar código aleatorio
    console.log('✅ Datos de prueba llenados automáticamente');
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

    if (!clientAddress) {
      setError('Por favor ingresa la dirección de entrega');
      return;
    }
    
    // Las coordenadas son opcionales - si no existen, se usan las por defecto
    // deliveryLat y deliveryLng pueden ser null, se resolverán al crear el pedido

    if (requiresPickup && !pickupAddress) {
      setError('Por favor ingresa la dirección de recogida');
      return;
    }

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
      const defaultLat = 24.6536;
      const defaultLng = -102.8738;

      const orderData = {
        clientId,
        clientName,
        clientPhone,
        clientAddress,
        clientLocation: {
          latitude: defaultLat,
          longitude: defaultLng
        },
        serviceType,
        status: 'PENDING',
        createdAt: Date.now(),
        ...(requiresPickup && {
          pickupAddress,
          pickupName,
          pickupUrl
        }),
        deliveryAddress: clientAddress,
        deliveryLocation: {
          latitude: defaultLat,
          longitude: defaultLng
        },
        items,
        notes,
        confirmationCode // Agregar código de confirmación
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
          
          {/* Botón de Datos de Prueba */}
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

          {/* Dirección de Entrega */}
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Dirección completa</label>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                required
                style={{ ...inputStyle, minHeight: '80px' }}
                placeholder="Calle, número, colonia, ciudad..."
              />
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
              ℹ️ Las coordenadas se obtendrán automáticamente al crear el pedido
            </p>
          </section>

          {/* Tipo de Servicio */}
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
              {serviceTypes.map((service) => (
                <div
                  key={service.value}
                  onClick={() => setServiceType(service.value)}
                  style={{
                    padding: '1rem',
                    border: serviceType === service.value 
                      ? '2px solid #667eea' 
                      : '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: serviceType === service.value 
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
                </div>
              ))}
            </div>
          </section>

          {/* Recogida (Opcional) */}
          <section style={{ marginBottom: '2rem' }}>
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
          </section>

          {/* Detalles del Pedido */}
          <section style={{ marginBottom: '2rem' }}>
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
          </section>

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
