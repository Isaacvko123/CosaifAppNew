import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  SafeAreaView,
  Animated,
  AccessibilityInfo,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import MovimientosTable, { Movement } from './MovimientosTable';
import Tabs from './Tabs';
import NewMovementForm from './Formulario/NewMovementForm';
import NetInfo from '@react-native-community/netinfo';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// API and helper constants
const API_BASE = 'http://10.10.10.6:3000';
const todayISO = () => new Date().toISOString().slice(0, 10);
const ITEMS_PER_PAGE = 50;

// Color palette
const COLORS = {
  bg: '#F0F4F8',
  bgDark: '#E1E8EF',
  card: '#FFFFFF',
  border: '#DDD',
  borderFocus: '#BBB',
  primary: '#2D6A4F',
  primaryLight: '#4D8D6E',
  primaryDark: '#1b4d3e',
  text: '#333333',
  textLight: '#666666',
  textDark: '#111111',
  red: '#E74C3C',
  redDark: '#C0392B',
  green: '#2ECC71',
  yellow: '#F1C40F',
  shadow: 'rgba(0,0,0,0.1)',
  backdrop: 'rgba(0,0,0,0.5)',
  disabled: '#CCCCCC',
};

interface Option {
  id: number;
  nombre: string;
}

interface User {
  id: number;
  nombre: string;
  rol: string;
  token: string;
  localidadId?: number;
  empresaId?: number;
  empresa?: {
    id: number;
    nombre: string;
  };
}

type TabType = 'Actuales' | 'Pasados';
type DropdownType = 'loc' | 'emp' | null;
type CalendarType = 'from' | 'to' | null;

// A separate component for the NewMovementForm wrapper
// This prevents hooks rendering inconsistency issues
const MovementFormWrapper = ({ onFinish }: { onFinish: () => void }) => {
  return <NewMovementForm onFinish={onFinish} />;
};

