import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  AppState,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/Navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';

// Constantes de diseño
const COLORS = {
  PRIMARY_RED: '#C53030',
  LIGHT_RED: '#FEE2E2',
  DARK_RED: '#7F1D1D',
  ACCENT_RED: '#F87171',
  NEUTRAL_100: '#F5F5F5',
  NEUTRAL_200: '#E5E5E5',
  NEUTRAL_300: '#D4D4D4',
  NEUTRAL_700: '#404040',
  NEUTRAL_900: '#171717',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  WHITE: '#FFFFFF'
};

// API URL base - configurable
const API_BASE_URL = 'http://10.10.10.6:3000'; // Idealmente usar una variable de entorno

// Definición de tareas en segundo plano
const BACKGROUND_TIMER_TASK = 'background-timer-task';

// Tipos para detalles del movimiento
interface MovimientoDetalle {
  id: number;
  locomotora: number;
  cliente: string;
  posicionCabina: string;
  posicionChimenea: string;
  tipoMovimiento: string;
  direccionEmpuje: string;
  prioridad: string;
  lavado: boolean;
  torno: boolean;
  fechaSolicitud: string;
  viaOrigen: string;
  viaDestino: string | null;
  rondaNumero: number;
  orden: number;
  estado?: string;
}

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

// Registro de la tarea en segundo plano
TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
  try {
    // Obtener tiempo actual del almacenamiento
    const timeStr = await AsyncStorage.getItem('movimiento_timer');
    if (timeStr) {
      const timeData = JSON.parse(timeStr);
      const { startTime, movimientoId, locomotora, isRunning } = timeData;
      
      if (isRunning) {
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        // Actualizar notificación
        await updateTimerNotification(elapsedSeconds, movimientoId, locomotora);
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Función para limpiar todos los datos y tareas
const cleanupTimerResources = async () => {
  try {
    // Eliminar datos de AsyncStorage
    await AsyncStorage.removeItem('movimiento_timer');
    
    // Cancelar todas las notificaciones
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    try {
      if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK)) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
      }
    } catch (error) {
    }
    
  } catch (error) {
  }
};

// Función para formatear tiempo (HH:MM:SS)
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

// Función para actualizar la notificación
const updateTimerNotification = async (
  seconds: number, 
  movimientoId: string, 
  locomotora: string
) => {
  const formattedTime = formatTime(seconds);
  
  await Notifications.setNotificationCategoryAsync('timer', [
    {
      identifier: 'stop',
      buttonTitle: 'PARAR',
      options: {
        opensAppToForeground: true,
      }
    }
  ]);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Movimiento en curso - Loco #${locomotora}`,
      body: `⏱️ Tiempo: ${formattedTime} | ID: ${movimientoId}`,
      data: { movimientoId, locomotora },
      sticky: true,
      autoDismiss: false,
      categoryIdentifier: 'timer',
    },
    trigger: null,
    identifier: 'timer-notification',
  });
};

// Función para obtener el token de autenticación
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token'); // Nombre correcto para obtener el token
    return token;
  } catch (error) {
    return null;
  }
};

// Transformar datos del movimiento para mostrar en UI
const transformMovementData = (data: any): MovimientoDetalle => {
  const m = data.movimiento;
  
  if (!m) {
    return {
      id: 0,
      locomotora: 0,
      cliente: 'N/A',
      posicionCabina: 'Sin dato',
      posicionChimenea: 'Sin dato',
      tipoMovimiento: 'Sin dato',
      direccionEmpuje: 'N/A',
      prioridad: 'N/A',
      lavado: false,
      torno: false,
      fechaSolicitud: new Date().toLocaleString(),
      viaOrigen: 'N/A',
      viaDestino: null,
      rondaNumero: 0,
      orden: 0,
      estado: 'En curso'
    };
  }
  
  // Manejo de vía destino (igual que en Maquinista)
  const viaDestinoNombre =
    m.viaDestino?.nombre ?? (m.lavado ? 'Lavado' : m.torno ? 'Torno' : null);
    
  return {
    id: m.id,
    locomotora: m.locomotiveNumber ?? m.locomotora ?? 0,
    cliente: m.empresa?.nombre ?? 'N/A',
    posicionCabina: m.posicionCabina ?? 'Sin dato',
    posicionChimenea: m.posicionChimenea ?? 'Sin dato',
    tipoMovimiento: m.tipoMovimiento ?? 'Sin dato',
    direccionEmpuje: m.direccionEmpuje ?? 'N/A',
    prioridad: m.prioridad ?? 'N/A',
    lavado: m.lavado ?? false,
    torno: m.torno ?? false,
    fechaSolicitud: m.fechaSolicitud ? new Date(m.fechaSolicitud).toLocaleString() : new Date().toLocaleString(),
    viaOrigen: m.viaOrigen?.nombre ?? 'N/A',
    viaDestino: viaDestinoNombre,
    rondaNumero: data.rondaNumero ?? 0,
    orden: data.orden ?? 0,
    estado: m.estado ?? 'En curso'
  };
};

