import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

interface AgregarLocalidadProps {
  onFinish: () => void;
}

const AgregarLocalidad: React.FC<AgregarLocalidadProps> = ({ onFinish }) => {
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCrearLocalidad = async () => {
    if (!nombre || !estado) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch('http://31.97.13.182:3000/localidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nombre, estado }),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Error al crear la localidad.');
        setIsLoading(false);
        return;
      }

      await response.json();
      Alert.alert('Éxito', 'Localidad creada correctamente.');
      onFinish();
    } catch (error) {
      console.error('Error al crear la localidad:', error);
      Alert.alert('Error', 'Error al crear la localidad.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Creando localidad...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Nueva Localidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Estado"
        value={estado}
        onChangeText={setEstado}
      />
      <TouchableOpacity style={styles.button} onPress={handleCrearLocalidad}>
        <FontAwesome5 name="plus" size={20} color="#FFF" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Crear Localidad</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onFinish}>
        <FontAwesome5 name="times" size={20} color="#FFF" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AgregarLocalidad;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#FF4D4D',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007BFF',
  },
});
