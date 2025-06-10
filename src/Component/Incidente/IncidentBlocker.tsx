import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  Image,
  Animated
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { IncidentNotification } from '../../navigation/NotificationService';

const { width, height } = Dimensions.get('window');

// Colores del tema Cliente
const PRIMARY_GREEN = '#3E8D63';
const DARK_GREEN = '#2A6547';
const LIGHT_GREEN = '#F0FFF4';
const TEXT_COLOR = '#2D3748';
const TEXT_LIGHT = '#718096';

interface IncidentBlockerProps {
  incident: IncidentNotification;
  onResolved: () => void;
  onFailed: () => void;
  customText?: string;
  customImages?: string[];
}

const IncidentBlocker: React.FC<IncidentBlockerProps> = ({
  incident,
  onResolved,
  onFailed,
  customText = 
    "Se ha detectado un incidente que requiere su atención inmediata. Por favor, revise la información y tome las acciones necesarias.",
  customImages = []
}) => {
  // Temporizador inicial de 10 minutos (600s)
  const [timeLeft, setTimeLeft] = useState(600);
  // Mostrar botones de resultado al entrar en los últimos 5 minutos
  const [showResultButtons, setShowResultButtons] = useState(false);

  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerColorAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0)).current;

  // Cuenta regresiva
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        // Al llegar a 5 minutos restantes
        if (prev === 301) {
          setShowResultButtons(true);
        }
        // Detener al expirar
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animar aparición de botones
  useEffect(() => {
    if (showResultButtons) {
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [showResultButtons]);

  // Pulso icono alerta
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Color del temporizador en último tramo
  useEffect(() => {
    Animated.timing(timerColorAnim, {
      toValue: timeLeft <= 300 ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  // Formateo MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Formateo de hora y fecha
  const formatIncidentTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Handlers con alerta de confirmación
  const handleResolved = () => {
    Alert.alert('Incidente Resuelto', '¿Confirmas que se resolvió el incidente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, resuelto', onPress: onResolved },
    ]);
  };
  const handleFailed = () => {
    Alert.alert('No Completado', '¿Marcar como no completado?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'No se pudo completar', style: 'destructive', onPress: onFailed },
    ]);
  };

  // Interpolaciones de color
  const timerTextColor = timerColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PRIMARY_GREEN, '#DC2626'],
  });
  const timerBgColor = timerColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [LIGHT_GREEN, '#FEE2E2'],
  });

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <LinearGradient colors={[PRIMARY_GREEN, DARK_GREEN]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Temporizador */}
            <Animated.View
              style={[styles.timerContainer, { backgroundColor: timerBgColor }]}
            >
              <FontAwesome5 name="clock" size={24} color={PRIMARY_GREEN} />
              <Animated.Text style={[styles.timerText, { color: timerTextColor }]}>                
                {formatTime(timeLeft)}
              </Animated.Text>
              <Text style={styles.timerLabel}>Tiempo restante</Text>
            </Animated.View>

            {/* Alerta */}
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>              
              <FontAwesome5 name="exclamation-triangle" size={60} color="#FFF" />
            </Animated.View>
            <Text style={styles.title}>🚨 INCIDENTE DETECTADO</Text>

            {/* Detalles */}
            <View style={styles.incidentInfo}>
              <Text style={styles.incidentTitle}>{incident.title}</Text>
              <Text style={styles.incidentBody}>{incident.body}</Text>
              <Text style={styles.incidentTime}>
                Recibido: {formatIncidentTime(incident.timestamp)}
              </Text>
            </View>

            {/* Texto opcional */}
            <View style={styles.customTextContainer}>
              <FontAwesome5 name="info-circle" size={20} color={PRIMARY_GREEN} />
              <Text style={styles.customText}>{customText}</Text>
            </View>
            {/* Imágenes opcionales */}
            {customImages.length > 0 && (
              <View style={styles.imagesContainer}>
                <Text style={styles.imagesTitle}>Información Visual:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {customImages.map((uri, i) => (
                    <View key={i} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.customImage} resizeMode="cover" />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Botones en últimos 5 minutos */}
            {showResultButtons && (
              <Animated.View
                style={[styles.resultButtonsContainer, { transform: [{ scale: buttonScaleAnim }] }]}
              >
                <TouchableOpacity style={styles.resolveButton} onPress={handleResolved} activeOpacity={0.8}>
                  <FontAwesome5 name="check-circle" size={16} color="#FFF" />
                  <Text style={styles.resolveButtonText}>Resuelto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.failedButton} onPress={handleFailed} activeOpacity={0.8}>
                  <FontAwesome5 name="times-circle" size={16} color="#DC2626" />
                  <Text style={styles.failedButtonText}>No se pudo completar</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  content: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  timerContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
  },
  timerText: { fontSize: 32, fontWeight: 'bold', marginVertical: 8, fontFamily: 'monospace' },
  timerLabel: { fontSize: 12, color: TEXT_LIGHT, textAlign: 'center' },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: DARK_GREEN, textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  incidentInfo: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  incidentTitle: { fontSize: 18, fontWeight: 'bold', color: DARK_GREEN, marginBottom: 8 },
  incidentBody: { fontSize: 15, color: TEXT_COLOR, marginBottom: 8, lineHeight: 22 },
  incidentTime: { fontSize: 13, color: TEXT_LIGHT, fontStyle: 'italic', marginBottom: 8 },
  customTextContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8F9FA', borderRadius: 10, padding: 14, marginBottom: 16, width: '100%' },
  customText: { fontSize: 14, color: TEXT_COLOR, marginLeft: 10, flex: 1, lineHeight: 20 },
  imagesContainer: { width: '100%', marginBottom: 16 },
  imagesTitle: { fontSize: 16, fontWeight: '600', color: DARK_GREEN, marginBottom: 10 },
  imageWrapper: { marginRight: 12, borderRadius: 8, overflow: 'hidden' },
  customImage: { width: 120, height: 80, borderRadius: 8 },
  resultButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12, marginTop: 16 },
  resolveButton: { flex: 1, backgroundColor: PRIMARY_GREEN, borderRadius: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  resolveButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  failedButton: { flex: 1, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#DC2626', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  failedButtonText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
});

export { IncidentBlocker };
