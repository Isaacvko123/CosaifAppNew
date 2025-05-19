// EditRonda.tsx - Versión corregida completa
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar, 
  Alert, 
  Platform, 
  FlatList, 
  Animated,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  IconButton,
  Surface,
  Snackbar,
} from 'react-native-paper';

const { width } = Dimensions.get('window');

/* ---------- constantes y tema ---------- */
const BASE_URL = 'http://10.10.10.6:3000';

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
  shadow: 'rgba(0,0,0,0.1)',  // Color de sombra
};

// Colores por ronda
const getRondaColor = (number: number) => {
  const colors = [
    { primary: '#0284c7', secondary: '#bae6fd', gradient: ['#0284c7', '#0ea5e9'] }, // Azul
    { primary: '#6366f1', secondary: '#c7d2fe', gradient: ['#6366f1', '#818cf8'] }, // Índigo
    { primary: '#f97316', secondary: '#fed7aa', gradient: ['#f97316', '#fb923c'] }, // Naranja
    { primary: '#10b981', secondary: '#a7f3d0', gradient: ['#10b981', '#34d399'] }, // Esmeralda
    { primary: '#8b5cf6', secondary: '#ddd6fe', gradient: ['#8b5cf6', '#a78bfa'] }, // Violeta
    { primary: '#ec4899', secondary: '#fbcfe8', gradient: ['#ec4899', '#f472b6'] }, // Rosa
  ];
  return colors[(number - 1) % colors.length];
};

// Tema de Paper
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

/* ---------- modelos ---------- */
export interface Ronda {
  id: number; 
  rondaNumero: number; 
  orden: number; 
  concluido: boolean;
  movimiento: {
    title: string;
    description: string;
    date: string;
    numLocomotora?: string;
  };
}

interface InfoExtra {
  empresa: { id: number; nombre: string };
  movimiento: {
    viaOrigen: { nombre: string };
    viaDestino: { nombre: string | null };
    lavado: boolean; 
    torno: boolean;
  };
}

/* ---------- props ---------- */
interface Props {
  localidadId: number;
  onClose: () => void;
  onSaved?: () => void;
}

