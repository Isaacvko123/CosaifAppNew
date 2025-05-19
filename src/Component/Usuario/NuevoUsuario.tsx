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

// Importamos los estilos mejorados y el tema
import { styles, theme } from './CrearNuevoUsuarioStyles';
import { formStylesPorRol, rolFormMap } from './FormStyles';

// Destructuramos el tema para fácil acceso
const { COLORS, SPACING } = theme;

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

// Componente para indicador de fortaleza de contraseña
const PasswordStrengthIndicator: React.FC<{ strength: number }> = ({ strength }) => {
  // Determinar color basado en la fortaleza
  const getColor = () => {
    if (strength < 40) return '#E63946'; // Rojo
    if (strength < 70) return '#FFA62B'; // Amarillo
    return '#2D6A4F';                     // Verde fuerte
  };

  return (
    <View style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
        <Text style={{ color: COLORS.text.secondary, fontSize: theme.FONT_SIZE.sm }}>
          Seguridad de la contraseña
        </Text>
        <Text style={{ color: getColor(), fontWeight: String(theme.FONT_WEIGHT.semibold) as any }}>
          {strength}%
        </Text>
      </View>
      <View style={{ height: 4, backgroundColor: '#E9ECF2', borderRadius: 2 }}>
        <View 
          style={{
            height: 4,
            width: `${strength}%`,
            backgroundColor: getColor(),
            borderRadius: 2
          }}
        />
      </View>
    </View>
  );
};

// Componente Input reutilizable
const FormInput: React.FC<{
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  rightIcon?: React.ReactNode;
}> = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  rightIcon
}) => {
  return (
    <View style={styles.inputContainer}>
      <FontAwesome5 name={icon} size={18} color={COLORS.text.secondary} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.secondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
      {rightIcon}
    </View>
  );
};

// Componente PickerSelect reutilizable
const FormPicker: React.FC<{
  icon: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
}> = ({ icon, selectedValue, onValueChange, items }) => {
  return (
    <View style={styles.inputContainer}>
      <FontAwesome5 name={icon} size={18} color={COLORS.text.secondary} style={styles.icon} />
      <Picker
        selectedValue={selectedValue}
        style={styles.picker}
        onValueChange={onValueChange}
      >
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
};

// Componente Button reutilizable
const FormButton: React.FC<{
  title: string;
  onPress: () => void;
  secondary?: boolean;
  style?: object;
}> = ({ title, onPress, secondary = false, style = {} }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        secondary && { backgroundColor: COLORS.primaryLight },
        style
      ]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const CrearNuevoUsuario: React.FC = () => {
  const navigation = useNavigation();

  // Estados
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  // Animaciones
  const opacity = useSharedValue(0);
  const animatedContainerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const updateProgress = (val: number) => setProgress((p) => Math.min(p + val, 100));

  // Efecto para ajustar roles disponibles cuando cambia la empresa
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        updateProgress(10);
        const token = await AsyncStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Fetch empresas
        const empresasRes = await fetch('http://10.10.10.6:3000/empresas', { headers });
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
        setEmpresaId(empresasData[0]?.id.toString() || '');
        updateProgress(40);

        // Fetch localidades
        const localidadesRes = await fetch('http://10.10.10.6:3000/localidades', { headers });
        const localidadesData = await localidadesRes.json();
        setLocalidades(localidadesData);
        setLocalidadId(localidadesData[0]?.id.toString() || '');
        updateProgress(30);

        // Obtener usuario actual
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }

        // Animar entrada
        updateProgress(100);
        opacity.value = withTiming(1, { duration: 500 });
        setTimeout(() => setLoading(false), 500);
      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
        setError('No se pudo conectar con el servidor. Contacta a soporte.');
        setFatalError(true);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Manejador para crear usuario
  const handleCrearUsuario = async () => {
    setError('');
    
    // Validaciones
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
      const response = await fetch('http://10.10.10.6:3000/usuarios', {
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
      setError('Error de conexión. Contacta con soporte.');
    }
  };

  // Obtener estilos dinámicos basados en el rol
  const roleKey = currentUser?.rol && rolFormMap[currentUser.rol] ? rolFormMap[currentUser.rol] : 'CLIENTE';
  const dynamicStyles = formStylesPorRol[roleKey];
  const passwordStrength = getPasswordStrength(contrasena);

  // Renderizado de pantalla de carga o error
  if (loading || fatalError) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo as import('react-native').ImageStyle} />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
        <Text style={styles.loadingText}>Cargando: {progress.toFixed(0)}%</Text>
        {fatalError && (
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={styles.errorText}>{error}</Text>
            <FormButton 
              title="Volver" 
              onPress={() => navigation.goBack()}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        )}
      </View>
    );
  }

  // Renderizado del formulario principal
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Animated.View style={[{ width: '100%' }, animatedContainerStyle]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: dynamicStyles.title.color }]}>
              Crear Nuevo Usuario
            </Text>

            {/* Inputs con componentes reutilizables */}
            <FormInput
              icon="user"
              placeholder="Nombre"
              value={usuario}
              onChangeText={setUsuario}
            />

            <FormInput
              icon="envelope"
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <FormInput
              icon="lock"
              placeholder="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <FontAwesome5 
                    name={showPassword ? 'eye' : 'eye-slash'} 
                    size={18} 
                    color={COLORS.text.secondary} 
                  />
                </TouchableOpacity>
              }
            />

            <FormInput
              icon="lock"
              placeholder="Confirmar Contraseña"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              secureTextEntry={!showConfirm}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <FontAwesome5 
                    name={showConfirm ? 'eye' : 'eye-slash'} 
                    size={18} 
                    color={COLORS.text.secondary} 
                  />
                </TouchableOpacity>
              }
            />

            {/* Indicador de fortaleza de contraseña */}
            <PasswordStrengthIndicator strength={passwordStrength} />

            {/* Pickers */}
            <FormPicker
              icon="building"
              selectedValue={empresaId}
              onValueChange={(value) => setEmpresaId(value)}
              items={empresas.map((e) => ({ label: e.nombre, value: e.id.toString() }))}
            />

            <FormPicker
              icon="user-tag"
              selectedValue={rol}
              onValueChange={(value) => setRol(value)}
              items={rolesOptions.map((r) => ({ label: r, value: r }))}
            />

            <FormPicker
              icon="map-marker-alt"
              selectedValue={localidadId}
              onValueChange={(value) => setLocalidadId(value)}
              items={localidades.map((l) => ({ label: l.nombre, value: l.id.toString() }))}
            />

            {/* Mensaje de error */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Botones */}
            <FormButton 
              title="Crear Usuario" 
              onPress={handleCrearUsuario} 
              style={{ backgroundColor: dynamicStyles.confirmButton.backgroundColor }}
            />

            <FormButton 
              title="Cancelar" 
              onPress={() => navigation.goBack()} 
              secondary
            />
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default CrearNuevoUsuario;