import React, { useRef } from 'react';
import { View, Text, Switch, TouchableOpacity, Image, ScrollView } from 'react-native';
import { formStyles as styles } from './formStyles';
import { MovementFormData } from './NewMovementForm';

// Imágenes (ajusta rutas según tu estructura)
import cabinaDentroImg from './assets/cabinadentro.png';
import cabinaFueraImg from './assets/cabinaFuera.png';
import dentroImg from './assets/dentro.png';
import fueraImg from './assets/fuera.png';

const DOUBLE_PRESS_DELAY = 100;

interface StepTwoProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
}

const StepTwo: React.FC<StepTwoProps> = ({ formData, setFormData }) => {
  // Referencia para controlar doble clic
  const lastTapTimes = useRef<{ [key: string]: number }>({});

  // Función para manejar selección/deselección con doble clic
  const handleOptionPress = (field: keyof MovementFormData, value: string) => {
    const now = Date.now();
    const key = `${field}-${value}`;
    if (lastTapTimes.current[key] && now - lastTapTimes.current[key] < DOUBLE_PRESS_DELAY) {
      // Doble clic: si estaba seleccionado, lo reinicia
      if (formData[field] === value) {
        if (field === 'cabinPosition' || field === 'chimneyPosition') {
          // Reinicia ambas, ya que la imagen depende de la combinación
          setFormData({ ...formData, cabinPosition: '', chimneyPosition: '' });
        } else {
          setFormData({ ...formData, [field]: '' });
        }
      }
    } else {
      // Un solo clic: asigna el valor
      setFormData({ ...formData, [field]: value });
    }
    lastTapTimes.current[key] = now;
  };

  // Lógica para la imagen final
  const finalImage = (() => {
    if (formData.cabinPosition === 'Dentro' && formData.chimneyPosition === 'Dentro') {
      return dentroImg;
    } else if (formData.cabinPosition === 'Dentro' && formData.chimneyPosition === 'Afuera') {
      return cabinaDentroImg;
    } else if (formData.cabinPosition === 'Afuera' && formData.chimneyPosition === 'Dentro') {
      return cabinaFueraImg;
    } else if (formData.cabinPosition === 'Afuera' && formData.chimneyPosition === 'Afuera') {
      return fueraImg;
    }
    return cabinaDentroImg; // Valor por defecto
  })();

  // --- Validaciones: si algún campo obligatorio está vacío, muestra un mensaje de error.
  // Puedes mostrar uno por campo o uno global. Aquí se hace por campo.
  const cabinPositionError = !formData.cabinPosition
    ? 'Debes seleccionar la posición de cabina.'
    : '';
  const chimneyPositionError = !formData.chimneyPosition
    ? 'Debes seleccionar la posición de chimenea.'
    : '';
  const pushPullError = !formData.pushPull
    ? 'Debes seleccionar Empujar o Jalar.'
    : '';
  const movementTypeError = !formData.movementType
    ? 'Debes seleccionar el tipo de movimiento.'
    : '';

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Imagen final */}
      <View style={styles.imageContainer}>
        <Image source={finalImage} style={styles.image} />
      </View>

      {/* Prioridad */}
      <View style={styles.switchContainer}>
        <Text style={styles.label}>¿Prioridad?</Text>
        <Switch
          value={formData.priority}
          onValueChange={(val) => setFormData({ ...formData, priority: val })}
        />
      </View>

      {/* Posición de cabina */}
      <Text style={styles.label}>Posición de cabina:</Text>
      {!!cabinPositionError && (
        <Text style={styles.errorText}>{cabinPositionError}</Text>
      )}
      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.cabinPosition === 'Dentro' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('cabinPosition', 'Dentro')}
        >
          <Text style={styles.optionButtonText}>Dentro</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.cabinPosition === 'Afuera' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('cabinPosition', 'Afuera')}
        >
          <Text style={styles.optionButtonText}>Afuera</Text>
        </TouchableOpacity>
      </View>

      {/* Posición de chimenea */}
      <Text style={styles.label}>Posición de chimenea:</Text>
      {!!chimneyPositionError && (
        <Text style={styles.errorText}>{chimneyPositionError}</Text>
      )}
      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.chimneyPosition === 'Dentro' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('chimneyPosition', 'Dentro')}
        >
          <Text style={styles.optionButtonText}>Dentro</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.chimneyPosition === 'Afuera' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('chimneyPosition', 'Afuera')}
        >
          <Text style={styles.optionButtonText}>Afuera</Text>
        </TouchableOpacity>
      </View>

      {/* Empujar / Jalar */}
      <Text style={styles.label}>Empujar / Jalar:</Text>
      {!!pushPullError && (
        <Text style={styles.errorText}>{pushPullError}</Text>
      )}
      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.pushPull === 'Empujar' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('pushPull', 'Empujar')}
        >
          <Text style={styles.optionButtonText}>Empujar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.pushPull === 'Jalar' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('pushPull', 'Jalar')}
        >
          <Text style={styles.optionButtonText}>Jalar</Text>
        </TouchableOpacity>
      </View>

      {/* Tipo de movimiento */}
      <Text style={styles.label}>Tipo de movimiento:</Text>
      {!!movementTypeError && (
        <Text style={styles.errorText}>{movementTypeError}</Text>
      )}
      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.movementType === 'MD' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('movementType', 'MD')}
        >
          <Text style={styles.optionButtonText}>MD Trabajando</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            formData.movementType === 'Remolcada' && styles.optionButtonSelected,
          ]}
          onPress={() => handleOptionPress('movementType', 'Remolcada')}
        >
          <Text style={styles.optionButtonText}>Remolcada</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StepTwo;