// Función para obtener detalles del movimiento
const obtenerDetallesMovimiento = async (movimientoId: string, locomotora: string): Promise<MovimientoDetalle | null> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Obtener datos de usuario para encontrar la localidadId
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      return null;
    }
    
    const userData = JSON.parse(userStr);
    
    if (!userData.localidadId) {
      return null;
    }
    
    // Probar con el endpoint exacto que usa Maquinista
    try {
      const response = await fetch(
        `${API_BASE_URL}/rondas/localidad/${userData.localidadId}/siguiente`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Verificar si contiene el movimiento que buscamos
        if (data.movimiento && data.movimiento.id.toString() === movimientoId) {
          return transformMovementData(data);
        } else {
        }
      }
    } catch (error) {
    }
    
    // Intentar con endpoint actual (segunda opción)
    try {
      const response = await fetch(
        `${API_BASE_URL}/rondas/localidad/${userData.localidadId}/actual`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Ver si hay movimientos y encontrar el actual
        if (data.movimientos && Array.isArray(data.movimientos)) {
          const movimientoEncontrado = data.movimientos.find(
            (mov: any) => mov.id.toString() === movimientoId
          );
          
          if (movimientoEncontrado) {
            
            // Estructurar datos para transformMovementData (mismo formato que en Maquinista)
            const movimientoData = {
              movimiento: movimientoEncontrado,
              rondaNumero: data.numero || 0,
              orden: movimientoEncontrado.orden || 0
            };
            
            return transformMovementData(movimientoData);
          }
        }
      }
    } catch (error) {
    }

    // Como último recurso, crear objeto básico
    return {
      id: parseInt(movimientoId),
      locomotora: parseInt(locomotora),
      cliente: 'No disponible',
      posicionCabina: 'No disponible',
      posicionChimenea: 'No disponible',
      tipoMovimiento: 'No disponible',
      direccionEmpuje: 'N/A',
      prioridad: 'N/A',
      lavado: false,
      torno: false,
      fechaSolicitud: new Date().toLocaleString(),
      viaOrigen: 'No disponible',
      viaDestino: null,
      rondaNumero: 0,
      orden: 0,
      estado: 'En curso'
    };
  } catch (error) {
    return null;
  }
};

