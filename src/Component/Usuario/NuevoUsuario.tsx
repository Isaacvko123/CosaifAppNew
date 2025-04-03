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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Importamos los estilos base
import { styles } from './CrearNuevoUsuarioStyles';
// Importamos los estilos dinámicos por rol
import { formStylesPorRol, rolFormMap } from './FormStyles';

// Definimos el tipo para el usuario actual (el que está autenticado)
interface UserData {
  id: number;
  usuario: string;
  email: string;
  rol: string;
  empresaId: number;
  activo: boolean;
  empresa?: { nombre: string };
}

/**
 * Función que calcula la seguridad de la contraseña y devuelve un porcentaje.
 * Se asignan puntos según criterios básicos: longitud, mayúsculas, minúsculas, números y caracteres especiales.
 */
const getPasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  return Math.min(score, 100);
};

/**
 * Componente Input memoizado para reutilización.
 * Incluye un ícono y configura el TextInput con estilos predefinidos.
 */
const Input = React.memo(
  ({ icon, ...props }: { icon: string } & React.ComponentProps<typeof TextInput>) => (
    <View style={styles.inputContainer}>
      <FontAwesome5 name={icon} size={18} color="#888" style={styles.icon} />
      <TextInput style={styles.input} placeholderTextColor="#666" {...props} />
    </View>
  )
);

const CrearNuevoUsuario: React.FC = () => {
  const navigation = useNavigation();

  // Estados del formulario
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  // Se reemplaza rolId por rol (tipo string)
  const [rol, setRol] = useState('CLIENTE'); // Valor por defecto
  const [empresaId, setEmpresaId] = useState('');
  const [localidadId, setLocalidadId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado para empresas (se obtienen del backend)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([]);
  // Estado para localidades (se obtienen del backend)
  const [localidades, setLocalidades] = useState<{ id: number; nombre: string }[]>([]);

  // Definimos los roles de forma estática utilizando el enum
  const enumRoles = [
    { rol: 'CLIENTE' },
    { rol: 'SUPERVISOR' },
    { rol: 'COORDINADOR' },
    { rol: 'OPERADOR' },
    { rol: 'MAQUINISTA' },
    { rol: 'ADMINISTRADOR' },
  ];

  // Estado para el usuario autenticado (para estilos dinámicos)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // Animación de opacidad para el formulario
  const opacity = useSharedValue(0);
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        // Se obtienen las empresas
        const empresasRes = await fetch('http://192.168.100.13:3000/empresas', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
        if (empresasData.length > 0) setEmpresaId(empresasData[0].id.toString());

        // Se obtienen las localidades
        const localidadesRes = await fetch('http://192.168.100.13:3000/localidades', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const localidadesData = await localidadesRes.json();
        setLocalidades(localidadesData);
        if (localidadesData.length > 0) setLocalidadId(localidadesData[0].id.toString());

        // Obtenemos el usuario autenticado para aplicar estilos dinámicos
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user: UserData = JSON.parse(userStr);
          setCurrentUser(user);
        }

        // Animar la aparición del formulario
        opacity.value = withTiming(1, { duration: 500 });
        setLoading(false);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('No se pudieron cargar los datos');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /**
   * Función para crear el usuario.
   * Valida los campos y envía la información a la API.
   */
  const handleCrearUsuario = async () => {
    // Validación: verificar que no queden campos vacíos
    if (!usuario || !email || !contrasena || !confirmarContrasena || !rol || !empresaId || !localidadId) {
      setError('Por favor, complete todos los campos');
      return;
    }
    // Validación: la contraseña debe tener al menos 8 caracteres
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    // Validación: comparar las contraseñas
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }
    // Validación: el email debe contener '@'
    const emailTrim = email.trim();
    if (!emailTrim.includes('@')) {
      setError('El email debe contener "@"');
      return;
    }

    // Aplicar trim a usuario
    const usuarioTrim = usuario.trim();

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.100.13:3000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          usuario: usuarioTrim,
          email: emailTrim,
          contrasena,
          rol, // Se utiliza el valor del enum directamente
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
      console.error('Error en el registro:', err);
      setError('Error de red, intente nuevamente');
    }
  };

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} />
        <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 30 }} />
        <Text style={styles.loadingText}>Cargando datos iniciales...</Text>
      </View>
    );
  }

  // Determinar los estilos dinámicos según el rol del usuario autenticado;
  // Si no hay usuario, se usa 'ADMINISTRADOR' por defecto.
  const roleKey = currentUser && rolFormMap[currentUser.rol]
    ? rolFormMap[currentUser.rol]
    : 'CLIENTE';
  const dynamicStyles = formStylesPorRol[roleKey];

  // Calcular la seguridad de la contraseña
  const passwordStrength = getPasswordStrength(contrasena);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[{ width: '100%' }, animatedContainerStyle]}>
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: dynamicStyles.title.color }]}>
            Crear Nuevo Usuario
          </Text>

          <Input icon="user" placeholder="Usuario" value={usuario} onChangeText={setUsuario} />
          <Input
            icon="envelope"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            icon="lock"
            placeholder="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />
          {/* Campo para confirmar la contraseña */}
          <Input
            icon="lock"
            placeholder="Confirmar Contraseña"
            value={confirmarContrasena}
            onChangeText={setConfirmarContrasena}
            secureTextEntry
          />
          {/* Mostrar recomendación de seguridad */}
          <Text style={{ marginBottom: 15, color: dynamicStyles.title.color }}>
            Seguridad de la contraseña: {passwordStrength}%
          </Text>

          {/* Picker para seleccionar el rol */}
          <View style={styles.inputContainer}>
            <FontAwesome5 name="user-tag" size={18} color="#888" style={styles.icon} />
            <Picker selectedValue={rol} style={styles.picker} onValueChange={(value) => setRol(value)}>
              {enumRoles.map((roleOption) => (
                <Picker.Item key={roleOption.rol} label={roleOption.rol} value={roleOption.rol} />
              ))}
            </Picker>
          </View>

          {/* Picker para seleccionar la empresa */}
          <View style={styles.inputContainer}>
            <FontAwesome5 name="building" size={18} color="#888" style={styles.icon} />
            <Picker selectedValue={empresaId} style={styles.picker} onValueChange={(value) => setEmpresaId(value)}>
              {empresas.map((empresa) => (
                <Picker.Item key={empresa.id} label={empresa.nombre} value={empresa.id.toString()} />
              ))}
            </Picker>
          </View>

          {/* Picker para seleccionar la localidad */}
          <View style={styles.inputContainer}>
            <FontAwesome5 name="map-marker-alt" size={18} color="#888" style={styles.icon} />
            <Picker selectedValue={localidadId} style={styles.picker} onValueChange={(value) => setLocalidadId(value)}>
              {localidades.map((loc) => (
                <Picker.Item key={loc.id} label={loc.nombre} value={loc.id.toString()} />
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
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default CrearNuevoUsuario;