export default function Movimientos() {
  // Core state
  const [tab, setTab] = useState<TabType>('Actuales');
  const [allMovements, setAllMovements] = useState<Movement[]>([]);
  const [displayedMovements, setDisplayedMovements] = useState<Movement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // User & role state
  const [user, setUser] = useState<User | null>(null);
  const [isSup, setIsSup] = useState(false);
  const [isCli, setIsCli] = useState(false);
  
  // Filter state
  const [locOpts, setLocOpts] = useState<Option[]>([]);
  const [empOpts, setEmpOpts] = useState<Option[]>([]);
  const [locId, setLocId] = useState<number | null>(null);
  const [empId, setEmpId] = useState<number | null>(null);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  
  // UI state
  const [drop, setDrop] = useState<DropdownType>(null);
  const [cal, setCal] = useState<CalendarType>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusAnimation] = useState(new Animated.Value(0));
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Get label for dropdowns
  const labelFor = useCallback(
    (opts: Option[], id: number | null) => 
      id == null ? 'Todas' : opts.find((o) => o.id === id)?.nombre ?? '—',
    []
  );

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      if (!state.isConnected) {
        showStatusMessage('Sin conexión - Mostrando datos almacenados');
      } else if (statusMessage === 'Sin conexión - Mostrando datos almacenados') {
        showStatusMessage('Conexión restaurada', 3000);
      }
    });
    
    return () => unsubscribe();
  }, [statusMessage]);

  // Show temporary status messages
  const showStatusMessage = useCallback((message: string, duration = 0) => {
    setStatusMessage(message);
    
    // Animate in
    Animated.timing(statusAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto-hide after duration if specified
    if (duration > 0) {
      setTimeout(() => {
        Animated.timing(statusAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setStatusMessage(null));
      }, duration);
    }
  }, [statusAnimation]);
  
  // Apply all filters and pagination
  const applyFiltersAndPagination = useCallback((movements: Movement[]) => {
    if (!movements || movements.length === 0) {
      setDisplayedMovements([]);
      setTotalPages(1);
      return;
    }
    
    // Filter by tab - Actuales (not finalized) vs Pasados (finalized)
    let filtered = tab === 'Actuales'
      ? movements.filter(m => !m.finalizado)
      : movements.filter(m => m.finalizado);
    
    // Apply supervisor filters if applicable
    if (isSup) {
      if (locId != null) filtered = filtered.filter(m => m.localidadId === locId);
      if (empId != null) filtered = filtered.filter(m => m.empresaId === empId);
    }
    
    // Apply date filters
    if (from) {
      const f = new Date(from);
      filtered = filtered.filter(m => {
        const date = new Date(m.fechaInicio || m.fechaSolicitud);
        return !isNaN(date.getTime()) && date >= f;
      });
    }
    
    if (to) {
      const t = new Date(to);
      filtered = filtered.filter(m => {
        const date = new Date(m.fechaFin || m.fechaInicio || m.fechaSolicitud);
        return !isNaN(date.getTime()) && date <= t;
      });
    }
    
    // Calculate total pages
    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    setTotalPages(Math.max(1, total));
    
    // Apply pagination
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filtered.slice(start, start + ITEMS_PER_PAGE);
    
    setDisplayedMovements(paginatedData);
  }, [tab, isSup, locId, empId, from, to, currentPage]);

  // Fetch and cache locations
  const fetchAndCacheLocations = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/localidades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch locations');
      
      const locs: any[] = await response.json();
      const locations = locs.map((l) => ({ id: l.id, nombre: l.nombre }));
      
      setLocOpts(locations);
      await AsyncStorage.setItem('cached_locations', JSON.stringify(locations));
      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      
      const cachedData = await AsyncStorage.getItem('cached_locations');
      if (cachedData) {
        const locations = JSON.parse(cachedData);
        setLocOpts(locations);
        return locations;
      }
      return [];
    }
  }, []);

  // Fetch and cache companies
  const fetchAndCacheCompanies = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/empresas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch companies');
      
      const emps: any[] = await response.json();
      const companies = emps.map((e) => ({ id: e.id, nombre: e.nombre }));
      
      setEmpOpts(companies);
      await AsyncStorage.setItem('cached_companies', JSON.stringify(companies));
      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      
      const cachedData = await AsyncStorage.getItem('cached_companies');
      if (cachedData) {
        const companies = JSON.parse(cachedData);
        setEmpOpts(companies);
        return companies;
      }
      return [];
    }
  }, []);

  // Load from cache
  const loadFromCache = useCallback(async () => {
    try {
      showStatusMessage('Sin conexión - Cargando datos almacenados');
      
      const [cachedLocations, cachedCompanies, cachedMovements] = await Promise.all([
        AsyncStorage.getItem('cached_locations'),
        AsyncStorage.getItem('cached_companies'),
        AsyncStorage.getItem('cached_movements')
      ]);
      
      if (cachedLocations) setLocOpts(JSON.parse(cachedLocations));
      if (cachedCompanies) setEmpOpts(JSON.parse(cachedCompanies));
      if (cachedMovements) {
        const movements = JSON.parse(cachedMovements);
        setAllMovements(movements);
        applyFiltersAndPagination(movements);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading from cache:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudieron cargar los datos almacenados');
    }
  }, [applyFiltersAndPagination, showStatusMessage]);

  // Load user data and initial options
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load from AsyncStorage
        const [uStr, token] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
        ]);
        
        if (!uStr || !token) throw new Error('No session data found');
        
        const u = JSON.parse(uStr);
        const userData = { ...u, token };
        
        setUser(userData);
        setIsSup(u.rol === 'SUPERVISOR' && u.empresa?.nombre.toLowerCase() === 'vianko');
        setIsCli(u.rol === 'CLIENTE');
        
        // Cache locations for offline use
        await fetchAndCacheLocations(token);
        
        // Cache companies if supervisor
        if (u.rol === 'SUPERVISOR' && u.empresa?.nombre.toLowerCase() === 'vianko') {
          await fetchAndCacheCompanies(token);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
        
        // Try loading from cache if offline
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          loadFromCache();
          return;
        }
        
        Alert.alert(
          'Error de sesión',
          'No se pudo cargar la información de usuario. ¿Desea intentar nuevamente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reintentar', onPress: loadUserData }
          ]
        );
      }
    };
    
    loadUserData();
  }, [fetchAndCacheLocations, fetchAndCacheCompanies, loadFromCache]);

  // Load movements based on filters and tab
  useEffect(() => {
    const loadMovements = async () => {
      if (!user) return;
      
      try {
        if (!refreshing) setLoading(true);
        
        const { token, localidadId: uLoc, empresaId: uEmp } = user;
        const selectedLocal = locId != null ? locId : uLoc;
        const selectedEmp = empId != null ? empId : uEmp;
        
        // We need to get all movements first, then filter by finalizado status on client-side
        // for Actuales (finalizado = false) and Pasados (finalizado = true)
        const ep = isSup
          ? '/movimientos'
          : `/movimientos/empresa/${selectedEmp}/localidad/${selectedLocal}`;
        
        // Fetch movements
        const response = await fetch(`${API_BASE}${ep}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch movements');
        
        const raw: any[] = await response.json();
        
        // Map API data to Movement type
        const movements: Movement[] = raw.map((r) => ({
          id: r.id,
          locomotora: r.locomotiveNumber,
          localidadId: r.localidadId,
          localidadNombre: r.localidad?.nombre,
          localidadEstado: r.localidad?.estado,
          viaOrigen: r.viaOrigen.numero,
          viaDestino: r.viaDestino?.numero || 0,
          tipoAccion: r.tipoMovimiento,
          prioridad: r.prioridad,
          tipoMovimiento: r.tipoMovimiento,
          clienteId: r.clienteId,
          supervisorId: r.supervisorId,
          coordinadorId: r.coordinadorId,
          operadorId: r.operadorId,
          maquinistaId: r.maquinistaId,
          empresaId: r.empresaId,
          fechaSolicitud: r.fechaSolicitud,
          fechaInicio: r.fechaInicio,
          fechaFin: r.fechaFin,
          estado: r.estado,
          instrucciones: r.instrucciones,
          incidenteGlobal: r.incidenteGlobal,
          finalizado: r.finalizado,
          lavado: r.lavado,
          torno: r.torno,
          posicionCabina: r.posicionCabina,
          posicionChimenea: r.posicionChimenea,
          direccionEmpuje: r.direccionEmpuje,
          comentarioPostergacion: r.comentarioPostergacion,
          nuevaFechaPostergacion: r.nuevaFechaPostergacion,
        }));
        
        // Cache all movements
        setAllMovements(movements);
        await AsyncStorage.setItem('cached_movements', JSON.stringify(movements));
        
        // Apply filters and pagination
        applyFiltersAndPagination(movements);
        
        if (refreshing) {
          showStatusMessage('Datos actualizados', 2000);
        }
      } catch (error) {
        console.error('Error loading movements:', error);
        
        // Try loading from cache if offline
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          const cachedMovements = await AsyncStorage.getItem('cached_movements');
          if (cachedMovements) {
            const movements = JSON.parse(cachedMovements);
            setAllMovements(movements);
            applyFiltersAndPagination(movements);
            showStatusMessage('Mostrando datos almacenados');
          } else {
            showStatusMessage('No hay datos disponibles sin conexión');
          }
        } else if (refreshing) {
          Alert.alert('Error', 'No se pudieron actualizar los movimientos');
        } else {
          Alert.alert('Error', 'No se pudieron cargar los movimientos');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    loadMovements();
  }, [user, isSup, locId, empId, from, to, refreshing, applyFiltersAndPagination, showStatusMessage]);

  // Apply filters and pagination when tab or page changes
  useEffect(() => {
    if (allMovements.length > 0) {
      applyFiltersAndPagination(allMovements);
    }
  }, [allMovements, tab, currentPage, applyFiltersAndPagination]);

  // Handle refreshing the data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLocId(null);
    setEmpId(null);
    setFrom('');
    setTo('');
    setCurrentPage(1);
    
    // Announce for accessibility
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility('Filtros eliminados');
    }
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((newTab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTab(newTab as TabType);
    setCurrentPage(1); // Reset to first page on tab change
  }, []);

  // Toggle new movement form
  const toggleForm = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(prev => !prev);
  }, []);

  // Handle form finish
  const handleFormFinish = useCallback(() => {
    setShowForm(false);
    setRefreshing(true);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((direction: 'prev' | 'next') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setCurrentPage(current => {
      if (direction === 'prev') {
        return Math.max(1, current - 1);
      } else {
        return Math.min(totalPages, current + 1);
      }
    });
    
    // Announce for accessibility
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(
        `Página ${direction === 'prev' ? currentPage - 1 : currentPage + 1} de ${totalPages}`
      );
    }
  }, [currentPage, totalPages]);

  // Handle row selection
  const handleRowPress = useCallback((item: Movement) => {
    setSelectedMovement(item);
    setShowDetailModal(true);
    
    // Announce for accessibility
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(
        `Detalles del movimiento ${item.id}`
      );
    }
  }, []);

  // Format detail information
  const formatDetailInfo = useCallback((item: Movement | null) => {
    if (!item) return null;
    
    const formatBoolean = (value: boolean) => (value ? 'Sí' : 'No');
    const formatDate = (date: string | null) => date || '—';
    
    return {
      generalInfo: [
        { label: 'ID', value: item.id },
        { label: 'Locomotora', value: item.locomotora },
        { label: 'Estado', value: item.estado },
        { label: 'Prioridad', value: item.prioridad },
        { label: 'Tipo Acción', value: item.tipoAccion },
        { label: 'Tipo Movimiento', value: item.tipoMovimiento },
      ],
      locationInfo: [
        { label: 'Localidad', value: item.localidadNombre || '—' },
        { label: 'Estado Localidad', value: item.localidadEstado || '—' },
        { label: 'Vía Origen', value: item.viaOrigen },
        { label: 'Vía Destino', value: item.viaDestino },
      ],
      personnelInfo: [
        { label: 'Cliente', value: item.clienteId },
        { label: 'Empresa', value: item.empresaId },
        { label: 'Supervisor', value: item.supervisorId || '—' },
        { label: 'Coordinador', value: item.coordinadorId || '—' },
        { label: 'Operador', value: item.operadorId || '—' },
        { label: 'Maquinista', value: item.maquinistaId || '—' },
      ],
      datesInfo: [
        { label: 'Fecha Solicitud', value: formatDate(item.fechaSolicitud) },
        { label: 'Fecha Inicio', value: formatDate(item.fechaInicio) },
        { label: 'Fecha Fin', value: formatDate(item.fechaFin) },
        { label: 'Nueva Fecha', value: formatDate(item.nuevaFechaPostergacion) },
      ],
      configInfo: [
        { label: 'Posición Cabina', value: item.posicionCabina },
        { label: 'Posición Chimenea', value: item.posicionChimenea },
        { label: 'Dirección Empuje', value: item.direccionEmpuje },
        { label: 'Finalizado', value: formatBoolean(item.finalizado) },
        { label: 'Incidente Global', value: formatBoolean(item.incidenteGlobal) },
        { label: 'Lavado', value: formatBoolean(item.lavado) },
        { label: 'Torno', value: formatBoolean(item.torno) },
      ],
    };
  }, []);
  
  // Memorized badges for tabs
  const tabBadges = useMemo(() => {
    const actualCount = allMovements.filter(m => !m.finalizado).length;
    return actualCount > 0 ? { 'Actuales': actualCount } : {};
  }, [allMovements]);

  // Render filter section
  const renderFilters = useMemo(() => {
    if (!isSup && !isCli) return null;
    
    return (
      <View style={styles.filterBox}>
        {isCli ? (
          <View style={styles.selectWide}>
            <Text style={styles.filterLabel}>Empresa</Text>
            <View style={styles.selectBox}>
              <Text style={styles.selectText}>{user?.empresa?.nombre}</Text>
            </View>
          </View>
        ) : (
          <Pressable 
            style={styles.selectWide} 
            onPress={() => setDrop('emp')}
            disabled={isOffline}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar empresa"
            accessibilityHint="Abre un menú para filtrar por empresa"
          >
            <Text style={styles.filterLabel}>Empresa</Text>
            <View style={[
              styles.selectBox,
              isOffline && styles.selectDisabled
            ]}>
              <Text style={[
                styles.selectText,
                isOffline && styles.selectTextDisabled
              ]}>
                {labelFor(empOpts, empId)}
              </Text>
              {!isOffline && (
                <Feather name="chevron-down" size={16} color={COLORS.text} />
              )}
            </View>
          </Pressable>
        )}

        <Pressable 
          style={styles.selectWide} 
          onPress={() => setDrop('loc')}
          disabled={isOffline}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar localidad"
          accessibilityHint="Abre un menú para filtrar por localidad"
        >
          <Text style={styles.filterLabel}>Localidad</Text>
          <View style={[
            styles.selectBox,
            isOffline && styles.selectDisabled
          ]}>
            <Text style={[
              styles.selectText,
              isOffline && styles.selectTextDisabled
            ]}>
              {labelFor(locOpts, locId)}
            </Text>
            {!isOffline && (
              <Feather name="chevron-down" size={16} color={COLORS.text} />
            )}
          </View>
        </Pressable>

        <Pressable 
          style={styles.selectNarrow} 
          onPress={() => setCal('from')}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar fecha desde"
          accessibilityHint="Abre un calendario para filtrar desde una fecha"
        >
          <Text style={styles.filterLabel}>Desde</Text>
          <View style={styles.selectBox}>
            <Text style={styles.selectText}>{from || '----'}</Text>
            <Feather name="calendar" size={16} color={COLORS.text} />
          </View>
        </Pressable>
        
        <Pressable 
          style={styles.selectNarrow} 
          onPress={() => setCal('to')}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar fecha hasta"
          accessibilityHint="Abre un calendario para filtrar hasta una fecha"
        >
          <Text style={styles.filterLabel}>Hasta</Text>
          <View style={styles.selectBox}>
            <Text style={styles.selectText}>{to || '----'}</Text>
            <Feather name="calendar" size={16} color={COLORS.text} />
          </View>
        </Pressable>

        <TouchableOpacity 
          style={styles.clearBtn} 
          onPress={clearFilters}
          accessibilityRole="button"
          accessibilityLabel="Limpiar filtros"
        >
          <Text style={styles.clearTxt}>Limpiar</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isSup, isCli, user, empOpts, locOpts, empId, locId, from, to, labelFor, clearFilters, isOffline]);

  // Render pagination controls
  const renderPagination = useMemo(() => {
    if (totalPages <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity 
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled
          ]} 
          onPress={() => handlePageChange('prev')}
          disabled={currentPage === 1}
          accessibilityRole="button"
          accessibilityLabel="Página anterior"
        >
          <Feather 
            name="chevron-left" 
            size={22} 
            color={currentPage === 1 ? COLORS.textLight : COLORS.text} 
          />
          <Text style={[
            styles.paginationButtonText,
            currentPage === 1 && styles.paginationButtonTextDisabled
          ]}>
            Anterior
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.paginationInfo}>
          Página {currentPage} de {totalPages}
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled
          ]} 
          onPress={() => handlePageChange('next')}
          disabled={currentPage === totalPages}
          accessibilityRole="button"
          accessibilityLabel="Página siguiente"
        >
          <Text style={[
            styles.paginationButtonText,
            currentPage === totalPages && styles.paginationButtonTextDisabled
          ]}>
            Siguiente
          </Text>
          <Feather 
            name="chevron-right" 
            size={22} 
            color={currentPage === totalPages ? COLORS.textLight : COLORS.text} 
          />
        </TouchableOpacity>
      </View>
    );
  }, [currentPage, totalPages, handlePageChange]);
  
  // ListHeaderComponent for the dropdown FlatList
  const ListHeaderOption = useCallback(({ type }: { type: DropdownType }) => {
    return (
      <TouchableOpacity
        style={styles.optionItem}
        onPress={() => {
          if (type === 'loc') setLocId(null);
          else setEmpId(null);
          setDrop(null);
          
          // Announce selection for accessibility
          AccessibilityInfo.announceForAccessibility(
            `${type === 'loc' ? 'Localidad' : 'Empresa'}: Todas`
          );
        }}
        accessibilityRole="button"
        accessibilityLabel="Todas"
      >
        <Text style={[styles.optionTxt, styles.optionAll]}>Todas</Text>
      </TouchableOpacity>
    );
  }, []);
  
  // Render the main interface
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.container}>
        {/* Use MovementFormWrapper to avoid hook errors */}
        {showForm ? (
          <MovementFormWrapper onFinish={handleFormFinish} />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
                title="Actualizando datos..."
                titleColor={COLORS.text}
              />
            }
          >
            <Text style={styles.title}>
              {tab === 'Actuales' ? 'Movimientos Actuales' : 'Historial de Movimientos'}
            </Text>
            
            <Tabs 
              tabs={['Actuales', 'Pasados']} 
              activeTab={tab} 
              onTabPress={handleTabChange}
              badges={tabBadges}
            />
            
            {renderFilters}
            
            {/* Status message */}
            {statusMessage && (
              <Animated.View 
                style={[
                  styles.statusContainer,
                  {
                    opacity: statusAnimation,
                    transform: [{ 
                      translateY: statusAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0]
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.statusText}>{statusMessage}</Text>
              </Animated.View>
            )}
            
            <View style={styles.tableWrap}>
              <MovimientosTable 
                data={displayedMovements} 
                loading={loading} 
                onRowPress={handleRowPress}
                emptyStateText={
                  isOffline 
                    ? "No hay datos disponibles sin conexión" 
                    : tab === 'Actuales'
                      ? "No hay movimientos activos para mostrar"
                      : "No hay movimientos finalizados para mostrar"
                }
              />
            </View>
            
            {/* Pagination controls */}
            {renderPagination}
            
            {/* New Movement Button - only shown in 'Actuales' tab */}
            {tab === 'Actuales' && (
              <TouchableOpacity 
                style={[
                  styles.btn,
                  isOffline && styles.btnDisabled
                ]} 
                onPress={toggleForm}
                disabled={isOffline}
                accessibilityRole="button"
                accessibilityLabel="Nuevo movimiento"
              >
                <Text style={styles.btnTx}>
                  {isOffline ? 'Sin conexión' : '+ Nuevo Movimiento'}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Dropdown modal for location/company selection */}
            <Modal 
              transparent 
              visible={drop !== null} 
              animationType="fade" 
              onRequestClose={() => setDrop(null)}
              statusBarTranslucent
            >
              <Pressable 
                style={styles.backdrop} 
                onPress={() => setDrop(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar selección"
              />
              <SafeAreaView style={styles.modalContainer} pointerEvents="box-none">
                <View style={styles.modalWrap}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {drop === 'loc' ? 'Seleccionar Localidad' : 'Seleccionar Empresa'}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setDrop(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar"
                    >
                      <Feather name="x" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={drop === 'loc' ? locOpts : empOpts}
                    keyExtractor={(i) => i.id.toString()}
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                    windowSize={5}
                    ListHeaderComponent={() => drop !== null ? <ListHeaderOption type={drop} /> : null}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => {
                          if (drop === 'loc') setLocId(item.id);
                          else setEmpId(item.id);
                          setDrop(null);
                          
                          // Announce selection for accessibility
                          AccessibilityInfo.announceForAccessibility(
                            `${drop === 'loc' ? 'Localidad' : 'Empresa'}: ${item.nombre}`
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={item.nombre}
                      >
                        <Text style={styles.optionTxt}>{item.nombre}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyList}>
                        <Text style={styles.emptyListText}>
                          No hay opciones disponibles
                        </Text>
                      </View>
                    )}
                  />
                </View>
              </SafeAreaView>
            </Modal>
            
            {/* Calendar modal for date selection */}
            <Modal 
              transparent 
              visible={cal !== null} 
              animationType="fade" 
              onRequestClose={() => setCal(null)}
              statusBarTranslucent
            >
              <Pressable 
                style={styles.backdrop} 
                onPress={() => setCal(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar calendario"
              />
              <SafeAreaView style={styles.modalContainer} pointerEvents="box-none">
                <View style={styles.calendarWrapper}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {cal === 'from' ? 'Fecha Desde' : 'Fecha Hasta'}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setCal(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar"
                    >
                      <Feather name="x" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <Calendar
                    initialDate={cal === 'from' ? from || todayISO() : to || todayISO()}
                    onDayPress={(d: DateData) => {
                      cal === 'from' ? setFrom(d.dateString) : setTo(d.dateString);
                      setCal(null);
                      
                      // Announce selection for accessibility
                      AccessibilityInfo.announceForAccessibility(
                        `${cal === 'from' ? 'Fecha desde' : 'Fecha hasta'}: ${d.dateString}`
                      );
                    }}
                    markedDates={{
                      [cal === 'from' ? from || todayISO() : to || todayISO()]: { selected: true },
                    }}
                    theme={{
                      selectedDayBackgroundColor: COLORS.primary,
                      todayTextColor: COLORS.primary,
                      arrowColor: COLORS.primary,
                      textDayFontSize: 16,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 14,
                    }}
                    enableSwipeMonths={true}
                  />
                  
                  {(cal === 'from' && from) || (cal === 'to' && to) ? (
                    <TouchableOpacity 
                      style={styles.clearDateBtn}
                      onPress={() => {
                        cal === 'from' ? setFrom('') : setTo('');
                        setCal(null);
                        
                        // Announce for accessibility
                        AccessibilityInfo.announceForAccessibility(
                          `${cal === 'from' ? 'Fecha desde' : 'Fecha hasta'} eliminada`
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar fecha"
                    >
                      <Feather name="trash-2" size={16} color={COLORS.red} />
                      <Text style={styles.clearDateText}>Eliminar fecha</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SafeAreaView>
            </Modal>
            
            {/* Detail modal */}
            <Modal
              transparent
              visible={showDetailModal}
              animationType="fade"
              onRequestClose={() => setShowDetailModal(false)}
              statusBarTranslucent
            >
              <Pressable 
                style={styles.backdrop} 
                onPress={() => setShowDetailModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar detalles"
              />
              <SafeAreaView style={styles.modalContainer} pointerEvents="box-none">
                <View style={styles.detailModalWrap}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Detalles del Movimiento #{selectedMovement?.id}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setShowDetailModal(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar"
                    >
                      <Feather name="x" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedMovement && (
                    <ScrollView 
                      style={styles.detailScrollView}
                      contentContainerStyle={styles.detailContentContainer}
                    >
                      {/* Instrucciones Section */}
                      {selectedMovement.instrucciones && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Instrucciones</Text>
                          <View style={styles.instructionsBox}>
                            <Text style={styles.instructionsText}>
                              {selectedMovement.instrucciones}
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {/* Sections from formatted info */}
                      {formatDetailInfo(selectedMovement) && (
                        <>
                          {/* General Info Section */}
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Información General</Text>
                            <View style={styles.detailGrid}>
                              {formatDetailInfo(selectedMovement)!.generalInfo.map((item, index) => (
                                <View key={index} style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>{item.label}:</Text>
                                  <Text style={styles.detailValue}>{item.value}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          
                          {/* Location Info Section */}
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Ubicación</Text>
                            <View style={styles.detailGrid}>
                              {formatDetailInfo(selectedMovement)!.locationInfo.map((item, index) => (
                                <View key={index} style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>{item.label}:</Text>
                                  <Text style={styles.detailValue}>{item.value}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          
                          {/* Personnel Info Section */}
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Personal</Text>
                            <View style={styles.detailGrid}>
                              {formatDetailInfo(selectedMovement)!.personnelInfo.map((item, index) => (
                                <View key={index} style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>{item.label}:</Text>
                                  <Text style={styles.detailValue}>{item.value}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          
                          {/* Dates Info Section */}
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Fechas</Text>
                            <View style={styles.detailGrid}>
                              {formatDetailInfo(selectedMovement)!.datesInfo.map((item, index) => (
                                <View key={index} style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>{item.label}:</Text>
                                  <Text style={styles.detailValue}>{item.value}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          
                          {/* Configuration Info Section */}
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Configuración</Text>
                            <View style={styles.detailGrid}>
                              {formatDetailInfo(selectedMovement)!.configInfo.map((item, index) => (
                                <View key={index} style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>{item.label}:</Text>
                                  <Text style={styles.detailValue}>{item.value}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </>
                      )}
                      
                      {/* Comentario Section */}
                      {selectedMovement.comentarioPostergacion && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Comentario de Postergación</Text>
                          <View style={styles.commentBox}>
                            <Text style={styles.commentText}>
                              {selectedMovement.comentarioPostergacion}
                            </Text>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowDetailModal(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar detalles"
                  >
                    <Text style={styles.closeButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Modal>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: COLORS.bg 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: COLORS.primary, 
    textAlign: 'center', 
    marginBottom: 16 
  },
  statusContainer: {
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.card,
    fontWeight: '600',
  },
  filterBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterLabel: { 
    fontSize: 13, 
    color: COLORS.textLight, 
    marginBottom: 4,
    fontWeight: '500',
  },
  selectWide: { 
    width: 130, 
    marginRight: 12, 
    marginBottom: 10 
  },
  selectNarrow: { 
    width: 100, 
    marginRight: 12, 
    marginBottom: 10 
  },
  selectBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectDisabled: {
    backgroundColor: COLORS.bgDark,
    borderColor: COLORS.disabled,
  },
  selectText: { 
    fontSize: 14, 
    color: COLORS.text,
    flex: 1,
  },
  selectTextDisabled: {
    color: COLORS.textLight,
  },
  clearBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 'auto',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearTxt: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  tableWrap: { 
    flex: 1, 
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    marginHorizontal: 4,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paginationButtonTextDisabled: {
    color: COLORS.textLight,
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnDisabled: {
    backgroundColor: COLORS.disabled,
  },
  btnTx: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: COLORS.backdrop 
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  modalWrap: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    maxHeight: '60%',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  optionItem: { 
    padding: 16, 
  },
  optionTxt: { 
    fontSize: 16, 
    color: COLORS.text 
  },
  optionAll: { 
    fontWeight: '700',
    color: COLORS.primary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  calendarWrapper: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearDateText: {
    color: COLORS.red,
    fontWeight: '500',
    marginLeft: 8,
  },
  detailModalWrap: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  detailScrollView: {
    maxHeight: '70%',
  },
  detailContentContainer: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    paddingVertical: 6,
    paddingRight: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.textDark,
    marginTop: 2,
  },
  instructionsBox: {
    backgroundColor: COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  commentBox: {
    backgroundColor: COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.yellow,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    margin: 16,
  },
  closeButtonText: {
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 16,
  },
});