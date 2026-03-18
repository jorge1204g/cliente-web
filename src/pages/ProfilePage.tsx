import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Cargar datos del cliente
    setName(AuthService.getClientName() || '');
    setEmail(AuthService.getClientEmail() || '');
    setPhone(AuthService.getClientPhone() || '');
    setAddress(AuthService.getClientAddress() || '');
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const clientId = AuthService.getClientId();
      
      if (!clientId) {
        setMessage({ type: 'error', text: 'Error: No se encontró el ID del cliente' });
        setLoading(false);
        return;
      }

      const success = await AuthService.updateProfile(clientId, {
        name,
        phone,
        address
      });

      if (success) {
        setMessage({ type: 'success', text: '✅ Perfil actualizado exitosamente' });
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      AuthService.logout();
      navigate('/login');
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
            👤 Mi Perfil
          </h1>
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </header>

      {/* Información del Perfil */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: '#667eea',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: '0 auto 1rem'
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.25rem'
          }}>
            {name || 'Usuario'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Cliente desde {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                ...inputStyle,
                backgroundColor: '#f3f4f6',
                cursor: 'not-allowed'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              El correo electrónico no se puede modificar
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              placeholder="Tu nombre completo"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
             required
              style={inputStyle}
              placeholder="492 123 4567"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>
              Dirección de entrega habitual
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ ...inputStyle, minHeight: '80px' }}
              placeholder="Calle, número, colonia, ciudad, código postal..."
            />
            <p style={{
              fontSize: '0.75rem',
             color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              ℹ️ Esta dirección se usará para rellenar automáticamente tus pedidos
            </p>
          </div>

          {message && (
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              border: message.type === 'success' ? '1px solid #10b981' : '1px solid #fecaca',
              color: message.type === 'success' ? '#065f46' : '#991b1b'
            }}>
              {message.text}
            </div>
          )}

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
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </form>

        {/* Estadísticas */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1.5rem',
          marginTop: '2rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            📊 Tu Actividad
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Pedidos realizados
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                --
              </p>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#d1fae5',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Calificación
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>
                --
              </p>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#fef3c7',
          borderRadius: '0.5rem',
          border: '1px solid #fcd34d'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            color: '#92400e',
            marginBottom: '0.5rem'
          }}>
            ℹ️ Información importante
          </h3>
          <ul style={{
            fontSize: '0.75rem',
            color: '#78350f',
            paddingLeft: '1.25rem',
            lineHeight: '1.6'
          }}>
            <li>Tus datos están protegidos y seguros</li>
            <li>Puedes actualizar tu información cuando lo necesites</li>
            <li>El correo electrónico es tu identificador único</li>
            <li>Para eliminar tu cuenta, contacta a soporte</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        maxWidth: '600px',
        margin: '2rem auto',
        textAlign: 'center',
        padding: '1rem',
        color: '#6b7280',
        fontSize: '0.75rem'
      }}>
        <p>© 2024 Click Entrega - Repartos Fresnillo</p>
        <p>Somos una empresa comprometida con el cliente</p>
      </footer>
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

export default ProfilePage;
