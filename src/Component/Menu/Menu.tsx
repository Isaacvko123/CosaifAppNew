/**
 * Menu.tsx
 * 
 * Componente de menú lateral deslizante.
 * Muestra opciones de navegación de forma contextual según el rol del usuario autenticado.
 * 
 * Características:
 * - Animación de aparición y desaparición con `Animated`.
 * - Fondo opaco que se cierra al tocar fuera del menú (`Pressable`).
 * - Ítems de menú personalizados por rol.
 * - Estilos dinámicos según el rol del usuario.
 * 
 * Props:
 * - visible: boolean → determina si el menú está abierto.
 * - onClose: callback para cerrar el menú.
 * - onNavigate: callback para navegación a otra pantalla.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Movimientos: undefined;
  Usuario: undefined;
};

// Estilos base + estilos por rol definidos en archivo externo
import { estilosBase, estilosPorRol, rolMap } from './Estilos';

// Props definidas para este menú
interface MenuProps {
  visible: boolean;                               
  onClose: (event?: GestureResponderEvent) => void; 
  onNavigate?: (screenName: string) => void;                         
}
const Menu: React.FC<MenuProps> = ({ visible, onClose, onNavigate }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = Dimensions.get('window');
  const slideAnim = useRef(new Animated.Value(-width)).current;
  
  // Estado actualizado para almacenar el rol como string
  const [rol, setRol] = useState<string | null>(null);

  /**
   * Devuelve los estilos según el rol del usuario.
   * Se utiliza el valor del rol para buscar en el mapeo; si no existe, se usa "CLIENTE" por defecto.
   */
  const getRolStyles = () => {
    const rolKey = (rol ?? 'CLIENTE') as keyof typeof estilosPorRol;
    return estilosPorRol[rolKey] || estilosPorRol.CLIENTE;
  };

  const rolStyles = getRolStyles();

  /**
   * Carga el rol del usuario desde AsyncStorage al montar.
   */
  useEffect(() => {
    const fetchUserRol = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRol(user.rol); // Se utiliza el campo "rol"
      }
    };
    fetchUserRol();
  }, []);

  /**
   * Ejecuta la animación de slide dependiendo del estado `visible`.
   */
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -width,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      {/* Fondo oscuro que cierra el menú al tocar fuera */}
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      </Pressable>

      {/* Menú deslizante */}
      <Animated.View
        style={[
          estilosBase.menuContainer,
          rolStyles.menuContainer,
          { left: slideAnim },
        ]}
      >
        {/* Header del menú */}
        <View style={estilosBase.headerContainer}>
          <FontAwesome5 name="home" size={28} color={rolStyles.headerText?.color} />
          <Text style={[estilosBase.headerText, rolStyles.headerText]}>
            COSAIF LOGISTICS
          </Text>
        </View>

        {/* Opción: Movimientos */}
        <TouchableOpacity
          style={estilosBase.menuItem}
          onPress={() => navigation.navigate('Movimientos')}
        >
          <FontAwesome5 name="exchange-alt" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>
            Movimientos
          </Text>
        </TouchableOpacity>

        {/* Opción visible solo para administradores o supervisores */}
        {(rol === "ADMINISTRADOR" || rol === "SUPERVISOR") && (
          <TouchableOpacity
            style={estilosBase.menuItem}
            onPress={() => navigation.navigate('Usuario')}
          >
            <FontAwesome5 name="users" size={20} color={rolStyles.menuText?.color} />
            <Text style={[estilosBase.menuText, rolStyles.menuText]}>
              Usuarios
            </Text>
          </TouchableOpacity>
        )}

        {/* Placeholder para Terminal */}
        <TouchableOpacity style={estilosBase.menuItem}>
          <FontAwesome5 name="terminal" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>
            Terminal
          </Text>
        </TouchableOpacity>

        {/* Placeholder para Historial */}
        <TouchableOpacity style={estilosBase.menuItem}>
          <FontAwesome5 name="history" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>
            Historial
          </Text>
        </TouchableOpacity>

        {/* Cierre del menú */}
        <TouchableOpacity style={estilosBase.menuItem} onPress={onClose}>
          <FontAwesome5 name="sign-out-alt" size={20} color={rolStyles.menuText?.color} />
          <Text style={[estilosBase.menuText, rolStyles.menuText]}>
            Cerrar menú
          </Text>
        </TouchableOpacity>

        {/* Ejemplo de ítems específicos por rol */}
        {rol === "SUPERVISOR" && (
          <TouchableOpacity style={estilosBase.menuItem}>
            <FontAwesome5 name="user" size={20} color="#ffff" />
            <Text style={[estilosBase.menuText, rolStyles.menuText]}>
              Supervisor
            </Text>
          </TouchableOpacity>
        )}
        {rol === "CLIENTE" && (
          <TouchableOpacity style={estilosBase.menuItem}>
            <FontAwesome5 name="user" size={20} color="#ffff" />
            <Text style={[estilosBase.menuText, rolStyles.menuText]}>
              Cliente
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

export default Menu;
