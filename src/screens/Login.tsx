import React, { useRef, useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Animated,
  useWindowDimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 IMPORTAR EL NOTIFICATION SERVICE - RUTA CORREGIDA
import NotificationService from '../navigation/NotificationService';

// Navigation routes definition
type RootStackParamList = {
  Cliente: undefined;
  Home: undefined;
  Supervisor: undefined;
  Maquinista: undefined;
  Operador: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function Login() {
  const navigation = useNavigation<NavigationProp>();
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const isLandscape = width > height;
  
  // Estados
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Valores de animación
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputAnim1 = useRef(new Animated.Value(0)).current;
  const inputAnim2 = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Referencias para los inputs
  const passwordInputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    // Animación de entrada de los elementos
    Animated.stagger(150, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim2, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Detectar cuando el teclado se abre/cierra
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardOpen(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardOpen(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const navigateTo = (route: keyof RootStackParamList) => {
    navigation.navigate(route);
  };
  
  // Animación de error (shake)
  const playErrorAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { 
        toValue: 10, 
        duration: 100, 
        useNativeDriver: true 
      }),
      Animated.timing(shakeAnim, { 
        toValue: -10, 
        duration: 100, 
        useNativeDriver: true 
      }),
      Animated.timing(shakeAnim, { 
        toValue: 10, 
        duration: 100, 
        useNativeDriver: true 
      }),
      Animated.timing(shakeAnim, { 
        toValue: 0, 
        duration: 100, 
        useNativeDriver: true 
      })
    ]).start();
  };

  const handleLogin = async () => {
    /* Animación de "tap" */
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    Keyboard.dismiss();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      playErrorAnimation();
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Iniciando proceso de login...');

      // Limpia credenciales previas
      if (Platform.OS === 'web') {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('user');
        localStorage.removeItem('active_incident');
        localStorage.removeItem('incident_history');
      } else {
        await AsyncStorage.multiRemove([
          'token', 
          'rol', 
          'user',
          'active_incident',
          'incident_history'
        ]);
      }
      console.log('🧹 Datos anteriores limpiados');

      /* ---------- LOGIN ---------- */
      console.log('📡 Enviando credenciales al servidor...');
      const res = await fetch('http://31.97.13.182:3000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: username, contrasena: password }),
      });

      const { token, user, error: errMsg } = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        console.error('❌ Error de autenticación:', errMsg);
        setError(errMsg ?? 'Error en la autenticación');
        playErrorAnimation();
        return;
      }

      console.log('✅ Login exitoso:', { nombre: user.nombre, rol: user.rol });

      /* ---------- PERSISTE JWT y USER ---------- */
      if (Platform.OS === 'web') {
        localStorage.setItem('token', token);
        localStorage.setItem('rol', user.rol);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        await AsyncStorage.multiSet([
          ['token', token],
          ['rol', user.rol],
          ['user', JSON.stringify(user)],
        ]);
      }
      console.log('💾 Datos de usuario guardados en AsyncStorage');

      /* ---------- REGISTRA TOKEN FCM Y CONFIGURA NOTIFICACIONES ---------- */
      try {
        console.log('🔔 Configurando notificaciones FCM...');
        
        // 1) Solicita permisos
        const auth = await messaging().requestPermission();
        const enabled =
          auth === messaging.AuthorizationStatus.AUTHORIZED ||
          auth === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('📱 Permisos FCM:', enabled ? 'Concedidos' : 'Denegados');

        if (enabled) {
          // 2) Obtiene token FCM
          const fcmToken = await messaging().getToken();
          console.log('🔑 FCM Token obtenido:', fcmToken.substring(0, 20) + '...');

          // 3) Envía al backend
          const fcmResponse = await fetch('http://31.97.13.182:3000/fcm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ usuarioId: user.id, token: fcmToken }),
          });

          if (fcmResponse.ok) {
            console.log('✅ Token FCM registrado en el servidor');
          } else {
            console.warn('⚠️ Error registrando token FCM en el servidor');
          }

          // 4) Configura actualización de token
          messaging().onTokenRefresh(async newToken => {
            console.log('🔄 Token FCM actualizado:', newToken.substring(0, 20) + '...');
            try {
              await fetch('http://31.97.13.182:3000/fcm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ usuarioId: user.id, token: newToken }),
              });
              console.log('✅ Token FCM actualizado en el servidor');
            } catch (refreshError) {
              console.error('❌ Error actualizando token FCM:', refreshError);
            }
          });

          // 🚨 INICIALIZAR SISTEMA DE NOTIFICACIONES PARA CLIENTES
          if (user.rol?.toUpperCase() === 'CLIENTE') {
            console.log('🔔 Usuario es CLIENTE - Inicializando sistema de notificaciones...');
            
            // Verificar que el NotificationService esté disponible
            try {
              const notificationService = NotificationService.getInstance();
              console.log('🔧 NotificationService obtenido:', !!notificationService);
              
              // Dar tiempo para que AsyncStorage se actualice
              setTimeout(async () => {
                try {
                  console.log('🚀 Inicializando NotificationService...');
                  await notificationService.initialize();
                  console.log('✅ Sistema de notificaciones inicializado correctamente');
                  
                  // Verificar configuración
                  const hasActiveIncident = await notificationService.hasActiveIncident();
                  console.log('📋 ¿Hay incidente activo al login?', hasActiveIncident);
                  
                } catch (notificationError) {
                  console.error('❌ Error inicializando NotificationService:', notificationError);
                }
              }, 1000); // Aumentado a 1 segundo para mayor seguridad
              
            } catch (serviceError) {
              console.error('❌ Error obteniendo NotificationService:', serviceError);
            }
          } else {
            console.log('ℹ️ Usuario no es CLIENTE, omitiendo inicialización de notificaciones');
          }
        }
      } catch (fcmErr) {
        console.warn('⚠️ Error en configuración FCM:', fcmErr);
      }

      /* ---------- BIENVENIDA Y NAVEGACIÓN ---------- */
      Alert.alert('Bienvenido', user.nombre);

      console.log('🧭 Navegando según rol:', user.rol?.toUpperCase());
      switch ((user.rol ?? '').toUpperCase()) {
        case 'SUPERVISOR':
          navigateTo('Supervisor');
          break;
        case 'MAQUINISTA':
          navigateTo('Maquinista');
          break;
        case 'OPERADOR':
          navigateTo('Operador');
          break;
        case 'CLIENTE':
        default:
          navigateTo('Cliente');
          break;
      }
      
    } catch (err: any) {
      console.error('❌ Error crítico en login:', err);
      setIsLoading(false);
      Alert.alert(
        'Error',
        err?.message?.includes('Network request failed')
          ? 'Conéctate a una red'
          : 'El servidor no responde. Por favor, contacte a soporte'
      );
      setError('Error de red, intente más tarde');
      playErrorAnimation();
    }
  };

  const animateIn = () =>
    Animated.spring(scaleAnim, { 
      toValue: 0.95, 
      friction: 5,
      tension: 60,
      useNativeDriver: true 
    }).start();

  const animateOut = () =>
    Animated.spring(scaleAnim, { 
      toValue: 1, 
      friction: 3, 
      tension: 40,
      useNativeDriver: true 
    }).start();
    
  const focusPasswordInput = () => {
    passwordInputRef?.current?.focus();
  };

  // Calcular dimensiones en función del tamaño de pantalla
  const containerWidth = isTablet ? 450 : (width > 400 ? width * 0.85 : width * 0.9);
  
  // Ajustar tamaño del logo basado en orientación y teclado
  const logoSize = isTablet 
    ? (isKeyboardOpen ? 120 : 150)
    : (isKeyboardOpen 
        ? (isLandscape ? 80 : 90) 
        : (isLandscape ? 100 : 120));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient 
          colors={['#A3D9A5', '#74C69D', '#52B788']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          {/* Elementos decorativos que se ajustan a la pantalla */}
          <View style={[styles.decorCircle, { 
            top: height * 0.05, 
            left: width * 0.1,
            width: Math.min(width * 0.3, 150),
            height: Math.min(width * 0.3, 150),
            borderRadius: Math.min(width * 0.15, 75),
          }]} />
          <View style={[styles.decorCircle, { 
            bottom: height * 0.1, 
            right: width * 0.1,
            width: Math.min(width * 0.25, 120),
            height: Math.min(width * 0.25, 120),
            borderRadius: Math.min(width * 0.125, 60), 
          }]} />
          <View style={[styles.decorCircle, { 
            top: height * 0.5, 
            left: width * 0.7,
            width: Math.min(width * 0.2, 100),
            height: Math.min(width * 0.2, 100),
            borderRadius: Math.min(width * 0.1, 50),
          }]} />
          
          <Animated.View 
            style={[
              styles.loginContainer, 
              {
                width: containerWidth,
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim }
                ]
              }
            ]}
          >
            <Image 
              source={require('../../assets/logo.png')} 
              style={[
                styles.logo, 
                { 
                  width: logoSize, 
                  height: logoSize,
                  marginBottom: isKeyboardOpen ? (isLandscape ? 5 : 10) : 20
                }
              ]} 
            />
            
            <Animated.Text style={[
              styles.title, 
              { 
                opacity: fadeAnim,
                fontSize: isTablet ? 32 : 28,
                marginBottom: isKeyboardOpen ? 15 : 25 
              }
            ]}>
              Bienenido
            </Animated.Text>

            {/* Entrada de usuario */}
            <Animated.View style={[
              styles.inputContainer,
              { 
                opacity: inputAnim1,
                height: isTablet ? 58 : 52,
                marginBottom: isTablet ? 20 : 16,
                transform: [
                  { translateX: inputAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    }) 
                  }
                ],
                borderColor: error && !username.trim() ? '#E57373' : '#E2F0E5'
              }
            ]}>
              <View style={styles.iconContainer}>
                <FontAwesome5 
                  name="user" 
                  size={isTablet ? 18 : 16} 
                  color={error && !username.trim() ? '#E57373' : '#40916C'} 
                />
              </View>
              <TextInput
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="Usuario"
                placeholderTextColor="#90A4AE"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={focusPasswordInput}
              />
            </Animated.View>

            {/* Entrada de contraseña */}
            <Animated.View style={[
              styles.inputContainer,
              { 
                opacity: inputAnim2,
                height: isTablet ? 58 : 52,
                marginBottom: isTablet ? 20 : 16,
                transform: [
                  { translateX: inputAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    }) 
                  }
                ],
                borderColor: error && !password.trim() ? '#E57373' : '#E2F0E5'
              }
            ]}>
              <View style={styles.iconContainer}>
                <FontAwesome5 
                  name="lock" 
                  size={isTablet ? 18 : 16} 
                  color={error && !password.trim() ? '#E57373' : '#40916C'} 
                />
              </View>
              <TextInput
                ref={passwordInputRef}
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="Contraseña"
                placeholderTextColor="#90A4AE"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLoading}
              >
                <FontAwesome5
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={isTablet ? 18 : 16}
                  color="#40916C"
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Mensaje de error */}
            {error !== '' && (
              <Animated.View style={[styles.errorContainer, { height: error ? 'auto' : 0 }]}>
                <FontAwesome5 name="exclamation-circle" size={14} color="#E53935" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Botón de ingreso */}
            <Animated.View style={[
              { 
                width: '100%', 
                marginTop: error ? 0 : 10,
                height: isTablet ? 58 : 54, 
              },
              {
                opacity: buttonAnim,
                transform: [
                  { translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    }) 
                  },
                  { scale: scaleAnim }
                ]
              }
            ]}>
              <TouchableOpacity
                style={[styles.button, { height: isTablet ? 58 : 54 }]}
                activeOpacity={0.8}
                onPressIn={animateIn}
                onPressOut={animateOut}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#78909C', '#546E7A'] : ['#40916C', '#2D6A4F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size={isTablet ? "large" : "small"} />
                  ) : (
                    <>
                      <Text style={[styles.buttonText, { fontSize: isTablet ? 18 : 17 }]}>
                        Ingresar
                      </Text>
                      <FontAwesome5 
                        name="arrow-right"
                        size={isTablet ? 16 : 14} 
                        color="#FFF" 
                        style={styles.buttonIcon} 
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  loginContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 15,
  },
  logo: {
    resizeMode: 'contain',
  },
  title: {
    fontWeight: '700',
    color: '#2D6A4F',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F9F6',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2F0E5',
  },
  input: {
    flex: 1,
    color: '#37474F',
    marginLeft: 12,
    height: '100%',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#40916C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});