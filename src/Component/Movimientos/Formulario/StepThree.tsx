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
      // 1. Obtenemos varios valores de AsyncStorage:
      const keysToGet = ['user', 'companies', 'localities', 'movementFormData'];
      const allStorage = await AsyncStorage.multiGet(keysToGet);

      console.log('Contenido de AsyncStorage (todas las claves):', JSON.stringify(allStorage, null, 2));

      // 2. Si deseas imprimir solo las "localities" en consola:
      const localitiesPair = allStorage.find(([key]) => key === 'localities');
      if (localitiesPair && localitiesPair[1]) {
        const localitiesData = JSON.parse(localitiesPair[1]);
        console.log('Localidades en AsyncStorage:', localitiesData);
      } else {
        console.log('No se encontraron localidades en AsyncStorage.');
      }

      // 3. Lógica normal: obtener user, companies, etc.
      const userStr = await AsyncStorage.getItem('user');
      let userSegment = {};
      if (userStr) {
        const parsed = JSON.parse(userStr);
        userSegment = {
          creadoPorId: parsed.id,
          clienteId: parsed.id,
        };
      }

      // 4. Cargar companies y localities para mapear
      const companiesStr = await AsyncStorage.getItem('companies');
      const companiesList = companiesStr ? JSON.parse(companiesStr) : [];
      const localitiesStr = await AsyncStorage.getItem('localities');
      const localitiesList = localitiesStr ? JSON.parse(localitiesStr) : [];

      // 5. Mapear IDs a nombres
      const companyName =
        companiesList.find((comp: any) => comp.id === formData.empresaId)?.nombre || 'N/A';
      const localityName =
        localitiesList.find((loc: any) => loc.id === formData.selectedLocalityId)?.nombre || 'N/A';
      const viaOrigenName =
        formData.fromTrack !== null && formData.fromTrack !== undefined
          ? `Vía ${formData.fromTrack}`
          : 'N/A';
      const viaDestinoName =
        formData.toTrack !== null && formData.toTrack !== undefined
          ? `Vía ${formData.toTrack}`
          : 'N/A';

      // 6. Construir el payload
      const payload = {
        codigo: formData.locomotiveNumber,
        empresaId: formData.empresaId,
        creadoPorId: formData.creadoPorId || (userSegment as any).creadoPorId,
        clienteId: formData.clienteId || (userSegment as any).clienteId,
        localidadId: formData.selectedLocalityId,
        viaOrigenId: Number(formData.fromTrack) || null,
        viaDestinoId: Number(formData.toTrack) || null,
        lavado: formData.service === 'Lavado',
        torno: formData.service === 'Torno',
        prioridad: formData.priority ? 'ALTA' : 'BAJA',
        tipoMovimiento: formData.movementType,
        estado: 'SOLICITADO',
        fechaInicio: formData.fechaInicio,
        fechaFin: '',
        instrucciones: formData.comments,
      };

      // 7. Mensaje amigable
      const confirmationMessage = [
        `Código de locomotora: ${payload.codigo}`,
        `Empresa: ${companyName}`,
        `Localidad: ${localityName}`,
        `Vía Origen: ${viaOrigenName}`,
        `Vía Destino: ${viaDestinoName}`,
        `Servicio: ${formData.service || 'Ninguno'}`,
        `Prioridad: ${formData.priority ? 'ALTA' : 'BAJA'}`,
        `Tipo de movimiento: ${payload.tipoMovimiento}`,
        `Estado: ${payload.estado}`,
        `Fecha Inicio: ${payload.fechaInicio}`,
        `Instrucciones: ${payload.instrucciones || 'Ninguna'}`,
      ].join('\n');

      const confirmAlertMessage = `¿Estás seguro de que deseas confirmar la solicitud?\n\n${confirmationMessage}`;

      Alert.alert(
        '🔔 Confirmación',
        confirmAlertMessage,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí',
            onPress: () => {
              console.log('Payload final:', JSON.stringify(payload, null, 2));
              Alert.alert(
                '✅ Realizado',
                `El movimiento ha sido confirmado.\n\n${confirmationMessage}`,
                [{ text: 'OK', onPress: () => onFinish() }],
                { cancelable: false }
              );
            },
          },
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
      <View style={styles.rowButtons}>{/* Otros elementos si se requieren */}</View>

      <Text style={styles.label}>Instrucciones y/o comentarios:</Text>
      <TextInput
        style={[
          styles.input,
          ('input' in dynamicStyles ? (dynamicStyles.input as any) : {}),
          { height: 100, textAlignVertical: 'top', paddingTop: 10 },
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