/* ---------- componente principal ---------- */
export default function EditRonda({ localidadId, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const [user, setUser] = useState<{ token: string; empresaId: number } | null>(null);
  const [list, setList] = useState<Ronda[]>([]);
  const [infoMap, setInfoMap] = useState<Record<number, InfoExtra>>({});
  const [loading, setLoading] = useState(true);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [groupedByRonda, setGroupedByRonda] = useState<Record<number, Ronda[]>>({});

  // Animación de entrada de componentes
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  /* -------- carga inicial ---------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [uStr, token] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
        ]);
        if (!uStr || !token) throw new Error('Sesión expirada');
        const u = JSON.parse(uStr);
        setUser({ token, empresaId: u.empresaId });

        /* 1️⃣ rondas pendientes de la localidad */
        const rRes = await fetch(
          `${BASE_URL}/rondas/localidad/${localidadId}/estado/false`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const rondas: Ronda[] = await rRes.json();

        /* 2️⃣ info adicional por ronda */
        const extra: Record<number, InfoExtra> = {};
        await Promise.all(
          rondas.map(async r => {
            try {
              const res = await fetch(
                `${BASE_URL}/movimientos/ronda/${r.id}/info`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const info = await res.json();
              extra[r.id] = info;
            } catch (err) {
              console.warn(`⚠️  Error cargando info de la ronda ${r.id}:`, err);
            }
          })
        );
        setInfoMap(extra);

        /* 3️⃣ filtra solo las de la empresa del usuario */
        const propias = rondas
          .filter(r => extra[r.id]?.empresa.id === u.empresaId)
          .sort((a, b) => (a.rondaNumero - b.rondaNumero) || (a.orden - b.orden));

        setList(propias);
        
        // Agrupar por número de ronda
        const grouped: Record<number, Ronda[]> = {};
        propias.forEach(ronda => {
          if (!grouped[ronda.rondaNumero]) {
            grouped[ronda.rondaNumero] = [];
          }
          grouped[ronda.rondaNumero].push(ronda);
        });
        setGroupedByRonda(grouped);
        
      } catch (e: any) {
        Alert.alert('Error', e.message || 'No se pudieron cargar los datos');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [localidadId]);

  /* -------- helpers de orden ------------------------------------------- */
  const swap = async (rondaId: number, i: number, j: number) => {
    if (!user) return;
    
    // Encontrar la lista específica de la ronda
    const rondaItems = [...(groupedByRonda[rondaId] || [])];
    if (i < 0 || j < 0 || i >= rondaItems.length || j >= rondaItems.length) return;
    
    const a = rondaItems[i];
    const b = rondaItems[j];
    if (!a || !b) return;

    // Actualizar estado local primero para UI inmediata
    setGroupedByRonda(prev => {
      const newGrouped = { ...prev };
      
      // Intercambiar elementos en la lista de esa ronda
      const newRondaItems = [...rondaItems];
      [newRondaItems[i], newRondaItems[j]] = [newRondaItems[j], newRondaItems[i]];
      
      // Actualizar órdenes
      [newRondaItems[i].orden, newRondaItems[j].orden] = [newRondaItems[j].orden, newRondaItems[i].orden];
      
      // Actualizar el grupo
      newGrouped[rondaId] = newRondaItems;
      
      return newGrouped;
    });

    // También actualizar la lista plana
    setList(prev => {
      const newList = [...prev];
      const aIndex = newList.findIndex(item => item.id === a.id);
      const bIndex = newList.findIndex(item => item.id === b.id);
      
      if (aIndex !== -1 && bIndex !== -1) {
        [newList[aIndex].orden, newList[bIndex].orden] = [newList[bIndex].orden, newList[aIndex].orden];
      }
      
      return newList.sort((x, y) => 
        (x.rondaNumero - y.rondaNumero) || (x.orden - y.orden)
      );
    });

    try {
      // Guardar en el backend
      await Promise.all([
        fetch(`${BASE_URL}/rondas/${a.id}/orden`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ orden: b.orden })
        }),
        fetch(`${BASE_URL}/rondas/${b.id}/orden`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ orden: a.orden })
        }),
      ]);
      
      setSnackMessage("Orden actualizado correctamente");
      setSnackVisible(true);
    } catch (err) {
      console.warn('❌  Error guardando nuevo orden', err);
      Alert.alert('Error', 'No se pudo guardar el nuevo orden');
    }
  };

  const moveUp = useCallback((rondaId: number, index: number) => swap(rondaId, index, index - 1), [swap, groupedByRonda, user]);
  const moveDown = useCallback((rondaId: number, index: number) => swap(rondaId, index, index + 1), [swap, groupedByRonda, user]);

  /* -------- componente de tarjeta de ronda ----------------------------- */
  const RondaCard = useCallback(({ 
    ronda, 
    index, 
    color, 
    info, 
    isFirst, 
    isLast,
    onMoveUp,
    onMoveDown
  }: {
    ronda: Ronda;
    index: number;
    color: any;
    info?: InfoExtra;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
  }) => {
    // Animación para el efecto de arrastrar
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View 
        style={[
          styles.cardWrapper,
          isFirst && styles.firstCard,
          isLast && styles.lastCard,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Surface style={[styles.card, { borderLeftColor: color.primary }]} elevation={2}>
          {/* Cabecera */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Surface style={[styles.orderBadge, { backgroundColor: color.secondary }]}>
                <Text style={[styles.orderNumber, { color: color.primary }]}>
                  {ronda.orden}
                </Text>
              </Surface>
              
              <View style={styles.titleTextContainer}>
                <View style={styles.titleRow}>
                  <FontAwesome5 name="train" size={14} color={color.primary} style={styles.titleIcon} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {ronda.movimiento.title}
                  </Text>
                </View>
                <Text style={styles.dateText}>{ronda.movimiento.date}</Text>
              </View>
            </View>
            
            {/* Botones para mover */}
            <View style={styles.actionsContainer}>
              <IconButton
                icon="arrow-up"
                size={20}
                iconColor={isFirst ? COLORS.textSecondary : color.primary}
                style={styles.actionButton}
                disabled={isFirst}
                onPress={onMoveUp}
              />
              <IconButton
                icon="arrow-down"
                size={20}
                iconColor={isLast ? COLORS.textSecondary : color.primary}
                style={styles.actionButton}
                disabled={isLast}
                onPress={onMoveDown}
              />
            </View>
          </View>
          
          {/* Descripción */}
          <Text style={styles.cardDescription} numberOfLines={2}>
            {ronda.movimiento.description}
          </Text>
          
          {/* Información adicional */}
          {info && (
            <View style={styles.infoContainer}>
              <LinearGradient
                colors={[`${color.primary}20`, `${color.primary}10`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.divider}
              />
              
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <View style={styles.infoItem}>
                    <FontAwesome5 name="map-pin" size={12} color={color.primary} style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Origen</Text>
                      <Text style={styles.infoValue}>{info.movimiento.viaOrigen.nombre}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <FontAwesome5 name="map-marker-alt" size={12} color={color.primary} style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Destino</Text>
                      <Text style={styles.infoValue}>{info.movimiento.viaDestino?.nombre || '—'}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.infoColumn}>
                  <View style={styles.statusItem}>
                    <FontAwesome5 
                      name={info.movimiento.lavado ? "check-circle" : "times-circle"} 
                      size={14} 
                      color={info.movimiento.lavado ? COLORS.success : COLORS.textSecondary} 
                      style={styles.statusIcon} 
                    />
                    <Text style={[
                      styles.statusText,
                      info.movimiento.lavado ? styles.statusActive : styles.statusInactive
                    ]}>Lavado</Text>
                  </View>
                  
                  <View style={styles.statusItem}>
                    <FontAwesome5 
                      name={info.movimiento.torno ? "check-circle" : "times-circle"} 
                      size={14} 
                      color={info.movimiento.torno ? COLORS.success : COLORS.textSecondary} 
                      style={styles.statusIcon} 
                    />
                    <Text style={[
                      styles.statusText,
                      info.movimiento.torno ? styles.statusActive : styles.statusInactive
                    ]}>Torno</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Surface>
      </Animated.View>
    );
  }, []);

  /* -------- renderizado de secciones ------------------------------------ */
  const renderRondaSection = useCallback(({ item, index }: { item: any, index: number }) => {
    const color = getRondaColor(item.rondaNumero);
    
    return (
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
          colors={color.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionLeft}>
            <View style={styles.rondaCircle}>
              <Text style={styles.rondaNumberText}>{item.rondaNumero}</Text>
            </View>
            <Text style={styles.rondaText}>Ronda</Text>
          </View>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>{item.items.length}</Text>
          </View>
        </LinearGradient>
        
        {/* Lista de items en esta ronda */}
        {item.items.map((ronda: Ronda, rondaIndex: number) => (
          <RondaCard
            key={ronda.id}
            ronda={ronda}
            index={rondaIndex}
            color={color}
            info={infoMap[ronda.id]}
            isFirst={rondaIndex === 0}
            isLast={rondaIndex === item.items.length - 1}
            onMoveUp={() => moveUp(item.rondaNumero, rondaIndex)}
            onMoveDown={() => moveDown(item.rondaNumero, rondaIndex)}
          />
        ))}
      </Animated.View>
    );
  }, [RondaCard, fadeAnim, infoMap, moveDown, moveUp]);

  /* -------- preparar datos para el FlatList ----------------------------- */
  const sectionData = useMemo(() => {
    return Object.entries(groupedByRonda).map(([rondaNum, items]) => ({
      rondaNumero: parseInt(rondaNum),
      items: items.sort((a, b) => a.orden - b.orden),
    })).sort((a, b) => a.rondaNumero - b.rondaNumero);
  }, [groupedByRonda]);

  /* -------- UI principal ----------------------------------------------- */
  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando rondas...</Text>
          </View>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        
        {/* Cabecera */}
        <LinearGradient 
          colors={[COLORS.primary, COLORS.primaryDark]} 
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor="#FFF"
              size={24}
              onPress={onClose}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Ordena tus rondas</Text>
            <View style={{ width: 40 }} /> {/* Espacio para equilibrar */}
          </View>
        </LinearGradient>
        
        {/* Instrucciones */}
        <View style={styles.instructionsContainer}>
          <FontAwesome5 name="info-circle" size={16} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.instructionsText}>
            Usa las flechas para reordenar los movimientos según tu preferencia
          </Text>
        </View>
        
        {/* Lista de rondas */}
        <FlatList
          data={sectionData}
          renderItem={renderRondaSection}
          keyExtractor={item => `ronda-${item.rondaNumero}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 }
          ]}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Botón flotante para guardar */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => { 
                setSnackMessage("Cambios guardados correctamente");
                setSnackVisible(true);
                setTimeout(() => {
                  onSaved?.(); 
                  onClose();
                }, 1000);
              }}
            >
              <FontAwesome5 name="check" size={18} color="#FFF" />
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        {/* Snackbar para notificaciones */}
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={2000}
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

/* ---------- estilos premium ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Cabecera
  header: {
    paddingVertical: 16,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    // Sombra sutil para mejorar legibilidad
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
  
  // Instrucciones
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  infoIcon: {
    marginRight: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  
  // Secciones
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rondaCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rondaNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rondaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  itemCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Tarjetas
  cardWrapper: {
    padding: 8,
  },
  firstCard: {
    paddingTop: 12,
  },
  lastCard: {
    paddingBottom: 12,
  },
  card: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: -4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 6,
    lineHeight: 20,
  },
  
  // Información adicional
  infoContainer: {
    marginTop: 10,
  },
  divider: {
    height: 2,
    borderRadius: 1,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusActive: {
    color: COLORS.success,
  },
  statusInactive: {
    color: COLORS.textSecondary,
  },
  
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
   marginTop: 16,
   fontSize: 16,
   color: COLORS.textSecondary,
 },
 
 // Lista
 listContent: {
   paddingTop: 8,
 },
 
 // Botón de guardar
 buttonContainer: {
   position: 'absolute',
   bottom: 16,
   left: 16,
   right: 16,
 },
 gradientButton: {
   borderRadius: 30,
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
 saveButton: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'center',
   paddingVertical: 14,
   paddingHorizontal: 24,
 },
 saveButtonText: {
   color: '#FFF',
   fontSize: 16,
   fontWeight: 'bold',
   marginLeft: 10,
 },
 
 // Snackbar
 snackbar: {
   backgroundColor: COLORS.primaryDark,
 },
});