import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/Navigation';
import messaging from '@react-native-firebase/messaging';

export interface IncidentNotification {
  id: string;
  title: string;
  body: string;
  data?: {
    incidenteId?: string;
    tipo?: string;
    prioridad?: string;
  };
  timestamp: number;
}

class NotificationService {
  private static instance: NotificationService;
  private appStateSubscription: any;
  private unsubscribeOnMessage: any;
  private unsubscribeBackgroundMessage: any;
  private isInitialized = false;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ NotificationService ya está inicializado');
      return;
    }
    
    try {
      console.log('🔔 Inicializando NotificationService...');
      
      // Verificar que tenemos los permisos
      const authStatus = await messaging().hasPermission();
      console.log('📱 Estado de permisos FCM:', authStatus);
      
      this.setupFirebaseListeners();
      this.setupAppStateListener();
      await this.checkPendingIncidentNotifications();
      
      this.isInitialized = true;
      console.log('✅ NotificationService inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando NotificationService:', error);
    }
  }

  private setupFirebaseListeners(): void {
    console.log('🔧 Configurando listeners de Firebase...');
    
    // Notificaciones en primer plano
    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('📱 [PRIMER PLANO] Notificación recibida:', JSON.stringify(remoteMessage, null, 2));
      await this.handleFirebaseNotification(remoteMessage);
    });

    // Notificaciones en segundo plano
    this.unsubscribeBackgroundMessage = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 [SEGUNDO PLANO] Notificación abrió la app:', JSON.stringify(remoteMessage, null, 2));
      this.handleFirebaseNotification(remoteMessage);
    });

    // App abierta desde notificación cerrada
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📱 [APP CERRADA] App abierta desde notificación:', JSON.stringify(remoteMessage, null, 2));
          this.handleFirebaseNotification(remoteMessage);
        }
      });
      
    console.log('✅ Listeners de Firebase configurados');
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        console.log('📱 App state cambió a:', nextAppState);
        
        if (nextAppState === 'active') {
          console.log('🔍 App activa, verificando incidentes pendientes...');
          await this.checkPendingIncidentNotifications();
        }
      }
    );
  }

  private async handleFirebaseNotification(remoteMessage: any): Promise<void> {
    if (!remoteMessage) {
      console.log('⚠️ RemoteMessage es null o undefined');
      return;
    }

    console.log('🔍 Procesando notificación de Firebase...');
    
    const notification = {
      id: remoteMessage.messageId || Date.now().toString(),
      title: remoteMessage.notification?.title || '',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data || {},
      timestamp: Date.now()
    };

    console.log('📦 Notificación estructurada:', JSON.stringify(notification, null, 2));

    // Verificar si es incidente
    const isIncident = this.isIncidentNotification(notification);
    console.log('🚨 ¿Es incidente?', isIncident);

    if (isIncident) {
      await this.handleIncidentNotification(notification);
    } else {
      console.log('ℹ️ No es una notificación de incidente, ignorando...');
    }
  }

  private isIncidentNotification(notification: IncidentNotification): boolean {
    const title = notification.title.toLowerCase();
    const body = notification.body.toLowerCase();
    const dataType = notification.data?.tipo?.toLowerCase() || '';
    
    console.log('🔍 Analizando notificación:');
    console.log('  - Título:', title);
    console.log('  - Cuerpo:', body);
    console.log('  - Tipo de data:', dataType);
    
    // Palabras clave para detectar incidentes
    const incidentKeywords = [
      'incidente',
      'emergencia',
      'alerta',
      'urgente',
      'problema',
      'accidente',
      'falla',
      'avería'
    ];
    
    // Verificar en título, cuerpo y datos
    const hasIncidentKeyword = incidentKeywords.some(keyword => {
      const found = title.includes(keyword) || body.includes(keyword) || dataType.includes(keyword);
      if (found) {
        console.log(`✅ Palabra clave encontrada: "${keyword}"`);
      }
      return found;
    });

    // También verificar si el tipo específico es 'incidente'
    const isIncidentType = dataType === 'incidente' || 
                          notification.data?.tipo === 'INCIDENTE';
    
    if (isIncidentType) {
      console.log('✅ Tipo específico de incidente detectado');
    }

    const result = hasIncidentKeyword || isIncidentType;
    console.log('🎯 Resultado final es incidente:', result);
    
    return result;
  }

  private async handleIncidentNotification(notification: IncidentNotification): Promise<void> {
    console.log('🚨 PROCESANDO INCIDENTE:', notification.title);
    
    try {
      // Verificar rol del usuario
      const userRole = await this.getCurrentUserRole();
      console.log('👤 Rol del usuario actual:', userRole);
      
      if (userRole !== 'CLIENTE') {
        console.log('⚠️ Usuario no es CLIENTE, no se procesará incidente');
        return;
      }

      console.log('💾 Guardando notificación de incidente...');
      await this.saveIncidentNotification(notification);
      
      console.log('🔒 Iniciando bloqueo y redirección...');
      await this.blockAndRedirectToIncident(notification);
      
    } catch (error) {
      console.error('❌ Error manejando notificación de incidente:', error);
    }
  }

  private async getCurrentUserRole(): Promise<string | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('👤 Usuario obtenido:', user);
        return user.rol || null;
      }
      console.log('⚠️ No se encontró usuario en AsyncStorage');
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo rol de usuario:', error);
      return null;
    }
  }

  private async saveIncidentNotification(incident: IncidentNotification): Promise<void> {
    try {
      console.log('💾 Guardando incidente activo...');
      await AsyncStorage.setItem('active_incident', JSON.stringify(incident));
      
      // También mantener historial
      const existingIncidents = await AsyncStorage.getItem('incident_history');
      const incidents: IncidentNotification[] = existingIncidents 
        ? JSON.parse(existingIncidents) 
        : [];
      
      incidents.unshift(incident);
      
      if (incidents.length > 10) {
        incidents.splice(10);
      }
      
      await AsyncStorage.setItem('incident_history', JSON.stringify(incidents));
      console.log('✅ Incidente guardado correctamente');
      
    } catch (error) {
      console.error('❌ Error guardando incidente:', error);
    }
  }

  private async blockAndRedirectToIncident(incident: IncidentNotification): Promise<void> {
    try {
      console.log('🔒 Bloqueando aplicación por incidente...');
      
      // Mostrar alerta inmediata
      Alert.alert(
        '🚨 INCIDENTE DETECTADO',
        `${incident.title}\n\n${incident.body}\n\nLa aplicación será bloqueada hasta que se atienda el incidente.`,
        [
          {
            text: 'Ir a Incidentes',
            onPress: () => {
              console.log('👆 Usuario presionó "Ir a Incidentes"');
              this.navigateToIncident(incident);
            },
            style: 'default'
          }
        ],
        { 
          cancelable: false
        }
      );
      
    } catch (error) {
      console.error('❌ Error bloqueando y redirigiendo:', error);
    }
  }

  private navigateToIncident(incident: IncidentNotification): void {
    try {
      console.log('🧭 Intentando navegar a pantalla de Incidentes...');
      console.log('📍 NavigationRef current:', !!navigationRef.current);
      
      if (navigationRef.current) {
        const params = {
          incidenteId: incident.data?.incidenteId || incident.id,
          fromNotification: true,
          notificationData: incident
        };
        
        console.log('📦 Parámetros de navegación:', params);
        
        navigationRef.current.navigate('Incidente', params);
        console.log('✅ Navegación iniciada');
      } else {
        console.error('❌ NavigationRef.current es null');
      }
    } catch (error) {
      console.error('❌ Error navegando a incidentes:', error);
    }
  }

  private async checkPendingIncidentNotifications(): Promise<void> {
    try {
      console.log('🔍 Verificando incidentes pendientes...');
      
      const activeIncident = await AsyncStorage.getItem('active_incident');
      const userRole = await this.getCurrentUserRole();
      
      console.log('📦 Incidente activo encontrado:', !!activeIncident);
      console.log('👤 Rol de usuario:', userRole);
      
      if (activeIncident && userRole === 'CLIENTE') {
        const incident: IncidentNotification = JSON.parse(activeIncident);
        console.log('🚨 Incidente activo detectado:', incident.title);
        
        const currentRoute = navigationRef.current?.getCurrentRoute();
        console.log('📍 Ruta actual:', currentRoute?.name);
        
        if (currentRoute?.name !== 'Incidente') {
          console.log('🧭 Redirigiendo a incidentes...');
          
          setTimeout(() => {
            this.navigateToIncident(incident);
          }, 1500); // Dar más tiempo para que la navegación esté lista
        } else {
          console.log('ℹ️ Ya está en la pantalla de incidentes');
        }
      } else {
        console.log('ℹ️ No hay incidentes pendientes o usuario no es cliente');
      }
    } catch (error) {
      console.error('❌ Error verificando incidentes pendientes:', error);
    }
  }

  public async resolveIncident(incidentId: string): Promise<void> {
    try {
      console.log('✅ Resolviendo incidente:', incidentId);
      await AsyncStorage.removeItem('active_incident');
      
      await this.notifyIncidentResolved(incidentId);
      console.log('✅ Incidente resuelto completamente');
      
    } catch (error) {
      console.error('❌ Error resolviendo incidente:', error);
    }
  }

  private async notifyIncidentResolved(incidentId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No hay token para notificar resolución al servidor');
        return;
      }

      await fetch('http://31.97.13.182:3000/incidentes/resolver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ incidenteId })
      });
      
      console.log('✅ Servidor notificado sobre resolución de incidente');
    } catch (error) {
      console.warn('⚠️ Error notificando resolución al servidor:', error);
    }
  }

  // Método de utilidad para testing
  public async simulateIncident(): Promise<void> {
    console.log('🧪 SIMULANDO INCIDENTE PARA TESTING...');
    
    const testIncident: IncidentNotification = {
      id: 'test-' + Date.now(),
      title: 'Incidente de Prueba',
      body: 'Este es un incidente simulado para testing del sistema de bloqueo.',
      data: {
        tipo: 'incidente',
        incidenteId: 'INC-TEST-001',
        prioridad: 'ALTA'
      },
      timestamp: Date.now()
    };
    
    await this.handleIncidentNotification(testIncident);
  }

  public async hasActiveIncident(): Promise<boolean> {
    try {
      const activeIncident = await AsyncStorage.getItem('active_incident');
      const userRole = await this.getCurrentUserRole();
      
      return !!(activeIncident && userRole === 'CLIENTE');
    } catch (error) {
      console.error('❌ Error verificando incidente activo:', error);
      return false;
    }
  }

  public async getActiveIncident(): Promise<IncidentNotification | null> {
    try {
      const activeIncident = await AsyncStorage.getItem('active_incident');
      return activeIncident ? JSON.parse(activeIncident) : null;
    } catch (error) {
      console.error('❌ Error obteniendo incidente activo:', error);
      return null;
    }
  }

  public cleanup(): void {
    console.log('🧹 Limpiando NotificationService...');
    
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }
    if (this.unsubscribeBackgroundMessage) {
      this.unsubscribeBackgroundMessage();
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    this.isInitialized = false;
  }
}

export default NotificationService;