import React, { useRef, useState } from 'react';
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
  Animated,
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

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    try {
      await AsyncStorage.multiRemove(['token', 'rol', 'user']);

      const response = await fetch('http://192.168.101.20:3000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: username, contrasena: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? 'Error en la autenticación');
        return;
      }

      const { token, user } = data;

      await AsyncStorage.multiSet([
        ['token', token],
        ['rol', user.rol],
        ['user', JSON.stringify(user)],
      ]);

      Alert.alert('Bienvenido', `${user.nombre}`);

      switch (user.rol) {
        case 'CLIENTE':
          navigation.navigate('Cliente');
          break;
        case 'SUPERVISOR':
          if (user.empresa?.nombre?.toLowerCase() === 'vianko') {
            navigation.navigate('Supervisor');
          } else {
            navigation.navigate('Cliente');
          }
          break;
        default:
          navigation.navigate('Home');
      }
    } catch (err: any) {
      console.error('Error de red o solicitud:', err);
      Alert.alert(
        'Error',
        err?.message?.includes('Network request failed')
          ? 'Conéctate a una red'
          : 'El servidor no responde. Por favor, contacte a soporte'
      );
      setError('Error de red, intente más tarde');
    }
  };

  const animateIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
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
            <FontAwesome5 name="user" size={18} color="#4B5563" />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={18} color="#4B5563" />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome5
                name={showPassword ? 'eye' : 'eye-slash'}
                size={18}
                color="#4B5563"
                style={styles.iconRight}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.8}
              onPressIn={animateIn}
              onPressOut={animateOut}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Ingresar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginContainer: {
    width: '90%',
    backgroundColor: '#ffffffee',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D6A4F',
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A3D9A5',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#40916C',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#40916C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  errorText: {
    color: 'crimson',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default Login;
