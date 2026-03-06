import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

// CREDENCIALES POR DEFECTO PARA DEMOSTRACIÓN
const DEFAULT_EMAIL = 'cliente@demo.com';
const DEFAULT_PASSWORD = '123456';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-login con credenciales por defecto
  useEffect(() => {
    const performAutoLogin = async () => {
      // Verificar si ya hay una sesión activa
      if (AuthService.isAuthenticated()) {
        navigate('/inicio');
        return;
      }

      // Intentar auto-login con credenciales por defecto
      try {
        setLoading(true);
        const success = await AuthService.login(DEFAULT_EMAIL, DEFAULT_PASSWORD);
        
        if (success) {
          console.log('✅ Auto-login exitoso con cuenta virtual');
          navigate('/inicio');
        } else {
          console.log('❌ Auto-login fallido. Mostrar formulario de login.');
          setError('No se pudo iniciar sesión automáticamente. Por favor, ingresa tus credenciales.');
        }
      } catch (err) {
        console.error('Error en auto-login:', err);
        setError('Error de conexión. Intenta manualmente.');
      } finally {
        setLoading(false);
      }
    };

    performAutoLogin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await AuthService.login(email, password);
      
      if (success) {
        navigate('/inicio');
      } else {
        setError('Correo o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
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

        {/* Información de cuenta por defecto */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#0369a1',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            🎯 Cuenta Virtual de Prueba
          </p>
          <div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: '1.6' }}>
            <div><strong>Email:</strong> {DEFAULT_EMAIL}</div>
            <div><strong>Contraseña:</strong> {DEFAULT_PASSWORD}</div>
          </div>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError('');
              const success = await AuthService.login(DEFAULT_EMAIL, DEFAULT_PASSWORD);
              if (success) {
                navigate('/inicio');
              } else {
                setError('Error al iniciar con cuenta demo');
              }
              setLoading(false);
            }}
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              fontSize: '0.75rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Iniciando...' : '⚡ Entrada Rápida (Demo)'}
          </button>
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
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              placeholder={DEFAULT_EMAIL}
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
              placeholder={DEFAULT_PASSWORD}
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
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              style={{
                color: '#667eea',
                fontWeight: '600',
                textDecoration: 'none'
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
