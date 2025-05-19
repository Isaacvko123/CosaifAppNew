import { StyleSheet } from 'react-native';

// Sistema de diseño con tonos oscuros mejorados y mayor consistencia
const DesignSystem = {
  spacing: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48,
  },
  colors: {
    // Colores primarios para fondos (más refinados y profesionales)
    primary: {
      ADMINISTRADOR: '#0F1A2F',  // Azul noche intenso
      SUPERVISOR: '#1E2B3A',     // Azul acero oscuro
      CLIENTE: '#1E3B2E',        // Verde bosque oscuro
      MAQUINISTA: '#3B0D0C',     // Rojo oscuro
      OPERADOR: '#4F3B0A',       // Amarillo tierra oscuro
    },
    
    // Colores para texto (mejor contraste y legibilidad)
    text: {
      ADMINISTRADOR: '#E5EDF8',  // Azul claro más luminoso
      SUPERVISOR: '#E0ECF7',     // Gris azulado claro optimizado
      CLIENTE: '#E0F5E9',        // Verde menta claro ajustado
      MAQUINISTA: '#FFD9D9',     // Rosa claro optimizado para contraste
      OPERADOR: '#FFF8E0',       // Amarillo pálido mejorado
    },
    
    // Colores de acento (más vivos y distintivos)
    accent: {
      ADMINISTRADOR: '#4D8BF9',  // Azul eléctrico
      SUPERVISOR: '#36B4C6',     // Turquesa
      CLIENTE: '#4AC27D',        // Verde esmeralda
      MAQUINISTA: '#E35A56',     // Rojo coral
      OPERADOR: '#F0C03F',       // Amarillo ámbar
    },
    
    // Colores de acento con transparencia para efectos sutiles
    accentTranslucent: {
      ADMINISTRADOR: 'rgba(77, 139, 249, 0.3)',
      SUPERVISOR: 'rgba(54, 180, 198, 0.3)',
      CLIENTE: 'rgba(74, 194, 125, 0.3)',
      MAQUINISTA: 'rgba(227, 90, 86, 0.3)',
      OPERADOR: 'rgba(240, 192, 63, 0.3)',
    },
    
    // Gradientes de fondo
    gradient: {
      ADMINISTRADOR: ['#0F1A2F', '#142641'],
      SUPERVISOR: ['#1E2B3A', '#253648'],
      CLIENTE: ['#1E3B2E', '#25483A'],
      MAQUINISTA: ['#3B0D0C', '#4A1412'],
      OPERADOR: ['#4F3B0A', '#5F4B14'],
    },
    
    // Colores para estados y acciones
    action: {
      active: '#4AC27D',     // Verde para acciones activas
      inactive: '#9CA3AF',   // Gris para elementos inactivos
      warning: '#F59E0B',    // Amarillo para advertencias
      error: '#EF4444',      // Rojo para errores
      info: '#3B82F6',       // Azul para información
    },
    
    // Colores generales para usar en todos los temas
    common: {
      white: '#FFFFFF',
      black: '#000000',
      darkBg: '#0A0F1C',     // Fondo oscuro base
      darkSurface: '#121827', // Superficie oscura para tarjetas
      border: 'rgba(255, 255, 255, 0.12)', // Bordes sutiles
      divider: 'rgba(255, 255, 255, 0.06)', // Divisores muy sutiles
      shadow: 'rgba(0, 0, 0, 0.5)', // Sombras prominentes
      overlay: 'rgba(0, 0, 0, 0.7)', // Overlay para modales
    },
  },
  
  // Tipografía refinada para mejor legibilidad
  typography: {
    header: {
      large: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "bold",
        letterSpacing: 0.2,
      },
      medium: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "bold",
        letterSpacing: 0.15,
      },
      small: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "bold",
        letterSpacing: 0.1,
      },
    },
    body: {
      large: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "400",
      },
      medium: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "400",
      },
      small: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "400",
      },
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
      letterSpacing: 0.4,
    },
  },
  
  // Efectos visuales refinados
  effects: {
    shadow: {
      small: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      medium: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      large: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    },
    textShadow: {
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
  },
  
  // Radios de borde
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    round: 9999, // Para círculos perfectos
  },
};

