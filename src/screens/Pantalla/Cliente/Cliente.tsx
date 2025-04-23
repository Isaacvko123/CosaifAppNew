import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  FlatList,
  ActivityIndicator,
  LogBox,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import Menu from '../../../Component/Menu/Menu';

LogBox.ignoreAllLogs(true);

interface Pedido {
  id: number;
  title: string;
  description: string;
  date: string;
}

const Cliente: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userRol, setUserRol] = useState<string>('');  
  const [empresa, setEmpresa] = useState<string>(''); // Almacena el nombre de la empresa
  const [activeTab, setActiveTab] = useState<'pendientes' | 'completados'>('pendientes');
  const [pendientes, setPendientes] = useState<Pedido[]>([]);
  const [completados, setCompletados] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState<boolean>(true);

  const toggleMenu = (event?: GestureResponderEvent) => {
    setMenuVisible(!menuVisible);
  };

  // Obtener nombre, rol y empresa del usuario desde AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('user')
      .then((userData) => {
        if (userData) {
          const userObj = JSON.parse(userData);
          setUserName(userObj.nombre || '');
          setUserRol(userObj.rol || '');
          if (userObj.empresa && userObj.empresa.nombre) {
            setEmpresa(userObj.empresa.nombre);
          }
        }
      })
      .catch((err) => console.error('Error al obtener datos del usuario:', err));
  }, []);

  // Cargar pedidos reales desde el backend (reemplaza las URL según corresponda)
  useEffect(() => {
    const fetchPedidos = async () => {
      setLoadingPedidos(true);
      try {
        // Obtener el token JWT guardado
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No se encontró token');
          setLoadingPedidos(false);
          return;
        }

        // Construir la URL según la pestaña activa
        const endpoint =
          activeTab === 'pendientes'
            ? 'http://<tu-ip-o-dominio>:4500/pedidos/pendientes'
            : 'http://<tu-ip-o-dominio>:4500/pedidos/completados';

        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (activeTab === 'pendientes') {
          setPendientes(data);
        } else {
          setCompletados(data);
        }
      } catch (error) {
        console.error('Error al obtener pedidos:', error);
      } finally {
        setLoadingPedidos(false);
      }
    };

    fetchPedidos();
  }, [activeTab]);

  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome5 name="clipboard-list" size={20} color="#74C69D" />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <Text style={styles.cardDate}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Muestra el ícono de menú (hamburguesa) solo cuando el menú no está visible */}
      {!menuVisible && (
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <FontAwesome5 name="bars" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {menuVisible ? (
        // Muestra el componente Menu cuando el menú está visible
        <Menu visible={menuVisible} onClose={toggleMenu} />
      ) : (
        <>
          <View style={styles.header}>
           <Text style={styles.companyText}>{userRol}  </Text>
            <Text style={styles.companyText}>{empresa}</Text>
          
            
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'pendientes' && styles.activeTab]}
                onPress={() => setActiveTab('pendientes')}
              >
                <Text style={[styles.tabText, activeTab === 'pendientes' && styles.activeTabText]}>
                  Pedidos Pendientes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'completados' && styles.activeTab]}
                onPress={() => setActiveTab('completados')}
              >
                <Text style={[styles.tabText, activeTab === 'completados' && styles.activeTabText]}>
                  Pedidos Completados
                </Text>
              </TouchableOpacity>
            </View>

            {loadingPedidos ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#74C69D" />
                <Text style={styles.loadingText}>Cargando pedidos...</Text>
              </View>
            ) : activeTab === 'pendientes' && pendientes.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No hay pedidos pendientes</Text>
              </View>
            ) : activeTab === 'completados' && completados.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No hay pedidos completados</Text>
              </View>
            ) : (
              <FlatList
                data={activeTab === 'pendientes' ? pendientes : completados}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPedido}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default Cliente;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9F5EB',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#74C69D',
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
    color: '#2D6A4F',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#2D6A4F',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFF',
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
    borderColor: '#74C69D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#74C69D',
  },
  tabText: {
    color: '#74C69D',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    color: '#74C69D',
  },
  cardDescription: {
    fontSize: 16,
    marginBottom: 10,
    color: '#2D6A4F',
  },
  cardDate: {
    fontSize: 14,
    color: '#777',
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#74C69D',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    color: '#74C69D',
    fontWeight: 'bold',
  },
});
