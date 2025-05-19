import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, Text, StyleSheet, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';

// Tipos para navegación
type RootStackParamList = {
  Login: undefined;
  // ... otras rutas
};

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

// Constantes para tiempos de animación
const ANIMATION_DURATION = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
};

// Textos para los estados de carga
const LOADING_TEXTS = {
  CHECKING_UPDATES: 'Buscando actualizaciones...',
  DOWNLOADING_UPDATE: 'Descargando actualización...',
  APPLYING_UPDATE: 'Aplicando actualización...',
  ERROR: 'No se pudo verificar actualizaciones',
  LOAD_STAGES: [
    { percent: 0, text: 'Iniciando componentes...' },
    { percent: 25, text: 'Cargando recursos...' },
    { percent: 50, text: 'Preparando aplicación...' },
    { percent: 75, text: 'Casi listo...' },
    { percent: 100, text: '¡Listo!' }
  ]
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // Valores de animación
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(10);
  const progress = useSharedValue(0);
  const progressGlow = useSharedValue(0);
  const logoY = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);

  // Estados
  const [percent, setPercent] = useState(0);
  const [stageText, setStageText] = useState(LOADING_TEXTS.CHECKING_UPDATES);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Mostrar el checkmark
  const displayCheckmark = useCallback(() => {
    setShowCheckmark(true);
    checkmarkOpacity.value = withTiming(1, { duration: ANIMATION_DURATION.MEDIUM });
    checkmarkScale.value = withSequence(
      withTiming(1.3, { 
        duration: ANIMATION_DURATION.SHORT, 
        easing: Easing.out(Easing.cubic) 
      }),
      withTiming(1, { 
        duration: ANIMATION_DURATION.SHORT, 
        easing: Easing.inOut(Easing.cubic) 
      })
    );
  }, [checkmarkOpacity, checkmarkScale]);

  // Animación de salida
  const exitAnimation = useCallback((callback?: () => void) => {
    scale.value = withSequence(
      withTiming(1.1, { 
        duration: ANIMATION_DURATION.SHORT, 
        easing: Easing.inOut(Easing.cubic) 
      }),
      withTiming(0, { 
        duration: ANIMATION_DURATION.MEDIUM, 
        easing: Easing.in(Easing.cubic) 
      }, () => {
        if (callback) runOnJS(callback)();
      })
    );
  }, [scale]);

  // Simular progreso de carga
  const simulateLoad = useCallback(() => {
    let currentStage = 0;
    let current = 0;
    let interval: NodeJS.Timeout;
    
    const updateProgress = () => {
      current += 2;
      
      if (current >= LOADING_TEXTS.LOAD_STAGES[currentStage].percent && 
          currentStage < LOADING_TEXTS.LOAD_STAGES.length - 1) {
        currentStage++;
        setStageText(LOADING_TEXTS.LOAD_STAGES[currentStage].text);
      }
      
      if (current <= 100) {
        setPercent(current);
        progress.value = withTiming(current / 100, { 
          duration: ANIMATION_DURATION.SHORT, 
          easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
        });
      }
      
      if (current === 100) {
        clearInterval(interval);
        progress.value = withTiming(1, { 
          duration: ANIMATION_DURATION.SHORT 
        }, () => {
          runOnJS(displayCheckmark)();
        });
        
        setTimeout(() => {
          exitAnimation(() => navigation.navigate('Login'));
        }, 1000);
      }
    };

    interval = setInterval(updateProgress, 30);
    return () => clearInterval(interval);
  }, [progress, displayCheckmark, exitAnimation, navigation]);

  // Verificar actualizaciones
  const checkForUpdate = useCallback(async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setStageText(LOADING_TEXTS.DOWNLOADING_UPDATE);
        
        // Simular progreso de descarga
        const downloadInterval = setInterval(() => {
          setPercent(prev => {
            const increment = Math.random() < 0.7 ? 3 : (Math.random() < 0.5 ? 2 : 4);
            const next = Math.min(prev + increment, 95);
            progress.value = withTiming(next / 100, { 
              duration: ANIMATION_DURATION.MEDIUM, 
              easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
            });
            return next;
          });
        }, 50);

        // Descargar actualización real
        await Updates.fetchUpdateAsync();
        clearInterval(downloadInterval);
        
        setStageText(LOADING_TEXTS.APPLYING_UPDATE);
        setPercent(100);
        progress.value = withTiming(1, { 
          duration: ANIMATION_DURATION.LONG, 
          easing: Easing.out(Easing.cubic) 
        }, () => {
          runOnJS(displayCheckmark)();
        });

        setTimeout(() => {
          exitAnimation(() => Updates.reloadAsync());
        }, 1000);
      } else {
        simulateLoad();
      }
    } catch (error) {
      console.error('Error verificando actualizaciones', error);
      setHasError(true);
      
      setTimeout(() => {
        setHasError(false);
        simulateLoad();
      }, 1500);
    }
  }, [progress, displayCheckmark, exitAnimation, simulateLoad]);

  // Iniciar animaciones y verificación de actualizaciones
  useEffect(() => {
    // Configurar animaciones iniciales
    scale.value = withSpring(1, { 
      damping: 12, 
      stiffness: 90,
      mass: 1.2,
      overshootClamping: false
    });
    
    rotation.value = withRepeat(
      withSequence(
        withTiming(-0.03, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.03, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    
    logoY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    
    textOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
    textY.value = withDelay(400, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
    
    progressGlow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );

    // Iniciar el proceso de verificación
    checkForUpdate();

    return () => {
      // Limpiar cualquier intervalo pendiente si el componente se desmonta
    };
  }, [checkForUpdate, scale, rotation, logoY, textOpacity, textY, progressGlow]);

  // Estilos animados
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
      { translateY: logoY.value }
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }]
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolate.CLAMP)}%`,
    shadowOpacity: interpolate(
      progressGlow.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
      Extrapolate.CLAMP
    )
  }));
  
  const progressGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progressGlow.value,
      [0, 0.5, 1],
      [0, 0.7, 0],
      Extrapolate.CLAMP
    ),
    transform: [{ 
      translateX: interpolate(
        progressGlow.value,
        [0, 1],
        [-50, 150],
        Extrapolate.CLAMP
      ) 
    }]
  }));
  
  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
    transform: [{ scale: checkmarkScale.value }]
  }));

  return (
    <View style={styles.container} accessibilityLabel="Pantalla de carga">
      <LinearGradient
        colors={['#52B788', '#2D6A4F', '#1B4332']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.overlay} />
      
      <View style={styles.contentContainer}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            accessibilityLabel="Logo de la aplicación"
          />
          <Animated.Text style={[styles.appName, textStyle]}>
            Cosaif App
          </Animated.Text>
        </Animated.View>

        <Animated.Text 
          style={[styles.statusText, textStyle]}
          accessibilityLabel={`Estado: ${stageText}`}
        >
          {stageText}
        </Animated.Text>
        
        {hasError && (
          <View style={styles.errorContainer}>
            <FontAwesome5 
              name="exclamation-circle" 
              size={16} 
              color="#E53935" 
              accessibilityLabel="Icono de error"
            />
            <Text style={styles.errorText}>
              {LOADING_TEXTS.ERROR}
            </Text>
          </View>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[styles.progressBarFill, progressBarStyle]}
              accessibilityLabel={`Progreso: ${percent}%`}
            >
              <Animated.View style={[styles.progressGlow, progressGlowStyle]} />
            </Animated.View>
          </View>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
        
        {showCheckmark && (
          <Animated.View style={[styles.checkmarkContainer, checkmarkStyle]}>
            <View style={styles.checkmarkCircle}>
              <FontAwesome5 
                name="check" 
                size={24} 
                color="#FFFFFF" 
                accessibilityLabel="Icono de completado"
              />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    opacity: 0.5,
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  appName: {
    marginTop: 15,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '500',
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute',
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
  },
  percentText: {
    marginTop: 8,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  checkmarkContainer: {
    marginTop: 20,
  },
  checkmarkCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default SplashScreen;