import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import MovimientosTable, { Movement } from './MovimientosTable';
import Tabs from './Tabs';
import NewMovementForm from './Formulario/NewMovementForm';
import NetInfo from '@react-native-community/netinfo';

// Enable LayoutAnimation on Android

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE = 'http://31.97.13.182:3000';
const todayISO = () => new Date().toISOString().slice(0, 10);
const ITEMS_PER_PAGE = 50;
const MAX_CACHED_ITEMS = 200;
const DEBOUNCE_DELAY = 300;

// Enhanced Color palette with gradients
const COLORS = {
  bg: '#F5F7FA',
  bgDark: '#E8ECF0',
  card: '#FFFFFF',
  cardHover: '#FAFBFC',
  border: '#E1E4E8',
  borderFocus: '#4A90E2',
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  primaryDark: '#1B5E3F',
  primaryGradient: ['#2D6A4F', '#52B788'],
  text: '#2C3E50',
  textLight: '#7B8794',
  textDark: '#1A202C',
  red: '#E74C3C',
  redLight: '#FF6B6B',
  redDark: '#C0392B',
  green: '#27AE60',
  greenLight: '#4ADE80',
  yellow: '#F39C12',
  blue: '#3498DB',
  blueLight: '#5DADE2',
  purple: '#9B59B6',
  shadow: 'rgb(0, 0, 0)',
  shadowDark: 'rgb(0, 0, 0)',
  backdrop: 'rgb(0, 0, 0)',
  disabled: '#CBD5E0',
  info: '#3498DB',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
};

// Interfaces
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

// Helper functions
const getCurrentMonthDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString().slice(0, 10),
    end: lastDay.toISOString().slice(0, 10)
  };
};

// Debounce hook for better performance
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized Movement Form Wrapper
const MovementFormWrapper = React.memo(({ onFinish }: { onFinish: () => void }) => {
  return <NewMovementForm onFinish={onFinish} />;
});

// Loading skeleton component for better UX
const LoadingSkeleton = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(5)].map((_, i) => (
      <View key={i} style={styles.skeletonRow}>
        <View style={styles.skeletonCell} />
        <View style={styles.skeletonCell} />
        <View style={styles.skeletonCell} />
        <View style={styles.skeletonCell} />
      </View>
    ))}
  </View>
);

// Enhanced status badge component
const StatusBadge = React.memo(({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'SOLICITADO': return styles.statusSolicitado;
      case 'EN_PROCESO': return styles.statusEnProceso;
      case 'CONCLUIDO': return styles.statusConcluido;
      case 'DETENIDO': return styles.statusDetenido;
      default: return styles.statusDefault;
    }
  };

  return (
    <View style={[styles.statusBadge, getStatusStyle()]}>
      <Text style={styles.statusBadgeText}>{status}</Text>
    </View>
  );
});

