// RondaList.tsx - Versión mejorada con estilo premium para clientes
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  Platform,
  Dimensions,
  TouchableOpacity,
  Text as RNText,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  Text,
  ActivityIndicator,
  Button,
  IconButton,
  FAB,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import EditRonda from './EditRonda';

// API y constantes
const BASE_URL = 'http://31.97.13.182:3000';
const { width } = Dimensions.get('window');

// Paleta de colores premium
const COLORS = {
  primary: '#0C88C5',        // Azul principal
  primaryDark: '#0071A7',    // Azul oscuro
  primaryLight: '#E0F7FF',   // Azul claro
  secondary: '#5ABEF5',      // Azul claro secundario
  accent: '#FFC107',         // Color acento (ámbar)
  background: '#F5F7FA',     // Fondo gris claro
  surface: '#FFFFFF',        // Superficie blanca
  success: '#4CAF50',        // Verde éxito
  error: '#F44336',          // Rojo error
  warning: '#FF9800',        // Naranja advertencia
  text: '#333333',           // Texto principal
  textSecondary: '#757575',  // Texto secundario
  border: '#E0E0E0',         // Bordes
  divider: '#EEEEEE',        // Divisor
  chipBackground: '#E8F5E9', // Fondo de chips verificados
  shadow: 'rgba(0,0,0,0.1)',  // Color de sombra
};

// Tema personalizado para Paper
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
  },
};

/* ---------- interfaces ---------- */
export interface Ronda {
  id: number;
  rondaNumero: number;
  orden: number;
  concluido: boolean;
  movimiento: { title: string; description: string; date: string };
}

export interface Localidad {
  id: number;
  nombre: string;
}

export interface RondaInfo {
  empresa: { id: number; nombre: string };
  movimiento: {
    viaOrigen: { nombre: string };
    viaDestino: { nombre: string | null };
    lavado: boolean;
    torno: boolean;
  };
}

/* Props para integración con componentes padres */
interface RondaListProps {
  token?: string | null;
  empresaId?: number;
  refreshTrigger?: number;
  onRefreshComplete?: () => void;
  style?: any;
}

