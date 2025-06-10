import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import Menu from '../../../Component/Menu/Menu';

interface User {
  empresa: { nombre: string };
  token: string;
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
  viaDestino: string;
  rondaNumero: number;
  orden: number;
}

const PRIMARY_RED = '#C53030';
const LIGHT_RED = '#FEE2E2';
const DARK_RED = '#7F1D1D';

const Maquinista: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (!userStr || !token) {
          Alert.alert('Error', 'No se pudo cargar la sesión');
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(userStr);
        const usr: User = { empresa: parsed.empresa, token };
        setUser(usr);

        await fetchSiguiente(usr);
      } catch (err) {
        Alert.alert('Error', 'Hubo un problema al cargar el usuario');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchSiguiente = async (usr: User) => {
    setFetching(true);
    try {
      const parsedUser = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      const localidadId = parsedUser.localidadId;

      const res = await fetch(`http://31.97.13.182:3000/rondas/localidad/${localidadId}/siguiente`, {
        headers: { Authorization: `Bearer ${usr.token}` },
      });

      if (!res.ok) throw new Error('Error al consultar el siguiente en ronda');

      const ronda = await res.json();

      if (ronda?.movimiento) {
        setMovimiento({
          id: ronda.movimiento.id,
          locomotora: ronda.movimiento.locomotiveNumber ?? '??',
          cliente: ronda.movimiento.empresa?.nombre ?? 'N/A',
          posicionCabina: ronda.movimiento.posicionCabina ?? 'Sin dato',
          posicionChimenea: ronda.movimiento.posicionChimenea ?? 'Sin dato',
          tipoMovimiento: ronda.movimiento.tipoMovimiento ?? 'Sin dato',
          direccionEmpuje: ronda.movimiento.direccionEmpuje ?? 'N/A',
          prioridad: ronda.movimiento.prioridad ?? 'N/A',
          lavado: ronda.movimiento.lavado ?? false,
          torno: ronda.movimiento.torno ?? false,
          fechaSolicitud: new Date(ronda.movimiento.fechaSolicitud).toLocaleString(),
          viaOrigen: ronda.movimiento.viaOrigen?.nombre ?? 'N/A',
          viaDestino: ronda.movimiento.viaDestino?.nombre ?? 'No asignada',
          rondaNumero: ronda.rondaNumero ?? 0,
          orden: ronda.orden ?? 0,
        });
      } else {
        setMovimiento(null);
      }
    } catch (err) {
      console.error('❌ Error al obtener siguiente en ronda:', err);
      setMovimiento(null);
    } finally {
      setFetching(false);
    }
  };

  const iniciarMovimiento = () => {
    Alert.alert('✅ Movimiento Iniciado', 'Comienza con precaución.');
    // Aquí podrías llamar a una API para marcar el inicio del movimiento
  };

  const toggleMenu = useCallback(() => setMenuVisible(prev => !prev), []);

  if (loading)
    return <ActivityIndicator style={styles.center} size="large" color={PRIMARY_RED} />;

  return (
    <View style={styles.container}>
      {!menuVisible && (
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <FontAwesome5 name="bars" size={20} color={DARK_RED} />
        </TouchableOpacity>
      )}
      {menuVisible && <Menu visible={menuVisible} onClose={toggleMenu} />}

      {!menuVisible && (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {movimiento ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🚆 Locomotora #{movimiento.locomotora}</Text>
              <Text style={styles.cardDesc}>
                🧾 Cliente: {movimiento.cliente}{"\n"}
                🔄 Movimiento: {movimiento.tipoMovimiento} ({movimiento.direccionEmpuje}){"\n"}
                🏷️ Prioridad: {movimiento.prioridad}{"\n"}
                🚪 Cabina: {movimiento.posicionCabina}{"\n"}
                🏭 Chimenea: {movimiento.posicionChimenea}{"\n"}
                🛤️ Vía Origen: {movimiento.viaOrigen}{"\n"}
                🛤️ Vía Destino: {movimiento.viaDestino}{"\n"}
                🧼 Lavado: {movimiento.lavado ? '✅' : '❌'}     🛠️ Torno: {movimiento.torno ? '✅' : '❌'}
              </Text>
              <Text style={styles.cardDate}>🕒 Solicitud: {movimiento.fechaSolicitud}</Text>
              <Text style={styles.cardDate}>🔁 Ronda #{movimiento.rondaNumero} · Orden {movimiento.orden}</Text>

              <TouchableOpacity onPress={iniciarMovimiento} style={styles.button}>
                <Text style={styles.buttonText}>Iniciar Movimiento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <FontAwesome5 name="inbox" size={36} color={DARK_RED} />
              <Text style={styles.emptyText}>No hay más movimientos</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default Maquinista;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_RED,
    padding: 16,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: PRIMARY_RED,
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
    elevation: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: DARK_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY_RED,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 16,
    color: DARK_RED,
    marginBottom: 12,
    lineHeight: 24,
  },
  cardDate: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'right',
    marginBottom: 10,
  },
  button: {
    backgroundColor: PRIMARY_RED,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: DARK_RED,
  },
});
