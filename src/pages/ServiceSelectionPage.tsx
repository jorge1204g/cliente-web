import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServiceSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0fdf4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#166534',
          marginBottom: '1rem'
        }}>
          ¿Qué tipo de servicio requieres?
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          Selecciona una opción para continuar
        </p>
      </div>

      {/* Cards Container */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '900px',
        width: '100%'
      }}>
        
        {/* Card 1: Favores y Comida */}
        <div 
          onClick={() => navigate('/inicio')}
          style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '3px solid transparent',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 25px rgba(0,0,0,0.15)';
            e.currentTarget.style.borderColor = '#10b981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {/* Icon */}
          <div style={{ 
            fontSize: '5rem', 
            marginBottom: '1.5rem',
            animation: 'bounce 2s infinite'
          }}>
            🛍️
          </div>

          {/* Title */}
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Favores y Comida
          </h2>

          {/* Description */}
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Pide comida de tus restaurantes favoritos o solicita favores especiales como compras, mandados y más.
          </p>

          {/* Arrow Icon */}
          <div style={{ 
            marginTop: '2rem',
            fontSize: '2rem',
            color: '#10b981',
            transition: 'transform 0.3s ease'
          }}>
            ➡️
          </div>
        </div>

        {/* Card 2: Viaje en Motocicleta */}
        <div 
          onClick={() => navigate('/servicio-motocicleta')}
          style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '3px solid transparent',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 25px rgba(0,0,0,0.15)';
            e.currentTarget.style.borderColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {/* Icon */}
          <div style={{ 
            fontSize: '5rem', 
            marginBottom: '1.5rem',
            animation: 'bounce 2s infinite'
          }}>
            🏍️
          </div>

          {/* Title */}
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Viaje en Motocicleta
          </h2>

          {/* Description */}
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Solicita un viaje rápido y seguro en motocicleta. Ideal para distancias cortas y tráfico pesado.
          </p>

          {/* Arrow Icon */}
          <div style={{ 
            marginTop: '2rem',
            fontSize: '2rem',
            color: '#3b82f6',
            transition: 'transform 0.3s ease'
          }}>
            ➡️
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '0.875rem'
      }}>
        <p>🚀 Servicio rápido, seguro y confiable</p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default ServiceSelectionPage;
