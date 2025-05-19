import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { styles } from './CrearViasStyles';

interface Via {
  numero: number;
  nombre: string;
}

const CrearVias: React.FC = () => {
  const [step, setStep] = useState(1);
  const [viaCount, setViaCount] = useState<number>(1);
  const [vias, setVias] = useState<Via[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);

  // Paso 1: Definir la cantidad de vías
  const handleContinueStep1 = () => {
    if (viaCount <= 0 || isNaN(viaCount)) {
      Alert.alert('Error', 'Ingrese un número válido');
      return;
    }
    // Inicializamos el arreglo de vías
    const initialVias = Array.from({ length: viaCount }, (_, i) => ({
      numero: i + 1,
      nombre: '',
    }));
    setVias(initialVias);
    setStep(2);
  };

  // Actualiza los datos de cada vía
  const updateVia = (index: number, field: 'numero' | 'nombre', value: string) => {
    const updated = [...vias];
    if (field === 'numero') {
      updated[index].numero = parseInt(value, 10) || 0;
    } else {
      updated[index].nombre = value;
    }
    setVias(updated);
  };

  // Función que envía cada vía de forma secuencial al backend
  const handleSendVias = async () => {
    setIsProcessing(true);
    setProgressCount(0);
    try {
      // Obtenemos la localidad almacenada en AsyncStorage (previamente guardada)
      const storedLocalidad = await AsyncStorage.getItem('localidad');
      if (!storedLocalidad) {
        Alert.alert('Error', 'No se encontró la localidad asociada.');
        setIsProcessing(false);
        return;
      }
      const localidad = JSON.parse(storedLocalidad);

      // Obtenemos el token de autenticación
      const token = await AsyncStorage.getItem('token');

      // Enviamos cada vía de forma secuencial
      for (let i = 0; i < vias.length; i++) {
        const via = vias[i];
        const response = await fetch('http://192.168.101.20:3000/vias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            numero: via.numero,
            nombre: via.nombre,
            localidadId: localidad.id,
          }),
        });
        if (!response.ok) {
          let errorMessage = 'Error al crear la vía.';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch (err) {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
          Alert.alert('Error', errorMessage);
          setIsProcessing(false);
          return;
        }
        // Actualizamos el progreso luego de cada envío exitoso
        setProgressCount(prev => prev + 1);
      }
      Alert.alert('Éxito', 'Todas las vías se han creado correctamente.');
    } catch (error) {
      console.error('Error al enviar vías:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar las vías.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Paso 3: Confirmación de datos
  const handleConfirm = () => {
    Alert.alert(
      'Confirmación',
      'Se crearán las siguientes vías:\n' +
        vias
          .map(
            (via, i) =>
              `Vía ${i + 1}: Número ${via.numero}, Nombre ${via.nombre || 'No definido'}`
          )
          .join('\n'),
      [
        { text: 'Cancelar' },
        { text: 'Confirmar', onPress: () => handleSendVias() },
      ]
    );
  };

  // Splash de carga con progreso
  if (isProcessing) {
    return (
      <View style={splashStyles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={splashStyles.progressText}>
          Procesando vías: {progressCount} de {vias.length} completadas
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.title}>Definir cantidad de vías</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Número de vías"
            value={viaCount.toString()}
            onChangeText={(text) => setViaCount(parseInt(text, 10) || 0)}
          />
          <TouchableOpacity style={styles.button} onPress={handleContinueStep1}>
            <FontAwesome5 name="arrow-right" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.title}>Ingrese los datos de cada vía</Text>
          {vias.map((via, index) => (
            <View key={index} style={styles.formGroup}>
              <Text style={styles.label}>Vía {index + 1}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Número de vía"
                value={via.numero.toString()}
                onChangeText={(text) => updateVia(index, 'numero', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre de la vía"
                value={via.nombre}
                onChangeText={(text) => updateVia(index, 'nombre', text)}
              />
            </View>
          ))}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => setStep(1)}>
              <FontAwesome5 name="arrow-left" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
              <FontAwesome5 name="arrow-right" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Revisar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.title}>Confirmar Datos</Text>
          {vias.map((via, index) => (
            <View key={index} style={styles.confirmationItem}>
              <Text style={styles.confirmationText}>
                Vía {index + 1}: Número {via.numero} - Nombre {via.nombre || 'No definido'}
              </Text>
            </View>
          ))}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => setStep(2)}>
              <FontAwesome5 name="arrow-left" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
              <FontAwesome5 name="check" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CrearVias;

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    marginTop: 20,
    fontSize: 18,
    color: '#007BFF',
  },
});