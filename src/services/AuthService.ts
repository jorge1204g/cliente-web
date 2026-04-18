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
      localStorage.setItem('clientPhone', phone);

      return true;
    } catch (error) {
      console.error('Error registering:', error);
      return false;
    }
  }

  // Login cliente (con email o teléfono)
  async login(emailOrPhone: string, password: string): Promise<boolean> {
    try {
     const clientsRef = ref(database, 'clients');
     const snapshot = await get(clientsRef);

      if (!snapshot.exists()) {
       return false;
      }

     const clients = snapshot.val();
     
     // Buscar por email o por teléfono
     const clientFound = Object.values(clients as any).find((client: any) => {
       const matchesByEmail = client.email === emailOrPhone && client.password === password;
       const matchesByPhone = client.phone === emailOrPhone && client.password === password;
       return matchesByEmail || matchesByPhone;
      });

      if (clientFound) {
       const client = clientFound as any;
        localStorage.setItem('clientId', client.id);
        localStorage.setItem('clientEmail', client.email);
        localStorage.setItem('clientName', client.name);
        localStorage.setItem('clientPhone', client.phone);
        if (client.address) localStorage.setItem('clientAddress', client.address);
        if (client.latitude) localStorage.setItem('clientLatitude', client.latitude.toString());
        if (client.longitude) localStorage.setItem('clientLongitude', client.longitude.toString());
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
    localStorage.removeItem('clientAddress');
    localStorage.removeItem('clientLatitude');
    localStorage.removeItem('clientLongitude');
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

  // Obtener dirección del cliente
  getClientAddress(): string | null {
   return localStorage.getItem('clientAddress');
  }

  // Obtener latitud del cliente
  getClientLatitude(): number | null {
   const lat = localStorage.getItem('clientLatitude');
   return lat ? parseFloat(lat) : null;
  }

  // Obtener longitud del cliente
  getClientLongitude(): number | null {
   const lng = localStorage.getItem('clientLongitude');
   return lng ? parseFloat(lng) : null;
  }

  // Actualizar perfil
  async updateProfile(clientId: string, data: { name?: string; phone?: string; address?: string; latitude?: number; longitude?: number }): Promise<boolean> {
    try {
     const clientRef = ref(database, `clients/${clientId}`);
      await set(clientRef, {
        ...data,
        id: clientId,
        updatedAt: Date.now()
      });
      
      if (data.name) localStorage.setItem('clientName', data.name);
      if (data.phone) localStorage.setItem('clientPhone', data.phone);
      if (data.address) localStorage.setItem('clientAddress', data.address);
      if (data.latitude !== undefined) localStorage.setItem('clientLatitude', data.latitude.toString());
      if (data.longitude !== undefined) localStorage.setItem('clientLongitude', data.longitude.toString());
      
     return true;
    } catch (error) {
     console.error('Error updating profile:', error);
     return false;
    }
  }
}

export default AuthService.getInstance();
