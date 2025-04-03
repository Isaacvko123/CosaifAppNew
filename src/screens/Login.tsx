/**
 * Login.tsx
 *
 * Pantalla de autenticación de usuario.
 *
 * Esta vista permite a los usuarios iniciar sesión mediante usuario y contraseña.
 * Realiza una solicitud HTTP al backend, recibe un token JWT y lo almacena en AsyncStorage.
 * Luego redirige al usuario a una pantalla específica según su rol.
 *
 * Funcionalidad:
 * - Validación básica de campos.
 * - Comunicación con backend vía `fetch`.
 * - Manejo de errores de red y errores de autenticación.
 * - Persistencia del token y usuario autenticado.
 * - Redirección por rol.
 * - Iconos con FontAwesome y gradiente visual con `expo-linear-gradient`.
 *
 * Navegación:
 * - Utiliza React Navigation para navegar hacia:
 *   - `Cliente` (rol = "CLIENTE")
 *   - `Supervisor` (rol = "SUPERVISOR")
 *   - `Home` (otros)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Cliente: undefined;
  Home: undefined;
  Supervisor: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const Login = () => {
  const navigation = useNavigation<NavigationProp>();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /**
   * Maneja el proceso de login:
   * - Envía la solicitud POST al backend.
   * - Almacena token y datos del usuario en AsyncStorage.
   * - Redirige según el rol del usuario autenticado.
   */
  const handleLogin = async () => {
    try {
      const response = await fetch('http://192.168.100.13:3000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: username, contrasena: password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.error || 'Error en la autenticación');
        return;
      }
  
      const { token, user } = data;
  
      // Guardamos todo el usuario tal como viene del backend
      await AsyncStorage.multiSet([
        ['token', token],
        ['rol', user.rol],
        ['user', JSON.stringify(user)],
      ]);
  
      // Mensaje de bienvenida con el nombre
      Alert.alert('Bienvenido', `${user.nombre}`);
  
      switch (user.rol) {
        case 'CLIENTE':
          navigation.navigate('Cliente');
          break;
        case 'SUPERVISOR':
          navigation.navigate('Supervisor');
          break;
        default:
          navigation.navigate('Home');
          break;
      }
    } catch (err) {
      console.error('Error de red o solicitud:', err);
      setError('Error de red, intente más tarde');
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#A3D9A5', '#74C69D']} style={styles.background}>
        <View style={styles.loginContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Bienvenido</Text>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="user" size={20} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={20} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome5
                name={showPassword ? 'eye' : 'eye-slash'}
                size={20}
                color="#888"
                style={styles.iconRight}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginContainer: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#E9F5EB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A3D9A5',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  icon: {
    marginLeft: 5,
  },
  iconRight: {
    marginRight: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#74C69D',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#74C69D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default Login;
