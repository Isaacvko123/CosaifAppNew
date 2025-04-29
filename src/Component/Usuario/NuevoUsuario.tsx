import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { styles } from './CrearNuevoUsuarioStyles';
import { formStylesPorRol, rolFormMap } from './FormStyles';

interface UserData {
  id: number;
  usuario: string;
  email: string;
  rol: string;
  empresaId: number;
  activo: boolean;
  empresa?: { nombre: string };
}

const getPasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  return Math.min(score, 100);
};

const CrearNuevoUsuario: React.FC = () => {
  const navigation = useNavigation();

  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reordered: company first, then role
  const [empresaId, setEmpresaId] = useState('');
  const [rol, setRol] = useState('CLIENTE');
  const [rolesOptions, setRolesOptions] = useState<string[]>(['CLIENTE']);

  const [localidadId, setLocalidadId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(false);
  const [progress, setProgress] = useState(0);

  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([]);
  const [localidades, setLocalidades] = useState<{ id: number; nombre: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const opacity = useSharedValue(0);
  const animatedContainerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const updateProgress = (val: number) => setProgress((p) => Math.min(p + val, 100));

  // Adjust available roles when company changes
  useEffect(() => {
    const selected = empresas.find(e => e.id.toString() === empresaId)?.nombre || '';
    const lower = selected.toLowerCase();
    if (lower === 'vianko' || lower === 'cosaif') {
      const opts = ['SUPERVISOR', 'COORDINADOR', 'OPERADOR', 'MAQUINISTA', 'ADMINISTRADOR'];
      setRolesOptions(opts);
      if (!opts.includes(rol)) setRol(opts[0]);
    } else {
      setRolesOptions(['CLIENTE']);
      setRol('CLIENTE');
    }
  }, [empresaId, empresas]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        updateProgress(10);
        const token = await AsyncStorage.getItem('token');

        const empresasRes = await fetch('http://192.168.101.20:3000/empresas', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
        setEmpresaId(empresasData[0]?.id.toString() || '');

        updateProgress(40);
        const localidadesRes = await fetch('http://192.168.101.20:3000/localidades', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const localidadesData = await localidadesRes.json();
        setLocalidades(localidadesData);
        setLocalidadId(localidadesData[0]?.id.toString() || '');

        updateProgress(30);
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }

        updateProgress(100);
        opacity.value = withTiming(1, { duration: 500 });
        setTimeout(() => setLoading(false), 500);
      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
        setError('Upps... No se pudo conectar con el servidor. Contacta a soporte.');
        setFatalError(true);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCrearUsuario = async () => {
    setError('');
    if (!usuario || !email || !contrasena || !confirmarContrasena || !rol || !empresaId || !localidadId) {
      setError('Completa todos los campos.');
      return;
    }
    if (contrasena.length < 8) {
      setError('Contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Formato de correo inválido.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.101.20:3000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: usuario.trim(),
          email: email.trim(),
          contrasena,
          rol,
          empresaId: parseInt(empresaId, 10),
          localidadId: parseInt(localidadId, 10),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error al crear usuario');
        return;
      }

      Alert.alert('✅ Usuario creado', 'El usuario ha sido registrado exitosamente');
      navigation.goBack();
    } catch (err) {
      console.error('Error creando usuario:', err);
      setError('Ups... no se pudo registrar. Contacta con soporte.');
    }
  };

  const roleKey = currentUser?.rol && rolFormMap[currentUser.rol] ? rolFormMap[currentUser.rol] : 'CLIENTE';
  const dynamicStyles = formStylesPorRol[roleKey];
  const passwordStrength = getPasswordStrength(contrasena);

  if (loading || fatalError) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} />
        <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 30 }} />
        <Text style={styles.loadingText}>Cargando: {progress.toFixed(0)}%</Text>
        {fatalError && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: dynamicStyles.confirmButton.backgroundColor }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Animated.View style={[{ width: '100%' }, animatedContainerStyle]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: dynamicStyles.title.color }]}>Crear Nuevo Usuario</Text>

            {/* Campos de entrada estándar */}
            <View style={styles.inputContainer}>
              <FontAwesome5 name="user" size={18} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#888"
                value={usuario}
                onChangeText={setUsuario}
              />
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome5 name="envelope" size={18} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#888"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome5 name="lock" size={18} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={contrasena}
                onChangeText={setContrasena}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome5 name={showPassword ? 'eye' : 'eye-slash'} size={18} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome5 name="lock" size={18} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirm}
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <FontAwesome5 name={showConfirm ? 'eye' : 'eye-slash'} size={18} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={{ marginBottom: 10, color: dynamicStyles.title.color }}>
              Seguridad de la contraseña: {passwordStrength}%
            </Text>

            {/* Picker: Empresa primero */}
            <View style={styles.inputContainer}>
              <FontAwesome5 name="building" size={18} color="#888" style={styles.icon} />
              <Picker selectedValue={empresaId} style={styles.picker} onValueChange={setEmpresaId}>
                {empresas.map((e) => (
                  <Picker.Item key={e.id} label={e.nombre} value={e.id.toString()} />
                ))}
              </Picker>
            </View>

            {/* Picker dinámico de Rol */}
            <View style={styles.inputContainer}>
              <FontAwesome5 name="user-tag" size={18} color="#888" style={styles.icon} />
              <Picker selectedValue={rol} style={styles.picker} onValueChange={setRol}>
                {rolesOptions.map(r => (
                  <Picker.Item key={r} label={r} value={r} />
                ))}
              </Picker>
            </View>

            {/* Picker: Localidad */}
            <View style={styles.inputContainer}>
              <FontAwesome5 name="map-marker-alt" size={18} color="#888" style={styles.icon} />
              <Picker selectedValue={localidadId} style={styles.picker} onValueChange={setLocalidadId}>
                {localidades.map((l) => (
                  <Picker.Item key={l.id} label={l.nombre} value={l.id.toString()} />
                ))}
              </Picker>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: dynamicStyles.confirmButton.backgroundColor }]}
              onPress={handleCrearUsuario}
            >
              <Text style={styles.buttonText}>Crear Usuario</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default CrearNuevoUsuario;
