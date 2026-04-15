import { ref as databaseRef, set, onValue, query, orderByChild, get } from 'firebase/database';
import { database, storage } from './Firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  messageType: 'TEXT' | 'SYSTEM' | 'IMAGE';
  orderId?: string; // Para vincular el mensaje con un pedido específico
  imageUrl?: string; // URL de la imagen si messageType es 'IMAGE'
}

class MessageService {
  private static instance: MessageService;

  private constructor() {}

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  // Enviar mensaje
  async sendMessage(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    message: string,
    orderId?: string,
    messageType: 'TEXT' | 'SYSTEM' | 'IMAGE' = 'TEXT',
    imageUrl?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Enviando mensaje de:', senderId, 'a:', receiverId);
      
      // Crear referencia para nuevo mensaje en la base de datos
      const newMessageRef = databaseRef(database, `messages/${Date.now()}_${senderId}`);
      
      const messageObject: any = {
        id: newMessageRef.key || `${Date.now()}_${senderId}`,
        senderId,
        senderName,
        receiverId,
        receiverName,
        message,
        timestamp: Date.now(),
        isRead: false,
        messageType,
        orderId
      };
      
      // Solo agregar imageUrl si existe (Firebase no acepta undefined)
      if (imageUrl) {
        messageObject.imageUrl = imageUrl;
      }
      
      // Guardar en Firebase
      await set(newMessageRef, messageObject);
      
      return {
        success: true,
        message: 'Mensaje enviado exitosamente'
      };
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      return {
        success: false,
        message: error.message || 'Error al enviar el mensaje'
      };
    }
  }

  // Limpiar mensajes del chat cuando se completa una entrega
  async clearChatMessages(deliveryId: string, customerPhone: string, orderId: string): Promise<boolean> {
    try {
      console.log('🗑️ [CHAT] Limpiando mensajes del pedido:', orderId);
      console.log('🗑️ [CHAT] Repartidor:', deliveryId, 'Cliente:', customerPhone);
      
      // Obtener todos los mensajes
      const messagesRef = databaseRef(database, 'messages');
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        let deletedCount = 0;
        const updates: { [key: string]: any } = {};
        
        // Debug: mostrar primeros 3 mensajes
        let debugCount = 0;
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          
          if (debugCount < 3) {
            console.log(`🔍 [DEBUG] Mensaje #${debugCount + 1}:`, {
              senderId: message.senderId,
              receiverId: message.receiverId,
              orderId: message.orderId
            });
            debugCount++;
          }
          
          // Verificar si el mensaje es entre este repartidor y cliente
          const isBetweenUsers = (
            (message.senderId === deliveryId && message.receiverId === customerPhone) ||
            (message.senderId === customerPhone && message.receiverId === deliveryId)
          );
          
          // Eliminar TODOS los mensajes entre estos usuarios (sin importar orderId)
          if (isBetweenUsers) {
            updates[childSnapshot.key!] = null;
            deletedCount++;
            console.log('🗑️ [CHAT] Marcando para eliminar:', childSnapshot.key);
          }
        });
        
        // Eliminar todos los mensajes en una sola operación
        if (deletedCount > 0) {
          // Usar update para eliminar múltiples nodos eficientemente
          const messagesRefForUpdate = databaseRef(database, 'messages');
          await Promise.all(
            Object.keys(updates).map(key => 
              set(databaseRef(database, `messages/${key}`), null)
            )
          );
          console.log(`✅ [CHAT] ${deletedCount} mensajes eliminados`);
        } else {
          console.log('ℹ️ [CHAT] No se encontraron mensajes para eliminar');
        }
        
        return true;
      }
      
      console.log('⚠️ [CHAT] No hay mensajes en Firebase');
      return false;
    } catch (error: any) {
      console.error('❌ [CHAT] Error al limpiar mensajes:', error);
      return false;
    }
  }

  // Enviar imagen
  async sendImage(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    imageBase64: string,
    orderId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Enviando imagen de:', senderId, 'a:', receiverId);
      
      // Convertir Base64 a Blob
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      
      // Crear nombre único para la imagen
      const imageName = `images/${Date.now()}_${senderId}_${Math.random().toString(36).substring(7)}.jpg`;
      const imageRef = storageRef(storage, imageName);
      
      console.log('📦 [DEBUG] Subiendo imagen a Storage:', imageName);
      
      // Subir imagen a Firebase Storage
      await uploadBytes(imageRef, blob);
      
      // Obtener URL de descarga
      const imageUrl = await getDownloadURL(imageRef);
      
      console.log('✅ [DEBUG] Imagen subida exitosamente. URL:', imageUrl.substring(0, 50) + '...');
      
      // Crear referencia para nuevo mensaje en la base de datos
      const newMessageRef = databaseRef(database, `messages/${Date.now()}_${senderId}`);
      
      const messageObject: Message = {
        id: newMessageRef.key || `${Date.now()}_${senderId}`,
        senderId,
        senderName,
        receiverId,
        receiverName,
        message: '📷 Imagen enviada',
        timestamp: Date.now(),
        isRead: false,
        messageType: 'IMAGE',
        orderId,
        imageUrl // URL de Firebase Storage en lugar de Base64
      };
      
      // Guardar en Firebase Database
      await set(newMessageRef, messageObject);
      
      return {
        success: true,
        message: 'Imagen enviada exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error enviando imagen:', error);
      return {
        success: false,
        message: error.message || 'Error al enviar la imagen'
      };
    }
  }

  // Escuchar mensajes entre dos usuarios en tiempo real
  listenMessages(userId1: string, userId2: string, callback: (messages: Message[]) => void) {
    const messagesRef = databaseRef(database, 'messages');
    
    console.log('🔍 [listenMessages] userId1:', userId1, 'userId2:', userId2);
    
    // Crear query para obtener mensajes entre los dos usuarios
    const messagesQuery = query(
      messagesRef,
      orderByChild('timestamp')
    );
    
    onValue(messagesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const allMessages = snapshot.val();
        const messagesArray: Message[] = [];
        
        console.log('📦 [listenMessages] Total de mensajes en Firebase:', Object.keys(allMessages).length);
        console.log('═══════════════════════════════════════════════');
        
        for (const messageId in allMessages) {
          const msg = allMessages[messageId];
          
          console.log('\n📨 Mensaje revisando:');
          console.log('   ID:', messageId);
          console.log('   senderId:', msg.senderId);
          console.log('   receiverId:', msg.receiverId);
          console.log('   message:', msg.message);
          
          // Filtrar mensajes entre los dos usuarios
          const match = (msg.senderId === userId1 && msg.receiverId === userId2) ||
                       (msg.senderId === userId2 && msg.receiverId === userId1);
          
          console.log('   ¿Coincide?', match ? '✅ SÍ' : '❌ NO');
          console.log('   Comparación:');
          console.log('     - (senderId === userId1):', msg.senderId === userId1);
          console.log('     - (receiverId === userId2):', msg.receiverId === userId2);
          console.log('     - (senderId === userId2):', msg.senderId === userId2);
          console.log('     - (receiverId === userId1):', msg.receiverId === userId1);
          
          if (match) {
            console.log('\n✅ [MATCH] Mensaje que coincide:');
            console.log('   ├── senderId:', msg.senderId);
            console.log('   ├── receiverId:', msg.receiverId);
            console.log('   └── message:', msg.message);
            
            const messageObj: Message = {
              id: messageId,
              senderId: msg.senderId || '',
              senderName: msg.senderName || '',
              receiverId: msg.receiverId || '',
              receiverName: msg.receiverName || '',
              message: msg.message || '',
              timestamp: msg.timestamp || Date.now(),
              isRead: msg.isRead || false,
              messageType: msg.messageType || 'TEXT',
              orderId: msg.orderId,
              imageUrl: msg.imageUrl // ⚠️ IMPORTANTE: Incluir imageUrl
            };
            
            messagesArray.push(messageObj);
          } else {
            console.log('\n❌ [NO MATCH] Mensaje descartado');
          }
        }
        
        console.log('\n═══════════════════════════════════════════════');
        console.log('📊 [RESULTADO] Mensajes filtrados:', messagesArray.length);
        console.log('═══════════════════════════════════════════════\n');
        
        // Ordenar por timestamp ascendente
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        callback(messagesArray);
      } else {
        console.log('⚠️ [listenMessages] No hay mensajes en Firebase');
        callback([]);
      }
    });
  }

  // Marcar mensaje como leído
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const messageRef = databaseRef(database, `messages/${messageId}`);
      await set(messageRef, {
        ...await this.getMessageById(messageId),
        isRead: true
      });
      return true;
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
      return false;
    }
  }

  // Obtener mensaje por ID
  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      const messageRef = databaseRef(database, `messages/${messageId}`);
      const snapshot = await get(messageRef);
      
      if (snapshot.exists()) {
        return snapshot.val() as Message;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo mensaje:', error);
      return null;
    }
  }

  // Obtener últimos mensajes para mostrar en lista
  listenLastMessages(userId: string, callback: (messages: Message[]) => void) {
    const messagesRef = databaseRef(database, 'messages');
    
    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allMessages = snapshot.val();
        const userMessages: Message[] = [];
        const conversationMap = new Map<string, Message>();
        
        // Obtener último mensaje de cada conversación
        for (const messageId in allMessages) {
          const msg = allMessages[messageId];
          
          if (msg.senderId === userId || msg.receiverId === userId) {
            const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            
            // Mantener solo el mensaje más reciente de cada conversación
            if (!conversationMap.has(otherUserId) || 
                msg.timestamp > conversationMap.get(otherUserId)!.timestamp) {
              conversationMap.set(otherUserId, {
                id: messageId,
                senderId: msg.senderId || '',
                senderName: msg.senderName || '',
                receiverId: msg.receiverId || '',
                receiverName: msg.receiverName || '',
                message: msg.message || '',
                timestamp: msg.timestamp || Date.now(),
                isRead: msg.isRead || false,
                messageType: msg.messageType || 'TEXT',
                orderId: msg.orderId,
                imageUrl: msg.imageUrl // ⚠️ IMPORTANTE: Incluir imageUrl
              });
            }
          }
        }
        
        // Convertir map a array y ordenar por timestamp
        conversationMap.forEach(msg => userMessages.push(msg));
        userMessages.sort((a, b) => b.timestamp - a.timestamp);
        
        callback(userMessages);
      } else {
        callback([]);
      }
    });
  }
}

export default MessageService.getInstance();
