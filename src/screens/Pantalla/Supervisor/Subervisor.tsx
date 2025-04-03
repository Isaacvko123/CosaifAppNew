import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Menu from '../../../Component/Menu/Menu';

interface MenuProps {
  visible: boolean;
  onClose: (event?: GestureResponderEvent) => void;
  onNavigate: (screenName: string) => void;
}
const Supervisor: React.FC = () => {
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
      <Menu 
        visible={menuVisible} 
        onClose={toggleMenu} 
      />

      {/* Renderiza el texto solo si el menú no está visible */}
      {!menuVisible && <Text style={styles.text}>Supervisor</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#789cb3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#789cb3',
    padding: 10,
    borderRadius: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color:"rgb(0, 0, 0)",
  },
});

export default Supervisor;
