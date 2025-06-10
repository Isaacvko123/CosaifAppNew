import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

// Importar componentes existentes
import Menu from '../../../Component/Menu/Menu';
import MovimientoList from './MovimientoList';

// 🚨 IMPORTAR SISTEMA DE INCIDENTES
import { useIncidentHandler } from '../../../hooks/useIncidentHandler';
import { IncidentBlocker } from '../../../Component/Incidente/IncidentBlocker';
import NotificationService from '../../../navigation/NotificationService';

interface User {
  empresa: { nombre: string };
  nombre: string;
  rol?: string;
}

// Tipos de navegación
type RootStackParamList = {
  Incidente: { 
    incidenteId?: string; 
    fromNotification?: boolean; 
    notificationData?: any 
  } | undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Paleta de colores verde profesional
const PRIMARY_GREEN = '#3E8D63';
const SECONDARY_GREEN = '#75C095';
const DARK_GREEN = '#2A6547';
const LIGHT_GREEN = '#F0FFF4';
const TEXT_COLOR = '#2D3748';
const TEXT_LIGHT = '#718096';

const Cliente: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🚨 HOOK PARA MANEJAR INCIDENTES
  const { 
    activeIncident, 
    isBlocked, 
    loading: incidentLoading, 
    resolveIncident, 
    checkForActiveIncident 
  } = useIncidentHandler();

  // ===================================================================
  // 🔧 INICIALIZACIÓN Y CARGA DE DATOS
  // ===================================================================
  
  useEffect(() => {
    loadUserData();
    
    // 🔍 DEBUGGING INICIAL
    const debugInitialState = async () => {
      
      try {
        const userJson = await AsyncStorage.getItem('user');
        const userData = userJson ? JSON.parse(userJson) : null;
        
        const activeIncidentData = await AsyncStorage.getItem('active_incident');
        
        const hasNotificationService = NotificationService.getInstance();
        
      } catch (error) {
      }
    };
    
    debugInitialState();
  }, []);

  // 🔄 VERIFICAR INCIDENTES PERIÓDICAMENTE SOLO PARA CLIENTES
  useEffect(() => {
    if (user?.rol === 'CLIENTE') {

      
      const interval = setInterval(() => {
        checkForActiveIncident();
      }, 5000); // Verificar cada 5 segundos (más frecuente)

      return () => {
        clearInterval(interval);
      };
    }
  }, [user, checkForActiveIncident]);

  // 🔍 DEBUGGING DEL ESTADO DEL HOOK
  useEffect(() => {

  }, [isBlocked, activeIncident, incidentLoading, user]);

  const loadUserData = async () => {
    try {
      setIsRefreshing(true);

      
      const userJson = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        
        // 🚨 Si es cliente, verificar incidentes inmediatamente
        if (userData.rol === 'CLIENTE') {
          setTimeout(() => {
            checkForActiveIncident();
          }, 1000);
        }
      }
      
      setToken(storedToken);
      
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  };

  // ===================================================================
  // 🔧 FUNCIONES DE INTERACCIÓN
  // ===================================================================

  const toggleMenu = useCallback(() => {
    if (isBlocked) {
      return;
    }
    setMenuVisible(v => !v);
  }, [isBlocked]);

  const refreshData = useCallback(() => {
    console.log('🔄 Refrescando datos...');
    loadUserData();
    checkForActiveIncident();
  }, [checkForActiveIncident]);

  // 🧪 FUNCIÓN DE TESTING PARA SIMULAR INCIDENTES
  const testIncident = async () => {
    try {
      
      // Verificar que el NotificationService esté inicializado
      const hasActiveIncident = await NotificationService.getInstance().hasActiveIncident();
      
      // Simular incidente
      await NotificationService.getInstance().simulateIncident();
      
      // Forzar verificación inmediata
      setTimeout(() => {
        checkForActiveIncident();
      }, 1000);
      
    } catch (error) {
    
    }
  };

  // 🚨 FUNCIÓN PARA NAVEGAR A INCIDENTES
  const navigateToIncident = useCallback(() => {
    if (activeIncident) {
   
      
      navigation.navigate('Incidente', {
        incidenteId: activeIncident.data?.incidenteId || activeIncident.id,
        fromNotification: true,
        notificationData: activeIncident
      });
    } else {
    }
  }, [activeIncident, navigation]);

  // 🚨 FUNCIÓN PARA RESOLVER INCIDENTE
  const handleResolveIncident = useCallback(async () => {
    try {
      await resolveIncident();
    } catch (error) {
    }
  }, [resolveIncident]);

  // 🚨 FUNCIÓN PARA CONTINUAR (NUEVA)
  const handleContinue = useCallback(() => {
    // Aquí puedes agregar lógica adicional si es necesario
    // Por ejemplo, marcar como "pospuesto" pero no resuelto
  }, []);

  // 🚨 FUNCIÓN PARA PASAR (NUEVA)
  const handleSkip = useCallback(() => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres pasar este incidente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, pasar',
          onPress: () => {
            // Aquí puedes agregar lógica para marcar el incidente como "pasado"
            Alert.alert('Incidente pasado', 'El incidente ha sido marcado como pasado.');},
        },
      ],
      { cancelable: true }
    );
  }, []);

  // ===================================================================
  // 🚨 RENDERIZADO DEL BLOQUEADOR SI HAY INCIDENTE ACTIVO
  // ===================================================================
  
  if (isBlocked && activeIncident && user?.rol === 'CLIENTE') {
    
    return (
      <IncidentBlocker
        incident={activeIncident}
        onNavigateToIncident={navigateToIncident}
        onResolve={handleResolveIncident}
        onContinue={handleContinue}
        onSkip={handleSkip}
        customText="Se ha detectado un incidente crítico en el sistema ferroviario. Su atención inmediata es requerida para garantizar la seguridad operacional."
        customImages={[
          // Aquí irán las URLs de las imágenes cuando las tengas
          // 'https://ejemplo.com/imagen-incidente-1.jpg',
          // 'https://ejemplo.com/imagen-incidente-2.jpg'
        ]}
      />
    );
  }

  // ===================================================================
  // 🖥️ RENDERIZADO DE LA PANTALLA NORMAL
  // ===================================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_GREEN} />
      
      <LinearGradient
        colors={[PRIMARY_GREEN, DARK_GREEN]}
        style={styles.container}
      >
        {!menuVisible && (
          <View style={styles.topBar}>
            {/* Botón de menú */}
            <TouchableOpacity 
              onPress={toggleMenu} 
              style={[
                styles.menuButton,
                isBlocked && styles.disabledButton
              ]}
              disabled={isBlocked}
            >
              <FontAwesome5 
                name="bars" 
                size={22} 
                color={isBlocked ? "#999" : "#fff"} 
              />
            </TouchableOpacity>
            
            {/* Título con indicador de incidente */}
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Panel de Cliente</Text>
              {isBlocked && (
                <View style={styles.incidentIndicator}>
                  <FontAwesome5 name="exclamation-triangle" size={12} color="#FF4444" />
                  <Text style={styles.incidentText}>Incidente Activo</Text>
                </View>
              )}
            </View>
            
            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              {/* 🧪 BOTÓN DE TESTING - TEMPORAL */}
              {__DEV__ && (
                <TouchableOpacity 
                  onPress={testIncident} 
                  style={[styles.testButton]}
                >
                  <FontAwesome5 name="bug" size={16} color="#fff" />
                </TouchableOpacity>
              )}
              
              {/* Botón de refresh */}
              <TouchableOpacity 
                onPress={refreshData} 
                style={[
                  styles.refreshButton,
                  isBlocked && styles.disabledButton
                ]}
                disabled={isBlocked}
              >
                <FontAwesome5 
                  name="sync-alt" 
                  size={18} 
                  color={isBlocked ? "#999" : "#fff"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {menuVisible ? (
          <Menu visible={menuVisible} onClose={toggleMenu} />
        ) : (
          <>
            {/* Información del usuario */}
            {user && (
              <View style={styles.userInfoCard}>
                <View style={styles.userInfoContent}>
                  <View style={styles.avatarContainer}>
                    <FontAwesome5 
                      name="user-circle" 
                      size={40} 
                      color={PRIMARY_GREEN} 
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.welcomeText}>Bienvenido</Text>
                    <Text style={styles.companyName}>
                      {user.empresa?.nombre || 'Empresa'}
                    </Text>
                    <Text style={styles.nameText}>{user.nombre}</Text>
                    {/* Mostrar rol para debugging */}
                
                  </View>
                </View>
              </View>
            )}

            <View style={styles.contentContainer}>
              {/* 🚨 OVERLAY DE ADVERTENCIA LIGERO (si hay incidente pero no se muestra el bloqueador completo) */}
              {isBlocked && (
                <View style={styles.blockOverlay}>
                  <View style={styles.blockMessage}>
                    <FontAwesome5 name="exclamation-triangle" size={24} color="#FF4444" />
                    <Text style={styles.blockText}>
                      Hay un incidente activo que requiere su atención inmediata
                    </Text>
                    <TouchableOpacity 
                      style={styles.goToIncidentButton}
                      onPress={navigateToIncident}
                    >
                      <Text style={styles.goToIncidentText}>Ver Incidente</Text>
                      <FontAwesome5 name="arrow-right" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Contenido principal */}
              <MovimientoList
                token={token}
              />
            </View>
          </>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_GREEN,
  },
  container: {
    flex: 1,
    padding: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  incidentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  incidentText: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
  },
  
  // 🔧 ESTILOS PARA BOTONES DE ACCIÓN
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  userInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    overflow: 'hidden',
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: LIGHT_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 16,
    color: PRIMARY_GREEN,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  
  // 🚨 ESTILOS PARA OVERLAY DE BLOQUEO
  blockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  blockText: {
    fontSize: 16,
    color: '#7F1D1D',
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  goToIncidentButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  goToIncidentText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default Cliente;