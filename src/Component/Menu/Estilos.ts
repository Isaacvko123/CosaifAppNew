import { StyleSheet } from 'react-native';

// Sistema de diseño con tonos oscuros mejorados
const DesignSystem = {
  spacing: {
    small: 8,
    medium: 22,
    large: 27,
    xlarge: 32,
  },
  colors: {
    primary: {
      ADMIN: '#0F1A2F',       // Azul noche intenso
      SUPERVISOR: '#1E2B3A',   // Azul acero oscuro
      CLIENTE: '#1E3B2E'       // Verde bosque oscuro
    },
    text: {
      ADMIN: '#D8E2EE',        // Azul claro suave
      SUPERVISOR: '#D1DDE8',   // Gris azulado claro
      CLIENTE: '#D8ECE0'       // Verde menta claro
    },
    accents: {
      ADMIN: '#2A3F5F60',      // Bordes con transparencia
      SUPERVISOR: '#2F435C60',
      CLIENTE: '#2D554560'
    },
    borders: '#FFFFFF',      // Bordes muy sutiles
    shadow: '#00000090',       // Sombras más definidas
  },
  typography: {
    header: {
      fontSize: 22,
      fontWeight: 'bold' as const,
    },
    body: {
      fontSize: 18,
    },
  },
  effects: {
    shadow: {
      elevation: 12,
      shadowColor: '#fff',
    
      shadowRadius: 8,
    },
  },
};

// Estilos base ajustados
export const estilosBase = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 280,
    paddingHorizontal: DesignSystem.spacing.medium,
    paddingTop: DesignSystem.spacing.xlarge,
    backgroundColor: '#0A0F1C',  // Fondo oscuro base
    ...DesignSystem.effects.shadow,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.borders,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xlarge,
    paddingBottom: DesignSystem.spacing.small,
    borderBottomWidth: 3,
    borderBottomColor: DesignSystem.colors.borders,
  },
  headerText: {
    ...DesignSystem.typography.header,
    marginLeft: DesignSystem.spacing.small,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DesignSystem.spacing.medium,
    paddingVertical: DesignSystem.spacing.small,
  },
  menuText: {
    ...DesignSystem.typography.body,
    marginLeft: DesignSystem.spacing.medium,
    flex: 4,
    paddingBottom: DesignSystem.spacing.small,
    borderBottomWidth: 6,
  },
});

// Estilos por rol con mejor contraste
export const estilosPorRol = {
  ADMIN: StyleSheet.create({
    menuContainer: {
      backgroundColor: DesignSystem.colors.primary.ADMIN,
    },
    headerText: {
      color: DesignSystem.colors.text.ADMIN,
      textShadowColor: 'rgba(15, 26, 47, 0.5)',
    },
    menuText: {
      color: DesignSystem.colors.text.ADMIN,
      borderBottomColor: DesignSystem.colors.accents.ADMIN,
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
      borderBottomColor: DesignSystem.colors.accents.SUPERVISOR,
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
      borderBottomColor: DesignSystem.colors.accents.CLIENTE,
    },
  }),
};

// Componente Supervisor ajustado
const SupervisorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A586D',  // Tonos oscuros coordinados
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    backgroundColor: '#1E2B3A',  // Color primario Supervisor
    padding: 12,
    borderRadius: 8,
    elevation: 5,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D1DDE8',  // Texto Supervisor
    letterSpacing: 0.5,
  },
});

// Componente Cliente ajustado
const ClienteStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3B2E',  // Verde oscuro
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    backgroundColor: '#2D5545',  // Versión más clara del primario
    padding: 12,
    borderRadius: 8,
    elevation: 5,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D8ECE0',  // Texto Cliente
    letterSpacing: 0.5,
  },
});