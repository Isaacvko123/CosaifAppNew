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
  ActivityIndicator,
  BackHandler
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

const API_BASE_URL = 'http://31.97.13.182:3000';
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
    const timeStr = await AsyncStorage.getItem('movimiento_timer');
    if (timeStr) {
      const timeData = JSON.parse(timeStr);
      const { startTime, movimientoId, locomotora, isRunning } = timeData;
      
      if (isRunning) {
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        await updateTimerNotification(elapsedSeconds, movimientoId, locomotora);
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ← FUNCIÓN MEJORADA PARA LIMPIAR COMPLETAMENTE TODOS LOS DATOS DEL MOVIMIENTO
const cleanupAllMovementData = async (movimientoId?: string) => {
  try {
    console.log('🧹 Iniciando limpieza completa de datos del movimiento...');
    
    // 1. Eliminar datos del timer
    await AsyncStorage.removeItem('movimiento_timer');
    console.log('✅ Timer data eliminado');
    
    // 2. Eliminar información específica del movimiento si se proporciona ID
    if (movimientoId) {
      await AsyncStorage.removeItem(`movimiento_info_${movimientoId}`);
      console.log(`✅ Movimiento info ${movimientoId} eliminado`);
    }
    
    // 3. Cancelar todas las notificaciones
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Notificaciones eliminadas');
    
    // 4. Limpiar tareas en segundo plano
    try {
      if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK)) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
        console.log('✅ Background task eliminado');
      }
    } catch (error) {
      console.log('⚠️ Error eliminando background task (normal):', error);
    }
    
    // 5. Limpiar cualquier otro dato relacionado con movimientos activos
    const allKeys = await AsyncStorage.getAllKeys();
    const movementKeys = allKeys.filter(key => 
      key.startsWith('movimiento_') || 
      key.includes('active_movement') ||
      key.includes('timer_')
    );
    
    if (movementKeys.length > 0) {
      await AsyncStorage.multiRemove(movementKeys);
      console.log('✅ Datos adicionales de movimiento eliminados:', movementKeys);
    }
    
    console.log('🎉 Limpieza completa finalizada');
    
  } catch (error) {
    console.error('❌ Error en limpieza completa:', error);
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
      title: `🚂 MOVIMIENTO ACTIVO - Loco #${locomotora}`,
      body: `⏱️ Tiempo: ${formattedTime} | ID: ${movimientoId}\n🔒 Debes finalizar para continuar`,
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
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    return null;
  }
};

// Transformar datos del movimiento para mostrar en UI
const transformMovementData = (data: any): MovimientoDetalle => {
  const m = data.movimiento || data;
  
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
  
  console.log('🔍 Datos del movimiento recibidos:', JSON.stringify(m, null, 2));
  
  // Lógica mejorada para vía destino
  let viaDestinoNombre = null;
  
  // Caso especial: MD_trabajando va a "Quita"
  if (m.tipoMovimiento === 'MD_trabajando') {
    viaDestinoNombre = 'Quita';
  } 
  // Si tiene vía destino explícita
  else if (m.viaDestino?.nombre) {
    viaDestinoNombre = m.viaDestino.nombre;
  }
  // Si es lavado
  else if (m.lavado === true) {
    viaDestinoNombre = 'Lavado';
  }
  // Si es torno
  else if (m.torno === true) {
    viaDestinoNombre = 'Torno';
  }
  // Otros casos especiales según tipo de movimiento
  else if (m.tipoMovimiento === 'Entrada') {
    viaDestinoNombre = 'Entrada Depot';
  }
  else if (m.tipoMovimiento === 'Salida') {
    viaDestinoNombre = 'Salida Depot';
  }
  
  // Obtener cliente de múltiples posibles ubicaciones
  const clienteNombre = 
    m.empresa?.nombre || 
    m.cliente?.nombre || 
    m.clienteNombre || 
    m.company?.nombre ||
    'Cliente no especificado';
  
  // Obtener vía origen de múltiples posibles ubicaciones
  const viaOrigenNombre = 
    m.viaOrigen?.nombre || 
    m.origenVia?.nombre || 
    m.origen?.nombre ||
    'Origen no especificado';
    
  return {
    id: m.id || 0,
    locomotora: m.locomotiveNumber || m.locomotora || m.locomotive || 0,
    cliente: clienteNombre,
    posicionCabina: m.posicionCabina || m.cabina || 'Sin especificar',
    posicionChimenea: m.posicionChimenea || m.chimenea || 'Sin especificar',
    tipoMovimiento: m.tipoMovimiento || m.tipo || 'Sin especificar',
    direccionEmpuje: m.direccionEmpuje || m.direccion || 'Sin especificar',
    prioridad: m.prioridad || m.priority || 'Normal',
    lavado: m.lavado === true || m.lavado === 'true',
    torno: m.torno === true || m.torno === 'true',
    fechaSolicitud: m.fechaSolicitud ? new Date(m.fechaSolicitud).toLocaleString() : new Date().toLocaleString(),
    viaOrigen: viaOrigenNombre,
    viaDestino: viaDestinoNombre,
    rondaNumero: data.rondaNumero || m.rondaNumero || 0,
    orden: data.orden || m.orden || 0,
    estado: m.estado || 'En curso'
  };
};

