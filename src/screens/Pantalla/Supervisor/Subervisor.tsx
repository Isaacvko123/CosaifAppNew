import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import Menu from '../../../Component/Menu/Menu';
import MovimientoList from './MovimientoList';

interface User {
  empresa: { nombre: string };
  nombre: string;
}

const Supervisor: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'terminados'>('pendientes');

  useEffect(() => {
    (async () => {
      const userJson = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (userJson) {
        setUser(JSON.parse(userJson));
      }
      setToken(storedToken);
    })();
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuVisible(v => !v);
  }, []);

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
            <Text style={styles.welcomeText}>
              Bienvenido {user?.empresa.nombre}
            </Text>
            <Text style={styles.nameText}>
              {user?.nombre}
            </Text>
          </View>

          <MovimientoList
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </>
      )}
    </View>
  );
};

export default Supervisor;

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
    marginTop: 80,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 18,
    color: '#000',
  },
});