// Estilos base mejorados para el menú
export const estilosBase = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 280,
    paddingTop: DesignSystem.spacing.xlarge,
    backgroundColor: DesignSystem.colors.common.darkBg,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.common.border,
    ...DesignSystem.effects.shadow.large,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.medium,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.large,
    paddingBottom: DesignSystem.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.common.border,
  },
  headerText: {
    ...DesignSystem.typography.header.medium,
    marginLeft: DesignSystem.spacing.small,
    ...DesignSystem.effects.textShadow,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DesignSystem.spacing.small,
    paddingVertical: DesignSystem.spacing.medium,
    borderRadius: DesignSystem.borderRadius.medium,
  },
  menuText: {
    ...DesignSystem.typography.body.large,
    marginLeft: DesignSystem.spacing.medium,
    flex: 1,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
  },
  footerContainer: {
    marginTop: DesignSystem.spacing.large,
    paddingTop: DesignSystem.spacing.medium,
    paddingBottom: DesignSystem.spacing.xlarge,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.common.border,
    alignItems: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.small,
    paddingHorizontal: DesignSystem.spacing.medium,
    borderRadius: DesignSystem.borderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: DesignSystem.spacing.medium,
  },
  roleIcon: {
    marginRight: DesignSystem.spacing.small,
  },
  roleText: {
    ...DesignSystem.typography.body.medium,
    fontWeight: '600',
  },
  versionText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.small,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.medium,
    paddingHorizontal: DesignSystem.spacing.large,
    marginTop: DesignSystem.spacing.medium,
    borderRadius: DesignSystem.borderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  logoutText: {
    ...DesignSystem.typography.button,
    marginLeft: DesignSystem.spacing.small,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemText: {
    marginLeft: DesignSystem.spacing.medium,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.large,
    paddingBottom: DesignSystem.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.common.border,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.medium,
  },
  avatarText: {
    ...DesignSystem.typography.header.medium,
    color: DesignSystem.colors.common.white,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    ...DesignSystem.typography.body.large,
    fontWeight: '600',
    marginBottom: 2,
  },
  userCompany: {
    ...DesignSystem.typography.body.medium,
    opacity: 0.8,
  },
});

