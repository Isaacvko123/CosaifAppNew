import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

// Componentes para editar y crear usuarios
import EditarUsuario from './EditarUsuario';
import CrearNuevoUsuario from './NuevoUsuario';

// Estilos
import { styles } from './UsuarioStyles';
import { formStylesPorRol, rolFormMap } from './FormStyles';

// Tipado de usuario según backend actualizado
interface UserData {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresaId: number;
  empresa?: { nombre: string };
  localidad?: { nombre: string; estado: string };
}

const Usuario: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [creando, setCreando] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.100.13:3000/usuarios', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();

      // Recupera el usuario actual
      const userString = await AsyncStorage.getItem('user');
      let currentUserId: number | null = null;
      if (userString) {
        const currentUser = JSON.parse(userString);
        currentUserId = currentUser.id;
      }

      // Ordena poniendo al usuario actual al inicio
      if (currentUserId !== null) {
        data.sort((a: UserData, b: UserData) => {
          if (a.id === currentUserId) return -1;
          if (b.id === currentUserId) return 1;
          return 0;
        });
      }

      setUsuarios(data);
    } catch (error) {
      console.error('Error fetching usuarios', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  if (editingUser) {
    return (
      <EditarUsuario
        userData={editingUser}
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const roleKey = rolFormMap[item.rol] || 'CLIENTE';
          const dynamic = formStylesPorRol[roleKey];

          return (
            <View
              style={[
                styles.card,
                { borderColor: dynamic.title.color, borderWidth: 1, marginBottom: 10 },
              ]}
            >
              <Text style={[styles.cardTitle, { color: dynamic.title.color }]}>
                <FontAwesome5 name="user-circle" size={24} color={dynamic.title.color} />{' '}
                {item.nombre}
              </Text>

              <View style={styles.row}>
                <FontAwesome5
                  name="envelope"
                  size={18}
                  color={dynamic.title.color}
                  style={styles.icon}
                />
                <Text style={styles.cardText}>Email: {item.email}</Text>
              </View>

              <View style={styles.row}>
                <FontAwesome5
                  name="user-tag"
                  size={18}
                  color={dynamic.title.color}
                  style={styles.icon}
                />
                <Text style={styles.cardText}>Rol: {item.rol}</Text>
              </View>

              <View style={styles.row}>
                <FontAwesome5
                  name="building"
                  size={18}
                  color={dynamic.title.color}
                  style={styles.icon}
                />
                <Text style={styles.cardText}>
                  Empresa: {item.empresa?.nombre || '-'}
                </Text>
              </View>

              <View style={styles.row}>
                <FontAwesome5
                  name="map-marker-alt"
                  size={18}
                  color={dynamic.title.color}
                  style={styles.icon}
                />
                <Text style={styles.cardText}>
                  Localidad: {item.localidad?.nombre || '-'} ({item.localidad?.estado || ''})
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.editButton,
                  { backgroundColor: dynamic.confirmButton.backgroundColor },
                ]}
                onPress={() => setEditingUser(item)}
              >
                <FontAwesome5
                  name="edit"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.newButton,
          { backgroundColor: formStylesPorRol['CLIENTE'].navButton.backgroundColor },
        ]}
        onPress={() => setCreando(true)}
      >
        <FontAwesome5 name="plus-circle" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Nuevo Usuario</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Usuario;
