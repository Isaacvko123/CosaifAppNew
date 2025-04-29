import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

import EditarUsuario from './EditarUsuario';
import CrearNuevoUsuario from './NuevoUsuario';

import { styles } from './UsuarioStyles';
import { formStylesPorRol, rolFormMap } from './FormStyles';

import type { StackNavigationProp } from '@react-navigation/stack';
import RootStackParamList from '../../navigation/Navigation'; // Asegúrate de importar desde donde tengas ese archivo

type NavigationProp = StackNavigationProp<typeof RootStackParamList, 'Usuario'>;

interface UserData {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresaId: number;
  empresa?: { nombre: string };
  localidad?: { nombre: string; estado: string };
  usuario?: string;
  activo?: boolean;
}

const Usuario: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [creando, setCreando] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [userLogged, setUserLogged] = useState<UserData | null>(null);

  // Leer usuario al inicio
  useEffect(() => {
    const loadUser = async () => {
      const raw = await AsyncStorage.getItem('user');
      if (raw) {
        setUserLogged(JSON.parse(raw));
      }
    };
    loadUser();
  }, []);

  // 👉 Manejamos botón físico "atrás"
  useEffect(() => {
    const backAction = () => {
      navigation.replace('Supervisor');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await fetch('http://192.168.101.20:3000/usuarios', { headers });
      const raw = await response.text();
      const data = JSON.parse(raw);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message?.includes('Network request failed')
        ? 'Conéctate a una red'
        : 'No se pudieron obtener usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  const renderItem = useCallback(({ item }: { item: UserData }) => {
    const roleKey = rolFormMap[item.rol] || 'CLIENTE';
    const dynamic = formStylesPorRol[roleKey];

    return (
      <View style={[styles.card, { borderColor: dynamic.title.color, borderWidth: 1 }]}>
        <Text style={[styles.cardTitle, { color: dynamic.title.color }]}>
          <FontAwesome5 name="user-circle" size={22} color={dynamic.title.color} /> {item.nombre}
        </Text>
        <View style={styles.row}>
          <FontAwesome5 name="envelope" size={16} color={dynamic.title.color} style={styles.icon} />
          <Text style={styles.cardText}>Email: {item.email}</Text>
        </View>
        <View style={styles.row}>
          <FontAwesome5 name="user-tag" size={16} color={dynamic.title.color} style={styles.icon} />
          <Text style={styles.cardText}>Rol: {item.rol}</Text>
        </View>
        <View style={styles.row}>
          <FontAwesome5 name="building" size={16} color={dynamic.title.color} style={styles.icon} />
          <Text style={styles.cardText}>Empresa: {item.empresa?.nombre || '-'}</Text>
        </View>
        <View style={styles.row}>
          <FontAwesome5 name="map-marker-alt" size={16} color={dynamic.title.color} style={styles.icon} />
          <Text style={styles.cardText}>
            Localidad: {item.localidad?.nombre || '-'} ({item.localidad?.estado || ''})
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: dynamic.confirmButton.backgroundColor }]}
          onPress={() => setEditingUser(item)}
        >
          <FontAwesome5 name="edit" size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    );
  }, []);

  const flatListKey = useMemo(() => usuarios.map(u => u.id).join(','), [usuarios]);

  if (editingUser) {
    return (
      <EditarUsuario
        userData={{ ...editingUser, activo: true }}
        onFinish={() => {
          setEditingUser(null);
          fetchUsuarios();
        }}
      />
    );
  }

  if (creando) {
    return <CrearNuevoUsuario />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={usuarios}
        key={flatListKey}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        removeClippedSubviews
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay usuarios</Text>}
      />

      <TouchableOpacity
        style={[
          styles.newButton,
          { backgroundColor: isConnected ? formStylesPorRol['CLIENTE'].navButton.backgroundColor : '#ccc' },
        ]}
        onPress={() => setCreando(true)}
        disabled={!isConnected}
      >
        <FontAwesome5 name="plus-circle" size={18} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Nuevo Usuario</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Usuario;
