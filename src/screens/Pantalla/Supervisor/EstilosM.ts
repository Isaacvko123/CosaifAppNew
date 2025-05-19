import { StyleSheet, Platform, Dimensions, TextStyle } from 'react-native';

// Obtenemos las dimensiones de la pantalla para diseños responsivos
const { width, height } = Dimensions.get('window');

/**
 * Sistema de Diseño Refinado para Movimientos
 * Paleta sofisticada, estilos elegantes y componentes visuales modernos
 */
export const MovimientosDesign = {
  // Espaciados con proporciones armónicas
  spacing: {
    xs: 4,
    small: 8,
    medium: 12,
    standard: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48,
    section: 20,
  },

  // Paleta de colores refinada
  colors: {
    // Colores primarios elegantes
    primary: {
      light: '#6B9BD3',   // Azul suave elegante
      main: '#4A89DC',    // Azul corporativo principal
      dark: '#3B6CB0',    // Azul profundo para énfasis
      gradient: ['#4A89DC', '#3B6CB0'], // Gradiente principal
      subtleGradient: ['rgba(74, 137, 220, 0.9)', 'rgba(59, 108, 176, 0.95)'], // Gradiente sutil
      background: '#EEF4FF', // Fondo azul suave
    },

    // Colores de acento sofisticados
    accent: {
      blue: '#5BC0EB',      // Azul brillante
      teal: '#55C2C3',      // Turquesa elegante
      green: '#5BC9A8',     // Verde menta
      purple: '#9386E0',    // Púrpura sofisticado
      coral: '#F87B73',     // Coral moderno
      amber: '#FFCB66',     // Ámbar cálido
    },

    // Colores para estados con mejor contraste
    state: {
      success: '#4FBE79',   // Verde éxito refinado
      warning: '#F8AC59',   // Naranja advertencia elegante
      error: '#F76C6C',     // Rojo error sofisticado
      info: '#5BC0EB',      // Azul información brillante
      disabled: '#C5D1E1',  // Gris deshabilitado elegante
    },

    // Escala de grises sofisticada
    neutral: {
      white: '#FFFFFF',
      offWhite: '#F9FBFF',   // Blanco con matiz azul muy sutil
      background: '#F2F6FC', // Fondo principal con tono sofisticado
      backgroundAlt: '#E9F0FA', // Fondo alternativo
      surfaceLight: '#F7FAFF', // Superficie clara
      surface: '#FFFFFF',    // Superficie estándar
      surfaceDark: '#F0F5FB', // Superficie oscura
      border: '#E1E7F5',     // Borde sutil
      divider: '#EDF2FA',    // Divisor muy sutil
      textPrimary: '#2E4159', // Texto principal
      textSecondary: '#546B8B', // Texto secundario
      textTertiary: '#8195B0', // Texto terciario
      textLight: '#A6B4C9',  // Texto claro
      placeholder: '#C5D1E1', // Placeholder
    },

    // Transparencias para efectos visuales
    transparent: {
      light: 'rgba(255, 255, 255, 0.9)',
      medium: 'rgba(255, 255, 255, 0.7)',
      dark: 'rgba(0, 0, 0, 0.06)',
      darkMedium: 'rgba(0, 0, 0, 0.15)',
      primaryLight: 'rgba(74, 137, 220, 0.08)', // Primario con baja opacidad
      primaryMedium: 'rgba(74, 137, 220, 0.15)', // Primario con media opacidad
    },
  },

  // Tipografía refinada
  typography: {
    fontFamily: {
      base: Platform.OS === 'ios' ? 'System' : 'Roboto',
      heading: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    
    // Escala tipográfica armónica
    fontSize: {
      tiny: 9,
      xs: 10,
      small: 12,
      medium: 14,
      standard: 16,
      large: 18,
      xl: 22,
      xxl: 26,
      xxxl: 32,
    },
    
    // Escala de pesos
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Estilos tipográficos predefinidos
    heading: {
      h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: 0.25,
        color: '#2E4159',
      },
      h2: {
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 32,
        letterSpacing: 0.15,
        color: '#2E4159',
      },
      h3: {
        fontSize: 22,
        fontWeight: "600",
        lineHeight: 28,
        letterSpacing: 0.1,
        color: '#2E4159',
      },
      h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: 0.05,
        color: '#2E4159',
      },
    },
    
    body: {
      large: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#2E4159',
      },
      standard: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 22,
        color: '#546B8B',
      },
      small: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        color: '#8195B0',
      },
    },
    
    label: {
      bold: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E4159',
        letterSpacing: 0.2,
      },
      regular: {
        fontSize: 14,
        fontWeight: '500',
        color: '#546B8B',
      },
      small: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8195B0',
        letterSpacing: 0.1,
      },
    },
    
    subtitle: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.15,
      color: '#546B8B',
    },
    
    caption: {
      fontSize: 12,
      fontWeight: '400',
      letterSpacing: 0.4,
      color: '#8195B0',
      lineHeight: 16,
    },
  },

  // Estilos de bordes refinados
  border: {
    radius: {
      small: 6,
      medium: 10,
      large: 14,
      xl: 20,
      pill: 999,
      circle: '50%',
    },
    width: {
      thin: 1,
      standard: 1.5,
      thick: 2,
      focus: 2,
    },
  },

  // Sombras elegantes
  shadows: {
    none: {
      elevation: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    tiny: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
    small: Platform.select({
      ios: {
        shadowColor: '#0F2B5B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
    medium: Platform.select({
      ios: {
        shadowColor: '#0F2B5B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
    large: Platform.select({
      ios: {
        shadowColor: '#0F2B5B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
    xl: Platform.select({
      ios: {
        shadowColor: '#0F2B5B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 9 },
    }),
    // Sombra específica para tarjetas elegantes
    card: Platform.select({
      ios: {
        shadowColor: '#0F2B5B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
    // Sombra para elementos destacados
    highlight: Platform.select({
      ios: {
        shadowColor: '#4A89DC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { 
        elevation: 7,
        shadowColor: '#4A89DC',
      },
    }),
  },

  // Transiciones y animaciones refinadas
  animation: {
    durations: {
      veryFast: 100,
      fast: 200,
      normal: 300,
      slow: 450,
      verySlow: 600,
    },
    easings: {
      easeIn: 'ease-in',
      easeOut: 'ease-out', 
      easeInOut: 'ease-in-out',
      linear: 'linear',
    }
  },
  
  // Layouts y medidas comunes
  layout: {
    screenPadding: 20,
    maxContentWidth: width > 900 ? 900 : width,
    headerHeight: 64,
    footerHeight: 56,
    cardSpacing: 16,
    iconSize: {
      tiny: 12,
      small: 16,
      medium: 20,
      large: 24,
      xl: 32,
      xxl: 40,
    },
    avatarSize: {
      small: 36,
      medium: 48,
      large: 64,
    },
  },
  
  // Efectos visuales sofisticados
  effects: {
    // Degradados predefinidos
    gradients: {
      primary: ['#4A89DC', '#3B6CB0'],
      success: ['#4FBE79', '#3AA665'],
      warning: ['#F8AC59', '#E99539'],
      error: ['#F76C6C', '#E54A4A'],
      neutral: ['#F2F6FC', '#E9F0FA'],
      card: ['#FFFFFF', '#F9FBFF'],
      header: ['#4A89DC', '#4078C6'],
      glass: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'],
    },
    
    // Profundidad y capas con z-index
    zIndex: {
      base: 0,
      elevated: 1,
      dropdown: 5,
      sticky: 10,
      modal: 20,
      toast: 30,
      tooltip: 40,
    },
    
    // Opacidades para estados
    opacity: {
      disabled: 0.5,
      inactive: 0.7,
      hover: 0.8,
      active: 1,
    },
    
    // Fondos con efecto de vidrio (glassmorphism)
    glassmorphism: {
      light: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      dark: {
        backgroundColor: 'rgba(9, 30, 66, 0.7)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(9, 30, 66, 0.2)',
      },
    },
  },
};

/**
 * Estilos refinados para componentes específicos
 */
export const MovimientosStyles = StyleSheet.create({
  // Contenedor principal
  safeArea: {
    flex: 1,
    backgroundColor: MovimientosDesign.colors.neutral.background,
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: MovimientosDesign.spacing.xlarge,
  },

  // Encabezado principal elegante
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MovimientosDesign.layout.screenPadding,
    paddingTop: MovimientosDesign.spacing.standard + (Platform.OS === 'ios' ? 6 : 0),
    paddingBottom: MovimientosDesign.spacing.standard,
    height: MovimientosDesign.layout.headerHeight,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MovimientosDesign.layout.screenPadding,
    paddingVertical: MovimientosDesign.spacing.medium,
    height: MovimientosDesign.layout.headerHeight,
    backgroundColor: MovimientosDesign.colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: MovimientosDesign.colors.neutral.border,
    ...MovimientosDesign.shadows.small,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: MovimientosDesign.typography.heading.h3.fontSize,
    fontWeight: "600",
    lineHeight: MovimientosDesign.typography.heading.h3.lineHeight,
    letterSpacing: MovimientosDesign.typography.heading.h3.letterSpacing,
    color: MovimientosDesign.colors.neutral.textPrimary,
  },
  headerWhiteTitle: {
    fontSize: MovimientosDesign.typography.heading.h3.fontSize,
    fontWeight: MovimientosDesign.typography.heading.h3.fontWeight as TextStyle['fontWeight'],
    lineHeight: MovimientosDesign.typography.heading.h3.lineHeight,
    letterSpacing: MovimientosDesign.typography.heading.h3.letterSpacing,
    color: MovimientosDesign.colors.neutral.white,
  },
  headerSubtitle: {
    ...MovimientosDesign.typography.caption,
    marginTop: MovimientosDesign.spacing.xs,
  },
  headerWhiteSubtitle: {
    ...MovimientosDesign.typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: MovimientosDesign.spacing.xs,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  
  // Tarjeta de perfil de usuario
  userProfileCard: {
    margin: MovimientosDesign.spacing.standard,
    marginBottom: MovimientosDesign.spacing.large,
    padding: MovimientosDesign.spacing.standard,
    backgroundColor: MovimientosDesign.colors.neutral.white,
    borderRadius: MovimientosDesign.border.radius.large,
    ...MovimientosDesign.shadows.card,
  },
  userProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MovimientosDesign.colors.primary.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MovimientosDesign.spacing.standard,
    ...MovimientosDesign.shadows.small,
  },
  userAvatarText: {
    fontSize: MovimientosDesign.typography.fontSize.large,
    color: MovimientosDesign.colors.primary.main,
    fontWeight: MovimientosDesign.typography.fontWeight.bold as "bold",
  },
  userInfo: {
    flex: 1,
  },
  userWelcome: {
    ...MovimientosDesign.typography.label.small,
    marginBottom: 2,
  },
  userName: {
    fontSize: MovimientosDesign.typography.fontSize.xl,
    fontWeight: "bold",
    color: MovimientosDesign.colors.neutral.textPrimary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: MovimientosDesign.typography.body.small.fontSize,
    color: MovimientosDesign.colors.neutral.textTertiary,
    fontWeight: MovimientosDesign.typography.body.small.fontWeight as TextStyle['fontWeight'],
    lineHeight: MovimientosDesign.typography.body.small.lineHeight,
  },
  
  // Filtros y pestañas elegantes
  filtersContainer: {
    paddingHorizontal: MovimientosDesign.layout.screenPadding,
    paddingTop: MovimientosDesign.spacing.medium,
    paddingBottom: MovimientosDesign.spacing.standard,
    backgroundColor: MovimientosDesign.colors.neutral.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: MovimientosDesign.colors.neutral.border,
  },
  locationsContainer: {
    marginHorizontal: -MovimientosDesign.spacing.small,
    marginBottom: MovimientosDesign.spacing.large,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MovimientosDesign.spacing.small,
    paddingHorizontal: MovimientosDesign.spacing.standard,
    marginHorizontal: MovimientosDesign.spacing.small,
    borderRadius: MovimientosDesign.border.radius.pill,
    backgroundColor: MovimientosDesign.colors.neutral.white,
    ...MovimientosDesign.shadows.small,
  },
  locationChipActive: {
    backgroundColor: MovimientosDesign.colors.primary.main,
    ...MovimientosDesign.shadows.medium,
  },
  locationChipText: {
    ...MovimientosDesign.typography.label.regular,
    color: MovimientosDesign.colors.neutral.textSecondary,
    marginLeft: MovimientosDesign.spacing.small,
  },
  locationChipTextActive: {
    color: MovimientosDesign.colors.neutral.white,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
  },
  locationIcon: {
    opacity: 0.7,
  },
  locationIconActive: {
    opacity: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: MovimientosDesign.spacing.standard,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MovimientosDesign.spacing.medium,
    paddingHorizontal: MovimientosDesign.spacing.large,
    borderRadius: MovimientosDesign.border.radius.large,
    marginRight: MovimientosDesign.spacing.medium,
    backgroundColor: MovimientosDesign.colors.neutral.white,
    borderWidth: 1.5,
    borderColor: MovimientosDesign.colors.neutral.border,
    ...MovimientosDesign.shadows.tiny,
  },
  tabButtonActive: {
    backgroundColor: MovimientosDesign.colors.primary.background,
    borderColor: MovimientosDesign.colors.primary.main,
    ...MovimientosDesign.shadows.small,
  },
  tabText: {
    ...MovimientosDesign.typography.label.regular,
    marginLeft: MovimientosDesign.spacing.small,
  },
  tabTextActive: {
    color: MovimientosDesign.colors.primary.main,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
  },
  tabIcon: {
    opacity: 0.7,
  },
  tabIconActive: {
    opacity: 1,
  },
  
  // Botones y acciones elegantes
  buttonPrimary: {
    backgroundColor: MovimientosDesign.colors.primary.main,
    paddingVertical: MovimientosDesign.spacing.medium,
    paddingHorizontal: MovimientosDesign.spacing.large,
    borderRadius: MovimientosDesign.border.radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...MovimientosDesign.shadows.medium,
  },
  buttonPrimaryPressed: {
    backgroundColor: MovimientosDesign.colors.primary.dark,
  },
  buttonSecondary: {
    backgroundColor: MovimientosDesign.colors.neutral.white,
    paddingVertical: MovimientosDesign.spacing.medium,
    paddingHorizontal: MovimientosDesign.spacing.large,
    borderRadius: MovimientosDesign.border.radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: MovimientosDesign.colors.primary.main,
    ...MovimientosDesign.shadows.small,
  },
  buttonText: {
    color: MovimientosDesign.colors.neutral.white,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
    fontSize: MovimientosDesign.typography.fontSize.medium,
    letterSpacing: 0.3,
  },
  buttonTextSecondary: {
    color: MovimientosDesign.colors.primary.main,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
    fontSize: MovimientosDesign.typography.fontSize.medium,
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginRight: MovimientosDesign.spacing.small,
  },
  refreshAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MovimientosDesign.spacing.small + 2,
    paddingHorizontal: MovimientosDesign.spacing.standard,
    borderRadius: MovimientosDesign.border.radius.medium,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  refreshActionDark: {
    borderColor: MovimientosDesign.colors.primary.main,
    backgroundColor: MovimientosDesign.colors.neutral.white,
  },
  refreshActionActive: {
    backgroundColor: MovimientosDesign.colors.primary.main,
    borderColor: MovimientosDesign.colors.primary.main,
  },
  refreshActionText: {
    fontSize: MovimientosDesign.typography.fontSize.small,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  refreshActionTextDark: {
    color: MovimientosDesign.colors.primary.main,
  },
  refreshActionTextActive: {
    color: MovimientosDesign.colors.neutral.white,
  },
  
  // Tarjetas de movimientos elegantes
  cardContainer: {
    backgroundColor: MovimientosDesign.colors.neutral.white,
    borderRadius: MovimientosDesign.border.radius.large,
    marginHorizontal: MovimientosDesign.layout.screenPadding,
    marginVertical: MovimientosDesign.spacing.medium,
    padding: 0, // Sin padding, cada sección tendrá su propio espaciado
    overflow: 'hidden',
    ...MovimientosDesign.shadows.card,
  },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: '100%',
    borderTopLeftRadius: MovimientosDesign.border.radius.large,
    borderBottomLeftRadius: MovimientosDesign.border.radius.large,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MovimientosDesign.spacing.standard,
    paddingTop: MovimientosDesign.spacing.standard,
    paddingBottom: MovimientosDesign.spacing.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MovimientosDesign.spacing.standard,
    paddingBottom: MovimientosDesign.spacing.medium,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MovimientosDesign.spacing.small,
  },
  cardBody: {
    paddingHorizontal: MovimientosDesign.spacing.standard,
    paddingBottom: MovimientosDesign.spacing.medium,
  },
  cardDivider: {
    height: 1,
    backgroundColor: MovimientosDesign.colors.neutral.divider,
    marginVertical: MovimientosDesign.spacing.small,
  },
  cardDetails: {
    backgroundColor: MovimientosDesign.colors.neutral.surfaceLight,
    padding: MovimientosDesign.spacing.standard,
    borderRadius: MovimientosDesign.border.radius.medium,
    marginBottom: MovimientosDesign.spacing.standard,
  },
  cardFooter: {
    padding: MovimientosDesign.spacing.standard,
    backgroundColor: MovimientosDesign.colors.neutral.surfaceDark,
    borderBottomLeftRadius: MovimientosDesign.border.radius.large,
    borderBottomRightRadius: MovimientosDesign.border.radius.large,
  },
  cardTitle: {
    fontSize: MovimientosDesign.typography.fontSize.large,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
    color: MovimientosDesign.colors.neutral.textPrimary,
    flex: 1,
    marginLeft: MovimientosDesign.spacing.small,
  },
  cardSubtitle: {
    fontSize: MovimientosDesign.typography.fontSize.small,
    color: MovimientosDesign.colors.neutral.textTertiary,
    marginTop: 2,
  },
  cardOrderNumber: {
    fontSize: MovimientosDesign.typography.fontSize.small,
    fontWeight: MovimientosDesign.typography.fontWeight.semibold as "600",
    color: MovimientosDesign.colors.neutral.textSecondary,
    backgroundColor: MovimientosDesign.colors.neutral.surfaceLight,
    paddingHorizontal: MovimientosDesign.spacing.medium,
    paddingVertical: MovimientosDesign.spacing.xs,
    borderRadius: MovimientosDesign.border.radius.pill,
  },
  cardDescription: {
    ...MovimientosDesign.typography.body.standard,
    marginBottom: MovimientosDesign.spacing.medium,
    lineHeight: 20,
  },
  cardDate: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: MovimientosDesign.spacing.small,
  },
  cardDateText: {
    ...MovimientosDesign.typography.caption,
    marginLeft: MovimientosDesign.spacing.xs,
  },
  
  // Elementos de información refinados
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MovimientosDesign.spacing.medium,
  },
  infoIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: MovimientosDesign.spacing.standard,
    opacity: 0.7,
  },
  infoLabel: {
    ...MovimientosDesign.typography.label.small,
    width: 80,
    marginRight: MovimientosDesign.spacing.small,
  },
  infoValue: {
    ...MovimientosDesign.typography.body.standard,
    flex: 1,
    fontWeight: MovimientosDesign.typography.fontWeight.medium as "500",
  },
  infoSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: MovimientosDesign.spacing.large,
  },
  
  // Badges y estados elegantes
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MovimientosDesign.spacing.small + 2,
    paddingVertical: MovimientosDesign.spacing.xs + 1,
    borderRadius: MovimientosDesign.border.radius.pill,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: MovimientosDesign.colors.state.success,
  },
  badgeWarning: {
    backgroundColor: MovimientosDesign.colors.state.warning,
  },
  badgeInfo: {
    backgroundColor: MovimientosDesign.colors.state.info,
  },
  badgeError: {
    backgroundColor: MovimientosDesign.colors.state.error,
  },
  badgeText: {
    color: MovimientosDesign.colors.neutral.white,
    fontSize: MovimientosDesign.typography.fontSize.xs,
    fontWeight: "bold",
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  
  // Estados de carga y error elegantes
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: MovimientosDesign.spacing.xlarge,
  },
  loadingText: {
    ...MovimientosDesign.typography.body.standard,
    color: MovimientosDesign.colors.neutral.textSecondary,
    marginTop: MovimientosDesign.spacing.standard,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MovimientosDesign.spacing.large,
  },
  errorIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(247, 108, 108, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MovimientosDesign.spacing.standard,
    borderWidth: 2,
    borderColor: 'rgba(247, 108, 108, 0.3)',
  },
  errorIcon: {
    color: MovimientosDesign.colors.state.error,
  },
  errorTitle: {
    ...MovimientosDesign.typography.heading.h3,
    marginBottom: MovimientosDesign.spacing.small,
    color: MovimientosDesign.colors.neutral.textPrimary,
  },
  errorMessage: {
    ...MovimientosDesign.typography.body.standard,
    textAlign: 'center',
    marginBottom: MovimientosDesign.spacing.large,
    maxWidth: 300,
  },
  
  // Estado vacío refinado
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MovimientosDesign.spacing.large,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(74, 137, 220, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MovimientosDesign.spacing.standard,
    borderWidth: 2,
    borderColor: 'rgba(74, 137, 220, 0.2)',
  },
  emptyIcon: {
    color: MovimientosDesign.colors.primary.main,
    opacity: 0.7,
  },
  emptyTitle: {
    ...MovimientosDesign.typography.heading.h3,
    marginBottom: MovimientosDesign.spacing.small,
    color: MovimientosDesign.colors.neutral.textPrimary,
  },
  emptyMessage: {
    ...MovimientosDesign.typography.body.standard,
    textAlign: 'center',
    marginBottom: MovimientosDesign.spacing.large,
    maxWidth: 300,
  },
  
  // Separadores y divisores
  divider: {
    height: 1,
    backgroundColor: MovimientosDesign.colors.neutral.divider,
    marginVertical: MovimientosDesign.spacing.medium,
  },
  spacer: {
    height: MovimientosDesign.spacing.standard,
  },
  
  // Elementos específicos de sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MovimientosDesign.spacing.medium,
    paddingHorizontal: MovimientosDesign.spacing.standard,
    marginHorizontal: MovimientosDesign.layout.screenPadding,
    marginTop: MovimientosDesign.spacing.large,
    marginBottom: MovimientosDesign.spacing.medium,
    borderRadius: MovimientosDesign.border.radius.large,
  },
  sectionTitle: {
    flex: 1,
    fontSize: MovimientosDesign.typography.fontSize.large,
    fontWeight: "bold",
    color: MovimientosDesign.colors.neutral.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionIcon: {
    marginRight: MovimientosDesign.spacing.small,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: MovimientosDesign.spacing.small,
    paddingVertical: MovimientosDesign.spacing.xs,
    borderRadius: MovimientosDesign.border.radius.pill,
  },
  sectionBadgeText: {
    fontSize: MovimientosDesign.typography.fontSize.xs,
    fontWeight: "bold",
    color: MovimientosDesign.colors.neutral.white,
  },
  
  // Helpers de utilidad
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flex1: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  marginBottom: {
    marginBottom: MovimientosDesign.spacing.standard,
  },
  marginBottomSmall: {
    marginBottom: MovimientosDesign.spacing.small,
  },
  padding: {
    padding: MovimientosDesign.spacing.standard,
  },
  paddingHorizontal: {
    paddingHorizontal: MovimientosDesign.spacing.standard,
  },
  textCenter: {
    textAlign: 'center',
  },
  roundedBox: {
    borderRadius: MovimientosDesign.border.radius.medium,
    overflow: 'hidden',
  },
});

// Utilidad para generar un degradado de color basado en un índice
export const getGradientForIndex = (index: number): string[] => {
  const baseColors = [
    [MovimientosDesign.colors.accent.blue, `${MovimientosDesign.colors.accent.blue}95`],
    [MovimientosDesign.colors.accent.teal, `${MovimientosDesign.colors.accent.teal}95`],
    [MovimientosDesign.colors.accent.green, `${MovimientosDesign.colors.accent.green}95`],
    [MovimientosDesign.colors.accent.purple, `${MovimientosDesign.colors.accent.purple}95`],
    [MovimientosDesign.colors.accent.coral, `${MovimientosDesign.colors.accent.coral}95`],
    [MovimientosDesign.colors.accent.amber, `${MovimientosDesign.colors.accent.amber}95`],
  ];
  
  return baseColors[index % baseColors.length];
};

// Exportar el sistema de diseño completo
export default {
  design: MovimientosDesign,
  styles: MovimientosStyles,
  utils: {
    getGradientForIndex,
  },
};