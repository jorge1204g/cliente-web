import React from 'react';

const MotorcycleServicePage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#eff6ff',
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
          color: '#1e40af',
          marginBottom: '1rem'
        }}>
          🏍️ Viaje en Motocicleta
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          Próximamente - Esta pantalla está en construcción
        </p>
      </div>

      {/* Content Placeholder */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1.5rem',
        padding: '3rem',
        maxWidth: '600px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>
          🚧
        </div>
        
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Estamos trabajando en esta funcionalidad
        </h2>
        
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          Muy pronto podrás solicitar viajes en motocicleta de forma rápida y segura. 
          ¡Regresa pronto!
        </p>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          ← Regresar
        </button>
      </div>
    </div>
  );
};

export default MotorcycleServicePage;
