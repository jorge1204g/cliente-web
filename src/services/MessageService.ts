import { ref, set, onValue, query, orderByChild, get } from 'firebase/database';
import { database } from './Firebase';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  messageType: 'TEXT' | 'SYSTEM';
  orderId?: string; // Para vincular el mensaje con un pedido específico
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
    messageType: 'TEXT' | 'SYSTEM' = 'TEXT'
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Enviando mensaje de:', senderId, 'a:', receiverId);
      
      // Crear referencia para nuevo mensaje
      const newMessageRef = ref(database, `messages/${Date.now()}_${senderId}`);
      
      const messageObject: Message = {
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

  // Escuchar mensajes entre dos usuarios en tiempo real
  listenMessages(userId1: string, userId2: string, callback: (messages: Message[]) => void) {
    const messagesRef = ref(database, 'messages');
    
    // Crear query para obtener mensajes entre los dos usuarios
    const messagesQuery = query(
      messagesRef,
      orderByChild('timestamp')
    );
    
    onValue(messagesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const allMessages = snapshot.val();
        const messagesArray: Message[] = [];
        
        for (const messageId in allMessages) {
          const msg = allMessages[messageId];
          
          // Filtrar mensajes entre los dos usuarios
          if (
            (msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1)
          ) {
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
              orderId: msg.orderId
            };
            
            messagesArray.push(messageObj);
          }
        }
        
        // Ordenar por timestamp ascendente
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        callback(messagesArray);
      } else {
        callback([]);
      }
    });
  }

  // Marcar mensaje como leído
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const messageRef = ref(database, `messages/${messageId}`);
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
      const messageRef = ref(database, `messages/${messageId}`);
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
    const messagesRef = ref(database, 'messages');
    
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
                orderId: msg.orderId
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
