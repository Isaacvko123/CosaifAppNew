import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { formStyles as styles } from './formStyles';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';

// Tipos de datos para el formulario
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
  // Nuevo campo para servicio (opcional, pero requerido en StepThree)
  service?: 'Lavado' | 'Torno' | '';
}

interface NewMovementFormProps {
  onFinish: () => void;
}

const NewMovementForm: React.FC<NewMovementFormProps> = ({ onFinish }) => {
  // Estado para manejar el paso actual (1, 2, 3)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Estado para los datos del formulario
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

  // Estado para almacenar los errores de validación en el Paso 1
  const [errors, setErrors] = useState<{
    locomotiveNumber?: string;
    fromTrack?: string;
    toTrack?: string;
  }>({});

  // Estados para mostrar/ocultar opciones de "De vía" y "Para vía"
  const [showFromOptions, setShowFromOptions] = useState(false);
  const [showToOptions, setShowToOptions] = useState(false);

  // Vías predefinidas (ejemplo)
  const predefinedTracks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Validación del Paso 1
  const validateStep1 = (): boolean => {
    let valid = true;
    const newErrors: {
      locomotiveNumber?: string;
      fromTrack?: string;
      toTrack?: string;
    } = {};

    if (formData.locomotiveNumber.trim() === '') {
      newErrors.locomotiveNumber = 'El número de locomotora es requerido.';
      valid = false;
    }
    if (formData.fromTrack.toString().trim() === '') {
      newErrors.fromTrack = 'Debes seleccionar una vía.';
      valid = false;
    }
    if (formData.toTrack.toString().trim() === '') {
      newErrors.toTrack = 'Debes seleccionar una vía.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Funciones para avanzar o retroceder entre pasos
  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Barra de progreso simple basada en el paso actual
  const progressPercentage = (currentStep / 3) * 100;

  // Renderizado condicional de cada paso
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
        return (
          <StepTwo
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          // Se pasa el callback onFinish a StepThree
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Barra de progreso */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>

      <Text style={styles.title}>Nuevo movimiento (Paso {currentStep} de 3)</Text>

      {renderStepContent()}

      {/* Botones para navegar entre pasos */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.navButton} onPress={prevStep}>
            <Text style={styles.navButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        {currentStep < 3 && (
          <TouchableOpacity style={styles.navButton} onPress={nextStep}>
            <Text style={styles.navButtonText}>Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default NewMovementForm;