// Estilos específicos por rol con colores refinados
export const estilosPorRol = {
  ADMINISTRADOR: StyleSheet.create({
    menuContainer: {
      backgroundColor: DesignSystem.colors.primary.ADMINISTRADOR,
    },
    headerText: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
      textShadowColor: 'rgba(15, 26, 47, 0.5)',
    },
    menuText: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
    },
    activeMenuItem: {
      backgroundColor: DesignSystem.colors.accentTranslucent.ADMINISTRADOR,
    },
    avatarContainer: {
      backgroundColor: DesignSystem.colors.accent.ADMINISTRADOR,
    },
    roleText: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
    },
    userName: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
    },
    userCompany: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
    },
    logoutText: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
    },
    versionText: {
      color: DesignSystem.colors.text.ADMINISTRADOR,
      opacity: 0.6,
    },
  }),
  
  SUPERVISOR: StyleSheet.create({
    menuContainer: {
      backgroundColor: DesignSystem.colors.primary.SUPERVISOR,
    },
    headerText: {
      color: DesignSystem.colors.text.SUPERVISOR,
      textShadowColor: 'rgba(30, 43, 58, 0.5)',
    },
    menuText: {
      color: DesignSystem.colors.text.SUPERVISOR,
    },
    activeMenuItem: {
      backgroundColor: DesignSystem.colors.accentTranslucent.SUPERVISOR,
    },
    avatarContainer: {
      backgroundColor: DesignSystem.colors.accent.SUPERVISOR,
    },
    roleText: {
      color: DesignSystem.colors.text.SUPERVISOR,
    },
    userName: {
      color: DesignSystem.colors.text.SUPERVISOR,
    },
    userCompany: {
      color: DesignSystem.colors.text.SUPERVISOR,
    },
    logoutText: {
      color: DesignSystem.colors.text.SUPERVISOR,
    },
    versionText: {
      color: DesignSystem.colors.text.SUPERVISOR,
      opacity: 0.6,
    },
  }),
  
  CLIENTE: StyleSheet.create({
    menuContainer: {
      backgroundColor: DesignSystem.colors.primary.CLIENTE,
    },
    headerText: {
      color: DesignSystem.colors.text.CLIENTE,
      textShadowColor: 'rgba(30, 59, 46, 0.5)',
    },
    menuText: {
      color: DesignSystem.colors.text.CLIENTE,
    },
    activeMenuItem: {
      backgroundColor: DesignSystem.colors.accentTranslucent.CLIENTE,
    },
    avatarContainer: {
      backgroundColor: DesignSystem.colors.accent.CLIENTE,
    },
    roleText: {
      color: DesignSystem.colors.text.CLIENTE,
    },
    userName: {
      color: DesignSystem.colors.text.CLIENTE,
    },
    userCompany: {
      color: DesignSystem.colors.text.CLIENTE,
    },
    logoutText: {
      color: DesignSystem.colors.text.CLIENTE,
    },
    versionText: {
      color: DesignSystem.colors.text.CLIENTE,
      opacity: 0.6,
    },
  }),
  
  MAQUINISTA: StyleSheet.create({
    menuContainer: {
      backgroundColor: DesignSystem.colors.primary.MAQUINISTA,
    },
    headerText: {
      color: DesignSystem.colors.text.MAQUINISTA,
      textShadowColor: 'rgba(59, 13, 12, 0.5)',
    },
    menuText: {
      color: DesignSystem.colors.text.MAQUINISTA,
    },
    activeMenuItem: {
      backgroundColor: DesignSystem.colors.accentTranslucent.MAQUINISTA,
    },
    avatarContainer: {
      backgroundColor: DesignSystem.colors.accent.MAQUINISTA,
    },
    roleText: {
      color: DesignSystem.colors.text.MAQUINISTA,
    },
    userName: {
      color: DesignSystem.colors.text.MAQUINISTA,
    },
    userCompany: {
      color: DesignSystem.colors.text.MAQUINISTA,
    },
    logoutText: {
      color: DesignSystem.colors.text.MAQUINISTA,
    },
    versionText: {
      color: DesignSystem.colors.text.MAQUINISTA,
      opacity: 0.6,
    },
  }),
  
  OPERADOR: StyleSheet.create({
    menuContainer: {
      backgroundColor: DesignSystem.colors.primary.OPERADOR,
    },
    headerText: {
      color: DesignSystem.colors.text.OPERADOR,
      textShadowColor: 'rgba(79, 59, 10, 0.5)',
    },
    menuText: {
      color: DesignSystem.colors.text.OPERADOR,
    },
    activeMenuItem: {
      backgroundColor: DesignSystem.colors.accentTranslucent.OPERADOR,
    },
    avatarContainer: {
      backgroundColor: DesignSystem.colors.accent.OPERADOR,
    },
    roleText: {
      color: DesignSystem.colors.text.OPERADOR,
    },
    userName: {
      color: DesignSystem.colors.text.OPERADOR,
    },
    userCompany: {
      color: DesignSystem.colors.text.OPERADOR,
    },
    logoutText: {
      color: DesignSystem.colors.text.OPERADOR,
    },
    versionText: {
      color: DesignSystem.colors.text.OPERADOR,
      opacity: 0.6,
    },
  }),
};

// Exporta el sistema de diseño completo para uso global
export { DesignSystem };