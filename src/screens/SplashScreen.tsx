import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import * as Updates from 'expo-updates';
interface Props {
  navigation: any;
}

const SplashScreen = ({ navigation }: Props) => {
  const scale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const progress = useSharedValue(0);

  const [percent, setPercent] = useState(0);
  const [stageText, setStageText] = useState('Buscando actualizaciones...');

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));

    const checkForUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setStageText('Descargando actualización...');
          const downloadProgress = setInterval(() => {
            setPercent((prev) => {
              const next = Math.min(prev + 3, 95);
              progress.value = next / 100;
              return next;
            });
          }, 50);

          await Updates.fetchUpdateAsync();

          clearInterval(downloadProgress);
          setStageText('Aplicando actualización...');
          setPercent(100);
          progress.value = 1;

          setTimeout(async () => {
            await Updates.reloadAsync(); // Recarga la app con la nueva versión
          }, 700);
        } else {
          simulateLoad(); // Si no hay actualización, simula la carga
        }
      } catch (e) {
        console.error('Error verificando actualizaciones', e);
        Alert.alert('Error', 'No se pudo verificar actualizaciones. Continuando...');
        simulateLoad();
      }
    };

    const simulateLoad = () => {
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current <= 100) {
          setPercent(current);
          progress.value = current / 100;
        }
        if (current === 100) {
          clearInterval(interval);
          setStageText('¡Listo!');
          setTimeout(() => navigation.replace('Login'), 500);
        }
      }, 30);
    };

    checkForUpdate();
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Animated.Text style={[styles.appName, textStyle]}>
          Cosaif App
        </Animated.Text>
      </Animated.View>

      <Animated.Text style={[styles.statusText, textStyle]}>
        {stageText}
      </Animated.Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CDF7D8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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
    color: '#2D6A4F',
  },
  statusText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#B7E4C7',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#40916C',
    borderRadius: 6,
  },
  percentText: {
    marginTop: 8,
    fontSize: 16,
    color: '#2D6A4F',
    fontWeight: '600',
  },
});

export default SplashScreen;
