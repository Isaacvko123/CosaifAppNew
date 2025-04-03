import { StyleSheet } from 'react-native';

const COLORS = {
  background: '#F0F2F5',       // Fondo muy claro
  white: '#FFFFFF',
  cardBorder: '#E0E0E0',       // Borde sutil para tarjetas
  primary: '#2D6A4F',          // Azul oscuro / verde azulado (para títulos y botones principales)
  secondary: '#74C69D',        // Verde claro (para botones secundarios)
  text: '#333333',
  subtext: '#555555',
  error: '#FF4D4D',
};

export const styles = StyleSheet.create({
  // Contenedor principal con fondo claro y padding generoso
  mainContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  // Contenedor para cargar el ActivityIndicator
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tarjeta para cada usuario con sombra sutil y borde definido
  card: {
    width: '95%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  // Título de la tarjeta: nombre de usuario u otra información principal
  cardTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  // Fila para agrupar íconos y textos, con espacio vertical
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  // Espacio a la derecha para el ícono
  icon: {
    marginRight: 8,
  },
  // Texto dentro de la tarjeta con tipografía más pequeña y color secundario
  cardText: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  // Botón para editar: fondo primario, bordes redondeados y espaciado adecuado
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 15,
  },
  // Botón para crear un nuevo usuario: fondo secundario y espacio superior
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  // Espacio a la derecha para el ícono del botón
  buttonIcon: {
    marginRight: 8,
  },
  // Texto dentro de los botones: fuente en negrita y color blanco
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Texto para mostrar errores
  errorText: {
    fontSize: 18,
    color: COLORS.error,
  },
  // Estilos para inputs usados en formularios (si se reutilizan)
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: COLORS.text,
  },
  // Fila para botones en formularios (Guardar y Cancelar)
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  // Botón para guardar cambios en formularios
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    elevation: 3,
  },
  // Botón para cancelar en formularios
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    elevation: 3,
  },
});