// Función para finalizar movimiento en el backend
const finalizarMovimientoEnBackend = async (movimientoId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/movimientos/${movimientoId}/finalizar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      return false;
    }
    
    // Intentar obtener el cuerpo de la respuesta (para debug)
    try {
      const responseBody = await response.json();
    } catch (e) {
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Tipos para navegación
type MovimientoPScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MovimientoP'>;
type MovimientoPScreenRouteProp = RouteProp<RootStackParamList, 'MovimientoP'>;

interface MovimientoProps {
  navigation: MovimientoPScreenNavigationProp;
  route: MovimientoPScreenRouteProp;
}

const MovimientoP: React.FC<MovimientoProps> = ({ navigation, route }) => {
  // Extraer parámetros
  const { movimientoId, locomotora } = route.params;
  
  // Estados
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [processingFinalization, setProcessingFinalization] = useState(false);
  const [movimientoDetalle, setMovimientoDetalle] = useState<MovimientoDetalle | null>(null);
  const [loadingDetalles, setLoadingDetalles] = useState(true);

  // Referencias
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(new Date().getTime());
  const alertShownRef = useRef(false);
  const navigationAttemptedRef = useRef(false);

  // Cargar detalles del movimiento
  const cargarDetallesMovimiento = useCallback(async () => {
    setLoadingDetalles(true);
    try {
      // Verificar primero en AsyncStorage
      try {
        const savedData = await AsyncStorage.getItem(`movimiento_info_${movimientoId}`);
        
        if (savedData) {
          const movData = JSON.parse(savedData);
          
          // Convertir al formato que espera la función transformMovementData
          const formattedData = {
            movimiento: movData,
            rondaNumero: movData.rondaNumero || 0,
            orden: movData.orden || 0
          };
          
          setMovimientoDetalle(transformMovementData(formattedData));
          setLoadingDetalles(false);
          return;
        }
      } catch (storageError) {
      }
      
      const detalles = await obtenerDetallesMovimiento(movimientoId, locomotora);
      if (detalles) {
        setMovimientoDetalle(detalles);
        
        // Guardar para uso futuro
        try {
          await AsyncStorage.setItem(
            `movimiento_info_${movimientoId}`,
            JSON.stringify(detalles)
          );
        } catch (saveError) {
        }
      }
    } catch (error) {
    } finally {
      setLoadingDetalles(false);
    }
  }, [movimientoId, locomotora]);

  // Solicitar permisos de notificación
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Las notificaciones son necesarias para mantener el cronómetro visible cuando la app está en segundo plano.'
        );
      }
    })();
  }, []);

  // Registrar la tarea en segundo plano
  const registerBackgroundTask = async () => {
    try {
      // Verificar si la plataforma soporta Background Fetch
      const isAvailable = await BackgroundFetch.getStatusAsync()
        .then(() => true)
        .catch(() => false);
      
      if (isAvailable) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
          minimumInterval: 15, // 15 segundos
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } else {
      }
    } catch (err) {
      // No mostrar error, simplemente loguear que no está disponible
    }
  };

  // Inicializar datos del cronómetro en el almacenamiento
  const initializeTimerData = async () => {
    const now = new Date().getTime();
    startTimeRef.current = now;
    
    // Guardar datos en AsyncStorage
    const timerData = {
      startTime: now,
      movimientoId,
      locomotora,
      isRunning: true
    };
    
    await AsyncStorage.setItem('movimiento_timer', JSON.stringify(timerData));
  };

  // Cargar cronómetro desde almacenamiento
  const loadTimerFromStorage = async () => {
    try {
      const timeStr = await AsyncStorage.getItem('movimiento_timer');
      if (timeStr) {
        const timeData = JSON.parse(timeStr);
        
        // Verificar si es el mismo movimiento
        if (timeData.movimientoId === movimientoId) {
          startTimeRef.current = timeData.startTime;
          setIsRunning(timeData.isRunning);
          
          // Calcular segundos transcurridos
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - timeData.startTime) / 1000);
          setSeconds(elapsedSeconds);
        } else {
          // Nuevo movimiento, inicializar datos
          await initializeTimerData();
        }
      } else {
        // No hay datos guardados, inicializar
        await initializeTimerData();
      }
    } catch (error) {
      await initializeTimerData();
    }
  };

  // Mostrar notificación inicial
  const showInitialNotification = async () => {
    await updateTimerNotification(seconds, movimientoId, locomotora);
  };

  // Manejar cambios de estado de la aplicación
  const handleAppStateChange = useCallback((nextAppState: any) => {
    setAppState(nextAppState);
    
    if (nextAppState === 'active') {
      // Cuando la app vuelve a primer plano, sincronizar cronómetro
      syncTimerWithStorage();
    }
  }, []);

  // Sincronizar cronómetro con almacenamiento
  const syncTimerWithStorage = async () => {
    try {
      const timeStr = await AsyncStorage.getItem('movimiento_timer');
      if (timeStr) {
        const timeData = JSON.parse(timeStr);
        
        if (timeData.isRunning && timeData.movimientoId === movimientoId) {
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - timeData.startTime) / 1000);
          setSeconds(elapsedSeconds);
          
          // Actualizar notificación incluso si Background Fetch no está disponible
          updateTimerNotification(elapsedSeconds, movimientoId, locomotora);
        }
      }
    } catch (error) {
    }
  };

  // Función para renderizar filas de datos con indicador cuando no está disponible
  const renderDataRow = (icon: string, label: string, value: string | number | boolean | null | undefined) => {
    // Manejo de valores nulos o indefinidos
    let displayValue = value;
    if (value === null || value === undefined || value === 'N/A' || value === 'Sin dato') {
      displayValue = 'No disponible';
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Sí' : 'No';
    }
    
    return (
      <View style={styles.dataRow}>
        <View style={styles.labelContainer}>
          <FontAwesome5
            name={icon}
            size={16}
            color={COLORS.PRIMARY_RED}
            style={styles.labelIcon}
          />
          <Text style={styles.dataLabel}>{label}</Text>
        </View>
        <Text 
          style={[
            styles.dataValue, 
            (value === null || value === undefined || value === 'N/A' || value === 'Sin dato') ? styles.dataValueNA : null
          ]}
        >
          {displayValue}
        </Text>
      </View>
    );
  };

  // Navegar a la pantalla Maquinista con garantía
  const navigateToMaquinista = useCallback(() => {
    // Evitar múltiples intentos
    if (navigationAttemptedRef.current) return;
    navigationAttemptedRef.current = true;
    
    
    // Estrategia principal: replace (mejor opción)
    try {
      navigation.replace('Maquinista');
      return;
    } catch (error) {
    }
    
    // Estrategia de respaldo 1: reset
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Maquinista' }],
      });
      return;
    } catch (error) {
    }
    
    // Estrategia de respaldo 2: navigate
    try {
      navigation.navigate('Maquinista');
      return;
    } catch (error) {
    }
    
    // Estrategia de respaldo 3: popToTop y luego navigate
    try {
      navigation.popToTop();
      setTimeout(() => navigation.navigate('Maquinista'), 100);
      return;
    } catch (error) {
    }
    
    // Si todas fallan
    navigation.goBack();
  }, [navigation]);

  // Inicialización
  useEffect(() => {
    // Registrar listener para cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Para debug - imprimir todos los valores en AsyncStorage
    const debugAsyncStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const items = await AsyncStorage.multiGet(keys);
        items.forEach(([key, value]) => {
        });
      } catch (error) {
      }
    };
    debugAsyncStorage();
    
    // Cargar datos del timer y detalles del movimiento
    Promise.all([
      loadTimerFromStorage(),
      cargarDetallesMovimiento()
    ]).then(() => {
      registerBackgroundTask();
      showInitialNotification();
    });
    
    return () => {
      // Limpiar al desmontar
      subscription.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Manejar cronómetro en primer plano y segundo plano
  useEffect(() => {
    // Cronómetro en primer plano (interfaz visible)
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Sincronizar con tiempo almacenado para segundo plano
    const backgroundSync = setInterval(async () => {
      if (isRunning && appState !== 'active') {
        await syncTimerWithStorage();
      }
    }, 5000); // Sincronizar cada 5 segundos en segundo plano
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      clearInterval(backgroundSync);
    };
  }, [isRunning, appState]);

  // Actualizar notificación cada 15 segundos cuando la app está en primer plano
  useEffect(() => {
    if (seconds % 15 === 0 && isRunning) {
      updateTimerNotification(seconds, movimientoId, locomotora);
    }
  }, [seconds, isRunning, movimientoId, locomotora]);

  // Función para manejar el botón de parar
  const handleStop = useCallback(() => {
    setShowAlert(true);
  }, []);

  // Función para manejar la selección de motivo
  const handleReasonSelect = useCallback((reason: string) => {
    setSelectedReason(reason);
    setShowAlert(false);
    setShowConfirmation(true);
  }, []);

  // Función para finalizar el movimiento
  const finalizarMovimiento = useCallback(async () => {
    // Evitar procesamientos múltiples
    if (processingFinalization) return;
    setProcessingFinalization(true);
    
    try {
      // Detener el cronómetro
      setIsRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      // Limpiar recursos del timer (importante hacerlo aquí)
      await cleanupTimerResources();
      
      // Comunicar finalización al backend
      const exito = await finalizarMovimientoEnBackend(movimientoId);
      
      if (exito) {
        // Navegar inmediatamente sin mostrar alerta (opcional)
        navigateToMaquinista();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    } finally {
      setProcessingFinalization(false);
    }
  }, [movimientoId, navigateToMaquinista, processingFinalization]);

  // Función para confirmar la acción
  const handleConfirm = useCallback(async () => {
    if (!selectedReason) {
      setShowConfirmation(false);
      return;
    }
    
    
    // Cerrar primero el modal de confirmación
    setShowConfirmation(false);
    
    try {
      const tiempoTotal = formatTime(seconds);
      
      if (selectedReason === 'TERMINADO') {
        // Para finalización real, hacer el proceso completo
        const exito = await finalizarMovimiento();
        
        // Mostrar alerta de confirmación basada en el resultado
        Alert.alert(
          `Movimiento ${selectedReason}`,
          `Movimiento completado\nTiempo total: ${tiempoTotal}${!exito ? '\n(Error en servidor)' : ''}`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (exito) {
                  // Si ya navegamos en finalizarMovimiento(), esto es redundante pero seguro
                  navigateToMaquinista();
                } else {
                  // Si hubo error, intentar navegar de todos modos
                  navigateToMaquinista();
                }
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        // Para incidente, solo detener el cronómetro y volver atrás
        setIsRunning(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        await cleanupTimerResources();
        
        Alert.alert(
          `Movimiento ${selectedReason}`,
          `Incidente registrado\nTiempo total: ${tiempoTotal}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { cancelable: false }
        );
      }
    } catch (error) {
      
      // En caso de error inesperado, intentar limpiar y volver atrás
      await cleanupTimerResources();
      navigation.goBack();
    }
  }, [selectedReason, seconds, finalizarMovimiento, navigateToMaquinista, navigation]);
  
  // Función para cancelar la confirmación
  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setSelectedReason(null);
  }, []);

  // Función para cerrar la alerta
  const handleCloseAlert = useCallback(() => {
    setShowAlert(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK_RED} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (isRunning) {
                // Si el cronómetro sigue en marcha, mostrar diálogo de confirmación
                Alert.alert(
                  "¿Salir sin terminar?",
                  "El cronómetro seguirá en marcha en segundo plano.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    { 
                      text: "Salir", 
                      onPress: () => navigation.goBack() 
                    }
                  ]
                );
              } else {
                // Si no está en marcha, volver directamente
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Movimiento en Curso - Loco #{locomotora}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Timer Card */}
          <View style={styles.card}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Tiempo transcurrido:</Text>
              <Text style={styles.timer}>{formatTime(seconds)}</Text>
              <View style={styles.runningIndicator}>
                <View style={[
                  styles.pulsingDot,
                  styles.pulsing
                ]} />
                <Text style={styles.runningText}>
                  En progreso (continúa en segundo plano)
                </Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>ID del Movimiento:</Text>
              <Text style={styles.infoValue}>{movimientoId}</Text>
            </View>
            
            <View style={styles.noteContainer}>
              <FontAwesome5 name="info-circle" size={14} color={COLORS.PRIMARY_RED} />
              <Text style={styles.noteText}>
                El cronómetro seguirá funcionando incluso si minimizas la aplicación.
                Verás una notificación con el tiempo actualizado.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStop}
              activeOpacity={0.8}
              disabled={processingFinalization}
            >
              <FontAwesome5 name="stop-circle" size={20} color={COLORS.WHITE} style={styles.buttonIcon} />
              <Text style={styles.stopButtonText}>
                {processingFinalization ? 'PROCESANDO...' : 'PARAR MOVIMIENTO'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Detalles del Movimiento */}
          <View style={[styles.card, styles.detallesCard]}>
            <LinearGradient
              colors={[COLORS.PRIMARY_RED, COLORS.DARK_RED]}
              style={styles.cardHeader}
            >
              <View style={styles.cardTitleRow}>
                <FontAwesome5 name="train" size={20} color={COLORS.WHITE} />
                <Text style={styles.cardTitle}>
                  Detalles del Movimiento
                </Text>
              </View>
              {!loadingDetalles && movimientoDetalle && movimientoDetalle.rondaNumero > 0 && (
                <Text style={styles.cardSubtitle}>
                  Ronda #{movimientoDetalle.rondaNumero} • Orden {movimientoDetalle.orden}
                </Text>
              )}
            </LinearGradient>

            <View style={styles.cardBody}>
              {loadingDetalles ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.PRIMARY_RED} />
                  <Text style={styles.loadingText}>Cargando detalles...</Text>
                </View>
              ) : movimientoDetalle ? (
                <>
                  {renderDataRow('building', 'Cliente', movimientoDetalle.cliente)}
                  {renderDataRow(
                    'exchange-alt',
                    'Movimiento',
                    `${movimientoDetalle.tipoMovimiento} (${movimientoDetalle.direccionEmpuje})`
                  )}
                  {renderDataRow('flag', 'Prioridad', movimientoDetalle.prioridad)}
                  {renderDataRow('door-open', 'Cabina', movimientoDetalle.posicionCabina)}
                  {renderDataRow(
                    'industry',
                    'Chimenea',
                    movimientoDetalle.posicionChimenea
                  )}
                  {renderDataRow(
                    'map-pin',
                    'Vía Origen',
                    movimientoDetalle.viaOrigen
                  )}
                  {renderDataRow(
                    'map-marker-alt',
                    'Vía Destino',
                    movimientoDetalle.viaDestino ?? 'N/A'
                  )}
                  {renderDataRow('tint', 'Lavado', movimientoDetalle.lavado)}
                  {renderDataRow('cog', 'Torno', movimientoDetalle.torno)}

                  <View style={styles.dateContainer}>
                    <FontAwesome5
                      name="clock"
                      size={14}
                      color={COLORS.NEUTRAL_700}
                    />
                    <Text style={styles.dateText}>
                      Solicitud: {movimientoDetalle.fechaSolicitud}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.errorContainer}>
                  <FontAwesome5 name="exclamation-circle" size={24} color={COLORS.ERROR} />
                  <Text style={styles.errorText}>No se pudieron cargar los detalles</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={cargarDetallesMovimiento}
                  >
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Alerta de motivo de detención */}
        <Modal
          visible={showAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseAlert}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Motivo de detención</Text>
              <Text style={styles.modalSubtitle}>Seleccione una opción:</Text>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.successButton]}
                  onPress={() => handleReasonSelect('TERMINADO')}
                >
                  <FontAwesome5 name="check-circle" size={24} color={COLORS.WHITE} />
                  <Text style={styles.optionText}>TERMINADO</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.optionButton, styles.warningButton]}
                  onPress={() => handleReasonSelect('INCIDENTE')}
                >
                  <FontAwesome5 name="exclamation-triangle" size={24} color={COLORS.WHITE} />
                  <Text style={styles.optionText}>INCIDENTE</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseAlert}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Confirmación de acción */}
        <Modal
          visible={showConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirmar acción</Text>
              <Text style={styles.confirmationText}>
                ¿Está seguro que desea marcar este movimiento como{' '}
                <Text style={styles.highlightText}>{selectedReason}</Text>?
              </Text>
              
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelConfirmButton]}
                  onPress={handleCancel}
                  disabled={processingFinalization}
                >
                  <Text style={styles.confirmButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.confirmButton, styles.acceptConfirmButton]}
                  onPress={handleConfirm}
                  disabled={processingFinalization}
                >
                  <Text style={styles.confirmButtonText}>
                    {processingFinalization ? 'Procesando...' : 'Confirmar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.DARK_RED,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.NEUTRAL_200,
  },
  header: {
    backgroundColor: COLORS.PRIMARY_RED,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: COLORS.NEUTRAL_900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: COLORS.NEUTRAL_900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detallesCard: {
    marginTop: 16,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.NEUTRAL_200,
    marginTop: 4,
    marginLeft: 28,
  },
  cardBody: {
    padding: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 16,
    color: COLORS.NEUTRAL_700,
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_900,
    fontVariant: ['tabular-nums'],
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.SUCCESS,
    marginRight: 8,
  },
  pulsing: {
    opacity: 1,
  },
  runningText: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.NEUTRAL_200,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.NEUTRAL_700,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_900,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.LIGHT_RED,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 13,
    color: COLORS.NEUTRAL_700,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL_200,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 8,
  },
  dataLabel: {
    fontSize: 15,
    color: COLORS.NEUTRAL_700,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 15,
    color: COLORS.NEUTRAL_900,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  dataValueNA: {
    fontSize: 15,
    color: COLORS.NEUTRAL_700,
    fontWeight: '400',
    fontStyle: 'italic',
    maxWidth: '50%',
    textAlign: 'right',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.NEUTRAL_700,
    marginLeft: 6,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.PRIMARY_RED,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.ERROR,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY_RED,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  stopButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_900,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.NEUTRAL_700,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  successButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  warningButton: {
    backgroundColor: COLORS.WARNING,
  },
  optionText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.NEUTRAL_700,
    fontSize: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: COLORS.NEUTRAL_700,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  highlightText: {
    fontWeight: 'bold',
    color: COLORS.PRIMARY_RED,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: COLORS.NEUTRAL_300,
  },
  acceptConfirmButton: {
    backgroundColor: COLORS.PRIMARY_RED,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
});

export default MovimientoP;