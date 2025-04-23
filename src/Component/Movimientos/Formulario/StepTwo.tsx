import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formStylesBase, formStylesPorRol, rolFormMap } from './formStyles';
import { MovementFormData } from './NewMovementForm';
import { MovementImages } from '../../../constants/imagenes'; // Usando alias limpio

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

  useEffect(() => {
    AsyncStorage.setItem('movementFormData', JSON.stringify(formData));
  }, [formData]);

  const rolKey = rolFormMap[rolId ?? -1];
  const dynamicStyles = formStylesPorRol[rolKey] || formStylesPorRol.CLIENTE;
  const styles = { ...formStylesBase, ...dynamicStyles };

  const handleOptionPress = (field: keyof MovementFormData, value: string) => {
    const now = Date.now();
    const key = `${field}-${value}`;
    if (lastTapTimes.current[key] && now - lastTapTimes.current[key] < DOUBLE_PRESS_DELAY) {
      setFormData({ ...formData, [field]: '' });
    } else {
      let finalValue = value;
      if (field === 'movementType') {
        finalValue = value === 'MD Trabajando' ? 'MD_TRABAJANDO' : 'REMOLCADA';
      } else if (field === 'cabinPosition' || field === 'chimneyPosition' || field === 'pushPull') {
        finalValue = value.toUpperCase();
      }
      setFormData({ ...formData, [field]: finalValue });
    }
    lastTapTimes.current[key] = now;
  };

  const finalImage = (() => {
    if (!formData.service) {
      const { cabinPosition, chimneyPosition } = formData;
      if (cabinPosition === 'DENTRO' && chimneyPosition === 'DENTRO') return MovementImages.dentro;
      if (cabinPosition === 'DENTRO' && chimneyPosition === 'AFUERA') return MovementImages.cabinaDentro;
      if (cabinPosition === 'AFUERA' && chimneyPosition === 'DENTRO') return MovementImages.cabinaFuera;
      if (cabinPosition === 'AFUERA' && chimneyPosition === 'AFUERA') return MovementImages.fuera;
    }
    return null;
  })();

  const renderPushPullImage = () => {
    if (formData.pushPull === 'EMPUJAR') return MovementImages.empujando;
    if (formData.pushPull === 'JALAR') return MovementImages.remolcado;
    return null;
  };

  const cabinPositionError = !formData.cabinPosition ? 'Debes seleccionar la posición de cabina.' : '';
  const chimneyPositionError = !formData.chimneyPosition ? 'Debes seleccionar la posición de chimenea.' : '';
  const pushPullError = !formData.pushPull ? 'Debes seleccionar EMPUJAR o JALAR.' : '';
  const movementTypeError = !formData.movementType ? 'Debes seleccionar el tipo de movimiento.' : '';

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {formData.service ? (
        <>
          <Text style={styles.label}>Tipo de movimiento:</Text>
          {movementTypeError && <Text style={styles.errorText}>{movementTypeError}</Text>}
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'MD_TRABAJANDO' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'MD Trabajando')}
            >
              <Text style={styles.optionButtonText}>MD Trabajando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'REMOLCADA' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'Remolcada')}
            >
              <Text style={styles.optionButtonText}>Remolcada</Text>
            </TouchableOpacity>
          </View>
          {formData.movementType === 'REMOLCADA' && (
            <View>
              <Text style={styles.label}>Empujar / Jalar:</Text>
              {formData.pushPull && (
                <View style={styles.imageContainer}>
                  <Image source={renderPushPullImage()!} style={styles.image} />
                </View>
              )}
              {pushPullError && <Text style={styles.errorText}>{pushPullError}</Text>}
              <View style={styles.rowButtons}>
                {['EMPUJAR', 'JALAR'].map((op) => (
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
        <>
          {finalImage && (
            <View style={styles.imageContainer}>
              <Image source={finalImage} style={styles.image} />
            </View>
          )}
          <Text style={styles.label}>Posición de cabina:</Text>
          {cabinPositionError && <Text style={styles.errorText}>{cabinPositionError}</Text>}
          <View style={styles.rowButtons}>
            {['DENTRO', 'AFUERA'].map((pos) => (
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
            {['DENTRO', 'AFUERA'].map((pos) => (
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
              style={[styles.optionButton, formData.movementType === 'MD_TRABAJANDO' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'MD Trabajando')}
            >
              <Text style={styles.optionButtonText}>MD Trabajando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.movementType === 'REMOLCADA' && styles.optionButtonSelected]}
              onPress={() => handleOptionPress('movementType', 'Remolcada')}
            >
              <Text style={styles.optionButtonText}>Remolcada</Text>
            </TouchableOpacity>
          </View>
          {formData.movementType === 'REMOLCADA' && (
            <View>
              <Text style={styles.label}>Empujar / Jalar:</Text>
              {formData.pushPull && (
                <View style={styles.imageContainer}>
                  <Image source={renderPushPullImage()!} style={styles.image} />
                </View>
              )}
              {pushPullError && <Text style={styles.errorText}>{pushPullError}</Text>}
              <View style={styles.rowButtons}>
                {['EMPUJAR', 'JALAR'].map((op) => (
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
