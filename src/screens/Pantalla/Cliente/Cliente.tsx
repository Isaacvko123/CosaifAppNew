import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Menu from '../../../Component/Menu/Menu';
import MovimientoList from './MovimientoList';

interface User {
  empresa: { nombre: string };
  nombre: string;
}

// Paleta de colores verde profesional
const PRIMARY_GREEN = '#3E8D63'; // Verde principal
const SECONDARY_GREEN = '#75C095'; // Verde más claro para efectos
const DARK_GREEN = '#2A6547'; // Verde oscuro para fondos
const LIGHT_GREEN = '#F0FFF4'; // Verde muy claro para fondos
const TEXT_COLOR = '#2D3748'; // Color texto principal
const TEXT_LIGHT = '#718096'; // Color texto secundario

const Cliente: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsRefreshing(true);
      const userJson = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (userJson) {
        setUser(JSON.parse(userJson));
      }
      setToken(storedToken);
    } catch (error) {
      console.error('Error al cargar datos de usuario:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleMenu = useCallback(() => {
    setMenuVisible(v => !v);
  }, []);

  const refreshData = useCallback(() => {
    loadUserData();
    // También se puede refrescar MovimientoList si es necesario
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_GREEN} />
      
      <LinearGradient
        colors={[PRIMARY_GREEN, DARK_GREEN]}
        style={styles.container}
      >
        {!menuVisible && (
          <View style={styles.topBar}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={22} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.pageTitle}>Panel de Cliente</Text>
            
            <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
              <FontAwesome5 name="sync-alt" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {menuVisible ? (
          <Menu visible={menuVisible} onClose={toggleMenu} />
        ) : (
          <>
      

            <View style={styles.contentContainer}>
              <MovimientoList
                token={token}
              />
            </View>
          </>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_GREEN,
  },
  container: {
    flex: 1,
    padding: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  userInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    overflow: 'hidden',
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: LIGHT_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 16,
    color: PRIMARY_GREEN,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
});

export default Cliente;