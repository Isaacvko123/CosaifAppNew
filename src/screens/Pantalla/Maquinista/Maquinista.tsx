import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Menu from '../../../Component/Menu/Menu';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/Navigation'; // Manteniendo la ruta original

// Tipos
interface User {
  empresa: { nombre: string };
  token: string;
  localidadId?: number;
}

interface Movimiento {
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
}

// Tipos para navegación
type MaquinistaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Maquinista'>;

interface MaquinistaProps {
  navigation: MaquinistaScreenNavigationProp;
}

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
  ERROR: '#EF4444',
  WHITE: '#FFFFFF'
};

const API_BASE_URL = 'http://10.10.10.6:3000';

const Maquinista: React.FC<MaquinistaProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Obtener siguiente movimiento
  const fetchNextMovement = useCallback(async (userData: User) => {
    if (!userData.localidadId) return;
    setFetching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/rondas/localidad/${userData.localidadId}/siguiente`,
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );
      if (!res.ok) throw new Error('Falló la consulta');
      const data = await res.json();
      setMovimiento(data.movimiento ? transformMovementData(data) : null);
    } catch (err) {
      setMovimiento(null);
    } finally {
      setFetching(false);
    }
  }, []);
  
  const loadInitialData = useCallback(async () => {
    try {
      const [userStr, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token')
      ]);
      if (!userStr || !token) throw new Error('Sesión inválida');
      const parsed = JSON.parse(userStr);
      const userData: User = {
        empresa: parsed.empresa,
        token,
        localidadId: parsed.localidadId
      };
      setUser(userData);
      await fetchNextMovement(userData);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la sesión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchNextMovement]);
  
  const transformMovementData = (data: any): Movimiento => {
    const m = data.movimiento;
    const viaDestinoNombre =
      m.viaDestino?.nombre ?? (m.lavado ? 'Lavado' : m.torno ? 'Torno' : null);
    return {
      id: m.id,
      locomotora: m.locomotiveNumber ?? 0,
      cliente: m.empresa?.nombre ?? 'N/A',
      posicionCabina: m.posicionCabina ?? 'Sin dato',
      posicionChimenea: m.posicionChimenea ?? 'Sin dato',
      tipoMovimiento: m.tipoMovimiento ?? 'Sin dato',
      direccionEmpuje: m.direccionEmpuje ?? 'N/A',
      prioridad: m.prioridad ?? 'N/A',
      lavado: m.lavado ?? false,
      torno: m.torno ?? false,
      fechaSolicitud: new Date(m.fechaSolicitud).toLocaleString(),
      viaOrigen: m.viaOrigen?.nombre ?? 'N/A',
      viaDestino: viaDestinoNombre,
      rondaNumero: data.rondaNumero ?? 0,
      orden: data.orden ?? 0,
    };
  };
  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadInitialData();
  }, [loadInitialData]);
  
  const handleStartMovement = useCallback(async () => {
    if (!movimiento || !user) {
      Alert.alert("Error", "No hay movimiento disponible o sesión inválida.");
      return;
    }
  
    try {
      // 🧠 Verifica el contenido de AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
   
      if (!userStr) throw new Error('Usuario no encontrado');
  
      const parsed = JSON.parse(userStr);
      const operadorId = parsed.id;
  
      const response = await fetch(
        `${API_BASE_URL}/movimientos/${movimiento.id}/iniciar`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            operadorId: operadorId,
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error('No se pudo iniciar el movimiento');
      }
  
      const result = await response.json();
  
      navigation.navigate('MovimientoP', {
        movimientoId: movimiento.id.toString(),
        locomotora: movimiento.locomotora.toString(),
      });
  
    } catch (error) {
       Alert.alert("Error", "No se pudo iniciar el movimiento. Intenta nuevamente.");
    }
  }, [movimiento, user, navigation]);
  
  const toggleMenu = useCallback(() => setMenuVisible(v => !v), []);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const renderDataRow = (icon: string, label: string, value: string | number) => (
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
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY_RED} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK_RED} />
      <View style={styles.container}>

        {!menuVisible && (
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Control de Locomotoras</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.refreshButton}
              disabled={fetching}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={COLORS.WHITE}
                style={fetching && styles.refreshingIcon}
              />
            </TouchableOpacity>
          </View>
        )}

        {menuVisible && <Menu visible={menuVisible} onClose={toggleMenu} />}

        {!menuVisible && (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.PRIMARY_RED]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {movimiento ? (
              <View style={styles.card}>
                <LinearGradient
                  colors={[COLORS.PRIMARY_RED, COLORS.DARK_RED]}
                  style={styles.cardHeader}
                >
                  <View style={styles.cardTitleRow}>
                    <FontAwesome5 name="train" size={20} color={COLORS.WHITE} />
                    <Text style={styles.cardTitle}>
                      Locomotora #{movimiento.locomotora}
                    </Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Ronda #{movimiento.rondaNumero} • Orden {movimiento.orden}
                  </Text>
                </LinearGradient>

                <View style={styles.cardBody}>
                  {renderDataRow('building', 'Cliente', movimiento.cliente)}
                  {renderDataRow(
                    'exchange-alt',
                    'Movimiento',
                    `${movimiento.tipoMovimiento} (${movimiento.direccionEmpuje})`
                  )}
                  {renderDataRow('flag', 'Prioridad', movimiento.prioridad)}
                  {renderDataRow('door-open', 'Cabina', movimiento.posicionCabina)}
                  {renderDataRow(
                    'industry',
                    'Chimenea',
                    movimiento.posicionChimenea
                  )}
                  {renderDataRow(
                    'map-pin',
                    'Vía Origen',
                    movimiento.viaOrigen
                  )}
                  {renderDataRow(
                    'map-marker-alt',
                    'Vía Destino',
                    movimiento.viaDestino ?? 'N/A'
                  )}

                  <View style={styles.dateContainer}>
                    <FontAwesome5
                      name="clock"
                      size={14}
                      color={COLORS.NEUTRAL_700}
                    />
                    <Text style={styles.dateText}>
                      Solicitud: {movimiento.fechaSolicitud}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleStartMovement}
                  style={styles.actionButton}
                  activeOpacity={0.8}
                >
                  <FontAwesome5
                    name="play-circle"
                    size={18}
                    color={COLORS.WHITE}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.actionButtonText}>
                    Iniciar Movimiento
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState onRefresh={handleRefresh} />
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

// EmptyState Component
const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconCircle}>
      <FontAwesome5 name="inbox" size={32} color={COLORS.PRIMARY_RED} />
    </View>
    <Text style={styles.emptyTitle}>Sin Movimientos Pendientes</Text>
    <Text style={styles.emptyText}>
      No hay movimientos programados para este momento. Intenta refrescar para ver nuevos movimientos.
    </Text>
    <TouchableOpacity
      style={styles.refreshActionButton}
      onPress={onRefresh}
      activeOpacity={0.8}
    >
      <Text style={styles.refreshActionButtonText}>Refrescar</Text>
    </TouchableOpacity>
  </View>
);

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT_RED,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.PRIMARY_RED,
    fontWeight: '500',
  },
  header: {
    backgroundColor: COLORS.PRIMARY_RED,
    paddingTop: 12,
    paddingBottom: 12,
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
  menuButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  refreshingIcon: {
    opacity: 0.5,
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
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.NEUTRAL_900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
    backgroundColor: COLORS.NEUTRAL_100,
    padding: 12,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: COLORS.NEUTRAL_700,
    marginBottom: 8,
  },
  optionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  badgeInactive: {
    backgroundColor: COLORS.ERROR,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
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
  actionButton: {
    backgroundColor: COLORS.PRIMARY_RED,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.NEUTRAL_900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.LIGHT_RED,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK_RED,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.NEUTRAL_700,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshActionButton: {
    backgroundColor: COLORS.PRIMARY_RED,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshActionButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Maquinista;