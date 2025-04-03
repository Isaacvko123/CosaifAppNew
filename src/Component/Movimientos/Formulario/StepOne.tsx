import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formStylesBase, formStylesPorRol, rolFormMap } from './formStyles';
import { MovementFormData } from './NewMovementForm';

interface StepOneProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
  errors: {
    locomotiveNumber?: string;
    fromTrack?: string;
    toTrack?: string;
  };
  predefinedTracks: number[];
  showFromOptions: boolean;
  setShowFromOptions: React.Dispatch<React.SetStateAction<boolean>>;
  showToOptions: boolean;
  setShowToOptions: React.Dispatch<React.SetStateAction<boolean>>;
}

// Componente personalizado para simular un CheckBox
const CustomCheckBox: React.FC<{
  value: boolean;
  onValueChange: (newValue: boolean) => void;
}> = ({ value, onValueChange }) => (
  <TouchableOpacity
    onPress={() => onValueChange(!value)}
    style={{
      width: 24,
      height: 24,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    }}
  >
    {value && <View style={{ width: 16, height: 16, backgroundColor: '#333' }} />}
  </TouchableOpacity>
);

const DOUBLE_PRESS_DELAY = 300;

const StepOne: React.FC<StepOneProps> = ({
  formData,
  setFormData,
  errors,
  predefinedTracks,
  showFromOptions,
  setShowFromOptions,
  showToOptions,
  setShowToOptions,
}) => {
  const [rolId, setRolId] = useState<number | null>(null);
  // Mensaje que explica cómo desactivar el servicio con doble clic
  const [serviceExplanation, setServiceExplanation] = useState('');
  const lastServicePress = useRef<{ [key: string]: number }>({
    Lavado: 0,
    Torno: 0,
  });

  // Se obtiene el rol del usuario para ajustar los estilos
  useEffect(() => {
    const fetchRolId = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setRolId(parsed.rolId);
      }
    };
    fetchRolId();
  }, []);

  const rolKey = rolFormMap[rolId ?? -1];
  const dynamicStyles = formStylesPorRol[rolKey] || formStylesPorRol.CLIENTE;
  const mergedStyles = { ...formStylesBase, ...dynamicStyles };

  // Función que guarda el servicio en formData; si se hace doble clic se quita la selección.
  const handleServicePress = (service: 'Lavado' | 'Torno') => {
    const now = Date.now();
    if (now - lastServicePress.current[service] < DOUBLE_PRESS_DELAY) {
      // Doble clic: se quita el servicio (se guardará vacío)
      setFormData({ ...formData, service: '' });
      setServiceExplanation('');
    } else {
      // Primer clic: se guarda el servicio seleccionado en formData
      setFormData({ ...formData, service });
      setServiceExplanation('Doble clic en el servicio para quitarlo');
    }
    lastServicePress.current[service] = now;
  };

  return (
    <View>
      {/* Sección de Servicio: Guarda el tipo de servicio en formData */}
      <Text style={mergedStyles.label}>Servicio:</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TouchableOpacity
          style={[
            mergedStyles.optionButton,
            formData.service === 'Lavado' && mergedStyles.optionButtonSelected,
          ]}
          onPress={() => handleServicePress('Lavado')}
        >
          <Text style={mergedStyles.optionButtonText}>Lavado</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            mergedStyles.optionButton,
            formData.service === 'Torno' && mergedStyles.optionButtonSelected,
          ]}
          onPress={() => handleServicePress('Torno')}
        >
          <Text style={mergedStyles.optionButtonText}>Torno</Text>
        </TouchableOpacity>
      </View>
      {serviceExplanation !== '' && (
        <Text style={{ marginBottom: 10, fontStyle: 'italic', color: '#555' }}>
          {serviceExplanation}
        </Text>
      )}

      {/* Prioridad: Se guarda la opción de prioridad en formData */}
      <View style={mergedStyles.centerRow}>
        <CustomCheckBox
          value={formData.priority}
          onValueChange={(newValue) => setFormData({ ...formData, priority: newValue })}
        />
        <Text style={mergedStyles.label}>
          Prioridad: {formData.priority ? 'Con alta prioridad' : 'Sin prioridad'}
        </Text>
      </View>

      {/* Número de locomotora: Se guarda el valor numérico en formData */}
      <Text style={mergedStyles.label}>Número de locomotora:</Text>
      <TextInput
        style={mergedStyles.input}
        placeholder="Ingresa número de locomotora"
        keyboardType="numeric"
        value={formData.locomotiveNumber}
        onChangeText={(text) => {
          const filteredText = text.replace(/[^0-9]/g, '');
          setFormData({ ...formData, locomotiveNumber: filteredText });
        }}
      />
      {errors.locomotiveNumber && (
        <Text style={mergedStyles.errorText}>{errors.locomotiveNumber}</Text>
      )}

      {/* "De vía": Siempre visible y guardado en formData */}
      <Text style={mergedStyles.label}>De vía:</Text>
      <TouchableOpacity onPress={() => setShowFromOptions(!showFromOptions)}>
        <TextInput
          style={mergedStyles.input}
          placeholder="Ejemplo: Vía 1"
          value={formData.fromTrack.toString()}
          editable={false}
        />
      </TouchableOpacity>
      {errors.fromTrack && (
        <Text style={mergedStyles.errorText}>{errors.fromTrack}</Text>
      )}
      {showFromOptions && (
        <ScrollView style={mergedStyles.optionsContainer} nestedScrollEnabled>
          {predefinedTracks.map((track) => (
            <TouchableOpacity
              key={track.toString()}
              onPress={() => {
                setFormData({ ...formData, fromTrack: track.toString() });
                setShowFromOptions(false);
              }}
            >
              <Text style={mergedStyles.optionText}>{`Vía ${track}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* "Para vía": Se muestra solo en caso de que sea necesario (cuando no se ha seleccionado un servicio) */}
      {!formData.service && (
        <>
          <Text style={mergedStyles.label}>Para vía:</Text>
          <TouchableOpacity onPress={() => setShowToOptions(!showToOptions)}>
            <TextInput
              style={mergedStyles.input}
              placeholder="Ejemplo: Vía 2"
              value={formData.toTrack.toString()}
              editable={false}
            />
          </TouchableOpacity>
          {errors.toTrack && (
            <Text style={mergedStyles.errorText}>{errors.toTrack}</Text>
          )}
          {showToOptions && (
            <ScrollView style={mergedStyles.optionsContainer} nestedScrollEnabled>
              {predefinedTracks.map((track) => (
                <TouchableOpacity
                  key={track.toString()}
                  onPress={() => {
                    setFormData({ ...formData, toTrack: track.toString() });
                    setShowToOptions(false);
                  }}
                >
                  <Text style={mergedStyles.optionText}>{`Vía ${track}`}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
};

export default StepOne;
