// EditRonda.tsx - Componente Principal (Vista)
import React, { useCallback, useMemo } from 'react';
import {
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar, 
  FlatList, 
  Animated,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Provider as PaperProvider,
  IconButton,
  Surface,
  Snackbar,
} from 'react-native-paper';

// Importar hooks personalizados
import { 
  useRondaData, 
  useOrderManagement, 
  useAnimations,
  type Ronda 
} from './useEditRonda';

// Importar estilos y utilidades
import { 
  styles, 
  COLORS, 
  getRondaColor, 
  theme 
} from './EditRondaStyles';

/* ---------- tipos adicionales ---------- */
interface InfoExtra {
  empresa: { id: number; nombre: string };
  movimiento: {
    viaOrigen: { nombre: string };
    viaDestino: { nombre: string | null };
    lavado: boolean; 
    torno: boolean;
  };
}

/* ---------- props ---------- */
interface Props {
  localidadId: number;
  onClose: () => void;
  onSaved?: () => void;
}

/* ---------- componente principal ---------- */
export default function EditRonda({ localidadId, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { fadeAnim } = useAnimations();
  
  // Hook para gestión de datos
  const {
    user,
    list,
    infoMap,
    loading,
    groupedByRonda,
    setGroupedByRonda,
    setList
  } = useRondaData(localidadId, onClose);

  // Hook para gestión de orden
  const {
    moveUp,
    moveDown,
    snackVisible,
    setSnackVisible,
    snackMessage,
    setSnackMessage
  } = useOrderManagement(user, groupedByRonda, setGroupedByRonda, setList);

  /* -------- componente de tarjeta de ronda ----------------------------- */
  const RondaCard = useCallback(({ 
    ronda, 
    index, 
    color, 
    info, 
    isFirst, 
    isLast,
    onMoveUp,
    onMoveDown
  }: {
    ronda: Ronda;
    index: number;
    color: any;
    info?: InfoExtra;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
  }) => {
    const { scaleAnim, animatePressIn, animatePressOut } = useAnimations();

    return (
      <Animated.View 
        style={[
          styles.cardWrapper,
          isFirst && styles.firstCard,
          isLast && styles.lastCard,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Surface style={[styles.card, { borderLeftColor: color.primary }]} elevation={2}>
          {/* Cabecera */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Surface style={[styles.orderBadge, { backgroundColor: color.secondary }]}>
                <Text style={[styles.orderNumber, { color: color.primary }]}>
                  {ronda.orden}
                </Text>
              </Surface>
              
              <View style={styles.titleTextContainer}>
                <View style={styles.titleRow}>
                  <FontAwesome5 name="train" size={14} color={color.primary} style={styles.titleIcon} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {ronda.movimiento.title}
                  </Text>
                </View>
                <Text style={styles.dateText}>{ronda.movimiento.date}</Text>
              </View>
            </View>
            
            {/* Botones para mover */}
            <View style={styles.actionsContainer}>
              <IconButton
                icon="arrow-up"
                size={20}
                iconColor={isFirst ? COLORS.textSecondary : color.primary}
                style={styles.actionButton}
                disabled={isFirst}
                onPress={onMoveUp}
              />
              <IconButton
                icon="arrow-down"
                size={20}
                iconColor={isLast ? COLORS.textSecondary : color.primary}
                style={styles.actionButton}
                disabled={isLast}
                onPress={onMoveDown}
              />
            </View>
          </View>
          
          {/* Descripción */}
          <Text style={styles.cardDescription} numberOfLines={2}>
            {ronda.movimiento.description}
          </Text>
          
          {/* Información adicional */}
          {info && (
            <View style={styles.infoContainer}>
              <LinearGradient
                colors={[`${color.primary}20`, `${color.primary}10`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.divider}
              />
              
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <View style={styles.infoItem}>
                    <FontAwesome5 name="map-pin" size={12} color={color.primary} style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Origen</Text>
                      <Text style={styles.infoValue}>{info.movimiento.viaOrigen.nombre}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <FontAwesome5 name="map-marker-alt" size={12} color={color.primary} style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Destino</Text>
                      <Text style={styles.infoValue}>{info.movimiento.viaDestino?.nombre || '—'}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.infoColumn}>
                  <View style={styles.statusItem}>
                    <FontAwesome5 
                      name={info.movimiento.lavado ? "check-circle" : "times-circle"} 
                      size={14} 
                      color={info.movimiento.lavado ? COLORS.success : COLORS.textSecondary} 
                      style={styles.statusIcon} 
                    />
                    <Text style={[
                      styles.statusText,
                      info.movimiento.lavado ? styles.statusActive : styles.statusInactive
                    ]}>Lavado</Text>
                  </View>
                  
                  <View style={styles.statusItem}>
                    <FontAwesome5 
                      name={info.movimiento.torno ? "check-circle" : "times-circle"} 
                      size={14} 
                      color={info.movimiento.torno ? COLORS.success : COLORS.textSecondary} 
                      style={styles.statusIcon} 
                    />
                    <Text style={[
                      styles.statusText,
                      info.movimiento.torno ? styles.statusActive : styles.statusInactive
                    ]}>Torno</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Surface>
      </Animated.View>
    );
  }, []);

  /* -------- renderizado de secciones ------------------------------------ */
  const renderRondaSection = useCallback(({ item, index }: { item: any, index: number }) => {
    const color = getRondaColor(item.rondaNumero);
    
    return (
      <Animated.View 
        style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }
            ]
          }
        ]}
      >
        {/* Cabecera de sección con gradiente */}
        <LinearGradient
          colors={color.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionLeft}>
            <View style={styles.rondaCircle}>
              <Text style={styles.rondaNumberText}>{item.rondaNumero}</Text>
            </View>
            <Text style={styles.rondaText}>Ronda</Text>
          </View>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>{item.items.length}</Text>
          </View>
        </LinearGradient>
        
        {/* Lista de items en esta ronda */}
        {item.items.map((ronda: Ronda, rondaIndex: number) => (
          <RondaCard
            key={ronda.id}
            ronda={ronda}
            index={rondaIndex}
            color={color}
            info={infoMap[ronda.id]}
            isFirst={rondaIndex === 0}
            isLast={rondaIndex === item.items.length - 1}
            onMoveUp={() => moveUp(item.rondaNumero, rondaIndex)}
            onMoveDown={() => moveDown(item.rondaNumero, rondaIndex)}
          />
        ))}
      </Animated.View>
    );
  }, [RondaCard, fadeAnim, infoMap, moveDown, moveUp]);

  /* -------- preparar datos para el FlatList ----------------------------- */
  const sectionData = useMemo(() => {
    return Object.entries(groupedByRonda).map(([rondaNum, items]) => ({
      rondaNumero: parseInt(rondaNum),
      items: items.sort((a, b) => a.orden - b.orden),
    })).sort((a, b) => a.rondaNumero - b.rondaNumero);
  }, [groupedByRonda]);

  /* -------- UI principal ----------------------------------------------- */
  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando rondas...</Text>
          </View>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        
        {/* Cabecera */}
        <LinearGradient 
          colors={[COLORS.primary, COLORS.primaryDark]} 
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor="#FFF"
              size={24}
              onPress={onClose}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Ordena tus rondas</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        
        {/* Instrucciones */}
        <View style={styles.instructionsContainer}>
          <FontAwesome5 name="info-circle" size={16} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.instructionsText}>
            Usa las flechas para reordenar los movimientos según tu preferencia
          </Text>
        </View>
        
        {/* Lista de rondas */}
        <FlatList
          data={sectionData}
          renderItem={renderRondaSection}
          keyExtractor={item => `ronda-${item.rondaNumero}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 }
          ]}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Botón flotante para guardar */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => { 
                setSnackMessage("Cambios guardados correctamente");
                setSnackVisible(true);
                setTimeout(() => {
                  onSaved?.(); 
                  onClose();
                }, 1000);
              }}
            >
              <FontAwesome5 name="check" size={18} color="#FFF" />
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        {/* Snackbar para notificaciones */}
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={2000}
          style={styles.snackbar}
          action={{
            label: 'OK',
            onPress: () => setSnackVisible(false),
          }}
        >
          {snackMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
}