// Función para obtener detalles del movimiento
const obtenerDetallesMovimiento = async (movimientoId: string, locomotora: string): Promise<MovimientoDetalle | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.log('❌ No hay token de autenticación');
      return null;
    }
    
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      console.log('❌ No hay datos de usuario');
      return null;
    }
    
    const userData = JSON.parse(userStr);
    if (!userData.localidadId) {
      console.log('❌ No hay localidadId en datos de usuario');
      return null;
    }
    
    console.log(`🌐 Consultando API para movimiento ${movimientoId} en localidad ${userData.localidadId}`);
    
    // ← PRIMER INTENTO: Endpoint 'siguiente'
    try {
      console.log('🔍 Intentando endpoint /siguiente...');
      const response = await fetch(
        `${API_BASE_URL}/rondas/localidad/${userData.localidadId}/siguiente`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Respuesta de /siguiente:', JSON.stringify(data, null, 2));
        
        if (data.movimiento && data.movimiento.id.toString() === movimientoId) {
          console.log('✅ Movimiento encontrado en /siguiente');
          return transformMovementData(data);
        } else {
          console.log('⚠️ Movimiento no coincide en /siguiente');
        }
      } else {
        console.log(`❌ Error en /siguiente: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Error en endpoint /siguiente:', error);
    }
    
    // ← SEGUNDO INTENTO: Endpoint 'actual'
    try {
      console.log('🔍 Intentando endpoint /actual...');
      const response = await fetch(
        `${API_BASE_URL}/rondas/localidad/${userData.localidadId}/actual`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Respuesta de /actual:', JSON.stringify(data, null, 2));
        
        if (data.movimientos && Array.isArray(data.movimientos)) {
          const movimientoEncontrado = data.movimientos.find(
            (mov: any) => mov.id.toString() === movimientoId
          );
          
          if (movimientoEncontrado) {
            console.log('✅ Movimiento encontrado en /actual:', movimientoEncontrado);
            
            // Estructurar datos para transformMovementData
            const movimientoData = {
              movimiento: movimientoEncontrado,
              rondaNumero: data.numero || 0,
              orden: movimientoEncontrado.orden || 0
            };
            
            return transformMovementData(movimientoData);
          } else {
            console.log('⚠️ Movimiento no encontrado en array de /actual');
          }
        } else {
          console.log('⚠️ No hay array de movimientos en /actual');
        }
      } else {
        console.log(`❌ Error en /actual: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Error en endpoint /actual:', error);
    }

    // ← ÚLTIMO RECURSO: Crear objeto básico con los datos que tenemos
    console.log('🆘 Creando objeto básico como último recurso');
    return {
      id: parseInt(movimientoId),
      locomotora: parseInt(locomotora),
      cliente: 'Información no disponible',
      posicionCabina: 'Sin especificar',
      posicionChimenea: 'Sin especificar',
      tipoMovimiento: 'En curso',
      direccionEmpuje: 'Sin especificar',
      prioridad: 'Normal',
      lavado: false,
      torno: false,
      fechaSolicitud: new Date().toLocaleString(),
      viaOrigen: 'Información no disponible',
      viaDestino: 'Información no disponible',
      rondaNumero: 0,
      orden: 0,
      estado: 'En curso'
    };
  } catch (error) {
    console.error('❌ Error general en obtenerDetallesMovimiento:', error);
    return null;
  }
};

