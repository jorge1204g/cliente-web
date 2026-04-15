import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import MessageService from '../services/MessageService';
import { Message } from '../services/MessageService';
import { database } from '../services/Firebase';
import { ref, onValue } from 'firebase/database';

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
  const [lastOrderStatus, setLastOrderStatus] = useState<string>('');
  const [sendingImage, setSendingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      console.error('❌ [AUTH] Usuario NO autenticado');
      navigate('/login');
      return;
    }

    console.log('\n🔐 [DEBUG] Verificando autenticación...');
    
    // Obtener datos del cliente actual
    const clientId = AuthService.getClientId();
    const clientName = AuthService.getClientName() || '';
    const clientPhone = AuthService.getClientPhone() || '';  // Obtener teléfono
    
    console.log('📋 [DEBUG] Datos de AuthService:');
    console.log('   ├── clientId:', clientId);
    console.log('   ├── clientName:', clientName);
    console.log('   └── clientPhone:', clientPhone);
    
    if (clientPhone) {
      // ✅ USAR TELÉFONO COMO ID PARA CONSISTENCIA CON APP MÓVIL
      const phoneUserId = `phone_${clientPhone}`;
      setCurrentUserId(phoneUserId);
      setCurrentUserName(clientName);
      console.log('   ✅ currentUserId establecido a:', phoneUserId);
    } else if (clientId && clientName) {
      // Fallback a clientId si no hay teléfono
      setCurrentUserId(clientId);
      setCurrentUserName(clientName);
      console.log('   ⚠️ currentUserId establecido a:', clientId, '(fallback sin teléfono)');
    } else {
      console.error('   ❌ ERROR: No se pudo determinar currentUserId');
    }

    // Obtener datos del repartidor desde los parámetros
    const params = new URLSearchParams(location.search);
    const deliveryId = params.get('deliveryId');
    const deliveryName = params.get('deliveryName');
    const orderCode = params.get('orderId');

    console.log('\n📍 [DEBUG] Parámetros de URL:');
    console.log('   ├── deliveryId:', deliveryId);
    console.log('   ├── deliveryName:', deliveryName);
    console.log('   └── orderId:', orderCode);
    
    if (deliveryId && deliveryName) {
      setReceiverId(deliveryId);
      setReceiverName(deliveryName);
      console.log('   ✅ receiverId establecido a:', deliveryId);
    } else {
      console.error('   ❌ ERROR: deliveryId o deliveryName faltan');
    }

    if (orderCode) {
      setOrderId(orderCode);
    }
  }, [navigate, location]);

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    if (!currentUserId || !receiverId) {
      console.error('❌ [CRITICAL] No se puede escuchar mensajes:');
      console.log('   ├── currentUserId:', currentUserId || 'NO DEFINIDO');
      console.log('   └── receiverId:', receiverId || 'NO DEFINIDO');
      console.log('   ⚠️ El chat NO funcionará sin estos valores');
      return;
    }

    console.log('\n===========================================');
    console.log('🔍 [DEBUG] Iniciando escucha de mensajes:');
    console.log('   ├── currentUserId:', currentUserId);
    console.log('   ├── receiverId:', receiverId);
    console.log('   └── orderId:', orderId);
    console.log('===========================================\n');
    
    try {
      const unsubscribe = MessageService.listenMessages(
        currentUserId,
        receiverId,
        (fetchedMessages) => {
          console.log('\n📩 [DEBUG] Mensajes recibidos:', fetchedMessages.length);
          console.log('   Filtrando por:');
          console.log('   ├── currentUserId:', currentUserId);
          console.log('   └── receiverId:', receiverId);
          
          // Mostrar SOLO mensajes IMAGE
          const imageMessages = fetchedMessages.filter(m => m.messageType === 'IMAGE');
          if (imageMessages.length > 0) {
            console.log('\n🖼️ [DEBUG] Mensajes IMAGE encontrados:', imageMessages.length);
            imageMessages.forEach((msg, idx) => {
              console.log(`\n   [${idx}] ID: ${msg.id}`);
              console.log(`       senderId: ${msg.senderId}`);
              console.log(`       receiverId: ${msg.receiverId}`);
              console.log(`       message: ${msg.message}`);
              console.log(`       imageUrl existe: ${!!msg.imageUrl}`);
              console.log(`       imageUrl length: ${msg.imageUrl?.length || 0}`);
              if (msg.imageUrl) {
                console.log(`       imageUrl preview: ${msg.imageUrl.substring(0, 50)}...`);
              }
            });
          }
          
          // Mostrar TODOS los mensajes TEXT también
          const textMessages = fetchedMessages.filter(m => m.messageType === 'TEXT');
          console.log('\n💬 [DEBUG] Mensajes TEXT encontrados:', textMessages.length);
          textMessages.slice(-3).forEach((msg, idx) => {
            console.log(`   [${idx}] De: ${msg.senderName} - ${msg.message}`);
          });
          
          setMessages(fetchedMessages);
          console.log('✅ [DEBUG] Messages state updated:', fetchedMessages.length);
          setTimeout(() => scrollToBottom(), 100);
        }
      );

      return () => {
        console.log('\n🧹 [DEBUG] Limpiando listener de mensajes');
      };
    } catch (error) {
      console.error('\n💥 [ERROR CRÍTICO] Al escuchar mensajes:', error);
    }
  }, [currentUserId, receiverId, orderId]);

  // Escuchar cambios en el estado del pedido para enviar mensajes automáticos
  useEffect(() => {
    if (!orderId || !currentUserId || !receiverId) return;

    const orderRef = ref(database, `orders/${orderId}`);
    
    const orderListener = onValue(orderRef, (snapshot: any) => {
      const orderData = snapshot.val();
      if (orderData && orderData.status && orderData.status !== lastOrderStatus) {
        const statusMessages: Record<string, string> = {
          'ACCEPTED': '✅ ¡Pedido aceptado! Tu repartidor está en camino al restaurante.',
          'ON_THE_WAY_TO_STORE': '🛵 Tu repartidor va en camino al restaurante.',
          'ARRIVED_AT_STORE': '📍 Tu repartidor llegó al restaurante.',
          'PICKING_UP_ORDER': '🍔 Tu repartidor está recogiendo tu pedido.',
          'ON_THE_WAY_TO_CUSTOMER': '🏠 ¡Tu repartidor va en camino a tu domicilio!',
          'ARRIVED_AT_CUSTOMER': '📍 Tu repartidor ha llegado a tu domicilio.',
          'DELIVERED': '🎉 ¡Pedido entregado! Gracias por tu compra.'
        };

        const statusMessage = statusMessages[orderData.status];
        if (statusMessage) {
          // Enviar mensaje automático como "sistema"
          MessageService.sendMessage(
            currentUserId,
            currentUserName,
            receiverId,
            receiverName,
            `📦 *Actualización de tu pedido:*\n\n${statusMessage}`,
            orderId,
            'TEXT'
          ).catch(err => console.error('Error enviando mensaje automático:', err));
        }
        
        setLastOrderStatus(orderData.status);
      }
    });

    return () => {
      // El cleanup con onValue se maneja automáticamente con el return del useEffect
    };
  }, [orderId, currentUserId, receiverId, currentUserName, receiverName, lastOrderStatus]);

  const scrollToBottom = () => {
    console.log('📜 [DEBUG] Scroll to bottom - messages count:', messages.length);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      console.log('✅ [DEBUG] Scroll completado');
    } else {
      console.warn('⚠️ [DEBUG] messagesEndRef.current es null');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUserId || !receiverId) {
      console.error('❌ [DEBUG] No se puede enviar mensaje:');
      console.log('   ├── newMessage:', newMessage);
      console.log('   ├── currentUserId:', currentUserId);
      console.log('   └── receiverId:', receiverId);
      return;
    }

    setLoading(true);

    try {
      console.log('\n📤 [DEBUG] Enviando mensaje:');
      console.log('   ├── De:', currentUserId, '(', currentUserName, ')');
      console.log('   ├── Para:', receiverId, '(', receiverName, ')');
      console.log('   └── Mensaje:', newMessage.trim());
      
      await MessageService.sendMessage(
        currentUserId,
        currentUserName,
        receiverId,
        receiverName,
        newMessage.trim(),
        orderId,
        'TEXT'
      );
      
      console.log('✅ [DEBUG] Mensaje enviado exitosamente');
      setNewMessage('');
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('❌ [ERROR] Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    setSendingImage(true);

    // Crear canvas para comprimir imagen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Redimensionar imagen (max 800px)
      const maxWidth = 800;
      const maxHeight = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Comprimir a JPEG 70% calidad
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);
      
      console.log('🖼️ [DEBUG] Imagen comprimida:', {
        original: file.size,
        compressed: Math.round((imageBase64.length * 3) / 4),
        ratio: Math.round(((imageBase64.length * 3) / 4) / file.size * 100) + '%'
      });
      
      MessageService.sendImage(
        currentUserId,
        currentUserName,
        receiverId,
        receiverName,
        imageBase64,
        orderId
      )
      .then(() => {
        console.log('✅ Imagen enviada correctamente');
        scrollToBottom();
      })
      .catch((error) => {
        console.error('❌ Error enviando imagen:', error);
        alert('Error al enviar la imagen. Intenta con una imagen más pequeña.');
      })
      .finally(() => {
        setSendingImage(false);
      });
    };
    
    img.onerror = () => {
      console.error('❌ Error cargando imagen');
      alert('Error al procesar la imagen');
      setSendingImage(false);
    };
    
    img.src = URL.createObjectURL(file);
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
            
            // Debug logs
            if (msg.messageType === 'IMAGE') {
              console.log(`🖼️ [DEBUG] Mensaje IMAGE ${index}:`, {
                id: msg.id,
                senderId: msg.senderId,
                imageUrlLength: msg.imageUrl?.length,
                hasImageUrl: !!msg.imageUrl
              });
            }
            
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
                  
                  {/* Renderizar imagen si es tipo IMAGE */}
                  {msg.messageType === 'IMAGE' && msg.imageUrl ? (
                    <div>
                      {(() => {
                        console.log('🖼️ [DEBUG] Renderizando imagen:');
                        console.log('   ├── messageType:', msg.messageType);
                        console.log('   ├── imageUrl existe:', !!msg.imageUrl);
                        console.log('   ├── imageUrl length:', msg.imageUrl?.length);
                        console.log('   ├── starts with data:image:', msg.imageUrl?.startsWith('data:image'));
                        
                        const imageSrc = msg.imageUrl.startsWith('data:image') 
                          ? msg.imageUrl 
                          : `data:image/jpeg;base64,${msg.imageUrl}`;
                        
                        console.log('   ├── imageSrc length:', imageSrc.length);
                        console.log('   └── imageSrc preview:', imageSrc.substring(0, 50) + '...');
                        
                        return (
                          <img 
                            src={imageSrc}
                            alt="Imagen enviada" 
                            style={{
                              maxWidth: '100%',
                              borderRadius: '0.5rem',
                              marginTop: '0.5rem'
                            }}
                            onError={(e) => {
                              console.error('❌ Error al cargar imagen:', e);
                              console.error('   URL completa:', msg.imageUrl);
                              console.error('   imageSrc length:', imageSrc.length);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Imagen cargada correctamente');
                            }}
                          />
                        );
                      })()}
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.4', marginTop: '0.5rem' }}>
                        {msg.message}
                      </p>
                    </div>
                  ) : msg.messageType === 'IMAGE' ? (
                    // Caso especial: Es IMAGE pero no tiene imageUrl (error de guardado)
                    <div>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.4', color: '#dc2626' }}>
                        ⚠️ Error: La imagen no se cargó correctamente
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        ID: {msg.id} | Timestamp: {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {msg.message}
                    </p>
                  )}
                  
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
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        {/* Input hidden para seleccionar archivos */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        {/* Botón para adjuntar imagen */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendingImage}
          title="Adjuntar imagen"
          style={{
            backgroundColor: sendingImage ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '2rem',
            cursor: sendingImage ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '45px'
          }}
        >
          {sendingImage ? '⏳' : '📷'}
        </button>
        
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading || sendingImage}
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
