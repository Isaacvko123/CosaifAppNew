import { StyleSheet } from 'react-native';

// Definición de colores base para mantener consistencia
const COLORS = {
  background: '#F9F9F9',
  white: '#FFF',
  border: '#CCC',
  primary: '#74C69D',
  text: '#333',
  error: 'red',
};

// Estilos base para el componente EditarUsuario
export const styles = StyleSheet.create({
  // Contenedor principal
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Título de la tarjeta (por ejemplo, "Editar Usuario")
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Estilo para inputs simples
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
    color: COLORS.text,
  },
  // Contenedor para inputs con ícono (por ejemplo, contraseña con botón para ver/ocultar)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  // Fila para agrupar botones (por ejemplo, "Guardar" y "Regresar")
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  // Botón para guardar cambios
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  // Botón para cancelar o regresar
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    elevation: 4,
    shadowColor: COLORS.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  // Texto que aparece dentro de los botones
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Contenedor para mostrar indicadores de carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Texto para mostrar mensajes de error
  errorText: {
    fontSize: 18,
    color: COLORS.error,
  },
});
