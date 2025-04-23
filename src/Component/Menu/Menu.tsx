import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { estilosBase, estilosPorRol } from './Estilos';

type RootStackParamList = {
  Movimientos: undefined;
  Usuario: undefined;
  Localidad: undefined;
};

interface MenuProps {
  visible: boolean;
  onClose: (event?: GestureResponderEvent) => void;
}

const Menu: React.FC<MenuProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = Dimensions.get('window');
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const [rol, setRol] = useState<string>('CLIENTE');
  const [empresa, setEmpresa] = useState<string>('');

  const loadUserData = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRol(user.rol || 'CLIENTE');
        setEmpresa(user?.empresa?.nombre || '');
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err);
    }
  }, []);

  const getEffectiveRol = (): string =>
    rol === 'SUPERVISOR' && empresa.toLowerCase() !== 'vianko' ? 'CLIENTE' : rol;

  const effectiveRol = getEffectiveRol();
  const rolStyles = estilosPorRol[effectiveRol as keyof typeof estilosPorRol] || estilosPorRol.CLIENTE;

  // Animación de entrada/salida
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -width,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (!visible) return null;

  const navigateTo = useCallback(
    (screen: keyof RootStackParamList) => {
      navigation.navigate(screen);
      onClose();
    },
    [navigation, onClose]
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={{ flex: 1 }} />
      </Pressable>

      <Animated.View
        style={[
          estilosBase.menuContainer,
          rolStyles.menuContainer,
          { left: slideAnim },
        ]}
      >
        <View style={estilosBase.headerContainer}>
          <FontAwesome5 name="home" size={28} color={rolStyles.headerText?.color} />
          <Text style={[estilosBase.headerText, rolStyles.headerText]}>
            COSAIF LOGISTICS
          </Text>
        </View>

        <TouchableOpacity style={estilosBase.menuItem} onPress={() => navigateTo('Movimientos')}>
          <FontAwesome5 name="exchange-alt" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>Movimientos</Text>
        </TouchableOpacity>

        {(effectiveRol === 'SUPERVISOR' || effectiveRol === 'ADMINISTRADOR') && (
          <>
            <TouchableOpacity style={estilosBase.menuItem} onPress={() => navigateTo('Usuario')}>
              <FontAwesome5 name="users" size={20} color={rolStyles.menuText?.color} />
              <Text style={[estilosBase.menuText, rolStyles.menuText]}>Usuarios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={estilosBase.menuItem} onPress={() => navigateTo('Localidad')}>
              <FontAwesome5 name="map-marker-alt" size={20} color={rolStyles.menuText?.color} />
              <Text style={[estilosBase.menuText, rolStyles.menuText]}>Localidad y Vías</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Otros accesos comunes */}
        <TouchableOpacity style={estilosBase.menuItem}>
          <FontAwesome5 name="terminal" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>Terminal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilosBase.menuItem}>
          <FontAwesome5 name="history" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>Historial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilosBase.menuItem} onPress={onClose}>
          <FontAwesome5 name="sign-out-alt" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>Cerrar menú</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilosBase.menuItem}>
          <FontAwesome5 name="user" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>
            {effectiveRol === 'SUPERVISOR' ? 'Supervisor' : 'Cliente'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});

export default Menu;