/* ---------- componente principal ---------- */
export default function RondaList({
  token: propToken,
  empresaId: propEmpresaId,
  refreshTrigger = 0,
  onRefreshComplete,
  style = {},
}: RondaListProps = {}) {
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Estados
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(propToken || null);
  const [isClient, setIsClient] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<number | null>(null);
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [infoMap, setInfoMap] = useState<Record<number, RondaInfo>>({});
  const [activeTab, setActiveTab] = useState<'pendientes' | 'terminados'>('pendientes');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  // Estado para la edición
  const [editing, setEditing] = useState(false);
  const [editingRondaId, setEditingRondaId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Animación de entrada para las tarjetas
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, refresh]);

  // Inicialización
  useEffect(() => {
    if (propToken) {
      setToken(propToken);
    }
    loadUserData();
  }, [propToken]);

  // Responder a la solicitud de actualización desde el padre
  useEffect(() => {
    if (refreshTrigger > 0) {
      setRefresh(r => r + 1);
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  }, [refreshTrigger, onRefreshComplete]);

  // Cargar datos de usuario
  const loadUserData = async () => {
    try {
      setLoading(true);
      const [uStr, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token'),
      ]);
      
      if (!uStr || !storedToken) throw new Error('Sesión no disponible');
      
      const u = JSON.parse(uStr);
      setUser({ ...u });
      setToken(storedToken);
      
      const client = u.rol === 'CLIENTE';
      setIsClient(client);

      if (u.localidadId) {
        setSelectedLoc(u.localidadId);
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos de usuario');
    } finally {
      setLoading(false);
    }
  };

  /* cargar rondas -------------------------------------------------------*/
  const loadRondas = async (showRefreshing = false) => {
    if (selectedLoc == null || !token) return;
    
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const estado = activeTab === 'pendientes' ? 'false' : 'true';
      const res = await fetch(
        `${BASE_URL}/rondas/localidad/${selectedLoc}/estado/${estado}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error al cargar rondas');
      const data: Ronda[] = await res.json();
      setRondas(data);
      
      if (showRefreshing) {
        setSnackMessage('Datos actualizados correctamente');
        setSnackVisible(true);
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar rondas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRondas();
  }, [selectedLoc, activeTab, token, refresh]);

  /* Función de actualización manual */
  const handleRefresh = useCallback(() => {
    loadRondas(true);
  }, [selectedLoc, activeTab, token]);

  /* info extra -----------------------------------------------------------*/
  useEffect(() => {
    if (!rondas.length || !token) {
      setInfoMap({});
      return;
    }

    const loadRondasInfo = async () => {
      const map: Record<number, RondaInfo> = {};
      await Promise.all(
        rondas.map(async (r) => {
          try {
            const res = await fetch(
              `${BASE_URL}/movimientos/ronda/${r.id}/info`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
              map[r.id] = await res.json();
            }
          } catch (err) {
            console.warn(`Error cargando info para ronda ${r.id}:`, err);
          }
        })
      );
      setInfoMap(map);
    };

    loadRondasInfo();
  }, [rondas, token]);

  /* helper editable ------------------------------------------------------*/
  const canEdit = useCallback(
    (r: Ronda) =>
      activeTab === 'pendientes' &&
      infoMap[r.id]?.empresa.id === (propEmpresaId || user?.empresaId) &&
      !r.concluido,
    [activeTab, infoMap, user, propEmpresaId]
  );

  /* filtrado --------------------------------------------------------------*/
  const filteredRondas = useMemo(() => {
    // Filtramos por cliente si es necesario
    let filtered = rondas;
    if (isClient && activeTab === 'terminados') {
      filtered = rondas.filter(r => infoMap[r.id]?.empresa.id === (propEmpresaId || user?.empresaId));
    }
    return filtered;
  }, [rondas, infoMap, isClient, activeTab, user, propEmpresaId]);

  /* agrupación por rondas ------------------------------------------------*/
  const groupedRondas = useMemo(() => {
    const grouped: Record<number, Ronda[]> = {};
    filteredRondas.forEach(r => (grouped[r.rondaNumero] ||= []).push(r));
    
    // Convertimos a un array para FlatList con secciones
    return Object.entries(grouped).map(([num, items]) => ({
      rondaNumero: parseInt(num),
      items: items.sort((a, b) => a.orden - b.orden),
    })).sort((a, b) => a.rondaNumero - b.rondaNumero);
  }, [filteredRondas]);

  /* Renderizado de sección de ronda - Estilo premium */
  const renderRondaSection = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      style={[
        styles.sectionContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }
          ]
        }
      ]}
    >
      {/* Cabecera de sección con gradiente */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.sectionHeader}
      >
        <View style={styles.sectionLeft}>
          <View style={styles.rondaCircle}>
            <RNText style={styles.rondaNumberText}>{item.rondaNumero}</RNText>
          </View>
          <RNText style={styles.rondaText}>Ronda</RNText>
        </View>
        <View style={styles.itemCount}>
          <RNText style={styles.itemCountText}>{item.items.length}</RNText>
        </View>
      </LinearGradient>
      
      {/* Lista de items */}
      {item.items.map((ronda: Ronda, rondaIndex: number) => (
        <View 
          key={ronda.id} 
          style={[
            styles.cardContainer,
            rondaIndex === item.items.length - 1 && styles.lastCard
          ]}
        >
          {/* Círculo con número de orden y efecto degradado */}
          <LinearGradient
            colors={['#64B5F6', '#1E88E5']}
            style={styles.orderCircle}
          >
            <RNText style={styles.orderText}>{ronda.orden}</RNText>
          </LinearGradient>
          
          {/* Contenido principal */}
          <View style={styles.cardContent}>
            {/* Título y fecha */}
            <View style={styles.titleRow}>
              {ronda.movimiento.title && (
                <RNText style={styles.cardTitle} numberOfLines={1}>
                  {ronda.movimiento.title}
                </RNText>
              )}
              <RNText style={styles.dateText}>{ronda.movimiento.date}</RNText>
            </View>
            
            {/* Línea divisora con efecto degradado */}
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
            
            {/* Información en dos columnas */}
            <View style={styles.twoColumns}>
              {/* Columna izquierda */}
              <View style={styles.columnLeft}>
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <FontAwesome5 name="building" size={12} color={COLORS.primary} />
                    <RNText style={styles.infoLabel}>Empresa</RNText>
                  </View>
                  <RNText style={styles.infoValue} numberOfLines={1}>
                    {infoMap[ronda.id]?.empresa.nombre || '-'}
                  </RNText>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <FontAwesome5 name="map-marker-alt" size={12} color={COLORS.primary} />
                    <RNText style={styles.infoLabel}>Origen</RNText>
                  </View>
                  <RNText style={styles.infoValue} numberOfLines={1}>
                    {infoMap[ronda.id]?.movimiento.viaOrigen.nombre || 'E'}
                  </RNText>
                </View>
              </View>
              
              {/* Columna derecha */}
              <View style={styles.columnRight}>
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <FontAwesome5 name="flag-checkered" size={12} color={COLORS.primary} />
                    <RNText style={styles.infoLabel}>Destino</RNText>
                  </View>
                  <RNText style={styles.infoValue} numberOfLines={1}>
                    {infoMap[ronda.id]?.movimiento.viaDestino?.nombre || 'Sin destino'}
                  </RNText>
                </View>
                
                <View style={styles.chipsContainer}>
                  {/* Chips elegantes para lavado y torno */}
                  <View style={[
                    styles.statusChip,
                    infoMap[ronda.id]?.movimiento.lavado ? styles.activeChip : styles.inactiveChip
                  ]}>
                    <FontAwesome5 
                      name={infoMap[ronda.id]?.movimiento.lavado ? "check-circle" : "times-circle"} 
                      size={12} 
                      color={infoMap[ronda.id]?.movimiento.lavado ? COLORS.success : COLORS.textSecondary} 
                    />
                    <RNText style={[
                      styles.chipText,
                      infoMap[ronda.id]?.movimiento.lavado ? styles.activeChipText : styles.inactiveChipText
                    ]}>
                      Lavado
                    </RNText>
                  </View>
                  
                  <View style={[
                    styles.statusChip,
                    infoMap[ronda.id]?.movimiento.torno ? styles.activeChip : styles.inactiveChip
                  ]}>
                    <FontAwesome5 
                      name={infoMap[ronda.id]?.movimiento.torno ? "check-circle" : "times-circle"} 
                      size={12} 
                      color={infoMap[ronda.id]?.movimiento.torno ? COLORS.success : COLORS.textSecondary} 
                    />
                    <RNText style={[
                      styles.chipText,
                      infoMap[ronda.id]?.movimiento.torno ? styles.activeChipText : styles.inactiveChipText
                    ]}>
                      Torno
                    </RNText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  /* Renderizado de componente vacío */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="clipboard-check" size={50} color={COLORS.primary} style={styles.emptyIcon} />
      <RNText style={styles.emptyTitle}>
        No hay rondas disponibles
      </RNText>
      <RNText style={styles.emptyText}>
        No hay rondas {activeTab === 'pendientes' ? 'pendientes' : 'terminadas'} en este momento.
      </RNText>
      <Button
        mode="contained"
        icon={({size, color}) => <FontAwesome5 name="sync" size={size-4} color={color} />}
        onPress={() => setRefresh(r => r + 1)}
        style={styles.emptyButton}
      >
        Actualizar
      </Button>
    </View>
  );

  /* render modal EditRonda ----------------------------------------------*/
  if (editing && selectedLoc !== null) {
    return (
      <EditRonda
        localidadId={selectedLoc}
        onSaved={() => {
          setRefresh(r => r + 1);
          setEditingRondaId(null);
          setSnackMessage('Orden actualizado correctamente');
          setSnackVisible(true);
        }}
        onClose={() => {
          setEditing(false);
          setEditingRondaId(null);
        }}
      />
    );
  }

  /* UI principal ---------------------------------------------------------*/
  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, style]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        
        {/* Cabecera con tabs */}
        <View style={styles.tabContainer}>
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pendientes' && styles.activeTab]}
              onPress={() => setActiveTab('pendientes')}
            >
              <RNText style={[styles.tabText, activeTab === 'pendientes' && styles.activeTabText]}>
                PENDIENTES
              </RNText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'terminados' && styles.activeTab]}
              onPress={() => setActiveTab('terminados')}
            >
              <RNText style={[styles.tabText, activeTab === 'terminados' && styles.activeTabText]}>
                TERMINADOS
              </RNText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actions}>
            <IconButton
              icon="magnify"
              size={24}
              iconColor="#000"
              onPress={() => {}} // Placeholder para búsqueda
            />
            <IconButton
              icon={refreshing ? "sync" : "refresh"}
              size={24}
              iconColor="#000"
              onPress={handleRefresh}
              disabled={refreshing}
            />
          </View>
        </View>
        
        {/* Lista de rondas con pull-to-refresh */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <RNText style={styles.loadingText}>Cargando rondas...</RNText>
          </View>
        ) : (
          <FlatList
            data={groupedRondas}
            renderItem={renderRondaSection}
            keyExtractor={item => `ronda-${item.rondaNumero}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary, COLORS.secondary]}
                tintColor={COLORS.primary}
                title="Actualizando..."
                titleColor={COLORS.primary}
              />
            }
          />
        )}
        
        {/* Botón Editar Orden */}
        {isClient && activeTab === 'pendientes' && groupedRondas.length > 0 && (
          <FAB
            icon={props => <FontAwesome5 name="edit" {...props} />}
            label="Editar orden"
            style={styles.fab}
            onPress={() => setEditing(true)}
            color="#fff"
          />
        )}
        
        {/* Snackbar para notificaciones */}
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={3000}
          style={styles.snackbar}
          action={{
            label: 'OK',
            onPress: () => setSnackVisible(false),
          }}
        >
          {snackMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
}

