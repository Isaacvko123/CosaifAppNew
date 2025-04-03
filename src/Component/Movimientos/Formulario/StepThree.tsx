import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formStylesBase as styles, formStylesPorRol, rolFormMap } from './formStyles';
import { MovementFormData } from './NewMovementForm';

interface StepThreeProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
  onFinish: () => void;
}

const StepThree: React.FC<StepThreeProps> = ({ formData, setFormData, onFinish }) => {
  const [rolId, setRolId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setRolId(parsed.rolId);
      }
    };
    fetchUser();
  }, []);

  const rolKey = rolFormMap[rolId ?? -1];
  const dynamicStyles = formStylesPorRol[rolKey] || formStylesPorRol.CLIENTE;

  const handleConfirm = async () => {
    try {
      // Recupera el objeto 'user' de AsyncStorage y extrae las propiedades deseadas
      const userStr = await AsyncStorage.getItem('user');
      let userSegment = {};
      if (userStr) {
        const parsed = JSON.parse(userStr);
        userSegment = {
          id: parsed.id,
          name: parsed.usuario, // O parsed.username, según cómo se guarde el nombre
          rol: parsed.rol,
          company: parsed.empresa?.nombre || ''
        };
      }
      // Agrega los datos del usuario a formData
      const finalData = { ...formData, ...userSegment };
      const collectedInfo = JSON.stringify(finalData, null, 2);

      console.log('Collected Info:', collectedInfo);

      Alert.alert(
        '🔔 Confirmación',
        '¿Estás seguro de que deseas confirmar la solicitud?\n\n' + collectedInfo,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí',
            onPress: () => {
              Alert.alert(
                '✅ Realizado',
                'El movimiento ha sido confirmado.\n\n' + collectedInfo,
                [{ text: 'OK', onPress: () => onFinish() }],
                { cancelable: false }
              );
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron recuperar los datos.');
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.rowButtons}>
        {/* Otros elementos si se requieren */}
      </View>

      <Text style={styles.label}>Instrucciones y/o comentarios:</Text>
      <TextInput
        style={[
          styles.input,
          dynamicStyles.input || {},
          { height: 100, textAlignVertical: 'top', paddingTop: 10 }
        ]}
        multiline
        placeholder="Escribe comentarios o instrucciones adicionales..."
        value={formData.comments}
        onChangeText={(text) => setFormData({ ...formData, comments: text })}
      />

      <TouchableOpacity
        style={[styles.confirmButton, dynamicStyles.confirmButton]}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmButtonText}>Confirmar solicitud</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StepThree;