// Función para finalizar movimiento en el backend
const finalizarMovimientoEnBackend = async (movimientoId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) return false;
    
    const response = await fetch(`${API_BASE_URL}/movimientos/${movimientoId}/finalizar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) return false;
    
    try {
      const responseBody = await response.json();
      console.log('Response from finalizar:', responseBody);
    } catch (e) {
      // Ignorar errores de parsing
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
  const [movementFinalized, setMovementFinalized] = useState(false); // ← NUEVO ESTADO

  // Referencias
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(new Date().getTime());
  const navigationAttemptedRef = useRef(false);

  // ← BLOQUEO TOTAL DEL BOTÓN FÍSICO DE ATRÁS
  useEffect(() => {
    const backAction = () => {
      if (isRunning && !movementFinalized) {
        // ← BLOQUEO ABSOLUTO - NO PERMITIR SALIR BAJO NINGUNA CIRCUNSTANCIA
        Alert.alert(
          "🚂 Movimiento en Curso",
          "No puedes salir de la aplicación mientras hay un movimiento activo.\n\n🔒 Debes finalizar el movimiento (TERMINADO o INCIDENTE) para continuar.",
          [
            { 
              text: "Entendido", 
              style: "default",
              onPress: () => {
                // Mostrar notificación persistente como recordatorio
                updateTimerNotification(seconds, movimientoId, locomotora);
              }
            }
          ],
          { cancelable: false }
        );
        return true; // ← BLOQUEAR COMPLETAMENTE - NUNCA PERMITIR SALIR
      }
      return false; // Solo permitir si el movimiento está finalizado
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isRunning, movementFinalized, seconds, movimientoId, locomotora]);

  // Cargar detalles del movimiento
  const cargarDetallesMovimiento = useCallback(async () => {
    setLoadingDetalles(true);
    try {
      console.log('🔍 Cargando detalles para movimiento:', movimientoId);
      
      // ← PRIMERO: Intentar desde AsyncStorage (datos guardados desde Maquinista)
      try {
        const savedData = await AsyncStorage.getItem(`movimiento_info_${movimientoId}`);
        if (savedData) {
          console.log('📦 Datos encontrados en AsyncStorage:', savedData);
          const movData = JSON.parse(savedData);
          
          // Si los datos ya están transformados, usarlos directamente
          if (movData.cliente && movData.viaOrigen) {
            console.log('✅ Usando datos ya transformados desde AsyncStorage');
            console.log('📋 Datos que se van a mostrar:', JSON.stringify(movData, null, 2));
            setMovimientoDetalle(movData);
            setLoadingDetalles(false);
            return;
          } else {
            // Si son datos en bruto, transformarlos
            console.log('🔄 Transformando datos en bruto desde AsyncStorage');
            const transformedData = transformMovementData(movData);
            console.log('📋 Datos transformados:', JSON.stringify(transformedData, null, 2));
            setMovimientoDetalle(transformedData);
            
            // Guardar los datos transformados para próximas veces
            await AsyncStorage.setItem(
              `movimiento_info_${movimientoId}`,
              JSON.stringify(transformedData)
            );
            setLoadingDetalles(false);
            return;
          }
        }
      } catch (storageError) {
        console.log('⚠️ Error leyendo AsyncStorage:', storageError);
      }
      
      // ← SEGUNDO: Si no hay datos guardados, consultar la API
      console.log('🌐 Consultando API para obtener detalles...');
      const detalles = await obtenerDetallesMovimiento(movimientoId, locomotora);
      if (detalles) {
        console.log('✅ Detalles obtenidos de la API:', JSON.stringify(detalles, null, 2));
        setMovimientoDetalle(detalles);
        
        // Guardar los datos transformados en AsyncStorage
        try {
          await AsyncStorage.setItem(
            `movimiento_info_${movimientoId}`,
            JSON.stringify(detalles)
          );
          console.log('💾 Detalles guardados en AsyncStorage');
        } catch (saveError) {
          console.error('❌ Error guardando en AsyncStorage:', saveError);
        }
      } else {
        console.log('❌ No se pudieron obtener detalles de la API');
      }
    } catch (error) {
      console.error('❌ Error general cargando detalles:', error);
    } finally {
      setLoadingDetalles(false);
    }
  }, [movimientoId, locomotora]);

  // ← NAVEGACIÓN MEJORADA CON LIMPIEZA COMPLETA
  const navigateToMaquinista = useCallback(async () => {
    if (navigationAttemptedRef.current) return;
    navigationAttemptedRef.current = true;
    
    console.log('🚀 Navegando a Maquinista después de finalizar movimiento...');
    
    // ← LIMPIAR COMPLETAMENTE TODOS LOS DATOS ANTES DE NAVEGAR
    await cleanupAllMovementData(movimientoId);
    
    try {
      // ← USAR reset PARA LIMPIAR COMPLETAMENTE LA PILA DE NAVEGACIÓN
      navigation.reset({
        index: 0,
        routes: [{ name: 'Maquinista' }],
      });
      return;
    } catch (error) {
      console.error('Error con reset, intentando replace:', error);
      try {
        navigation.replace('Maquinista');
      } catch (replaceError) {
        console.error('Error con replace:', replaceError);
        navigation.navigate('Maquinista');
      }
    }
  }, [navigation, movimientoId]);

  // Solicitar permisos de notificación
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Las notificaciones son necesarias para el funcionamiento del cronómetro en segundo plano.'
        );
      }
    })();
  }, []);

  // Registrar la tarea en segundo plano
  const registerBackgroundTask = async () => {
    try {
      const isAvailable = await BackgroundFetch.getStatusAsync()
        .then(() => true)
        .catch(() => false);
      
      if (isAvailable) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
          minimumInterval: 15,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    } catch (err) {
      // No mostrar error
    }
  };

  // Inicializar datos del cronómetro en el almacenamiento
  const initializeTimerData = async () => {
    const now = new Date().getTime();
    startTimeRef.current = now;
    
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
        
        if (timeData.movimientoId === movimientoId) {
          startTimeRef.current = timeData.startTime;
          setIsRunning(timeData.isRunning);
          
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - timeData.startTime) / 1000);
          setSeconds(elapsedSeconds);
        } else {
          await initializeTimerData();
        }
      } else {
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
          updateTimerNotification(elapsedSeconds, movimientoId, locomotora);
        }
      }
    } catch (error) {
      // Ignorar errores
    }
  };

  // Función para renderizar filas de datos
  const renderDataRow = (icon: string, label: string, value: string | number | boolean | null | undefined) => {
    let displayValue = value;
    let isSpecialCase = false;
    
    if (value === null || value === undefined || value === 'N/A' || value === 'Sin dato') {
      displayValue = 'No especificado';
      isSpecialCase = true;
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Sí' : 'No';
    } else if (value === 'Sin especificar' || value === 'Cliente no especificado' || value === 'Origen no especificado') {
      isSpecialCase = true;
    }
    
    return (
      <View style={styles.dataRow}>
        <View style={styles.labelContainer}>
          <FontAwesome5
            name={icon}
            size={16}
            color={isSpecialCase ? COLORS.WARNING : COLORS.PRIMARY_RED}
            style={styles.labelIcon}
          />
          <Text style={styles.dataLabel}>{label}</Text>
        </View>
        <Text 
          style={[
            styles.dataValue, 
            isSpecialCase ? styles.dataValueNA : null
          ]}
        >
          {displayValue}
        </Text>
      </View>
    );
  };

  // Inicialización
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    Promise.all([
      loadTimerFromStorage(),
      cargarDetallesMovimiento()
    ]).then(() => {
      registerBackgroundTask();
      showInitialNotification();
    });
    
    return () => {
      subscription.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Manejar cronómetro
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    const backgroundSync = setInterval(async () => {
      if (isRunning && appState !== 'active') {
        await syncTimerWithStorage();
      }
    }, 5000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      clearInterval(backgroundSync);
    };
  }, [isRunning, appState]);

  // Actualizar notificación
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

  // ← FUNCIÓN MEJORADA PARA FINALIZAR EL MOVIMIENTO
  const finalizarMovimiento = useCallback(async () => {
    if (processingFinalization) return;
    setProcessingFinalization(true);
    
    try {
      console.log('🏁 Iniciando finalización del movimiento...');
      
      // 1. Detener el cronómetro
      setIsRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      // 2. Comunicar finalización al backend
      const exito = await finalizarMovimientoEnBackend(movimientoId);
      
      // 3. Marcar como finalizado (permitir navegación)
      setMovementFinalized(true);
      
      // 4. Limpiar completamente todos los datos
      await cleanupAllMovementData(movimientoId);
      
      console.log('✅ Finalización completada, éxito del backend:', exito);
      return exito;
      
    } catch (error) {
      console.error('❌ Error en finalización:', error);
      return false;
    } finally {
      setProcessingFinalization(false);
    }
  }, [movimientoId, processingFinalization]);

  // ← FUNCIÓN MEJORADA PARA CONFIRMAR LA ACCIÓN
  const handleConfirm = useCallback(async () => {
    if (!selectedReason) {
      setShowConfirmation(false);
      return;
    }
    
    setShowConfirmation(false);
    
    try {
      const tiempoTotal = formatTime(seconds);
      
      if (selectedReason === 'TERMINADO') {
        const exito = await finalizarMovimiento();
        
        Alert.alert(
          `✅ Movimiento ${selectedReason}`,
          `Movimiento completado exitosamente\n⏱️ Tiempo total: ${tiempoTotal}${!exito ? '\n⚠️ (Advertencia: Error en servidor)' : '\n🌐 Sincronizado con servidor'}`,
          [
            {
              text: 'Continuar',
              onPress: () => {
                console.log('Usuario confirmó finalización, navegando...');
                navigateToMaquinista();
              }
            }
          ],
          { cancelable: false }
        );
      } else if (selectedReason === 'INCIDENTE') {
        // ← PARA INCIDENTE: Navegar a pantalla de Incidente (NO finalizar)
        console.log('🚨 Usuario seleccionó incidente, navegando a pantalla de reporte...');
        
        // NO detener el cronómetro - sigue corriendo
        // NO finalizar el movimiento - continúa activo
        // Navegar a pantalla de Incidente
        navigation.navigate('Incidente', {
          movimientoId: movimientoId,
          locomotora: locomotora,
          tiempoTranscurrido: tiempoTotal
        });
      }
    } catch (error) {
      console.error('❌ Error en handleConfirm:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
    }
  }, [selectedReason, seconds, finalizarMovimiento, navigateToMaquinista, movimientoId, locomotora, navigation]);
  
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
              if (isRunning && !movementFinalized) {
                Alert.alert(
                  "🔒 Movimiento Bloqueado",
                  "No puedes salir mientras hay un movimiento activo.\n\n✅ Finaliza el movimiento para continuar.",
                  [{ text: "Entendido", style: "default" }],
                  { cancelable: false }
                );
              } else {
                navigateToMaquinista();
              }
            }}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            🚂 Movimiento Activo - Loco #{locomotora}
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
              <Text style={styles.timerLabel}>⏱️ Tiempo transcurrido:</Text>
              <Text style={styles.timer}>{formatTime(seconds)}</Text>
              <View style={styles.runningIndicator}>
                <View style={[styles.pulsingDot, styles.pulsing]} />
                <Text style={styles.runningText}>
                  🔄 En progreso (bloqueado hasta finalizar)
                </Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>🆔 ID del Movimiento:</Text>
              <Text style={styles.infoValue}>{movimientoId}</Text>
            </View>
            
            <View style={styles.noteContainer}>
              <FontAwesome5 name="lock" size={14} color={COLORS.PRIMARY_RED} />
              <Text style={styles.noteText}>
                🔒 IMPORTANTE: No puedes salir de la aplicación hasta completar este movimiento. 
                El cronómetro continuará funcionando en segundo plano.
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
                {processingFinalization ? '⏳ PROCESANDO...' : '🛑 FINALIZAR MOVIMIENTO'}
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
                <Text style={styles.cardTitle}>📋 Detalles del Movimiento</Text>
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
                  {renderDataRow('industry', 'Chimenea', movimientoDetalle.posicionChimenea)}
                  {renderDataRow('map-pin', 'Vía Origen', movimientoDetalle.viaOrigen)}
                  {renderDataRow('map-marker-alt', 'Vía Destino', movimientoDetalle.viaDestino || 'Sin destino especificado')}
                  {renderDataRow('tint', 'Lavado', movimientoDetalle.lavado)}
                  {renderDataRow('cog', 'Torno', movimientoDetalle.torno)}

                  <View style={styles.dateContainer}>
                    <FontAwesome5 name="clock" size={14} color={COLORS.NEUTRAL_700} />
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
                  
                  {/* ← BOTÓN DE DEBUG PARA VER QUÉ DATOS HAY EN ASYNCSTORAGE */}
                  <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: COLORS.WARNING, marginTop: 8 }]}
                    onPress={async () => {
                      try {
                        const keys = await AsyncStorage.getAllKeys();
                        const movementKeys = keys.filter(key => key.includes('movimiento'));
                        const data = await AsyncStorage.multiGet(movementKeys);
                        
                        let debugInfo = `🔍 Datos en AsyncStorage:\n\n`;
                        data.forEach(([key, value]) => {
                          debugInfo += `${key}:\n${value}\n\n`;
                        });
                        
                        Alert.alert(
                          'Debug Info', 
                          debugInfo,
                          [
                            { text: 'Copiar', onPress: () => console.log(debugInfo) },
                            { text: 'OK' }
                          ]
                        );
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo obtener info de debug');
                      }
                    }}
                  >
                    <Text style={styles.retryButtonText}>Debug Info</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Modales (mantener los mismos pero con emojis) */}
        <Modal
          visible={showAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseAlert}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🛑 Motivo de finalización</Text>
              <Text style={styles.modalSubtitle}>Seleccione una opción:</Text>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.successButton]}
                  onPress={() => handleReasonSelect('TERMINADO')}
                >
                  <FontAwesome5 name="check-circle" size={24} color={COLORS.WHITE} />
                  <Text style={styles.optionText}>✅ TERMINADO</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.optionButton, styles.warningButton]}
                  onPress={() => handleReasonSelect('INCIDENTE')}
                >
                  <FontAwesome5 name="exclamation-triangle" size={24} color={COLORS.WHITE} />
                  <Text style={styles.optionText}>⚠️ INCIDENTE</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseAlert}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>✋ Confirmar acción</Text>
              <Text style={styles.confirmationText}>
                ¿Está seguro que desea marcar este movimiento como{' '}
                <Text style={styles.highlightText}>{selectedReason}</Text>?
                {'\n\n🔓 Esto desbloqueará la navegación.'}
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
                    {processingFinalization ? '⏳ Procesando...' : '✅ Confirmar'}
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

// Estilos (mantener los mismos del original)
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