import { ref, set, get } from 'firebase/database';
import { database } from './Firebase';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Registrar cliente
  async register(email: string, password: string, name: string, phone: string): Promise<boolean> {
    try {
      const userId = Date.now().toString();
      const userRef = ref(database, `clients/${userId}`);
      
      await set(userRef, {
        id: userId,
        email,
        password, // En producción debería estar encriptada
        name,
        phone,
        createdAt: Date.now(),
        status: 'active'
      });

      // Guardar sesión
      localStorage.setItem('clientId', userId);
      localStorage.setItem('clientEmail', email);
      localStorage.setItem('clientName', name);

      return true;
    } catch (error) {
      console.error('Error registering:', error);
      return false;
    }
  }

  // Login cliente
  async login(email: string, password: string): Promise<boolean> {
    try {
      const clientsRef = ref(database, 'clients');
      const snapshot = await get(clientsRef);

      if (!snapshot.exists()) {
        return false;
      }

      const clients = snapshot.val();
      const clientFound = Object.values(clients as any).find((client: any) => 
        client.email === email && client.password === password
      );

      if (clientFound) {
        const client = clientFound as any;
        localStorage.setItem('clientId', client.id);
        localStorage.setItem('clientEmail', client.email);
        localStorage.setItem('clientName', client.name);
        localStorage.setItem('clientPhone', client.phone);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientName');
    localStorage.removeItem('clientPhone');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('clientId');
  }

  // Obtener ID del cliente
  getClientId(): string | null {
    return localStorage.getItem('clientId');
  }

  // Obtener email del cliente
  getClientEmail(): string | null {
    return localStorage.getItem('clientEmail');
  }

  // Obtener nombre del cliente
  getClientName(): string | null {
    return localStorage.getItem('clientName');
  }

  // Obtener teléfono del cliente
  getClientPhone(): string | null {
    return localStorage.getItem('clientPhone');
  }

  // Actualizar perfil
  async updateProfile(clientId: string, data: { name?: string; phone?: string; address?: string }): Promise<boolean> {
    try {
      const clientRef = ref(database, `clients/${clientId}`);
      await set(clientRef, {
        ...data,
        id: clientId,
        updatedAt: Date.now()
      });
      
      if (data.name) localStorage.setItem('clientName', data.name);
      if (data.phone) localStorage.setItem('clientPhone', data.phone);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }
}

export default AuthService.getInstance();
