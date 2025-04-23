import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const basePadding = width * 0.05;
const baseMargin = width * 0.03;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: basePadding,
    paddingHorizontal: basePadding / 1.5,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d1f1e0',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: baseMargin,
    fontSize: 16,
    color: '#2D6A4F',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: basePadding,
    marginVertical: baseMargin,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: baseMargin * 1.5,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F5EB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D6CB',
    paddingHorizontal: 12,
    marginBottom: baseMargin,
    height: 55,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 10,
  },
  picker: {
    flex: 1,
    color: '#333',
  },
  icon: {
    marginRight: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: baseMargin,
    backgroundColor: '#74C69D',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#74C69D', // mismo color que el botón de enviar
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#e63946',
    fontSize: 15,
    marginBottom: baseMargin,
    textAlign: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    marginBottom: baseMargin * 2,
  },
});
