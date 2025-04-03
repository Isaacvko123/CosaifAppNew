import { StyleSheet } from 'react-native';

const COLORS = {
  background: '#FFFFFF',
  lightBackground: '#F8F9FA',
  border: '#E0E0E0',
  primary: '#2C3E50',      // Azul oscuro
  supervisor: '#457B9D',   // Azul medio
  cliente: '#2ECC71',      // Verde suave
  text: '#333333',
  error: '#D90429',
  placeholder: '#888888',
  shadow: '#000000',
};

export const formStylesBase = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 24,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.75,
    color: COLORS.text,
  },
  label: {
    marginTop: 20,
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: COLORS.text,
  },
  confirmButton: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: COLORS.lightBackground,
    paddingBottom: 80,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'space-between',
  },
  rowButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 16,
    justifyContent: 'space-around',
  },
  optionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#E8F0F2',
    marginBottom: 16,
  },
  optionButtonSelected: {
    backgroundColor: '#A4C3B2',
  },
  optionButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingHorizontal: 12,
  },
  navButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  optionsContainer: {
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 12,
    maxHeight: 160,
  },
  optionText: {
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D1D1',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: 160,
    height: 120,
    resizeMode: 'contain',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  centeredContainer: {
    alignItems: 'center',
    width: '100%',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});

export const formStylesPorRol = {
  ADMIN: StyleSheet.create({
    navButton: {
      backgroundColor: COLORS.primary,
    },
    title: {
      color: COLORS.primary,
    },
    confirmButton: {
      backgroundColor: COLORS.primary,
    },
  }),
  SUPERVISOR: StyleSheet.create({
    navButton: {
      backgroundColor: COLORS.supervisor,
    },
    title: {
      color: COLORS.supervisor,
    },
    confirmButton: {
      backgroundColor: COLORS.supervisor,
    },
  }),
  CLIENTE: StyleSheet.create({
    navButton: {
      backgroundColor: COLORS.cliente,
    },
    title: {
      color: COLORS.cliente,
    },
    confirmButton: {
      backgroundColor: COLORS.cliente,
    },
  }),
};

export const rolFormMap: Record<number, keyof typeof formStylesPorRol> = {
  1: 'ADMIN',
  4: 'SUPERVISOR',
  3: 'CLIENTE',
};
