// StepThree.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  formStylesBase as styles,
  formStylesPorRol,
  rolFormMap,
} from './formStyles';
import { MovementFormData } from './NewMovementForm';

interface StepThreeProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
  onFinish: () => void;
}

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://31.97.13.182:3000';

const StepThree: React.FC<StepThreeProps> = ({ formData, setFormData, onFinish }) => {
  const [rolId, setRolId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setRolId(JSON.parse(userStr).rolId);
    })();
  }, []);

  const rolKey = rolFormMap[rolId ?? -1];
  const dynamicStyles = formStylesPorRol[rolKey] || formStylesPorRol.CLIENTE;

  const handleConfirm = useCallback(async () => {
    if (!formData.movementType) {
      Alert.alert(
        '⚠️ Error',
        'Debes seleccionar el tipo de movimiento antes de continuar.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const [userStr, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token'),
      ]);
      if (!userStr || !token) throw new Error('Falta token o sesión de usuario');

      const user = JSON.parse(userStr);
      const payload: Record<string, any> = {
        empresaId: formData.empresaId ?? 1,
        creadoPorId: formData.creadoPorId ?? user.id,
        clienteId: formData.clienteId ?? user.id,
        locomotiveNumber: formData.locomotiveNumber ?? 1,
        localidadId: formData.selectedLocalityId ?? 1,
        lavado: formData.service === 'Lavado',
        torno: formData.service === 'Torno',
        prioridad: formData.priority ? 'ALTA' : 'BAJA',
        tipoMovimiento: formData.movementType ?? 'REMOLCADA',
        estado: 'SOLICITADO',
        fechaSolicitud: new Date().toISOString(),
        fechaInicio: formData.fechaInicio ?? new Date().toISOString(),
        instrucciones: formData.comments ?? '',
        posicionCabina: formData.cabinPosition ?? 'DENTRO',
        posicionChimenea: formData.chimneyPosition ?? 'DENTRO',
        direccionEmpuje: formData.pushPull ?? 'EMPUJAR',
        finalizado: false,
        incidenteGlobal: false,
      };

      payload.viaOrigenId = formData.fromTrack != null
        ? Number(formData.fromTrack)
        : (() => { throw new Error('Debes seleccionar vía de origen'); })();

      if (!formData.service && formData.toTrack != null) {
        payload.viaDestinoId = Number(formData.toTrack);
      }

      console.log('🚀 Payload:', payload);

      const res = await fetch(`${API_URL}/movimientos`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }

      await res.json();
      await AsyncStorage.multiRemove([
        'movementDraft',
        'movementSteps',
        'movementTimestamp',
      ]);

      // Ahora llamamos onFinish para que el padre navegue
      onFinish();
    } catch (err: any) {
      const msg =
        err instanceof TypeError
          ? 'No se pudo contactar al servidor. Revisa tu conexión.'
          : err.message || 'Error desconocido';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onFinish]);

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>Instrucciones y/o comentarios:</Text>
      <TextInput
        style={[
          styles.input,
          ('input' in dynamicStyles ? (dynamicStyles.input as any) : {}),
          { height: 100, textAlignVertical: 'top', paddingTop: 10 },
        ]}
        multiline
        placeholder="Escribe comentarios o instrucciones adicionales…"
        value={formData.comments}
        onChangeText={text => setFormData({ ...formData, comments: text })}
        editable={!isSubmitting}
      />

      <TouchableOpacity
        style={[
          styles.confirmButton,
          dynamicStyles.confirmButton,
          isSubmitting && { opacity: 0.6 },
        ]}
        onPress={handleConfirm}
        disabled={isSubmitting}
      >
        <Text style={styles.confirmButtonText}>Confirmar solicitud</Text>
      </TouchableOpacity>

      {isSubmitting && (
        <View style={local.overlay}>
          <ActivityIndicator size="large" color="#12AB35" />
          <Text style={local.loadingText}>Enviando movimiento al servidor…</Text>
        </View>
      )}
    </View>
  );
};

const local = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
});

export default StepThree;
