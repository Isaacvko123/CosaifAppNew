import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/Navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Constantes de diseño
const COLORS = {
  PRIMARY_RED: '#C53030',
  LIGHT_RED: '#FEE2E2',
  DARK_RED: '#7F1D1D',
  ACCENT_RED: '#F87171',
  NEUTRAL_100: '#F5F5F5',
  NEUTRAL_200: '#E5E5E5',
  NEUTRAL_300: '#D4D4D4',
  NEUTRAL_700: '#404040',
  NEUTRAL_900: '#171717',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  WHITE: '#FFFFFF',
  INCIDENT_ORANGE: '#EA580C',
  INCIDENT_YELLOW: '#F59E0B',
  SHADOW: 'rgba(0,0,0,0.1)'
};

const API_BASE_URL = 'http://31.97.13.182:3000';
const { width, height } = Dimensions.get('window');

// Tipos para navegación
type IncidenteScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Incidente'>;
type IncidenteScreenRouteProp = RouteProp<RootStackParamList, 'Incidente'>;

interface IncidenteProps {
  navigation: IncidenteScreenNavigationProp;
  route: IncidenteScreenRouteProp;
}

// Tipos para el incidente (basado en tu modelo DB)
interface IncidenteData {
  descripcion: string; // Obligatorio
  imagen1?: string;    // Opcional
  imagen2?: string;    // Opcional
  imagen3?: string;    // Opcional
  imagen4?: string;    // Opcional
  movimientoId: number; // Obligatorio (se obtiene automáticamente)
  usuarioId: number;    // Obligatorio (se obtiene automáticamente)
  // estado, fechaInicio, etc. se manejan automáticamente en el backend
}

interface ImageData {
  uri: string;
  name: string;
  type: string;
}

