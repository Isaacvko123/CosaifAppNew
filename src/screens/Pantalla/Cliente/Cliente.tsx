import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Menu from '../../../Component/Menu/Menu';
const Cliente: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  const toggleMenu = (event?: GestureResponderEvent) => {
    setMenuVisible(!menuVisible);
  };

  return (
    <View style={styles.container}>
      {/* Botón de hamburguesa para abrir/cerrar el menú */}
      <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
        <FontAwesome5 name="bars" size={24} color="#fff" />
      </TouchableOpacity>

      {/* El menú animado */}
      <Menu visible={menuVisible} onClose={toggleMenu} onNavigate={(screenName: string) => { /* handle navigation */ }} />

      <Text style={styles.text}>Contenido de la pantalla</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9F5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#74C69D',
    padding: 10,
    borderRadius: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
});

export default Cliente;
