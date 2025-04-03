import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formStylesBase, formStylesPorRol, rolFormMap } from './formStyles';
import { MovementFormData } from './NewMovementForm';

// Imágenes: se usan solo si NO se ha seleccionado un servicio.
import cabinaDentroImg from './assets/cabinadentro.png';
import cabinaFueraImg from './assets/cabinaFuera.png';
import dentroImg from './assets/dentro.png';
import fueraImg from './assets/fuera.png';
// Imágenes para empujar o jalar
import Empujando from './assets/Empujando.png';
import Remolcado from './assets/Remolcado.png';

const DOUBLE_PRESS_DELAY = 100;

interface StepTwoProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
}

const StepTwo: React.FC<StepTwoProps> = ({ formData, setFormData }) => {
  const lastTapTimes = useRef<{ [key: string]: number }>({});
  const [rolId, setRolId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRol = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRolId(user.rolId);
      }
    };
    fetchRol();
  }, []);

  // Guarda en AsyncStorage cada vez que formData se actualiza
  useEffect(() => {
    AsyncStorage.setItem('movementFormData', JSON.stringify(formData));
  }, [formData]);

  const rolKey = rolFormMap[rolId ?? -1];
  const dynamicStyles = formStylesPorRol[rolKey] || formStylesPorRol.CLIENTE;
  const styles = { ...formStylesBase, ...dynamicStyles };

  const handleOptionPress = (field: keyof MovementFormData, value: string) => {
    const now = Date.now();
    const key = `${field}-${value}`;
    // Si se detecta doble clic en la misma opción, se deselecciona
    if (lastTapTimes.current[key] && now - lastTapTimes.current[key] < DOUBLE_PRESS_DELAY) {
      setFormData({ ...formData, [field]: '' });
    } else {
      setFormData({ ...formData, [field]: value });
    }
    lastTapTimes.current[key] = now;
  };

  // Se calcula la imagen solo si NO se ha seleccionado un servicio.
  const finalImage = (() => {
    if (!formData.service) {
      if (formData.cabinPosition === 'Dentro' && formData.chimneyPosition === 'Dentro') {
        return dentroImg;
      } else if (formData.cabinPosition === 'Dentro' && formData.chimneyPosition === 'Afuera') {
        return cabinaDentroImg;
      } else if (formData.cabinPosition === 'Afuera' && formData.chimneyPosition === 'Dentro') {
        return cabinaFueraImg;
      } else if (formData.cabinPosition === 'Afuera' && formData.chimneyPosition === 'Afuera') {
        return fueraImg;
      }
      return cabinaDentroImg;
    }
    return null;
  })();

  const renderPushPullImage = () => {
    if (formData.pushPull === 'Empujar') return Empujando;
    if (formData.pushPull === 'Jalar') return Remolcado;
    return null;
  };

  const cabinPositionError = !formData.cabinPosition ? 'Debes seleccionar la posición de cabina.' : '';
  const chimneyPositionError = !formData.chimneyPosition ? 'Debes seleccionar la posición de chimenea.' : '';
  const pushPullError = !formData.pushPull ? 'Debes seleccionar Empujar o Jalar.' : '';
  const movementTypeError = !formData.movementType ? 'Debes seleccionar el tipo de movimiento.' : '';

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {formData.service ? (
        // Si se ha seleccionado un servicio (Lavado o Torno)
        <>
          <Text style={styles.label}>Tipo de movimiento:</Text>
          {movementTypeError && <Text style={styles.errorText}>{movementTypeError}</Text>}
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'MD' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'MD')}
            >
              <Text style={styles.optionButtonText}>MD Trabajando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'Remolcada' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'Remolcada')}
            >
              <Text style={styles.optionButtonText}>Remolcada</Text>
            </TouchableOpacity>
          </View>
          {formData.movementType === 'Remolcada' && (
            <View>
              <Text style={styles.label}>Empujar / Jalar:</Text>
              {formData.pushPull && (
                <View style={styles.imageContainer}>
                  <Image source={renderPushPullImage()!} style={styles.image} />
                </View>
              )}
              {pushPullError && <Text style={styles.errorText}>{pushPullError}</Text>}
              <View style={styles.rowButtons}>
                {['Empujar', 'Jalar'].map((op) => (
                  <TouchableOpacity
                    key={op}
                    style={[styles.optionButton, formData.pushPull === op && styles.optionButtonSelected]}
                    onPress={() => handleOptionPress('pushPull', op)}
                  >
                    <Text style={styles.optionButtonText}>{op}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        
        </>
      ) : (
        // Si NO se ha seleccionado un servicio
        <>
          {finalImage && (
            <View style={styles.imageContainer}>
              <Image source={finalImage} style={styles.image} />
            </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.label}>¿Prioridad?</Text>
            <Switch
              value={formData.priority}
              onValueChange={(val) => setFormData({ ...formData, priority: val })}
            />
          </View>
          <Text style={styles.label}>Posición de cabina:</Text>
          {cabinPositionError && <Text style={styles.errorText}>{cabinPositionError}</Text>}
          <View style={styles.rowButtons}>
            {['Dentro', 'Afuera'].map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.optionButton, formData.cabinPosition === pos && styles.optionButtonSelected]}
                onPress={() => handleOptionPress('cabinPosition', pos)}
              >
                <Text style={styles.optionButtonText}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Posición de chimenea:</Text>
          {chimneyPositionError && <Text style={styles.errorText}>{chimneyPositionError}</Text>}
          <View style={styles.rowButtons}>
            {['Dentro', 'Afuera'].map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.optionButton, formData.chimneyPosition === pos && styles.optionButtonSelected]}
                onPress={() => handleOptionPress('chimneyPosition', pos)}
              >
                <Text style={styles.optionButtonText}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Tipo de movimiento:</Text>
          {movementTypeError && <Text style={styles.errorText}>{movementTypeError}</Text>}
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'MD' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'MD')}
            >
              <Text style={styles.optionButtonText}>MD Trabajando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'Remolcada' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'Remolcada')}
            >
              <Text style={styles.optionButtonText}>Remolcada</Text>
            </TouchableOpacity>
          </View>
          {formData.movementType === 'Remolcada' && (
            <View>
              <Text style={styles.label}>Empujar / Jalar:</Text>
              {formData.pushPull && (
                <View style={styles.imageContainer}>
                  <Image source={renderPushPullImage()!} style={styles.image} />
                </View>
              )}
              {pushPullError && <Text style={styles.errorText}>{pushPullError}</Text>}
              <View style={styles.rowButtons}>
                {['Empujar', 'Jalar'].map((op) => (
                  <TouchableOpacity
                    key={op}
                    style={[styles.optionButton, formData.pushPull === op && styles.optionButtonSelected]}
                    onPress={() => handleOptionPress('pushPull', op)}
                  >
                    <Text style={styles.optionButtonText}>{op}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default StepTwo;