const Incidente: React.FC<IncidenteProps> = ({ navigation, route }) => {
  const { movimientoId, locomotora, tiempoTranscurrido } = route.params;
  
  // Estados
  const [descripcion, setDescripcion] = useState('');
  const [imagenes, setImagenes] = useState<(ImageData | null)[]>([null, null, null, null]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagenesCount, setImagenesCount] = useState(0);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Toast de éxito
  const showSuccessToast = useCallback((message: string) => {
    Alert.alert('✅ Éxito', message, [{ text: 'OK' }]);
  }, []);

  // Obtener datos del usuario
  const obtenerDatosUsuario = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        return userData.id;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo datos de usuario:', error);
      return null;
    }
  }, []);

  // Validar formulario
  const validarFormulario = useCallback(() => {
    if (!descripcion.trim()) {
      Alert.alert('📝 Campo Requerido', 'La descripción del incidente es obligatoria');
      return false;
    }
    
    if (descripcion.trim().length < 10) {
      Alert.alert('📝 Descripción Insuficiente', 'Por favor proporciona una descripción más detallada (mínimo 10 caracteres)');
      return false;
    }
    
    return true;
  }, [descripcion]);

  // Abrir cámara
  const openCamera = useCallback(async (index: number) => {
    try {
      console.log(`📷 Abriendo cámara para slot ${index + 1}`);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData: ImageData = {
          uri: asset.uri,
          name: `incidente_${movimientoId}_${index + 1}_${Date.now()}.jpg`,
          type: 'image/jpeg'
        };
        
        console.log(`✅ Imagen capturada para slot ${index + 1}:`, imageData.name);
        
        setImagenes(prevImagenes => {
          console.log('📋 Estado anterior:', prevImagenes.map((img, i) => `${i + 1}: ${img ? '✅' : '❌'}`).join(', '));
          
          const newImages = [...prevImagenes];
          newImages[index] = imageData;
          
          console.log('📋 Estado nuevo:', newImages.map((img, i) => `${i + 1}: ${img ? '✅' : '❌'}`).join(', '));
          
          return newImages;
        });
        
        showSuccessToast(`📸 Foto ${index + 1} capturada`);
      }
    } catch (error) {
      console.error('❌ Error en cámara:', error);
      Alert.alert('❌ Error', 'No se pudo acceder a la cámara');
    }
  }, [movimientoId, showSuccessToast]);

  // Abrir galería
  const openGallery = useCallback(async (index: number) => {
    try {
      console.log(`🖼️ Abriendo galería para slot ${index + 1}`);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData: ImageData = {
          uri: asset.uri,
          name: `incidente_${movimientoId}_${index + 1}_${Date.now()}.jpg`,
          type: 'image/jpeg'
        };
        
        console.log(`✅ Imagen seleccionada para slot ${index + 1}:`, imageData.name);
        
        setImagenes(prevImagenes => {
          console.log('📋 Estado anterior:', prevImagenes.map((img, i) => `${i + 1}: ${img ? '✅' : '❌'}`).join(', '));
          
          const newImages = [...prevImagenes];
          newImages[index] = imageData;
          
          console.log('📋 Estado nuevo:', newImages.map((img, i) => `${i + 1}: ${img ? '✅' : '❌'}`).join(', '));
          
          return newImages;
        });
        
        showSuccessToast(`🖼️ Foto ${index + 1} seleccionada`);
      }
    } catch (error) {
      console.error('❌ Error en galería:', error);
      Alert.alert('❌ Error', 'No se pudo acceder a la galería');
    }
  }, [movimientoId, showSuccessToast]);

  // Seleccionar fuente de imagen
  const selectImageSource = useCallback((index: number) => {
    Alert.alert(
      '📷 Agregar Evidencia',
      `Selecciona el origen para la foto ${index + 1}:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📷 Cámara', onPress: () => openCamera(index) },
        { text: '🖼️ Galería', onPress: () => openGallery(index) }
      ]
    );
  }, [openCamera, openGallery]);

  // Ver imagen en modal
  const viewImage = useCallback((index: number) => {
    const currentImage = imagenes[index];
    if (currentImage) {
      setSelectedImageIndex(index);
      setSelectedImageUri(currentImage.uri);
      setShowImageModal(true);
    }
  }, [imagenes]);

  // Eliminar imagen
  const removeImage = useCallback((index: number) => {
    console.log(`🗑️ Eliminando imagen del slot ${index + 1}`);
    
    setImagenes(prevImagenes => {
      console.log('📋 Estado anterior:', prevImagenes.map((img, i) => `${i + 1}: ${img ? '✅' : '❌'}`).join(', '));
      
      const newImages = [...prevImagenes];
      newImages[index] = null;
      
      console.log('📋 Estado nuevo:', newImages.map((img, i) => `${i + 1}: ${img ? '✅' : '❌'}`).join(', '));
      
      return newImages;
    });
    
    showSuccessToast(`🗑️ Foto ${index + 1} eliminada`);
  }, [showSuccessToast]);

  // Función para manejar selección de imagen
  const handleImageAction = useCallback((index: number) => {
    const currentImage = imagenes[index];
    console.log(`🎯 Acción en slot ${index + 1}, tiene imagen:`, !!currentImage);
    
    if (currentImage) {
      Alert.alert(
        '📸 Gestionar Foto',
        `Foto ${index + 1} actual`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: '👁️ Ver', onPress: () => viewImage(index) },
          { text: '🔄 Cambiar', onPress: () => selectImageSource(index) },
          { text: '🗑️ Eliminar', style: 'destructive', onPress: () => removeImage(index) }
        ]
      );
    } else {
      selectImageSource(index);
    }
  }, [imagenes, viewImage, selectImageSource, removeImage]);

// 🔄 Sustituye tu función enviarIncidente por esta
const enviarIncidente = useCallback(async () => {
  if (!validarFormulario()) return;

  setEnviando(true);
  try {
    /* 1. datos del usuario */
    const usuarioId = await obtenerDatosUsuario();
    if (!usuarioId) throw new Error('No se pudo obtener información del usuario');

    /* 2. token JWT */
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Token no encontrado – el usuario no está logueado');

    /* 3. FormData: los tres campos + las fotos */
    const formData = new FormData();
    formData.append('descripcion', descripcion.trim());
    formData.append('movimientoId', movimientoId.toString());
    formData.append('usuarioId', usuarioId.toString());

    // 👉 todas las fotos van en el MISMO campo:  'imagenes'
    imagenes.forEach((img) => {
      if (img) {
        formData.append('imagenes', {
          uri: img.uri,
          name: img.name,   // incidente_123_1_...
          type: img.type    // image/jpeg
        } as any);
      }
    });

    /* 4. enviar */
    const resp = await fetch(`${API_BASE_URL}/incidentes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Servidor respondió ${resp.status}: ${err}`);
    }

    const data = await resp.json();
    showSuccessToast('Incidente registrado con ID ' + data.data.id);
    navigation.goBack();

  } catch (err: any) {
    console.error(err);
    Alert.alert('❌ Error', err.message || 'No se pudo enviar el incidente');
  } finally {
    setEnviando(false);
  }
}, [descripcion, imagenes, movimientoId, validarFormulario, obtenerDatosUsuario, navigation]);

  // Función para cancelar
  const cancelarIncidente = useCallback(() => {
    const hasImages = imagenes.some(img => img !== null);
    const hasData = descripcion.trim() || hasImages;
    
    if (hasData) {
      Alert.alert(
        '⚠️ Cancelar Reporte',
        'Perderás toda la información ingresada. ¿Estás seguro?',
        [
          { text: '❌ No, continuar editando', style: 'cancel' },
          { text: '✅ Sí, cancelar', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [descripcion, imagenes, navigation]);

  // Renderizar slot de imagen
  const renderImageSlot = useCallback((index: number) => {
    const currentImage = imagenes[index];
    const isEmpty = !currentImage;
    
    return (
      <TouchableOpacity
        key={index}
        style={[styles.imageSlot, isEmpty && styles.imageSlotEmpty]}
        onPress={() => handleImageAction(index)}
        activeOpacity={0.8}
      >
        {currentImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentImage.uri }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageOverlay}
            >
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={[styles.imageActionButton, styles.viewButton]}
                  onPress={() => viewImage(index)}
                >
                  <FontAwesome5 name="eye" size={12} color={COLORS.WHITE} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageActionButton, styles.deleteButton]}
                  onPress={() => removeImage(index)}
                >
                  <FontAwesome5 name="trash" size={12} color={COLORS.WHITE} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.emptyImageContainer}>
            <View style={styles.cameraIconContainer}>
              <FontAwesome5 name="camera-retro" size={24} color={COLORS.INCIDENT_ORANGE} />
            </View>
            <Text style={styles.addImageText}>Evidencia {index + 1}</Text>
            <Text style={styles.addImageSubtext}>Toca para agregar</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [imagenes, handleImageAction, viewImage, removeImage]);

  // Inicializar animaciones
  useEffect(() => {
    console.log('🚨 Pantalla de Incidente inicializada');
    console.log('📸 Estado inicial de imágenes:', imagenes.map((img, i) => `Slot ${i + 1}: ${img ? '✅' : '❌'}`).join(' | '));
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animar progreso de descripción
  useEffect(() => {
    const progress = descripcion.length / 500;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [descripcion]);

  // Actualizar contador cuando cambian las imágenes
  useEffect(() => {
    const count = imagenes.filter(img => img !== null).length;
    setImagenesCount(count);
    console.log('📊 Estado actual de imágenes:', imagenes.map((img, i) => `Slot ${i + 1}: ${img ? '✅ ' + img.name : '❌ vacío'}`).join(' | '));
    console.log('📊 Contador de imágenes actualizado:', count);
  }, [imagenes]);

  // Solicitar permisos de cámara
  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
        Alert.alert(
          '📸 Permisos Requeridos',
          'Necesitamos acceso a la cámara y galería para documentar incidentes.',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
    })();
  }, []);

  // Calcular estadísticas de descripción
  const descripcionProgress = descripcion.length / 500;
  const descripcionColor = descripcion.length > 450 ? COLORS.ERROR : 
                           descripcion.length > 300 ? COLORS.WARNING : COLORS.SUCCESS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK_RED} />
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.INCIDENT_ORANGE, COLORS.INCIDENT_YELLOW]}
          style={styles.header}
        >
          <TouchableOpacity onPress={cancelarIncidente} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🚨 Reporte de Incidente</Text>
            <Text style={styles.headerSubtitle}>Documenta el problema ocurrido</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient>

        <Animated.ScrollView 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Info del Movimiento */}
          <View style={styles.movementCard}>
            <LinearGradient
              colors={[COLORS.PRIMARY_RED, COLORS.DARK_RED]}
              style={styles.movementHeader}
            >
              <View style={styles.movementHeaderContent}>
                <FontAwesome5 name="train" size={20} color={COLORS.WHITE} />
                <Text style={styles.movementTitle}>Movimiento Activo</Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>En Curso</Text>
              </View>
            </LinearGradient>
            
            <View style={styles.movementBody}>
              <View style={styles.movementInfo}>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="train" size={16} color={COLORS.INCIDENT_ORANGE} />
                  <Text style={styles.infoLabel}>Locomotora</Text>
                  <Text style={styles.infoValue}>#{locomotora}</Text>
                </View>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="hashtag" size={16} color={COLORS.INCIDENT_ORANGE} />
                  <Text style={styles.infoLabel}>ID Movimiento</Text>
                  <Text style={styles.infoValue}>{movimientoId}</Text>
                </View>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="clock" size={16} color={COLORS.INCIDENT_ORANGE} />
                  <Text style={styles.infoLabel}>Tiempo</Text>
                  <Text style={styles.infoValue}>{tiempoTranscurrido}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Formulario de Descripción */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <FontAwesome5 name="edit" size={18} color={COLORS.INCIDENT_ORANGE} />
              <Text style={styles.formTitle}>Descripción del Incidente</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Requerido</Text>
              </View>
            </View>
            
            <View style={styles.formBody}>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={[styles.textInput, descripcion.length > 450 && styles.textInputWarning]}
                  multiline
                  numberOfLines={5}
                  placeholder="Describe detalladamente qué ocurrió, cuándo, dónde y cómo. Incluye cualquier detalle relevante para la investigación..."
                  placeholderTextColor={COLORS.NEUTRAL_700}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  maxLength={500}
                />
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={[styles.characterCount, { color: descripcionColor }]}>
                    {descripcion.length}/500 caracteres
                  </Text>
                  <Text style={styles.progressLabel}>
                    {descripcion.length < 10 ? 'Muy corto' : 
                     descripcion.length < 50 ? 'Agrega más detalles' :
                     descripcion.length < 200 ? 'Bien' : 'Excelente detalle'}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        }),
                        backgroundColor: descripcionColor
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Galería de Imágenes */}
          <View style={styles.imageCard}>
            <View style={styles.imageHeader}>
              <View style={styles.imageHeaderLeft}>
                <FontAwesome5 name="camera-retro" size={18} color={COLORS.INCIDENT_ORANGE} />
                <Text style={styles.imageTitle}>Evidencia Fotográfica</Text>
              </View>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCountText}>{imagenesCount}/4</Text>
                <FontAwesome5 name="images" size={14} color={COLORS.NEUTRAL_700} />
              </View>
            </View>
            <Text style={styles.imageSubtitle}>Opcional - Documenta visualmente el incidente</Text>
            
            <View style={styles.imagesGrid}>
              {[0, 1, 2, 3].map(index => renderImageSlot(index))}
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelarIncidente}
              disabled={enviando}
            >
              <FontAwesome5 name="times-circle" size={16} color={COLORS.NEUTRAL_700} />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton, 
                enviando && styles.submitButtonDisabled,
                !descripcion.trim() && styles.submitButtonInvalid
              ]}
              onPress={enviarIncidente}
              disabled={enviando || !descripcion.trim()}
            >
              {enviando ? (
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              ) : (
                <FontAwesome5 name="paper-plane" size={16} color={COLORS.WHITE} />
              )}
              <Text style={styles.submitButtonText}>
                {enviando ? 'Enviando Reporte...' : 'Enviar Incidente'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>

        {/* Modal para Ver Imagen */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowImageModal(false);
            setSelectedImageIndex(null);
            setSelectedImageUri(null);
          }}
        >
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalContent}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => {
                  setShowImageModal(false);
                  setSelectedImageIndex(null);
                  setSelectedImageUri(null);
                }}
              >
                <FontAwesome5 name="times" size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
              
              {selectedImageUri && (
                <Image 
                  source={{ uri: selectedImageUri }} 
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              
              <Text style={styles.imageModalTitle}>
                Evidencia {selectedImageIndex !== null ? selectedImageIndex + 1 : 0}
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.DARK_RED,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.NEUTRAL_100,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: COLORS.NEUTRAL_900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.9,
    marginTop: 2,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  movementCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  movementHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SUCCESS,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  movementBody: {
    padding: 16,
  },
  movementInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.NEUTRAL_100,
    padding: 12,
    borderRadius: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.NEUTRAL_700,
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_900,
  },
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL_200,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_900,
    marginLeft: 10,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  requiredText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  formBody: {
    padding: 16,
  },
  textInputContainer: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: COLORS.NEUTRAL_300,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.NEUTRAL_900,
    textAlignVertical: 'top',
    minHeight: 120,
    backgroundColor: COLORS.WHITE,
    lineHeight: 22,
  },
  textInputWarning: {
    borderColor: COLORS.WARNING,
  },
  progressContainer: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.NEUTRAL_700,
    fontStyle: 'italic',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.NEUTRAL_200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  imageCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL_200,
  },
  imageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_900,
    marginLeft: 10,
  },
  imageCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.NEUTRAL_100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 6,
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.NEUTRAL_700,
  },
  imageSubtitle: {
    fontSize: 13,
    color: COLORS.NEUTRAL_700,
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontStyle: 'italic',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  imageSlot: {
    width: (width - 76) / 2,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageSlotEmpty: {
    borderWidth: 2,
    borderColor: COLORS.NEUTRAL_300,
    borderStyle: 'dashed',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.NEUTRAL_200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    padding: 8,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: COLORS.PRIMARY_RED,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
  },
  emptyImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.NEUTRAL_100,
  },
  cameraIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.NEUTRAL_900,
    marginBottom: 2,
  },
  addImageSubtext: {
    fontSize: 11,
    color: COLORS.NEUTRAL_700,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.NEUTRAL_300,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.NEUTRAL_700,
    marginLeft: 8,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.INCIDENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: COLORS.INCIDENT_ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.NEUTRAL_100,
    elevation: 0,
  },
  submitButtonInvalid: {
    backgroundColor: COLORS.NEUTRAL_100,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: COLORS.NEUTRAL_900,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  closeModalButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '90%',
  },
  imageModalTitle: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Incidente;