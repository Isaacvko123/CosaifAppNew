import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formStylesBase } from './formStyles';

import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';

export interface MovementFormData {
  locomotiveNumber: string;
  fromTrack: string;
  toTrack: string;
  priority: boolean;
  cabinPosition: string;
  chimneyPosition: string;
  pushPull: string;
  movementType: string;
  comments: string;
  service?: 'Lavado' | 'Torno' | '';
}

interface NewMovementFormProps {
  onFinish: () => void;
}

const NewMovementForm: React.FC<NewMovementFormProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [formData, setFormData] = useState<MovementFormData>({
    locomotiveNumber: '',
    fromTrack: '',
    toTrack: '',
    priority: false,
    cabinPosition: '',
    chimneyPosition: '',
    pushPull: '',
    movementType: '',
    comments: '',
    service: '',
  });

  const [errors, setErrors] = useState<{
    locomotiveNumber?: string;
    fromTrack?: string;
    toTrack?: string;
  }>({});

  const [showFromOptions, setShowFromOptions] = useState(false);
  const [showToOptions, setShowToOptions] = useState(false);

  const predefinedTracks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const validateStep1 = (): boolean => {
    let valid = true;
    const newErrors: typeof errors = {};

    if (!formData.locomotiveNumber.trim()) {
      newErrors.locomotiveNumber = 'El número de locomotora es requerido.';
      valid = false;
    }
    if (!formData.fromTrack.trim()) {
      newErrors.fromTrack = 'Debes seleccionar una vía de origen.';
      valid = false;
    }
    // Si se ha seleccionado un servicio, no se requiere la vía de destino.
    if (!formData.service && !formData.toTrack.trim()) {
      newErrors.toTrack = 'Debes seleccionar una vía de destino.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const progressPercentage = (currentStep / 3) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepOne
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            predefinedTracks={predefinedTracks}
            showFromOptions={showFromOptions}
            setShowFromOptions={setShowFromOptions}
            showToOptions={showToOptions}
            setShowToOptions={setShowToOptions}
          />
        );
      case 2:
        return <StepTwo formData={formData} setFormData={setFormData} />;
      case 3:
        return (
          <StepThree
            formData={formData}
            setFormData={setFormData}
            onFinish={onFinish}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={formStylesBase.scrollContainer}>
      {/* Barra de progreso */}
      <View style={formStylesBase.progressBarContainer}>
        <View
          style={[
            formStylesBase.progressBarFill,
            { width: `${progressPercentage}%` },
          ]}
        />
      </View>

      {/* Título */}
      <Text style={formStylesBase.title}>
        Nuevo Movimiento (Paso {currentStep} de 3)
      </Text>

      {/* Contenido del paso */}
      {renderStepContent()}

      {/* Navegación */}
      <View style={formStylesBase.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={formStylesBase.navButton}
            onPress={prevStep}
          >
            <Text style={formStylesBase.confirmButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        {currentStep < 3 && (
          <TouchableOpacity
            style={formStylesBase.navButton}
            onPress={nextStep}
          >
            <Text style={formStylesBase.confirmButtonText}>Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default NewMovementForm;
