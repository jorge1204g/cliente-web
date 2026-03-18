import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
              placeholder="tu@correo.com"
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
