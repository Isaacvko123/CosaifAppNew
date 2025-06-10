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

  const fetchDetalles = async () => {
    console.log('🔄 fetchDetalles para localidadId:', localidadId);
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token obtenido:', token);
      if (!token) throw new Error('Token no encontrado');

      const [localidadRes, viasRes] = await Promise.all([
        fetch(`http://31.97.13.182:3000/localidades/${localidadId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`http://31.97.13.182:3000/vias/localidad/${localidadId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      console.log(
        `📥 localidadRes status: ${localidadRes.status}, viasRes status: ${viasRes.status}`
      );

      if (!localidadRes.ok) {
        const text = await localidadRes.text();
        throw new Error(`Error al obtener localidad: ${text}`);
      }
      if (!viasRes.ok) {
        const text = await viasRes.text();
        throw new Error(`Error al obtener vías: ${text}`);
      }

      const localidadData = await localidadRes.json();
      const viasData = await viasRes.json();
      console.log('📑 localidadData:', localidadData);
      console.log(`📑 viasData (count ${viasData.length}):`, viasData);

      localidadData.vias = viasData;
      setLocalidad(localidadData);
    } catch (err: any) {
      console.error('❌ Error al obtener detalles:', err);
      setError(err.message || 'Error al cargar detalles de la localidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalles();
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
        <Text style={{ color: '#FF4D4D', marginVertical: 10 }}>
          {error || 'No se encontró la localidad.'}
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onFinish}>
          <Text style={styles.buttonText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (editingVias) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <CrearVias
          localidadId={localidad.id}
          onComplete={() => {
            console.log('✅ onComplete de CrearVias ejecutado');
            setEditingVias(false);
            fetchDetalles();
          }}
        />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            console.log('↩ Volver a detalles sin crear vías');
            setEditingVias(false);
          }}
        >
          <Text style={styles.buttonText}>Volver a detalles</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{localidad.nombre}</Text>
        <Text style={styles.subtitle}>Estado: {localidad.estado}</Text>
      </View>

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

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            console.log('✏️ Iniciando edición de vías');
            setEditingVias(true);
          }}
        >
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
