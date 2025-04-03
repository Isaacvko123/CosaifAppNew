/**
 * SplashScreen.tsx
 *
 * Pantalla inicial de bienvenida animada (Splash Screen).
 *
 * Esta pantalla se muestra brevemente al iniciar la aplicación.
 * Incluye una animación de entrada con React Native Reanimated v2.
 * 
 * Funcionalidad:
 * - Anima el logo de la app con escala y opacidad usando `useSharedValue`.
 * - Luego de 3 segundos, redirige automáticamente a la pantalla de Login.
 * 
 * Navegación:
 * - Usa `navigation.replace('Login')` para evitar que el usuario regrese al splash screen.
 *
 * Librerías utilizadas:
 * - React Native Reanimated v2: para animaciones fluidas sin afectar el rendimiento.
 * - React Navigation: para manejo de rutas.
 */

import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Tipado para navegación (puede reemplazarse con NativeStackNavigationProp si usas TypeScript fuerte)
interface Props {
  navigation: any;
}

/**
 * SplashScreen
 * 
 * Componente de pantalla de carga inicial con animación y transición automática.
 */
const SplashScreen = ({ navigation }: Props) => {
  const scale = useSharedValue(0);      // Valor compartido para animar escala
  const opacity = useSharedValue(0);    // Valor compartido para animar opacidad

  useEffect(() => {
    // Animaciones de entrada usando spring (rebote suave)
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    opacity.value = withSpring(1);

    // Redirección automática a pantalla de login tras 3 segundos
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    // Limpieza del temporizador en caso de desmontaje
    return () => clearTimeout(timer);
  }, []);

  // Estilo animado compuesto por escala y opacidad
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedView, animatedStyle]}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.text}></Text>
      </Animated.View>
    </View>
  );
};

// Estilos base
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(205, 247, 216)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
