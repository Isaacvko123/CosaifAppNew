import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  SectionListData,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  Pressable,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const BASE_URL = 'http://31.97.13.182:3000';

/* ✨ Paleta de colores mejorada */
const ACCENTS = [
  '#4C85E0', // Azul principal
  '#4CA5E0', // Celeste
  '#A3D9FF', // Azul claro
  '#73C088', // Verde suave
  '#9DDCAD', // Verde pastel
  '#8C9EE0'  // Lavanda
];
const SURFACE = '#FFFFFF';
const ELEVATION = Platform.OS === 'ios' ? 4 : 3;
const BACKGROUND_START = '#F8FCFF';
const BACKGROUND_END = '#EEF6FF';
const TEXT_PRIMARY = '#1A2B42';
const TEXT_SECONDARY = '#526580';
const TEXT_TERTIARY = '#758CA3';
const BORDER_COLOR = '#E5EBF5';

// Dimensiones de pantalla
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPACT_LAYOUT = SCREEN_WIDTH < 380; // Para ajustes en pantallas pequeñas

const getAccent = (n: number) => ACCENTS[(n - 1) % ACCENTS.length];

/* •••••••••••••••••• Tipos •••••••••••••••••• */
// Interfaces para tipado
interface Ronda {
  id: number;
  rondaNumero: number;
  orden: number;
  concluido: boolean;
  movimiento: { title: string; description: string; date: string };
}
interface Localidad { id: number; nombre: string }
interface RondaInfo {
  rondaId: number;
  rondaNumero: number;
  orden: number;
  empresa: { id: number; nombre: string };
  movimiento: {
    viaOrigen: { nombre: string };
    viaDestino: { nombre: string } | null;
    lavado: boolean;
    torno: boolean;
  };
}

/* ────────────────── Card Component ────────────────── */
// Card component with heavy memoization
interface CardProps {
  item: Ronda;
  infoMap: Record<number, RondaInfo>;
}

const Card = memo(({ item, infoMap }: CardProps) => {
  const color = getAccent(item.rondaNumero);
  const info = infoMap[item.id];
  
  // Determinar un color de fondo muy sutil basado en el color accent
  const subtleBackground = `${color}08`;

  return (
    <View style={[
      styles.card, 
      { borderLeftColor: color, backgroundColor: SURFACE }
    ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
          <FontAwesome5 name="clipboard-list" size={18} color={color} />
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.ordenText}>#{item.orden}</Text>
          <Text
            style={styles.cardTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.movimiento.title}
          </Text>
        </View>
      </View>

      <Text
        style={styles.cardDesc}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {item.movimiento.description}
      </Text>
      
      <Text style={styles.cardDate}>{item.movimiento.date}</Text>

      {info ? (
        <View style={[styles.detailBlock, { backgroundColor: subtleBackground }]}>
          <View style={styles.detailRow}>
            <FontAwesome5 name="building" size={12} color={TEXT_SECONDARY} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Empresa:</Text>
            <Text style={styles.detailValue}>{info.empresa.nombre}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="map-pin" size={12} color={TEXT_SECONDARY} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Origen:</Text>
            <Text style={styles.detailValue}>{info.movimiento.viaOrigen.nombre}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="map-marker-alt" size={12} color={TEXT_SECONDARY} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Destino:</Text>
            <Text style={styles.detailValue}>
              {info.movimiento.viaDestino?.nombre || 'Sin destino'}
            </Text>
          </View>
          
          <View style={styles.optionsRow}>
            <View style={styles.optionItem}>
              <FontAwesome5 
                name={info.movimiento.lavado ? "check-circle" : "times-circle"} 
                size={14} 
                color={info.movimiento.lavado ? "#5BBE88" : "#CBD5E0"} 
              />
              <Text style={styles.optionText}>Lavado</Text>
            </View>
            
            <View style={styles.optionItem}>
              <FontAwesome5 
                name={info.movimiento.torno ? "check-circle" : "times-circle"} 
                size={14} 
                color={info.movimiento.torno ? "#5BBE88" : "#CBD5E0"} 
              />
              <Text style={styles.optionText}>Torno</Text>
            </View>
          </View>
        </View>
      ) : (
        <ActivityIndicator
          style={styles.infoLoading}
          size="small"
          color={color}
        />
      )}
    </View>
  );
}, (prevProps: CardProps, nextProps: CardProps) => {
  // Custom comparison para evitar re-renderizados innecesarios
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.infoMap[prevProps.item.id] === nextProps.infoMap[nextProps.item.id]
  );
});

/* ────────────────── Header Compacto ────────────────── */
interface CompactHeaderProps {
  onRefresh: () => void;
  localidades: Localidad[];
  selectedLoc: number | null;
  setSelectedLoc: (id: number) => void;
  activeTab: 'pendientes' | 'terminados';
  handleTabChange: (tab: 'pendientes' | 'terminados') => void;
}

