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

import { styles, COLORS } from './UsuarioStyles';
import { formStylesPorRol, rolFormMap } from './FormStyles';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/Navigation';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Usuario'>;

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

// Separate component for user card to improve readability
const UserCard: React.FC<{ 
  item: UserData; 
  onEdit: (user: UserData) => void 
}> = React.memo(({ item, onEdit }) => {
  const roleKey = rolFormMap[item.rol] || 'CLIENTE';
  const dynamic = formStylesPorRol[roleKey];

  return (
    <View style={[
      styles.card, 
      { 
        borderColor: dynamic.title.color, 
        borderWidth: 1,
        marginBottom: 12 
      }
    ]}>
      <Text style={[styles.cardTitle, { color: dynamic.title.color }]}>
        <FontAwesome5 
          name="user-circle" 
          size={22} 
          color={dynamic.title.color} 
        /> {item.nombre}
      </Text>
      
      <UserDetailRow 
        icon="envelope" 
        label="Email" 
        value={item.email} 
        iconColor={dynamic.title.color} 
      />
      
      <UserDetailRow 
        icon="user-tag" 
        label="Rol" 
        value={item.rol} 
        iconColor={dynamic.title.color} 
      />
      
      <UserDetailRow 
        icon="building" 
        label="Empresa" 
        value={item.empresa?.nombre || '-'} 
        iconColor={dynamic.title.color} 
      />
      
      <UserDetailRow 
        icon="map-marker-alt" 
        label="Localidad" 
        value={`${item.localidad?.nombre || '-'} (${item.localidad?.estado || ''})`} 
        iconColor={dynamic.title.color} 
      />

      <TouchableOpacity
        style={[
          styles.editButton, 
          { backgroundColor: dynamic.confirmButton.backgroundColor }
        ]}
        onPress={() => onEdit(item)}
      >
        <FontAwesome5 
          name="edit" 
          size={16} 
          color={COLORS.textLight} 
          style={styles.buttonIcon} 
        />
        <Text style={styles.buttonText}>Editar</Text>
      </TouchableOpacity>
    </View>
  );
});

// Utility component for consistent row rendering
const UserDetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  iconColor: string;
}> = React.memo(({ icon, label, value, iconColor }) => (
  <View style={styles.row}>
    <FontAwesome5 
      name={icon as any} 
      size={16} 
      color={iconColor} 
      style={styles.icon} 
    />
    <Text style={styles.cardText}>
      <Text style={styles.cardTextLabel}>{label}:</Text> {value}
    </Text>
  </View>
));

const Usuario: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [creando, setCreando] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [userLogged, setUserLogged] = useState<UserData | null>(null);

  // Load logged user on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          setUserLogged(JSON.parse(raw));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      navigation.replace('Supervisor');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  // Fetch users with improved error handling
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      
      const response = await fetch('http://31.97.13.182:3000/usuarios', { 
        headers,
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch users error:', error);
      Alert.alert(
        'Error', 
        error.message?.includes('Network request failed')
          ? 'Conéctate a una red'
          : 'No se pudieron obtener usuarios'
      );
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users on mount and network connection change
  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Monitor network connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  // Memoized key for FlatList optimization
  const flatListKey = useMemo(() => usuarios.map(u => u.id).join(','), [usuarios]);

  // Render editing or creation screens
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

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={COLORS.primary} 
        />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={usuarios}
        key={flatListKey}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserCard 
            item={item} 
            onEdit={setEditingUser} 
          />
        )}
        contentContainerStyle={{ 
          paddingBottom: 80,
          paddingHorizontal: 8 
        }}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        removeClippedSubviews
        ListEmptyComponent={
          <Text style={[styles.emptyText, { marginTop: 20 }]}>
            No hay usuarios
          </Text>
        }
      />

      <TouchableOpacity
        style={[
          styles.newButton,
          { 
            backgroundColor: isConnected 
              ? formStylesPorRol['CLIENTE'].navButton.backgroundColor 
              : COLORS.disabled 
          }
        ]}
        onPress={() => setCreando(true)}
        disabled={!isConnected}
      >
        <FontAwesome5 
          name="plus-circle" 
          size={18} 
          color={COLORS.textLight} 
          style={styles.buttonIcon} 
        />
        <Text style={styles.buttonText}>Nuevo Usuario</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Usuario;