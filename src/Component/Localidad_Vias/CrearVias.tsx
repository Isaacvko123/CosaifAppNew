import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { styles } from './CrearViasStyles'; // Asegúrate de tener este archivo de estilos

interface Via {
  numero: number;
  nombre: string;
}

interface CrearViasProps {
  localidadId: number;
  onComplete: () => void;
}

const CrearVias: React.FC<CrearViasProps> = ({ localidadId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [viaCount, setViaCount] = useState<number>(1);
  const [vias, setVias] = useState<Via[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);

  // Paso 1: Definir la cantidad de vías
  const handleContinueStep1 = () => {
    if (viaCount <= 0 || isNaN(viaCount)) {
      Alert.alert('Error', 'Ingrese un número válido de vías.');
      return;
    }
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

  // Envía vías de forma secuencial
  const handleSendVias = async () => {
    console.log('⏳ handleSendVias arrancó');
    setIsProcessing(true);
    setProgressCount(0);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token:', token);

      for (let i = 0; i < vias.length; i++) {
        console.log(`Enviando vía ${i + 1}/${vias.length}`, vias[i]);
        const response = await fetch('http://31.97.13.182:3000/vias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            numero: vias[i].numero,
            nombre: vias[i].nombre,
            localidadId,
          }),
        });
        console.log('Respuesta status:', response.status);
        if (!response.ok) {
          const text = await response.text();
          console.error('❌ Error creando vía:', text);
          Alert.alert('Error', text || 'Error al crear la vía.');
          setIsProcessing(false);
          return;
        }
        setProgressCount(prev => prev + 1);
      }

      console.log('✅ Todas las vías creadas');
      Alert.alert('Éxito', 'Todas las vías se han creado correctamente.');
      onComplete();
    } catch (err) {
      console.error('💥 Exception en handleSendVias:', err);
      Alert.alert('Error', 'Ocurrió un error al procesar las vías.');
    } finally {
      setIsProcessing(false);
    }
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
            onChangeText={text => setViaCount(parseInt(text, 10) || 0)}
          />
          <TouchableOpacity style={styles.button} onPress={handleContinueStep1}>
            <FontAwesome5 name="arrow-right" size={20} color="#FFF" />
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
                onChangeText={txt => updateVia(index, 'numero', txt)}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre de la vía"
                value={via.nombre}
                onChangeText={txt => updateVia(index, 'nombre', txt)}
              />
            </View>
          ))}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => setStep(1)}>
              <FontAwesome5 name="arrow-left" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
              <FontAwesome5 name="arrow-right" size={20} color="#FFF" />
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
              <FontAwesome5 name="arrow-left" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>

            {/* Confirmar dispara directamente la creación */}
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                console.log('🔴 Confirm pressed, llamando handleSendVias');
                handleSendVias();
              }}
            >
              <FontAwesome5 name="check" size={20} color="#FFF" />
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
