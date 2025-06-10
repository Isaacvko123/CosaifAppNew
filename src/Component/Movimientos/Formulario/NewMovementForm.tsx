// NewMovementForm.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { formStylesBase } from './formStyles';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';

export interface Track {
  id: number;
  nombre: string;
}

export interface MovementFormData {
  empresaId: number | null;
  locomotiveNumber: number;
  priority: boolean;
  fromTrack: number | null;
  toTrack: number | null;
  selectedLocalityId?: number;
  cabinPosition: string;
  chimneyPosition: string;
  pushPull: string;
  movementType: string;
  comments: string;
  service?: 'Lavado' | 'Torno' | '';
  creadoPorId: number | null;
  clienteId: number | null;
  fechaInicio: string;
  fechaFin: string;
  posicionChimenea?: 'DENTRO' | 'AFUERA' | null;
  direccionEmpuje?: 'EMPUJAR' | 'JALAR' | 'Sin_Solicitar';
}

// Declare your navigation params including Movimientos
type RootStackParamList = {
  Movimientos: undefined;
  // ... otras rutas
};
type NavProp = StackNavigationProp<RootStackParamList, 'Movimientos'>;

// --- ADD THIS INTERFACE ---
interface NewMovementFormProps {
  onFinish: () => void;
}

const initialFormState: MovementFormData = {
  empresaId: null,
  locomotiveNumber: 0,
  priority: false,
  fromTrack: null,
  toTrack: null,
  selectedLocalityId: undefined,
  cabinPosition: 'Sin_Solicitar',
  chimneyPosition: 'Sin_Solicitar',
  pushPull: '',
  movementType: '',
  comments: '',
  service: '',
  creadoPorId: null,
  clienteId: null,
  fechaInicio: new Date().toISOString(),
  fechaFin: new Date().toISOString(),
  posicionChimenea: null,
  direccionEmpuje: 'Sin_Solicitar',
};

const STEP_CONFIG = [
  { label: 'Paso 1 de 3', percent: 33 },
  { label: 'Paso 2 de 3', percent: 66 },
  { label: 'Paso 3 de 3', percent: 100 },
];

// Use the NewMovementFormProps interface here
const NewMovementForm: React.FC<NewMovementFormProps> = ({ onFinish }) => {
  const navigation = useNavigation<NavProp>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<MovementFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [predefinedTracks, setPredefinedTracks] = useState<Track[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  const [showFromOptions, setShowFromOptions] = useState(false);
  const [showToOptions, setShowToOptions] = useState(false);

  const fetchUserAndDefaults = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          creadoPorId: user.id,
          clienteId: user.id,
          empresaId: user.empresaId,
          selectedLocalityId: prev.selectedLocalityId ?? user.localidadId,
        }));
      }
    } catch (err) {
      console.error('Error cargando datos de usuario:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token');
      const [locRes, viasRes] = await Promise.all([
        fetch('http://31.97.13.182:3000/localidades', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        fetch('http://31.97.13.182:3000/vias', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
      ]);
      const localData = await locRes.json();
      const viasData = await viasRes.json();
      setLocalities(localData);
      setPredefinedTracks(
        viasData
          .map((v: any) => ({ id: v.id, nombre: v.nombre }))
          .sort((a: Track, b: Track) => a.nombre.localeCompare(b.nombre))
      );
    } catch (err) {
      console.error('Error al obtener datos:', err);
      Alert.alert('Error', 'No se pudieron cargar las vías/localidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndDefaults();
    fetchData();
  }, [fetchUserAndDefaults, fetchData]);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.locomotiveNumber || isNaN(formData.locomotiveNumber)) {
      errs.locomotiveNumber = 'Número requerido.';
    }
    if (!formData.fromTrack) errs.fromTrack = 'Selecciona vía de origen.';
    if (!formData.service && !formData.toTrack) errs.toTrack = 'Selecciona vía de destino.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const { label: stepLabel, percent } = useMemo(
    () => STEP_CONFIG[currentStep - 1],
    [currentStep]
  );

  const renderStep = () => {
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
            localities={localities}
          />
        );
      case 2:
        return <StepTwo formData={formData} setFormData={setFormData} />;
      case 3:
        return (
          <StepThree
            formData={formData}
            setFormData={setFormData}
            onFinish={onFinish}  // use the passed callback
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View
        style={[
          formStylesBase.scrollContainer,
          { alignItems: 'center', justifyContent: 'center' },
        ]}>
        <Image
          source={require('../../../../assets/logo.png')}
          style={{ width: 220, height: 220, marginBottom: 30 }}
        />
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            fontWeight: '500',
            color: '#2C3E50',
          }}>
          Cargando datos del formulario...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={formStylesBase.scrollContainer}>
      <Text style={formStylesBase.title}>
        Nuevo Movimiento ({stepLabel})
      </Text>
      <View style={formStylesBase.progressBarContainer}>
        <View
          style={[
            formStylesBase.progressBarFill,
            { width: `${percent}%`, backgroundColor: '#12AB35' },
          ]}
        />
      </View>
      <Text
        style={{
          textAlign: 'right',
          marginTop: 4,
          marginBottom: 8,
          fontSize: 12,
          color: '#666',
        }}>
        {percent}%
      </Text>
      {renderStep()}
      <View style={formStylesBase.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={formStylesBase.navButton}
            onPress={prevStep}>
            <Text style={formStylesBase.confirmButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        {currentStep < 3 && (
          <TouchableOpacity
            style={formStylesBase.navButton}
            onPress={nextStep}>
            <Text style={formStylesBase.confirmButtonText}>Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default NewMovementForm;