/* ---------- estilos premium para cliente ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Tabs de navegación
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
    }),
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: COLORS.primary,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.surface,
  },
  actions: {
    flexDirection: 'row',
  },
  
  // Sección de ronda
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rondaCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
    }),
  },
  rondaNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rondaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
    // Sombra sutíl para el texto
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      android: {
        elevation: 1,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  itemCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
    }),
  },
  itemCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Tarjetas de movimiento
  cardContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  lastCard: {
    borderBottomWidth: 0,
  },
  orderCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
    }),
  },
  orderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  divider: {
    height: 2,
    marginBottom: 12,
    borderRadius: 1,
  },
  
  // Diseño de dos columnas
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnLeft: {
    flex: 1,
    marginRight: 16,
  },
  columnRight: {
    flex: 1,
  },
  infoRow: {
    marginBottom: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  
  // Chips de estado
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
    }),
  },
  activeChip: {
    backgroundColor: COLORS.chipBackground,
  },
  inactiveChip: {
    backgroundColor: '#F5F5F5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeChipText: {
    color: COLORS.success,
  },
  inactiveChipText: {
    color: COLORS.textSecondary,
  },
  
  // Estados de carga y vacío
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  
  // Listado
  listContent: {
    paddingBottom: 80,
    minHeight: '100%',
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
    }),
  },
  
  // Snackbar
  snackbar: {
    backgroundColor: COLORS.primaryDark,
  },
 });