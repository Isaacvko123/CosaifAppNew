import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface MenuProps {
  visible: boolean;
  onClose: (event?: GestureResponderEvent) => void;
  onNavigate: (screenName: string) => void; // nueva prop para notificar al padre
}

const { width } = Dimensions.get('window');

const Menu: React.FC<MenuProps> = ({ visible, onClose, onNavigate }) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Función para navegar a la pantalla "Movimientos"
  const goToMovimientos = () => {
    onNavigate('movimientos'); // Notifica al componente padre (si es necesario)
    navigation.navigate('Movimientos'); // Navega usando react-navigation
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -width,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Overlay para cerrar el menú al hacer clic fuera */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      </Pressable>

      {/* Menú animado */}
      <Animated.View style={[styles.menuContainer, { left: slideAnim }]}>
        <View style={styles.headerContainer}>
          <FontAwesome5 name="boxes" size={28} color="#fff" />
          <Text style={styles.headerText}> COSAIF LOGISTICS</Text>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={goToMovimientos}>
          <FontAwesome5 name="exchange-alt" size={20} color="#fff" />
          <Text style={styles.menuText}>Movimientos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { /* Acción para Terminal */ }}>
          <FontAwesome5 name="terminal" size={20} color="#fff" />
          <Text style={styles.menuText}>Terminal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { /* Acción para Historial */ }}>
          <FontAwesome5 name="history" size={20} color="#fff" />
          <Text style={styles.menuText}>Historial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onClose}>
          <FontAwesome5 name="sign-out-alt" size={20} color="#fff" />
          <Text style={styles.menuText}>Cerrar menú</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default Menu;

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 250, // Ancho fijo de la barra lateral
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 20,
    paddingTop: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 15,
  },
});
