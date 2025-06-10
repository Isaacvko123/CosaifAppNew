import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { localidadCardStyles, extraStyles } from './Localidad_Vias';
import EditarLocalidad from './EditarLocalidad';
import AgregarLocalidad from './AgregarLocalidad';

interface Localidad {
  id: number;
  nombre: string;
  estado: string;
  vias?: any[];
}

interface LocalidadViasProps {
  onAddLocalidad?: () => void;
}

const LocalidadVias: React.FC<LocalidadViasProps> = ({ onAddLocalidad }) => {
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingLocalidad, setEditingLocalidad] = useState<Localidad | null>(null);
  const [addingLocalidad, setAddingLocalidad] = useState<boolean>(false);

  const fetchLocalidades = async () => {
    try {
      setError('');
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://31.97.13.182:3000/localidades', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener las localidades');
      }

      const data = await response.json();
      setLocalidades(data);
    } catch (err) {
      console.error('Error al cargar localidades:', err);
      setError('Error al conectar con el servidor. Verifica tu red o token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalidades();
  }, []);

  if (addingLocalidad) {
    return (
      <AgregarLocalidad
        onFinish={() => {
          setAddingLocalidad(false);
          fetchLocalidades();
        }}
      />
    );
  }

  if (editingLocalidad) {
    return (
      <EditarLocalidad
        localidadId={editingLocalidad.id}
        onFinish={() => {
          setEditingLocalidad(null);
          fetchLocalidades();
        }}
      />
    );
  }

  if (loading) {
    return (
      <View style={[extraStyles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
  <Image
    source={require('../../../assets/logo.png')}
    style={{
      width: 250,
      height: 250,
      resizeMode: 'contain',
      marginBottom: 30,
    }}
  />
  <ActivityIndicator size="large" color="#2D6A4F" />
  <Text
    style={{
      marginTop: 20,
      fontSize: 18,
      color: '#2D6A4F',
      fontWeight: '600',
      textAlign: 'center',
    }}
  >
    Cargando detalles de la localidad...
  </Text>
</View>

      
    );
  }

  if (error) {
    return (
      <View style={[extraStyles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <FontAwesome5 name="exclamation-triangle" size={32} color="#FF4D4D" />
        <Text style={{ color: '#FF4D4D', fontSize: 16, marginVertical: 10 }}>{error}</Text>
        <TouchableOpacity
          style={[extraStyles.editButton, { backgroundColor: '#FF4D4D' }]}
          onPress={fetchLocalidades}
        >
          <FontAwesome5 name="redo" color="#FFF" size={16} />
          <Text style={extraStyles.editButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={extraStyles.mainContainer}>
      <FlatList
        data={localidades}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={localidadCardStyles.cardContainer}>
            <View style={localidadCardStyles.headerContainer}>
              <FontAwesome5 name="map-marker-alt" style={localidadCardStyles.headerIcon} />
              <Text style={localidadCardStyles.cardTitle}>{item.nombre}</Text>
            </View>
            <Text style={localidadCardStyles.cardSubtitle}>Estado: {item.estado}</Text>
            <Text style={localidadCardStyles.cardSubtitle}>
              Total de vías: {item.vias ? item.vias.length : 0}
            </Text>
            <TouchableOpacity
              style={extraStyles.editButton}
              onPress={async () => {
                try {
                  await AsyncStorage.setItem('localidad', JSON.stringify(item));
                } catch (err) {
                  console.error('Error guardando localidad:', err);
                }
                setEditingLocalidad(item);
              }}
            >
              <FontAwesome5 name="edit" size={18} color="#FFF" />
              <Text style={extraStyles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}
      />

      <TouchableOpacity
        style={extraStyles.footer}
        onPress={() => {
          if (onAddLocalidad) onAddLocalidad();
          else setAddingLocalidad(true);
        }}
      >
        <Text style={extraStyles.addButtonText}>Agregar Localidad</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LocalidadVias;
