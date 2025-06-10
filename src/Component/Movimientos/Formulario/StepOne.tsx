import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { formStylesBase, formStylesPorRol, rolFormMap } from './formStyles';
import { MovementFormData } from './NewMovementForm';

export interface Track {
  id: number;
  nombre: string;
}

export interface Localidad {
  id: number;
  nombre: string;
  estado: string;
}

export interface Empresa {
  id: number;
  nombre: string;
}

interface StepOneProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
  errors: {
    locomotiveNumber?: string;
    fromTrack?: string;
    toTrack?: string;
    selectedLocalityId?: string;
  };
  predefinedTracks: Track[];
  showFromOptions: boolean;
  setShowFromOptions: React.Dispatch<React.SetStateAction<boolean>>;
  showToOptions: boolean;
  setShowToOptions: React.Dispatch<React.SetStateAction<boolean>>;
  localities: Localidad[];
}

const CustomCheckBox: React.FC<{ value: boolean; onValueChange: (newValue: boolean) => void }> = ({ value, onValueChange }) => (
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
  localities: propLocalities,
}) => {
  const [rolId, setRolId] = useState<number | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [serviceExplanation, setServiceExplanation] = useState('');
  const [showLocalityOptions, setShowLocalityOptions] = useState(false);

  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [isViankoUser, setIsViankoUser] = useState(false);
  const [showCompanyOptions, setShowCompanyOptions] = useState(false);
  const [userCompany, setUserCompany] = useState('');

  const [localities, setLocalities] = useState<Localidad[]>(propLocalities);
  const lastServicePress = useRef<{ [key: string]: number }>({ Lavado: 0, Torno: 0 });

  const alertShown = useRef(false);

  useEffect(() => {
    const checkNet = NetInfo.addEventListener(state => {
      if (!state.isConnected && !alertShown.current) {
        Alert.alert('Sin conexión', 'Conéctate a una red para continuar.');
        alertShown.current = true;
      }
      if (state.isConnected) {
        alertShown.current = false;
      }
    });
    return () => checkNet();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (!userStr) throw new Error('Usuario no encontrado');

        const user = JSON.parse(userStr);
        setRolId(user.rolId);
        setIsSupervisor(user.rol?.toUpperCase() === 'SUPERVISOR');

        if (!isSupervisor && user.localidadId) {
          setFormData(prev => ({ ...prev, selectedLocalityId: prev.selectedLocalityId ?? user.localidadId }));
        }

        if (user.empresa?.nombre?.toLowerCase() === 'vianko') {
          setIsViankoUser(true);
          const token = await AsyncStorage.getItem('token');
          if (!token) throw new Error('Token no encontrado');

          const res = await fetch('http://31.97.13.182:3000/empresas', {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!res.ok) throw new Error('Error al obtener empresas');
          const data = await res.json();
          setCompanies(data);
          await AsyncStorage.setItem('companies', JSON.stringify(data));
        } else {
          setUserCompany(user.empresa?.nombre || '');
        }
      } catch (err) {
        Alert.alert('Error crítico', 'No se pudo cargar la sesión. Regresando al inicio.');
      }
    };

    fetchUser();
  }, [setFormData]);

  useEffect(() => {
    const fetchLocalities = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado');

        const res = await fetch('http://31.97.13.182:3000/localidades', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Fallo al cargar localidades');

        const data = await res.json();
        setLocalities(data);
        await AsyncStorage.setItem('localities', JSON.stringify(data));
      } catch (err) {
        const fallback = await AsyncStorage.getItem('localities');
        if (fallback) {
          setLocalities(JSON.parse(fallback));
        } else {
          Alert.alert('Error', 'No se pudieron cargar las localidades.');
        }
      }
    };

    fetchLocalities();
  }, []);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!formData.selectedLocalityId) return setFilteredTracks([]);

      setTracksLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado');

        const res = await fetch(`http://31.97.13.182:3000/vias/localidad/${formData.selectedLocalityId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Error al obtener vías');
        const data = await res.json();

        const tracks: Track[] = data.map((v: any) => ({ id: v.id, nombre: v.nombre }));
        setFilteredTracks(tracks.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las vías.');
      } finally {
        setTracksLoading(false);
      }
    };

    fetchTracks();
  }, [formData.selectedLocalityId]);

  const getTrackName = useCallback(
    (trackId: number | null) => {
      const list = filteredTracks.length ? filteredTracks : predefinedTracks;
      return list.find(t => t.id === trackId)?.nombre || '';
    },
    [filteredTracks, predefinedTracks]
  );

  const handleServicePress = (service: 'Lavado' | 'Torno') => {
    const now = Date.now();
    if (now - lastServicePress.current[service] < DOUBLE_PRESS_DELAY) {
      setFormData({ ...formData, service: '' });
      setServiceExplanation('');
    } else {
      setFormData({ ...formData, service });
      setServiceExplanation('Doble clic para desmarcar el servicio');
    }
    lastServicePress.current[service] = now;
  };

  const rolKey = rolFormMap[rolId ?? -1] || 'CLIENTE';
  const styles = { ...formStylesBase, ...formStylesPorRol[rolKey] };

  const selectedLocality = localities.find(loc => loc.id === formData.selectedLocalityId);

  return (
    <View>
      {/* Empresa */}
      {isViankoUser ? (
        <>
          <Text style={styles.label}>Empresa (selección):</Text>
          <TouchableOpacity onPress={() => setShowCompanyOptions(!showCompanyOptions)}>
          <View pointerEvents="none">

            <TextInput
              style={styles.input}
              placeholder="Selecciona empresa"
              editable={false}
              value={companies.find(c => c.id === formData.empresaId)?.nombre || ''}
            />
              </View>
          </TouchableOpacity>
          {showCompanyOptions && (
            <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
              {companies.map(c => (
                <TouchableOpacity key={c.id} onPress={() => {
                  setFormData({ ...formData, empresaId: c.id });
                  setShowCompanyOptions(false);
                }}>
                  <Text style={styles.optionText}>{c.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <>
          <Text style={styles.label}>Empresa:</Text>
          <TextInput style={styles.input} editable={false} value={userCompany} />
        </>
      )}

      {/* Localidad */}
      <Text style={styles.label}>Localidad:</Text>
      {isSupervisor ? (
        <>
          <TouchableOpacity onPress={() => setShowLocalityOptions(!showLocalityOptions)}>
          <View pointerEvents="none">

            <TextInput
              style={styles.input}
              editable={false}
              value={selectedLocality?.nombre || ''}
              placeholder="Selecciona una localidad"
            />
              </View>

          </TouchableOpacity>
          {showLocalityOptions && (
            <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
              {localities.map(loc => (
                <TouchableOpacity key={loc.id} onPress={() => {
                  setFormData({ ...formData, selectedLocalityId: loc.id });
                  setShowLocalityOptions(false);
                }}>
                  <Text style={styles.optionText}>{loc.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <TextInput style={styles.input} editable={false} value={selectedLocality?.nombre || ''} />
      )}
      {errors.selectedLocalityId && <Text style={styles.errorText}>{errors.selectedLocalityId}</Text>}

      {/* Servicio */}
      <Text style={styles.label}>Servicio:</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {['Lavado', 'Torno'].map(service => (
          <TouchableOpacity
            key={service}
            style={[styles.optionButton, formData.service === service && styles.optionButtonSelected]}
            onPress={() => handleServicePress(service as 'Lavado' | 'Torno')}
          >
            <Text style={styles.optionButtonText}>{service}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {serviceExplanation && <Text style={{ fontStyle: 'italic', marginBottom: 10 }}>{serviceExplanation}</Text>}

      {/* Prioridad */}
      <View style={styles.centerRow}>
        <CustomCheckBox
          value={formData.priority}
          onValueChange={value => setFormData({ ...formData, priority: value })}
        />
        <Text style={styles.label}>Prioridad: {formData.priority ? 'ALTA' : 'BAJA'}</Text>
      </View>

      {/* Número locomotora */}
      <Text style={styles.label}>Número de locomotora:</Text>
      <TextInput
      
  style={styles.input}
  placeholder="Ej: 321"
  keyboardType="numeric"
  value={formData.locomotiveNumber > 0 ? String(formData.locomotiveNumber) : ''}
  onChangeText={(text) => {
    const numericValue = text.replace(/\D/g, ''); // Solo números
    setFormData({
      ...formData,
      locomotiveNumber: numericValue ? parseInt(numericValue, 10) : 0, // siempre número
    });
  }}
/>

      {errors.locomotiveNumber && <Text style={styles.errorText}>{errors.locomotiveNumber}</Text>}

      {/* From Track */}
      <Text style={styles.label}>De vía:</Text>
      <TouchableOpacity onPress={() => setShowFromOptions(!showFromOptions)}>
      <View pointerEvents="none">

        <TextInput
          style={styles.input}
          editable={false}
          placeholder="Selecciona una vía"
          value={getTrackName(formData.fromTrack)}
        />
        </View>
      </TouchableOpacity>
      {errors.fromTrack && <Text style={styles.errorText}>{errors.fromTrack}</Text>}
      {showFromOptions && (
        <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
          {(filteredTracks.length ? filteredTracks : predefinedTracks).map(track => (
            <TouchableOpacity
              key={track.id}
              onPress={() => {
                setFormData({ ...formData, fromTrack: track.id });
                setShowFromOptions(false);
              }}
            >
              <Text style={styles.optionText}>Vía {track.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* To Track (if no service) */}
      {!formData.service && (
        <>
          <Text style={styles.label}>Para vía:</Text>
          <TouchableOpacity onPress={() => setShowToOptions(!showToOptions)}>
          <View pointerEvents="none">

            <TextInput
              style={styles.input}
              editable={false}
              placeholder="Selecciona una vía"
              value={getTrackName(formData.toTrack)}
            />
            </View>
          </TouchableOpacity>
          {errors.toTrack && <Text style={styles.errorText}>{errors.toTrack}</Text>}
          {showToOptions && (
            <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
              {(filteredTracks.length ? filteredTracks : predefinedTracks).map(track => (
                <TouchableOpacity
                  key={track.id}
                  onPress={() => {
                    setFormData({ ...formData, toTrack: track.id });
                    setShowToOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>Vía {track.nombre}</Text>
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
