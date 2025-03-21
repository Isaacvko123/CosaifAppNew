import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Si se quiere usar navegación, aunque aquí usaremos el callback
import { formStyles as styles } from './formStyles';
import { MovementFormData } from './NewMovementForm';

interface StepThreeProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
  onFinish: () => void;
}

const StepThree: React.FC<StepThreeProps> = ({ formData, setFormData, onFinish }) => {
  // Función para seleccionar servicio ("Lavado" o "Torno")
  const handleServicePress = (selectedService: 'Lavado' | 'Torno') => {
    setFormData({ ...formData, service: selectedService });
  };

  // Al pulsar "Confirmar solicitud", se validan los campos requeridos
  // y se muestra un alert de confirmación.
  const handleConfirm = () => {
    // Validación: el servicio es obligatorio.
    if (!formData.service) {
      Alert.alert('⚠️ Error', 'Debes seleccionar un servicio.');
      return;
    }

    Alert.alert(
      '🔔 Confirmación',
      '¿Estás seguro de que deseas confirmar la solicitud?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí', 
          onPress: () => {
            Alert.alert(
              '✅ Realizado', 
              'El movimiento ha sido confirmado.',
              [
                { text: 'OK', onPress: () => onFinish() }
              ],
              { cancelable: false }
            );
          }
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View>
      {/* Sección de servicio */}
      <Text style={styles.label}>Servicio (selecciona uno):</Text>
      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.service === 'Lavado' && styles.optionButtonSelected,
          ]}
          onPress={() => handleServicePress('Lavado')}
        >
          <Text style={styles.optionButtonText}>Lavado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.service === 'Torno' && styles.optionButtonSelected,
          ]}
          onPress={() => handleServicePress('Torno')}
        >
          <Text style={styles.optionButtonText}>Torno</Text>
        </TouchableOpacity>
      </View>

      {/* Instrucciones y/o comentarios (opcional) */}
      <Text style={styles.label}>Instrucciones y/o comentarios:</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        placeholder="Escribe comentarios o instrucciones adicionales..."
        value={formData.comments}
        onChangeText={(text) => setFormData({ ...formData, comments: text })}
      />

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirmar solicitud</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StepThree;