export default function Movimientos() {
  // Animation values

  
  // Core state - Optimized with refs for non-UI updates
  const [tab, setTab] = useState<TabType>('Actuales');
  const [allMovements, setAllMovements] = useState<Movement[]>([]);
  const [displayedMovements, setDisplayedMovements] = useState<Movement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  
  // Cache ref for better performance
  const movementsCache = useRef<Map<string, Movement[]>>(new Map());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovements, setTotalMovements] = useState(0);
  
  // User & role state
  const [user, setUser] = useState<User | null>(null);
  const [isSup, setIsSup] = useState(false);
  const [isCli, setIsCli] = useState(false);
  
  // Filter state with debouncing
  const [locOpts, setLocOpts] = useState<Option[]>([]);
  const [empOpts, setEmpOpts] = useState<Option[]>([]);
  const [locId, setLocId] = useState<number | null>(null);
  const [empId, setEmpId] = useState<number | null>(null);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  
  // Debounced filter values
  const debouncedFrom = useDebounce(from, DEBOUNCE_DELAY);
  const debouncedTo = useDebounce(to, DEBOUNCE_DELAY);
  
  // UI state
  const [drop, setDrop] = useState<DropdownType>(null);
  const [cal, setCal] = useState<CalendarType>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusAnimation] = useState(new Animated.Value(0));
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Performance tracking


  // Optimized label function with memoization
  const labelFor = useCallback(
    (opts: Option[], id: number | null) => 
      id == null ? 'Todas' : opts.find((o) => o.id === id)?.nombre ?? '—',
    []
  );

  // Enhanced entrance animation
 

  // Optimized network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = isOffline;
      const isNowOffline = !state.isConnected;
      
      if (wasOffline !== isNowOffline) {
        setIsOffline(isNowOffline);
        
        if (isNowOffline) {
          showStatusMessage('Sin conexión - Mostrando datos almacenados', 0, 'warning');
        } else if (wasOffline) {
          showStatusMessage('Conexión restaurada', 3000, 'success');
          setRefreshing(true); // Auto-refresh on reconnection
        }
      }
    });
    
    return () => unsubscribe();
  }, [isOffline]);

  // Enhanced status message with better animations
  const showStatusMessage = useCallback((
    message: string, 
    duration = 0, 
    type: 'info' | 'success' | 'error' | 'warning' = 'info'
  ) => {
    setStatusMessage(message);
    
    // Smooth fade in
    Animated.sequence([
      Animated.timing(statusAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      ...(duration > 0 ? [
        Animated.delay(duration),
        Animated.timing(statusAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ] : [])
    ]).start(() => {
      if (duration > 0) setStatusMessage(null);
    });
  }, [statusAnimation]);

  // Optimized filter and pagination function
  const applyFiltersAndPagination = useCallback((movements: Movement[]) => {
    if (!movements || movements.length === 0) {
      setDisplayedMovements([]);
      setTotalPages(1);
      setTotalMovements(0);
      return;
    }
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      // Create filter key for caching
      const filterKey = `${tab}-${locId}-${empId}-${debouncedFrom}-${debouncedTo}`;
      
      // Check cache first
      const cached = movementsCache.current.get(filterKey);
      if (cached && currentPage === 1) {
        setDisplayedMovements(cached.slice(0, ITEMS_PER_PAGE));
        setTotalMovements(cached.length);
        setTotalPages(Math.ceil(cached.length / ITEMS_PER_PAGE));
        return;
      }
      
      // Filter by tab
      let filtered = tab === 'Actuales'
        ? movements.filter(m => !m.finalizado)
        : movements.filter(m => m.finalizado);
      
      // Apply supervisor filters
      if (isSup) {
        if (locId != null) filtered = filtered.filter(m => m.localidadId === locId);
        if (empId != null) filtered = filtered.filter(m => m.empresaId === empId);
      }
      
      // Apply date filters with optimization
      if (debouncedFrom) {
        const f = new Date(debouncedFrom).getTime();
        filtered = filtered.filter(m => {
          const date = new Date(m.fechaInicio || m.fechaSolicitud).getTime();
          return !isNaN(date) && date >= f;
        });
      }
      
      if (debouncedTo) {
        const t = new Date(debouncedTo).getTime();
        filtered = filtered.filter(m => {
          const date = new Date(m.fechaFin || m.fechaInicio || m.fechaSolicitud).getTime();
          return !isNaN(date) && date <= t;
        });
      }
      
      // Cache the filtered results
      movementsCache.current.set(filterKey, filtered);
      
      // Update totals
      setTotalMovements(filtered.length);
      const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
      setTotalPages(Math.max(1, total));
      
      // Apply pagination
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedData = filtered.slice(start, start + ITEMS_PER_PAGE);
      
      // Smooth transition
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDisplayedMovements(paginatedData);
    });
  }, [tab, isSup, locId, empId, debouncedFrom, debouncedTo, currentPage]);

  // Optimized fetch functions with better error handling
  const fetchAndCacheLocations = useCallback(async (token: string) => {
    try {
      const cacheKey = 'cached_locations_v2';
      
      // Try cache first
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isExpired) {
          setLocOpts(data);
          return data;
        }
      }
      
      // Fetch fresh data
      const response = await fetch(`${API_BASE}/localidades`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const locs: any[] = await response.json();
      const locations = locs.map((l) => ({ id: l.id, nombre: l.nombre }));
      
      // Update state and cache
      setLocOpts(locations);
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: locations,
        timestamp: Date.now()
      }));
      
      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      
      // Fallback to any cached data
      try {
        const cachedData = await AsyncStorage.getItem('cached_locations_v2');
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setLocOpts(data);
          return data;
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
      
      return [];
    }
  }, []);

  const fetchAndCacheCompanies = useCallback(async (token: string) => {
    try {
      const cacheKey = 'cached_companies_v2';
      
      // Try cache first
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired) {
          setEmpOpts(data);
          return data;
        }
      }
      
      const response = await fetch(`${API_BASE}/empresas`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const emps: any[] = await response.json();
      const companies = emps.map((e) => ({ id: e.id, nombre: e.nombre }));
      
      setEmpOpts(companies);
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: companies,
        timestamp: Date.now()
      }));
      
      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      
      try {
        const cachedData = await AsyncStorage.getItem('cached_companies_v2');
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setEmpOpts(data);
          return data;
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
      
      return [];
    }
  }, []);

  // Optimized cache loading
  const loadFromCache = useCallback(async () => {
    try {
      showStatusMessage('Cargando datos almacenados...', 0, 'info');
      
      const [cachedLocations, cachedCompanies, cachedMovements] = await Promise.all([
        AsyncStorage.getItem('cached_locations_v2'),
        AsyncStorage.getItem('cached_companies_v2'),
        AsyncStorage.getItem('cached_movements_v2')
      ]);
      
      let hasData = false;
      
      if (cachedLocations) {
        const { data } = JSON.parse(cachedLocations);
        setLocOpts(data);
        hasData = true;
      }
      
      if (cachedCompanies) {
        const { data } = JSON.parse(cachedCompanies);
        setEmpOpts(data);
        hasData = true;
      }
      
      if (cachedMovements) {
        const { data } = JSON.parse(cachedMovements);
        setAllMovements(data);
        applyFiltersAndPagination(data);
        hasData = true;
      }
      
      setLoading(false);
      
      if (hasData) {
        showStatusMessage('Datos cargados desde caché', 2000, 'success');
      } else {
        showStatusMessage('No hay datos almacenados', 3000, 'warning');
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos almacenados',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    }
  }, [applyFiltersAndPagination, showStatusMessage]);

  // Optimized user data loading
  useEffect(() => {
    let isMounted = true;
    
   const loadUserData = async () => {
  try {
    setLoading(true);

    const [uStr, token] = await Promise.all([
      AsyncStorage.getItem('user'),
      AsyncStorage.getItem('token'),
    ]);

    if (!isMounted) return;
    if (!uStr || !token) throw new Error('No session data found');

    const u = JSON.parse(uStr);
    const userData = { ...u, token };

    setUser(userData);
    const esCliente = u.rol === 'CLIENTE';
    setIsCli(esCliente);
    setIsSup(u.rol === 'SUPERVISOR' && u.empresa?.nombre.toLowerCase() === 'vianko');

    // 1) Carga todas las localidades
    const locs = await fetchAndCacheLocations(token);

    // 2) Si es CLIENTE, filtra solo la suya y fija locId
    if (esCliente && u.localidadId != null) {
      const miLoc = locs.find((l: Option) => l.id === u.localidadId);
      if (miLoc) {
        setLocOpts([miLoc]);
        setLocId(miLoc.id);
      }
    }

    // 3) Carga empresas solo si es SUP
    const promises = [];
    if (isSup) {
      promises.push(fetchAndCacheCompanies(token));
    }
    await Promise.all(promises);

    if (isMounted) {
      setLoading(false);
    }
  } catch (error) {
    console.error('Error loading user data:', error);

    if (!isMounted) return;
    setLoading(false);

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      loadFromCache();
      return;
    }

    Alert.alert(
      'Error de sesión',
      'No se pudo cargar la información de usuario',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reintentar', onPress: () => loadUserData() }
      ],
      { cancelable: false }
    );
  }
};

    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchAndCacheLocations, fetchAndCacheCompanies, loadFromCache]);

  // Optimized movements loading with intelligent caching
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const loadMovements = async () => {
      if (!user) return;
      
      try {
        if (!refreshing && isMounted) setLoading(true);
        
        const { token, localidadId: uLoc, empresaId: uEmp } = user;
        const selectedLocal = locId != null ? locId : uLoc;
        const selectedEmp = empId != null ? empId : uEmp;
        
        const ep = isSup
          ? '/movimientos'
          : `/movimientos/empresa/${selectedEmp}/localidad/${selectedLocal}`;
        
        let url = `${API_BASE}${ep}`;
        
        const params = new URLSearchParams();
        if (debouncedFrom) params.append('fechaInicio', debouncedFrom);
        if (debouncedTo) params.append('fechaFin', debouncedTo);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const raw: any[] = await response.json();
        
        if (!isMounted) return;
        
        // Optimized mapping with batch processing
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
        
        // Update state
        setAllMovements(movements);
        
        // Smart caching
        const itemsToCache = movements.slice(0, MAX_CACHED_ITEMS);
        AsyncStorage.setItem('cached_movements_v2', JSON.stringify({
          data: itemsToCache,
          timestamp: Date.now()
        })).catch(console.error);
        
        applyFiltersAndPagination(movements);
        
        if (refreshing && isMounted) {
          showStatusMessage('Datos actualizados', 2000, 'success');
        }
        
        // Show data range info
        if (!debouncedFrom && !debouncedTo && isMounted) {
          showStatusMessage(`Mostrando movimientos del mes actual`, 3000, 'info');
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        
        console.error('Error loading movements:', error);
        
        if (!isMounted) return;
        
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          try {
            const cachedMovements = await AsyncStorage.getItem('cached_movements_v2');
            if (cachedMovements) {
              const { data } = JSON.parse(cachedMovements);
              setAllMovements(data);
              applyFiltersAndPagination(data);
              showStatusMessage('Mostrando datos almacenados', 0, 'warning');
            } else {
              showStatusMessage('No hay datos disponibles sin conexión', 0, 'error');
            }
          } catch (cacheError) {
            console.error('Cache error:', cacheError);
          }
        } else {
          const message = refreshing 
            ? 'No se pudieron actualizar los movimientos'
            : 'Error al cargar los movimientos';
          
          Alert.alert(
            'Error',
            message,
            [{ text: 'OK', style: 'default' }],
            { cancelable: true }
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    
    loadMovements();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user, isSup, locId, empId, debouncedFrom, debouncedTo, refreshing, applyFiltersAndPagination, showStatusMessage]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (allMovements.length > 0) {
      applyFiltersAndPagination(allMovements);
    }
  }, [allMovements, tab, currentPage, applyFiltersAndPagination]);

  // Optimized handlers
  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const clearFilters = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    
    setLocId(null);
    setEmpId(null);
    setFrom('');
    setTo('');
    setCurrentPage(1);
    movementsCache.current.clear(); // Clear cache
    
    AccessibilityInfo.announceForAccessibility('Filtros eliminados');
    showStatusMessage('Filtros eliminados', 2000, 'success');
  }, [showStatusMessage]);

  const handleTabChange = useCallback((newTab: string) => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.spring,
        property: LayoutAnimation.Properties.scaleXY,
        springDamping: 0.7,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
    });
    
    setTab(newTab as TabType);
    setCurrentPage(1);
  }, []);

  const toggleForm = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setShowForm(prev => !prev);
  }, []);

  const handleFormFinish = useCallback(() => {
    setShowForm(false);
    setRefreshing(true);
  }, []);

  const handlePageChange = useCallback((direction: 'prev' | 'next') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setCurrentPage(current => {
      const newPage = direction === 'prev' 
        ? Math.max(1, current - 1)
        : Math.min(totalPages, current + 1);
      
      AccessibilityInfo.announceForAccessibility(
        `Página ${newPage} de ${totalPages}`
      );
      
      return newPage;
    });
  }, [totalPages]);

  const handleRowPress = useCallback((item: Movement) => {
    if (isCli) {
            return;
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setSelectedMovement(item);
    setShowDetailModal(true);
    
    AccessibilityInfo.announceForAccessibility(
      `Detalles del movimiento ${item.id}`
    );
  }, [isCli, showStatusMessage]);

  // Enhanced detail formatting
  const formatDetailInfo = useCallback((item: Movement | null) => {
    if (!item) return null;
    
    const formatBoolean = (value: boolean) => (value ? 'Sí' : 'No');
    const formatDate = (date: string | null) => {
      if (!date) return '—';
      try {
        return new Date(date).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return date;
      }
    };
    
    return {
      generalInfo: [
        { label: 'ID', value: item.id, icon: 'hash' },
        { label: 'Locomotora', value: item.locomotora, icon: 'truck' },
        { label: 'Estado', value: item.estado, icon: 'activity' },
        { label: 'Prioridad', value: item.prioridad, icon: 'flag' },
        { label: 'Tipo Acción', value: item.tipoAccion, icon: 'tool' },
        { label: 'Tipo Movimiento', value: item.tipoMovimiento, icon: 'navigation' },
      ],
      locationInfo: [
        { label: 'Localidad', value: item.localidadNombre || '—', icon: 'map-pin' },
        { label: 'Estado Localidad', value: item.localidadEstado || '—', icon: 'info' },
        { label: 'Vía Origen', value: item.viaOrigen, icon: 'log-in' },
        { label: 'Vía Destino', value: item.viaDestino, icon: 'log-out' },
      ],
      personnelInfo: [
        { label: 'Cliente', value: item.clienteId, icon: 'user' },
        { label: 'Empresa', value: item.empresaId, icon: 'briefcase' },
        { label: 'Supervisor', value: item.supervisorId || '—', icon: 'user-check' },
        { label: 'Coordinador', value: item.coordinadorId || '—', icon: 'users' },
        { label: 'Operador', value: item.operadorId || '—', icon: 'tool' },
        { label: 'Maquinista', value: item.maquinistaId || '—', icon: 'user' },
      ],
      datesInfo: [
        { label: 'Fecha Solicitud', value: formatDate(item.fechaSolicitud), icon: 'calendar' },
        { label: 'Fecha Inicio', value: formatDate(item.fechaInicio), icon: 'play' },
        { label: 'Fecha Fin', value: formatDate(item.fechaFin), icon: 'check-circle' },
        { label: 'Nueva Fecha', value: formatDate(item.nuevaFechaPostergacion ?? null), icon: 'clock' },
      ],
      configInfo: [
        { label: 'Posición Cabina', value: item.posicionCabina, icon: 'move' },
        { label: 'Posición Chimenea', value: item.posicionChimenea, icon: 'wind' },
        { label: 'Dirección Empuje', value: item.direccionEmpuje, icon: 'arrow-right' },
        { label: 'Finalizado', value: formatBoolean(item.finalizado), icon: 'check' },
        { label: 'Incidente Global', value: formatBoolean(item.incidenteGlobal), icon: 'alert-triangle' },
        { label: 'Lavado', value: formatBoolean(item.lavado), icon: 'droplet' },
        { label: 'Torno', value: formatBoolean(item.torno), icon: 'settings' },
      ],
    };
  }, []);
  
  // Optimized memoized values
  const tabBadges = useMemo<{ [key: string]: number } | undefined>(() => {
    const actualCount = allMovements.filter(m => !m.finalizado).length;
    return actualCount > 0 ? { 'Actuales': actualCount } : undefined;
  }, [allMovements]);

  const renderDateRangeInfo = useMemo(() => {
    if (loading) return null;
    
    const showingCurrentMonth = !debouncedFrom && !debouncedTo;
    
    return (
      <Animated.View 
        style={[
          styles.dateRangeInfo,
          
        ]}
      >
        <View style={styles.dateRangeContent}>
          <Feather name="calendar" size={16} color={COLORS.primary} />
          <Text style={styles.dateRangeText}>
            {showingCurrentMonth 
              ? 'Mes actual' 
              : debouncedFrom && debouncedTo 
                ? `${debouncedFrom} - ${debouncedTo}`
                : debouncedFrom 
                  ? `Desde ${debouncedFrom}`
                  : debouncedTo 
                    ? `Hasta ${debouncedTo}`
                    : 'Todos'
            }
          </Text>
        </View>
        {totalMovements > 0 && (
          <View style={styles.dateRangeStats}>
            <Text style={styles.dateRangeCount}>
              {totalMovements} {totalMovements === 1 ? 'movimiento' : 'movimientos'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }, [loading, debouncedFrom, debouncedTo, totalMovements]);

  const renderFilters = useMemo(() => {
    if (!isSup && !isCli) return null;
    
    return (
      <Animated.View 
        style={[
          styles.filterBox,
         
        ]}
      >
        <View style={styles.filterContent}>
          {isCli ? (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Empresa</Text>
              <View style={styles.selectBoxFixed}>
                <Feather name="briefcase" size={16} color={COLORS.primary} />
                <Text style={styles.selectTextFixed}>{user?.empresa?.nombre}</Text>
              </View>
            </View>
          ) : (
            <Pressable 
              style={[styles.filterItem, isOffline && styles.filterItemDisabled]} 
              onPress={() => !isOffline && setDrop('emp')}
              disabled={isOffline}
            >
              <Text style={styles.filterLabel}>Empresa</Text>
              <View style={[styles.selectBox, isOffline && styles.selectDisabled]}>
                <Feather name="briefcase" size={16} color={isOffline ? COLORS.disabled : COLORS.primary} />
                <Text style={[styles.selectText, isOffline && styles.selectTextDisabled]}>
                  {labelFor(empOpts, empId)}
                </Text>
                {!isOffline && (
                  <Feather name="chevron-down" size={16} color={COLORS.textLight} />
                )}
              </View>
            </Pressable>
          )}

          <Pressable 
            style={[styles.filterItem, isOffline && styles.filterItemDisabled]} 
            onPress={() => !isOffline && setDrop('loc')}
            disabled={isOffline}
          >
            <Text style={styles.filterLabel}>Localidad</Text>
            <View style={[styles.selectBox, isOffline && styles.selectDisabled]}>
              <Feather name="map-pin" size={16} color={isOffline ? COLORS.disabled : COLORS.primary} />
              <Text style={[styles.selectText, isOffline && styles.selectTextDisabled]}>
                {labelFor(locOpts, locId)}
              </Text>
              {!isOffline && (
                <Feather name="chevron-down" size={16} color={COLORS.textLight} />
              )}
            </View>
          </Pressable>

          <Pressable 
            style={styles.filterItemDate} 
            onPress={() => setCal('from')}
          >
            <Text style={styles.filterLabel}>Desde</Text>
            <View style={styles.selectBoxDate}>
              <Feather name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.selectText}>{from || 'Seleccionar'}</Text>
            </View>
          </Pressable>
          
          <Pressable 
            style={styles.filterItemDate} 
            onPress={() => setCal('to')}
          >
            <Text style={styles.filterLabel}>Hasta</Text>
            <View style={styles.selectBoxDate}>
              <Feather name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.selectText}>{to || 'Seleccionar'}</Text>
            </View>
          </Pressable>

          {(locId || empId || from || to) && (
            <TouchableOpacity 
              style={styles.clearBtn} 
              onPress={clearFilters}
              activeOpacity={0.7}
            >
              <Feather name="x-circle" size={16} color="#FFF" />
              <Text style={styles.clearTxt}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  }, [isSup, isCli, user, empOpts, locOpts, empId, locId, from, to, labelFor, clearFilters, isOffline]);

  const renderPagination = useMemo(() => {
    if (totalPages <= 1) return null;
    
    return (
      <Animated.View 
        style={[
          styles.paginationContainer,
          
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled
          ]} 
          onPress={() => handlePageChange('prev')}
          disabled={currentPage === 1}
          activeOpacity={0.7}
        >
          <Feather 
            name="chevron-left" 
            size={20} 
            color={currentPage === 1 ? COLORS.disabled : COLORS.primary} 
          />
          <Text style={[
            styles.paginationButtonText,
            currentPage === 1 && styles.paginationButtonTextDisabled
          ]}>
            Anterior
          </Text>
        </TouchableOpacity>
        
        <View style={styles.paginationInfoContainer}>
          <View style={styles.paginationDots}>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) {
                  // Show first 5 pages
                } else if (currentPage >= totalPages - 2) {
                  // Show last 5 pages
                  pageNum = totalPages - 4 + i;
                } else {
                  // Show current page in middle
                  pageNum = currentPage - 2 + i;
                }
              }
              
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.paginationDot,
                    pageNum === currentPage && styles.paginationDotActive
                  ]}
                  onPress={() => setCurrentPage(pageNum)}
                  disabled={pageNum === currentPage}
                >
                  <Text style={[
                    styles.paginationDotText,
                    pageNum === currentPage && styles.paginationDotTextActive
                  ]}>
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.paginationSubInfo}>
            {displayedMovements.length} de {totalMovements} items
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled
          ]} 
          onPress={() => handlePageChange('next')}
          disabled={currentPage === totalPages}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.paginationButtonText,
            currentPage === totalPages && styles.paginationButtonTextDisabled
          ]}>
            Siguiente
          </Text>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={currentPage === totalPages ? COLORS.disabled : COLORS.primary} 
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [currentPage, totalPages, handlePageChange, displayedMovements.length, totalMovements]);
  
  const ListHeaderOption = useCallback(({ type }: { type: DropdownType }) => {
    return (
      <TouchableOpacity
        style={styles.optionItem}
        onPress={() => {
          if (type === 'loc') setLocId(null);
          else setEmpId(null);
          setDrop(null);
          
          AccessibilityInfo.announceForAccessibility(
            `${type === 'loc' ? 'Localidad' : 'Empresa'}: Todas`
          );
        }}
        activeOpacity={0.7}
      >
        <Feather 
          name={type === 'loc' ? 'map' : 'grid'} 
          size={18} 
          color={COLORS.primary} 
        />
        <Text style={[styles.optionTxt, styles.optionAll]}>Todas</Text>
      </TouchableOpacity>
    );
  }, []);
  
  // Main render with performance optimizations
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.container}>
        {showForm ? (
          <MovementFormWrapper onFinish={handleFormFinish} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
            <Animated.View >
              <View style={styles.header}>
                <Text style={styles.title}>
                  {tab === 'Actuales' ? 'Movimientos Actuales' : 'Historial'}
                </Text>
          
              </View>
              
              <Tabs 
                tabs={['Actuales', 'Pasados']} 
                activeTab={tab} 
                onTabPress={handleTabChange}
                badges={tabBadges}
              />
              
              {renderDateRangeInfo}
              
              {renderFilters}
              
              {statusMessage && (
                <Animated.View 
                  style={[
                    styles.statusContainer,
                    statusMessage.includes('Error') || statusMessage.includes('permisos') 
                      ? styles.statusError 
                      : statusMessage.includes('actualizado') || statusMessage.includes('eliminado')
                        ? styles.statusSuccess
                        : statusMessage.includes('Sin conexión')
                          ? styles.statusWarning
                          : styles.statusInfo,
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
                  <Feather 
                    name={
                      statusMessage.includes('Error') ? 'x-circle' :
                      statusMessage.includes('actualizado') ? 'check-circle' :
                      statusMessage.includes('Sin conexión') ? 'wifi-off' :
                      'info'
                    } 
                    size={16} 
                    color="#FFF" 
                  />
                  <Text style={styles.statusText}>{statusMessage}</Text>
                </Animated.View>
              )}
              
              <View style={styles.tableWrap}>
                {loading ? (
                  <LoadingSkeleton />
                ) : (
                  <MovimientosTable 
                    data={displayedMovements} 
                    loading={false} 
                    onRowPress={handleRowPress}
                    emptyStateText={
                      isOffline 
                        ? "No hay datos disponibles sin conexión" 
                        : tab === 'Actuales'
                          ? "No hay movimientos activos"
                          : "No hay movimientos finalizados"
                    }
                  />
                )}
              </View>
              
              {renderPagination}
       
            </Animated.View>
             {tab === 'Actuales' && (
                <TouchableOpacity 
                  style={[
                    styles.floatingBtn,
                    isOffline && styles.floatingBtnDisabled
                  ]} 
                  onPress={toggleForm}
                  disabled={isOffline}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
              )}
          </ScrollView>
        )}
        
        {/* Modals with lazy loading */}
        {drop !== null && (
          <Modal 
            transparent 
            visible={true}
            animationType="fade" 
            onRequestClose={() => setDrop(null)}
            statusBarTranslucent
          >
            <Pressable 
              style={styles.backdrop} 
              onPress={() => setDrop(null)}
            />
            <SafeAreaView style={styles.modalContainer} pointerEvents="box-none">
              <Animated.View 
                style={[
                  styles.modalWrap,
               
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Feather 
                      name={drop === 'loc' ? 'map-pin' : 'briefcase'} 
                      size={20} 
                      color={COLORS.primary} 
                    />
                    <Text style={styles.modalTitle}>
                      {drop === 'loc' ? 'Localidad' : 'Empresa'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setDrop(null)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
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
                  removeClippedSubviews={true}
                  ListHeaderComponent={() => <ListHeaderOption type={drop} />}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => {
                        if (drop === 'loc') setLocId(item.id);
                        else setEmpId(item.id);
                        setDrop(null);
                        
                        AccessibilityInfo.announceForAccessibility(
                          `${drop === 'loc' ? 'Localidad' : 'Empresa'}: ${item.nombre}`
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Feather 
                        name="check" 
                        size={18} 
                        color={
                          (drop === 'loc' && locId === item.id) || 
                          (drop === 'emp' && empId === item.id) 
                            ? COLORS.primary 
                            : 'transparent'
                        } 
                      />
                      <Text style={styles.optionTxt}>{item.nombre}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyList}>
                      <Feather name="inbox" size={40} color={COLORS.disabled} />
                      <Text style={styles.emptyListText}>
                        No hay opciones disponibles
                      </Text>
                    </View>
                  )}
                />
              </Animated.View>
            </SafeAreaView>
          </Modal>
        )}
        
        {cal !== null && (
          <Modal 
            transparent 
            visible={true}
            animationType="fade" 
            onRequestClose={() => setCal(null)}
            statusBarTranslucent
          >
            <Pressable 
              style={styles.backdrop} 
              onPress={() => setCal(null)}
            />
            <SafeAreaView style={styles.modalContainer} pointerEvents="box-none">
              <Animated.View 
                style={[
                  styles.calendarWrapper,
              
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Feather name="calendar" size={20} color={COLORS.primary} />
                    <Text style={styles.modalTitle}>
                      {cal === 'from' ? 'Fecha Desde' : 'Fecha Hasta'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setCal(null)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <Calendar
                  initialDate={cal === 'from' ? from || todayISO() : to || todayISO()}
                  onDayPress={(d: DateData) => {
                    cal === 'from' ? setFrom(d.dateString) : setTo(d.dateString);
                    setCal(null);
                    
                    AccessibilityInfo.announceForAccessibility(
                      `${cal === 'from' ? 'Fecha desde' : 'Fecha hasta'}: ${d.dateString}`
                    );
                  }}
                  markedDates={{
                    [cal === 'from' ? from || todayISO() : to || todayISO()]: { 
                      selected: true,
                      selectedColor: COLORS.primary
                    },
                  }}
                  theme={{
                    backgroundColor: COLORS.card,
                    calendarBackground: COLORS.card,
                    textSectionTitleColor: COLORS.textLight,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: '#FFF',
                    todayTextColor: COLORS.primary,
                    dayTextColor: COLORS.text,
                    textDisabledColor: COLORS.disabled,
                    dotColor: COLORS.primary,
                    selectedDotColor: '#FFF',
                    arrowColor: COLORS.primary,
                    monthTextColor: COLORS.text,
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                    textDayFontWeight: '400',
                    textMonthFontWeight: '600',
                    textDayHeaderFontWeight: '500',
                  }}
                  enableSwipeMonths={true}
                />
                
                {(cal === 'from' && from) || (cal === 'to' && to) ? (
                  <TouchableOpacity 
                    style={styles.clearDateBtn}
                    onPress={() => {
                      cal === 'from' ? setFrom('') : setTo('');
                      setCal(null);
                      
                      AccessibilityInfo.announceForAccessibility(
                        `${cal === 'from' ? 'Fecha desde' : 'Fecha hasta'} eliminada`
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color={COLORS.red} />
                    <Text style={styles.clearDateText}>Eliminar fecha</Text>
                  </TouchableOpacity>
                ) : null}
              </Animated.View>
            </SafeAreaView>
          </Modal>
        )}
        
        {!isCli && showDetailModal && selectedMovement && (
          <Modal
            transparent
            visible={true}
            animationType="slide"
            onRequestClose={() => setShowDetailModal(false)}
            statusBarTranslucent
          >
            <Pressable 
              style={styles.backdrop} 
              onPress={() => setShowDetailModal(false)}
            />
            <SafeAreaView style={styles.modalContainerDetail} pointerEvents="box-none">
              <Animated.View 
                style={[
                  styles.detailModalWrap,
                
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Feather name="file-text" size={20} color={COLORS.primary} />
                    <Text style={styles.modalTitle}>
                      Movimiento #{selectedMovement.id}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setShowDetailModal(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.detailScrollView}
                  contentContainerStyle={styles.detailContentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedMovement.prioridad === 'ALTA' && (
                    <View style={styles.priorityBadge}>
                      <Feather name="alert-circle" size={16} color="#FFF" />
                      <Text style={styles.priorityBadgeText}>PRIORIDAD ALTA</Text>
                    </View>
                  )}
                  
                  <StatusBadge status={selectedMovement.estado} />
                  
                  {selectedMovement.instrucciones && (
                    <View style={styles.detailSection}>
                      <View style={styles.detailSectionHeader}>
                        <Feather name="file-text" size={18} color={COLORS.primary} />
                        <Text style={styles.detailSectionTitle}>Instrucciones</Text>
                      </View>
                      <View style={styles.instructionsBox}>
                        <Text style={styles.instructionsText}>
                          {selectedMovement.instrucciones}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {formatDetailInfo(selectedMovement) && (
                    <>
                      {Object.entries({
                        'Información General': formatDetailInfo(selectedMovement)!.generalInfo,
                        'Ubicación': formatDetailInfo(selectedMovement)!.locationInfo,
                        'Personal': formatDetailInfo(selectedMovement)!.personnelInfo,
                        'Fechas': formatDetailInfo(selectedMovement)!.datesInfo,
                        'Configuración': formatDetailInfo(selectedMovement)!.configInfo,
                      }).map(([title, items]) => (
                        <View key={title} style={styles.detailSection}>
                          <View style={styles.detailSectionHeader}>
                            <Feather 
                              name={
                                title === 'Información General' ? 'info' :
                                title === 'Ubicación' ? 'map' :
                                title === 'Personal' ? 'users' :
                                title === 'Fechas' ? 'calendar' :
                                'settings'
                              } 
                              size={18} 
                              color={COLORS.primary} 
                            />
                            <Text style={styles.detailSectionTitle}>{title}</Text>
                          </View>
                          <View style={styles.detailGrid}>
                            {items.map((item: any, index: number) => (
                              <View key={index} style={styles.detailItem}>
                                <View style={styles.detailItemHeader}>
                                  <Feather 
                                    name={item.icon} 
                                    size={14} 
                                    color={COLORS.textLight} 
                                  />
                                  <Text style={styles.detailLabel}>{item.label}</Text>
                                </View>
                                <Text style={styles.detailValue}>{item.value}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                  
                  {selectedMovement.comentarioPostergacion && (
                    <View style={styles.detailSection}>
                      <View style={styles.detailSectionHeader}>
                        <Feather name="message-circle" size={18} color={COLORS.warning} />
                        <Text style={styles.detailSectionTitle}>Comentario de Postergación</Text>
                      </View>
                      <View style={styles.commentBox}>
                        <Text style={styles.commentText}>
                          {selectedMovement.comentarioPostergacion}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            </SafeAreaView>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

// Enhanced styles with modern design
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { 
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateRangeInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  dateRangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 8,
  },
  dateRangeStats: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateRangeCount: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusInfo: {
    backgroundColor: COLORS.info,
  },
  statusSuccess: {
    backgroundColor: COLORS.success,
  },
  statusError: {
    backgroundColor: COLORS.error,
  },
  statusWarning: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  filterBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  filterContent: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 12,
  },
  filterItem: {
    flex: 1,
    minWidth: 140,
    marginBottom: 4,
  },
  filterItemDate: {
    minWidth: 110,
    marginBottom: 4,
  },
  filterItemDisabled: {
    opacity: 0.6,
  },
  filterLabel: { 
    fontSize: 12, 
    color: COLORS.textLight, 
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    gap: 8,
  },
  selectBoxFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgDark,
    gap: 8,
  },
  selectBoxDate: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    gap: 8,
  },
  selectDisabled: {
    backgroundColor: COLORS.bgDark,
    borderColor: COLORS.disabled,
  },
  selectText: { 
    fontSize: 14, 
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  selectTextFixed: { 
    fontSize: 14, 
    color: COLORS.text,
    fontWeight: '600',
  },
  selectTextDisabled: {
    color: COLORS.textLight,
  },
  clearBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: COLORS.redDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clearTxt: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  tableWrap: { 
    flex: 1, 
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    gap: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.bgDark,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paginationButtonTextDisabled: {
    color: COLORS.textLight,
  },
  paginationInfoContainer: {
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paginationDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  paginationDotTextActive: {
    color: '#FFF',
  },
  paginationSubInfo: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingBtnDisabled: {
    backgroundColor: COLORS.disabled,
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: COLORS.backdrop,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerDetail: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalWrap: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  detailModalWrap: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  optionItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionTxt: { 
    fontSize: 16, 
    color: COLORS.text,
    flex: 1,
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
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyListText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  calendarWrapper: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  clearDateText: {
    color: COLORS.red,
    fontWeight: '600',
    fontSize: 14,
  },
  detailScrollView: {
    maxHeight: '85%',
  },
  detailContentContainer: {
    padding: 20,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    gap: 6,
    elevation: 2,
    shadowColor: COLORS.redDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  priorityBadgeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusSolicitado: {
    backgroundColor: COLORS.blue,
  },
  statusEnProceso: {
    backgroundColor: COLORS.warning,
  },
  statusConcluido: {
    backgroundColor: COLORS.success,
  },
  statusDetenido: {
    backgroundColor: COLORS.red,
  },
  statusDefault: {
    backgroundColor: COLORS.textLight,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '47%',
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  instructionsBox: {
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  commentBox: {
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Skeleton loader styles
  skeletonContainer: {
    padding: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  skeletonCell: {
    height: 40,
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    flex: 1,
  },
});