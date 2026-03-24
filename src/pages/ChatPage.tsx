import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import MessageService from '../services/MessageService';
import { Message } from '../services/MessageService';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Obtener datos del cliente actual
    const clientId = AuthService.getClientId();
    const clientName = AuthService.getClientName();
    
    if (clientId && clientName) {
      setCurrentUserId(clientId);
      setCurrentUserName(clientName);
    }

    // Obtener datos del repartidor desde los parámetros
    const params = new URLSearchParams(location.search);
    const deliveryId = params.get('deliveryId');
    const deliveryName = params.get('deliveryName');
    const orderCode = params.get('orderId');

    if (deliveryId && deliveryName) {
      setReceiverId(deliveryId);
      setReceiverName(deliveryName);
    }

    if (orderCode) {
      setOrderId(orderCode);
    }
  }, [navigate, location]);

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    if (currentUserId && receiverId) {
      const unsubscribe = MessageService.listenMessages(
        currentUserId,
        receiverId,
        (fetchedMessages) => {
          setMessages(fetchedMessages);
          // Scroll al final cuando llegan nuevos mensajes
          setTimeout(() => scrollToBottom(), 100);
        }
      );

      return () => {
        // Cleanup si es necesario
      };
    }
  }, [currentUserId, receiverId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUserId || !receiverId) return;

    setLoading(true);

    try {
      await MessageService.sendMessage(
        currentUserId,
        currentUserName,
        receiverId,
        receiverName,
        newMessage.trim(),
        orderId,
        'TEXT'
      );
      
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUserId || !receiverId) {
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
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            💬 Chat con tu Repartidor
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            🚚 {receiverName}
          </p>
        </div>
      </header>

      {/* Área de mensajes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <p>Aún no hay mensajes</p>
            <p style={{ fontSize: '0.875rem' }}>Comienza la conversación con tu repartidor</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.senderId === currentUserId;
            
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                  animation: 'fadeIn 0.3s ease-in'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  backgroundColor: isCurrentUser ? '#667eea' : '#e5e7eb',
                  color: isCurrentUser ? 'white' : '#1f2937',
                  position: 'relative'
                }}>
                  {!isCurrentUser && (
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      color: '#6b7280'
                    }}>
                      {msg.senderName}
                    </p>
                  )}
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {msg.message}
                  </p>
                  <p style={{
                    fontSize: '0.7rem',
                    marginTop: '0.25rem',
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form
        onSubmit={handleSendMessage}
        style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '0.75rem'
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '2rem',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          style={{
            backgroundColor: loading || !newMessage.trim() ? '#9ca3af' : '#667eea',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '2rem',
            fontWeight: 'bold',
            cursor: loading || !newMessage.trim() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </form>

      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
