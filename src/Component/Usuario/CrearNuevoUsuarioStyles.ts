import { StyleSheet, Platform, Dimensions } from 'react-native';

// Obteniendo dimensiones
const { width, height } = Dimensions.get('window');

// Tema de colores centralizado
const COLORS = {
  primary: '#2D6A4F',       // Verde oscuro
  primaryLight: '#74C69D',  // Verde principal
  secondary: '#D8F3DC',     // Verde muy claro
  background: '#F0F4F8',    // Fondo gris azulado
  surface: '#FFFFFF',       // Superficies/tarjetas
  text: {
    primary: '#333333',     // Texto principal
    secondary: '#666666',   // Texto secundario
    light: '#FFFFFF',       // Texto claro
    error: '#E63946',       // Texto de error
  },
  border: '#C7D6CB',        // Bordes
  splash: '#D1F1E0',        // Fondo de splash
  input: '#E9F5EB',         // Fondo de inputs
};

// Espaciado consistente
const SPACING = {
  xs: width * 0.01,         // 1% del ancho
  sm: width * 0.02,         // 2% del ancho 
  md: width * 0.03,         // 3% del ancho (baseMargin anterior)
  lg: width * 0.04,         // 4% del ancho
  xl: width * 0.05,         // 5% del ancho (basePadding anterior)
  xxl: width * 0.07,        // 7% del ancho
};

// Tamaños de texto
const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
};

// Pesos de fuente
const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: "bold",
};

// Sombras reutilizables
const SHADOWS = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
});

// Sombras más profundas
const SHADOWS_STRONG = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  android: {
    elevation: 6,
  },
});

// Estilos de bordes comunes
const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 12,
  round: 100, // Para formas completamente redondeadas
};

// Estilos base para inputs
import type { ViewStyle } from 'react-native';
const baseInputStyles: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.input,
  borderRadius: BORDER_RADIUS.md,
  borderWidth: 1,
  borderColor: COLORS.border,
  paddingHorizontal: SPACING.md,
  height: 55,
};

// Estilos base para botones

const baseButtonStyles: ViewStyle = {
  width: '100%',
  paddingVertical: SPACING.md,
  borderRadius: BORDER_RADIUS.md,
  alignItems: 'center',
  justifyContent: 'center',
  height: 55,
};

export const styles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.splash,
    paddingHorizontal: SPACING.lg,
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginVertical: SPACING.md,
    ...SHADOWS_STRONG,
  },

  // Textos
  title: {
    fontSize: FONT_SIZE.xxl,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    color: COLORS.text.primary,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.text.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  // Inputs
  inputContainer: {
    ...baseInputStyles,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    paddingHorizontal: SPACING.sm,
  },
  picker: {
    flex: 1,
    color: COLORS.text.primary,
  },
  icon: {
    marginRight: SPACING.sm,
  },

  // Botones
  button: {
    ...baseButtonStyles,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primaryLight,
  },
  buttonText: {
    color: COLORS.text.light,
    fontSize: FONT_SIZE.lg,
  },
  cancelButton: {
    ...baseButtonStyles,
    backgroundColor: COLORS.primaryLight,
  },
  cancelButtonText: {
    color: COLORS.text.light,
    fontSize: FONT_SIZE.lg,
  },

  // Imágenes
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    marginBottom: SPACING.xl,
  },
});

// Exportamos además las constantes para usarlas en otros componentes
export const theme = {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
  SHADOWS_STRONG,
  BORDER_RADIUS
};