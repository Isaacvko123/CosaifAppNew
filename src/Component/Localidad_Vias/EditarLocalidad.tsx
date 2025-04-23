import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { styles } from './EditarLocalidadStyles';
import CrearVias from './CrearVias';

interface LocalidadDetalle {
  id: number;
  nombre: string;
  estado: string;
  vias?: any[];
}

interface EditarLocalidadProps {
  localidadId: number;
  onFinish: () => void;
}

const EditarLocalidad: React.FC<EditarLocalidadProps> = ({ localidadId, onFinish }) => {
  const [localidad, setLocalidad] = useState<LocalidadDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingVias, setEditingVias] = useState<boolean>(false);

  const fetchLocalidadDetalle = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.101.20:3000/localidades/${localidadId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.vias) data.vias = [];
      setLocalidad(data);
    } catch (err) {
      setError('Error al cargar detalles de la localidad.');
    }
  };

  const fetchVias = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.101.20:3000/vias/localidad/${localidadId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setLocalidad(prev => (prev ? { ...prev, vias: data } : null));
    } catch (err) {
      console.error('Error cargando vías:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalidadDetalle();
    fetchVias();
  }, [localidadId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: 100, height: 100, marginBottom: 20 }}
        />
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={{ color: '#2D6A4F', fontSize: 16, marginTop: 15 }}>
          Cargando datos de la localidad...
        </Text>
      </View>
    );
  }

  if (error || !localidad) {
    return (
      <View style={styles.container}>
        <FontAwesome5 name="exclamation-circle" size={30} color="#FF4D4D" />
        <Text style={{ color: '#FF4D4D', marginVertical: 10 }}>{error || 'No se encontró la localidad.'}</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onFinish}>
          <Text style={styles.buttonText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (editingVias) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <CrearVias />
        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingVias(false)}>
          <Text style={styles.buttonText}>Volver a detalles</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tarjeta de Localidad (solo vista) */}
      <View style={styles.card}>
        <Text style={styles.title}>{localidad.nombre}</Text>
        <Text style={styles.subtitle}>Estado: {localidad.estado}</Text>
      </View>

      {/* Tarjeta de Vías */}
      <View style={styles.card}>
        <Text style={styles.title}>Vías registradas</Text>
        {localidad.vias && localidad.vias.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewViasContainer}
          >
            {localidad.vias.map((via, i) => (
              <View key={i} style={styles.viaCard}>
                <Text style={styles.cardText}>
                  {via.nombre ? via.nombre : `Vía ${i + 1}`}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.cardText}>No hay vías registradas aún.</Text>
        )}

        <TouchableOpacity style={styles.editButton} onPress={() => setEditingVias(true)}>
          <FontAwesome5 name="edit" size={18} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Editar Vías</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={onFinish}>
        <Text style={styles.buttonText}>Regresar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditarLocalidad;
