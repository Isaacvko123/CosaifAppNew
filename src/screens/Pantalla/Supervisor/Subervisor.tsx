import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import Menu from '../../../Component/Menu/Menu';

interface Movimiento {
  id: number;
  title: string;
  description: string;
  date: string;
}

const BASE_URL = 'http://192.168.101.20:4500';

const Supervisor: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRol, setUserRol] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [activeTab, setActiveTab] = useState<'pendientes' | 'terminados'>('pendientes');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMenu = useCallback(() => {
    setMenuVisible(prev => !prev);
  }, []);

  // Obtener datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const userObj = JSON.parse(userData);
          setUserName(userObj.nombre || '');
          setUserRol(userObj.rol || '');
          setEmpresa(userObj.empresa?.nombre || '');
        }
      } catch (err) {
        console.error('Error al cargar datos del usuario:', err);
      }
    };
    loadUser();
  }, []);

  // Obtener movimientos
  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Token no encontrado.');
          setLoading(false);
          return;
        }

        const endpoint =
          activeTab === 'pendientes'
            ? `${BASE_URL}/movimientos/pendientes`
            : `${BASE_URL}/movimientos/terminados`;

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener movimientos.');
        }

        const data = await response.json();
        setMovimientos(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron obtener los movimientos.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [activeTab]);

  const renderMovimiento = useCallback(({ item }: { item: Movimiento }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome5 name="clipboard-list" size={20} color="#007BFF" />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <Text style={styles.cardDate}>{item.date}</Text>
    </View>
  ), []);

  const showEmptyMessage = useMemo(() => {
    if (loading) return null;
    if (error) return error;
    if (movimientos.length === 0) {
      return activeTab === 'pendientes'
        ? 'En espera de movimientos'
        : 'Sin movimientos concluidos en el día';
    }
    return null;
  }, [loading, error, movimientos, activeTab]);

  return (
    <View style={styles.container}>
      {!menuVisible && (
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <FontAwesome5 name="bars" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {menuVisible ? (
        <Menu visible={menuVisible} onClose={toggleMenu} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.companyText}>{empresa}</Text>
            <Text style={styles.headerTitle}>{userRol}</Text>
          </View>

          <View style={styles.movimientosContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'pendientes' && styles.activeTab]}
                onPress={() => setActiveTab('pendientes')}
              >
                <Text style={[styles.tabText, activeTab === 'pendientes' && styles.activeTabText]}>
                  Pendientes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'terminados' && styles.activeTab]}
                onPress={() => setActiveTab('terminados')}
              >
                <Text style={[styles.tabText, activeTab === 'terminados' && styles.activeTabText]}>
                  Terminados
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Cargando movimientos...</Text>
              </View>
            ) : showEmptyMessage ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>{showEmptyMessage}</Text>
              </View>
            ) : (
              <FlatList
                data={movimientos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMovimiento}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default Supervisor;

// Estilos (igual que los tuyos pero podrías mover a archivo externo si crece)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#789cb3',
    padding: 10,
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#789cb3',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
    marginBottom: 20,
  },
  companyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  movimientosContainer: {
    flex: 1,
    backgroundColor: '#EEF2F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFF',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#007BFF',
  },
  cardDescription: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  cardDate: {
    fontSize: 14,
    color: '#777',
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007BFF',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  noDataText: {
    fontSize: 18,
    color: '#007BFF',
    fontWeight: 'bold',
  },
});
