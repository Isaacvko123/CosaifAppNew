// EditRondaStyles.ts - Estilos para EditRonda
import { StyleSheet, Platform } from 'react-native';
import { MD3LightTheme } from 'react-native-paper';

/* ---------- Paleta de colores premium ---------- */
export const COLORS = {
  primary: '#0C88C5',        // Azul principal
  primaryDark: '#0071A7',    // Azul oscuro
  primaryLight: '#E0F7FF',   // Azul claro
  secondary: '#5ABEF5',      // Azul claro secundario
  accent: '#FFC107',         // Color acento (ámbar)
  background: '#F5F7FA',     // Fondo gris claro
  surface: '#FFFFFF',        // Superficie blanca
  success: '#4CAF50',        // Verde éxito
  error: '#F44336',          // Rojo error
  warning: '#FF9800',        // Naranja advertencia
  text: '#333333',           // Texto principal
  textSecondary: '#757575',  // Texto secundario
  border: '#E0E0E0',         // Bordes
  divider: '#EEEEEE',        // Divisor
  shadow: 'rgba(0,0,0,0.1)',  // Color de sombra
};

/* ---------- Colores por ronda ---------- */
export const getRondaColor = (number: number) => {
  const colors = [
    { primary: '#0284c7', secondary: '#bae6fd', gradient: ['#0284c7', '#0ea5e9'] }, // Azul
    { primary: '#6366f1', secondary: '#c7d2fe', gradient: ['#6366f1', '#818cf8'] }, // Índigo
    { primary: '#f97316', secondary: '#fed7aa', gradient: ['#f97316', '#fb923c'] }, // Naranja
    { primary: '#10b981', secondary: '#a7f3d0', gradient: ['#10b981', '#34d399'] }, // Esmeralda
    { primary: '#8b5cf6', secondary: '#ddd6fe', gradient: ['#8b5cf6', '#a78bfa'] }, // Violeta
    { primary: '#ec4899', secondary: '#fbcfe8', gradient: ['#ec4899', '#f472b6'] }, // Rosa
  ];
  return colors[(number - 1) % colors.length];
};

/* ---------- Tema de Paper ---------- */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
  },
};

/* ---------- Estilos ---------- */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Cabecera
  header: {
    paddingVertical: 16,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      android: {
        elevation: 1,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  
  // Instrucciones
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  infoIcon: {
    marginRight: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  
  // Secciones
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rondaCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rondaNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rondaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  itemCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Tarjetas
  cardWrapper: {
    padding: 8,
  },
  firstCard: {
    paddingTop: 12,
  },
  lastCard: {
    paddingBottom: 12,
  },
  card: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: -4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 6,
    lineHeight: 20,
  },
  
  // Información adicional
  infoContainer: {
    marginTop: 10,
  },
  divider: {
    height: 2,
    borderRadius: 1,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusActive: {
    color: COLORS.success,
  },
  statusInactive: {
    color: COLORS.textSecondary,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Lista
  listContent: {
    paddingTop: 8,
  },
  
  // Botón de guardar
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  gradientButton: {
    borderRadius: 30,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
    }),
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // Snackbar
  snackbar: {
    backgroundColor: COLORS.primaryDark,
  },
});