const CompactHeader = memo(({
  onRefresh,
  localidades,
  selectedLoc,
  setSelectedLoc,
  activeTab,
  handleTabChange
}: CompactHeaderProps) => {
  return (
    <View style={styles.compactHeader}>
      <View style={styles.headerRow}>
        <View style={styles.tabButtonsContainer}>
          {(['pendientes', 'terminados'] as const).map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.85}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => handleTabChange(tab)}
            >
              <FontAwesome5 
                name={tab === 'pendientes' ? 'clock' : 'check-circle'} 
                size={16} 
                color={activeTab === tab ? ACCENTS[idx] : TEXT_TERTIARY}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive,
                ]}
              >
                {tab === 'pendientes' ? 'PENDIENTES' : 'COMPLETADOS'}
              </Text>
            </TouchableOpacity>
          ))}
             </View>
        
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="sync-alt" size={16} color={ACCENTS[0]} />
        </TouchableOpacity>
      </View>
      
      {/* ScrollView horizontal para localidades */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.localidadesScroll}
      >
        {localidades.map((l) => (
          <Pressable
            android_ripple={{ color: '#E5E7EB', radius: 150 }}
            key={l.id}
            style={[
              styles.localidadChip,
              selectedLoc === l.id && styles.localidadChipActive,
            ]}
            onPress={() => setSelectedLoc(l.id)}
          >
            <Text
              style={[
                styles.localidadChipText,
                selectedLoc === l.id && styles.localidadChipTextActive,
              ]}
              numberOfLines={1}
            >
              {l.nombre}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

/* •••••••••••••••• Componente Principal •••••••••••••••• */
const RondaList: React.FC = () => {
  const insets = useSafeAreaInsets();


  const sectionListRef = useRef<SectionList<Ronda> | null>(null);
  
  /* Estado */
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<number | null>(null);
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [infoMap, setInfoMap] = useState<Record<number, RondaInfo>>({});
  const [activeTab, setActiveTab] = useState<'pendientes' | 'terminados'>('pendientes');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);

  /* ──────────────── Carga inicial ──────────────── */
  useEffect(() => {
    loadLocalidades();
    
    // Animación inicial de fade in
  
  }, []);

  const loadLocalidades = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/localidades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Localidad[] = await res.json();
      setLocalidades(data);
      if (data.length) setSelectedLoc(data[0].id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* ──────────────── Carga de rondas ──────────────── */
  const loadRondas = useCallback(async () => {
    if (selectedLoc == null) return;
    
    setLoading(!refreshing);
    setError(null);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const estado = activeTab === 'pendientes' ? 'false' : 'true';
      const res = await fetch(
        `${BASE_URL}/rondas/localidad/${selectedLoc}/estado/${estado}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data: Ronda[] = await res.json();
      setRondas(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLoc, activeTab, refreshing]);

  useEffect(() => {
    loadRondas();
  }, [loadRondas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRondas();
  }, [loadRondas]);

  /* ──────────────── Info detallada ──────────────── */
  useEffect(() => {
    if (!rondas.length) {
      setInfoMap({});
      return;
    }
    
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const map: Record<number, RondaInfo> = {};
      
      await Promise.all(
        rondas.map(async (r) => {
          try {
            const res = await fetch(
              `${BASE_URL}/movimientos/ronda/${r.id}/info`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            map[r.id] = await res.json();
          } catch {
            /* silent */
          }
        })
      );
      
      setInfoMap(map);
    })();
  }, [rondas]);

  /* ──────────────── Agrupado por rondaNumero ──────────────── */
  const sections = useMemo(() => {
    const grouped: Record<number, Ronda[]> = {};
    
    rondas.forEach((r) => {
      (grouped[r.rondaNumero] ||= []).push(r);
    });
    
    return Object.entries(grouped).map(([n, items]) => ({
      title: `Ronda ${n}`,
      data: items,
      color: getAccent(+n),
    }));
  }, [rondas]);

  /* ──────────────── Handlers ──────────────── */
  const handleSelectLocation = useCallback((id: number) => {
    // Evitamos re-renders innecesarios
    if (id === selectedLoc) return;
    
    // Feedback táctil en iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    
    setSelectedLoc(id);
    
    // Scroll al inicio cuando cambia la localidad
    if (sectionListRef.current) {
      setTimeout(() => {
        try {
          if (sectionListRef.current) {
            sectionListRef.current.scrollToLocation({
              sectionIndex: 0,
              itemIndex: 0,
              animated: true,
              viewOffset: 0,
            });
          }
        } catch (e) {
          console.warn('Error scrolling to top:', e);
        }
      }, 50);
    }
  }, [selectedLoc]);

  const handleTabChange = useCallback((tab: 'pendientes' | 'terminados') => {
    // Evitamos re-renders innecesarios
    if (tab === activeTab) return;
    
    // Feedback táctil en iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    
    setActiveTab(tab);
  }, [activeTab]);

  // Handler para ocultar/mostrar header en scroll
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldHideHeader = offsetY > 50;
    
    if (shouldHideHeader !== !headerVisible) {
      setHeaderVisible(!shouldHideHeader);
    }
  }, [headerVisible]);

  /* ──────────────── Renderizadores ──────────────── */
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<Ronda> }) => (
      <LinearGradient
        colors={[
          section.color ?? ACCENTS[0],
          `${section.color ?? ACCENTS[0]}99`
        ]}
        style={styles.sectionHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.sectionHeaderText}>
          {section.title}
        </Text>
      </LinearGradient>
    ),
    []
  );

  const renderItem = useCallback(
    (props: { item: Ronda }) => <Card {...props} infoMap={infoMap} />,
    [infoMap]
  );

  /* Placeholder cuando NO hay rondas */
  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <FontAwesome5 name="clipboard" size={42} color="#8CA2BC" />
      </View>
      <Text style={styles.emptyTitle}>Sin rondas para mostrar</Text>
      <Text style={styles.emptyText}>
        No hay rondas {activeTab === 'pendientes' ? 'pendientes' : 'completadas'} en esta localidad.
      </Text>
      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={onRefresh}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="sync-alt" size={14} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );

  /* ────────────────── UI ────────────────── */
  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_START} />

      <LinearGradient
        colors={[BACKGROUND_START, BACKGROUND_END]}
        style={styles.container}
      >
        {/* Header Compacto - Contiene título, filtros y localidades en un diseño eficiente */}
        <CompactHeader
          onRefresh={onRefresh}
          localidades={localidades}
          selectedLoc={selectedLoc}
          setSelectedLoc={handleSelectLocation}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENTS[0]} />
            <Text style={styles.loadingText}>Cargando rondas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={24} color="#FC8181" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={loadRondas}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ flex: 1,  }}>
            <SectionList
              ref={sectionListRef}
              sections={sections}
              keyExtractor={(i) => i.id.toString()}
              renderSectionHeader={renderSectionHeader}
              renderItem={renderItem}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 20 },
                !sections.length && styles.emptyListContent
              ]}
              ListEmptyComponent={ListEmpty}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[ACCENTS[0]]}
                  tintColor={ACCENTS[0]}
                />
              }
              // Optimizaciones de rendimiento
              maxToRenderPerBatch={4}
              windowSize={8}
              removeClippedSubviews={Platform.OS === 'android'}
              initialNumToRender={8}
              updateCellsBatchingPeriod={50}
              onEndReachedThreshold={0.5}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
            />
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
};

/* •••••••••••••••••• Estilos •••••••••••••••••• */
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: BACKGROUND_START 
  },
  container: { 
    flex: 1 
  },
  
  /* Header Compacto */
  compactHeader: {
    backgroundColor: SURFACE,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 224, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 242, 248, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 6,
    minWidth: 120,
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(236, 242, 248, 1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: TEXT_PRIMARY,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 133, 224, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  /* Localidades ScrollView */
  localidadesScroll: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  localidadChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(236, 242, 248, 0.6)',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 224, 0.3)',
  },
  localidadChipActive: {
    backgroundColor: SURFACE,
    borderColor: ACCENTS[0],
    ...Platform.select({
      ios: {
        shadowColor: ACCENTS[0],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  localidadChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  localidadChipTextActive: {
    color: ACCENTS[0],
    fontWeight: '600',
  },

  /* Lista */
  listContent: { 
    paddingHorizontal: 16 
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  /* Card */
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
      },
      android: { 
        elevation: ELEVATION, 
        borderWidth: 1, 
        borderColor: BORDER_COLOR,
      },
    }),
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBlock: { 
    marginLeft: 12, 
    flex: 1 
  },
  ordenText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: TEXT_TERTIARY,
    letterSpacing: 0.2,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: TEXT_PRIMARY, 
    marginTop: 1,
    letterSpacing: -0.2
  },
  cardDesc: { 
    fontSize: 14, 
    color: TEXT_SECONDARY, 
    marginVertical: 6, 
    lineHeight: 20
  },
  cardDate: { 
    fontSize: 12, 
    color: TEXT_TERTIARY, 
    textAlign: 'right',
    marginTop: 2,
  },

  detailBlock: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detailIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8
  },
  detailLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    width: 70,
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    flex: 1,
    fontWeight: '500'
  },
  optionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)'
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  optionText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginLeft: 6,
    fontWeight: '500'
  },
  infoLoading: { 
    marginTop: 14 
  },

  /* Global */
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 10,
    color: TEXT_SECONDARY,
    fontSize: 14
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: { 
    color: '#E53E3E', 
    fontSize: 14, 
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center' 
  },
  primaryButton: {
    backgroundColor: ACCENTS[0],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: ACCENTS[0],
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: { elevation: 4 },
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },

  /* Placeholder */
  emptyWrap: { 
    alignItems: 'center', 
    paddingVertical: 50 
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(243, 250, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: { 
    fontSize: 14, 
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  }
});

export default memo(RondaList);