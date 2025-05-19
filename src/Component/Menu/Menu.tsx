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
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { estilosBase, estilosPorRol } from './Estilos'; // Importamos los estilos

type RootStackParamList = {
  Movimientos: undefined;
  Usuario: undefined;
  Localidad: undefined;
  Terminal: undefined;
  Historial: undefined;
  Config: undefined;
  Login: undefined;
};

interface MenuProps {
  visible: boolean;
  onClose: (event?: GestureResponderEvent) => void;
}

// Mapeo de iconos por rol
const ROLE_ICONS = {
  ADMINISTRADOR: 'user-shield',
  SUPERVISOR: 'user-tie',
  CLIENTE: 'building',
  MAQUINISTA: 'train',
  OPERADOR: 'hard-hat',
};

const Menu: React.FC<MenuProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = Dimensions.get('window');
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [rol, setRol] = useState<string>('CLIENTE');
  const [empresa, setEmpresa] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRol(user.rol || 'CLIENTE');
        setEmpresa(user?.empresa?.nombre || '');
        setNombre(user?.nombre || '');
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err);
    }
  }, []);

  const getEffectiveRol = (): string => {
    if (rol === 'SUPERVISOR' && empresa.toLowerCase() !== 'vianko') return 'CLIENTE';
    return rol.toUpperCase();
  };

  const effectiveRol = getEffectiveRol();
  const rolStyles = estilosPorRol[effectiveRol as keyof typeof estilosPorRol] || estilosPorRol.CLIENTE;
  
  // Iniciales para el avatar
  const getInitials = () => {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, width]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const navigateTo = useCallback(
    (screen: keyof RootStackParamList) => {
      setActiveItem(screen);
      navigation.navigate(screen);
      onClose();
    },
    [navigation, onClose]
  );

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: 'Login' as any }] });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const esBasico = effectiveRol === 'MAQUINISTA' || effectiveRol === 'OPERADOR';
  
  // Definición de elementos del menú
  const MENU_ITEMS = [
    {
      id: 'Movimientos',
      title: 'Movimientos',
      icon: 'exchange-alt',
      show: !esBasico,
      onPress: () => navigateTo('Movimientos'),
    },
    {
      id: 'Usuario',
      title: 'Usuarios',
      icon: 'users',
      show: effectiveRol === 'SUPERVISOR' || effectiveRol === 'ADMINISTRADOR',
      onPress: () => navigateTo('Usuario'),
    },
    {
      id: 'Localidad',
      title: 'Localidad y Vías',
      icon: 'map-marker-alt',
      show: effectiveRol === 'SUPERVISOR' || effectiveRol === 'ADMINISTRADOR',
      onPress: () => navigateTo('Localidad'),
    },
    {
      id: 'Terminal',
      title: 'Terminal',
      icon: 'terminal',
      show: !esBasico,
      onPress: () => navigateTo('Terminal'),
    },
    {
      id: 'Historial',
      title: 'Historial',
      icon: 'history',
      show: !esBasico,
      onPress: () => navigateTo('Historial'),
    },
    {
      id: 'Config',
      title: 'Configuración',
      icon: 'cog',
      show: true,
      onPress: () => navigateTo('Config'),
    },
  ];

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    if (!item.show) return null;

    return (
      <TouchableOpacity 
        key={item.id}
        style={[
          estilosBase.menuItem,
          activeItem === item.id && rolStyles.activeMenuItem
        ]} 
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <FontAwesome5 
          name={item.icon} 
          size={20} 
          color={rolStyles.menuText?.color || '#FFFFFF'} 
          style={estilosBase.menuIcon} 
        />
        <Text style={[estilosBase.menuText, rolStyles.menuText]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={rolStyles.menuContainer?.backgroundColor || '#000000'}
      />
      
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: fadeAnim }
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          estilosBase.menuContainer,
          rolStyles.menuContainer,
          { 
            width: Math.min(width * 0.85, 320), 
            transform: [{ translateX: slideAnim }] 
          },
        ]}
      >
        {/* Información del usuario */}
        <View style={estilosBase.userInfoContainer}>
          <View style={[estilosBase.avatarContainer, rolStyles.avatarContainer]}>
            <Text style={[estilosBase.avatarText, { color: '#FFFFFF' }]}>{getInitials()}</Text>
          </View>
          <View style={estilosBase.userTextContainer}>
            <Text style={[estilosBase.userName, rolStyles.userName]}>
              {nombre || 'Usuario'}
            </Text>
            <Text style={[estilosBase.userCompany, rolStyles.userCompany]}>
              {empresa || 'Empresa'}
            </Text>
          </View>
        </View>

        {/* ScrollView para los elementos del menú */}
        <ScrollView 
          style={estilosBase.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Encabezado del menú */}
          <View style={estilosBase.headerContainer}>
            <FontAwesome5 
              name="home" 
              size={24} 
              color={rolStyles.headerText?.color || '#FFFFFF'} 
            />
            <Text style={[estilosBase.headerText, rolStyles.headerText]}>
              COSAIF LOGISTICS
            </Text>
          </View>

          {/* Indicador de rol */}
          <View style={estilosBase.roleContainer}>
            <FontAwesome5 
              name={ROLE_ICONS[effectiveRol as keyof typeof ROLE_ICONS] || 'user'} 
              size={16} 
              color={rolStyles.menuText?.color || '#FFFFFF'} 
              style={estilosBase.roleIcon} 
            />
            <Text style={[estilosBase.roleText, rolStyles.roleText]}>
              {effectiveRol.charAt(0) + effectiveRol.slice(1).toLowerCase()}
            </Text>
          </View>

          {/* Elementos del menú */}
          {MENU_ITEMS.map(renderMenuItem)}

          {/* Versión de la aplicación */}
          <View style={estilosBase.footerContainer}>
            <Text style={[estilosBase.versionText, rolStyles.versionText]}>
              Versión 1.2.0
            </Text>
          </View>
        </ScrollView>

        {/* Botón de cierre de sesión (fuera del ScrollView) */}
        <TouchableOpacity 
          style={estilosBase.logoutButton}
          onPress={cerrarSesion}
          activeOpacity={0.8}
        >
          <FontAwesome5 
            name="sign-out-alt" 
            size={18} 
            color={rolStyles.logoutText?.color || '#FFFFFF'} 
          />
          <Text style={[estilosBase.logoutText, rolStyles.logoutText]}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Estilos adicionales específicos para este componente
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default Menu;