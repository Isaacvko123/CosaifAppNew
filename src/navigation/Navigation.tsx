/**
 * Navigation.tsx
 * 
 * Configuración centralizada del sistema de navegación de la aplicación.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';

// 🔧 Referencia global para poder navegar desde cualquier parte (como App.tsx)
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// Pantallas
import SplashScreen from '../screens/SplashScreen';
import Login from '../screens/Login';
import Movimientos from '../Component/Movimientos/Movimientos';
import Cliente from '../screens/Pantalla/Cliente/Cliente';
import Usuario from '../Component/Usuario/Usuario';
import Maquinista from '../screens/Pantalla/Maquinista/Maquinista';
import Supervisor from '../screens/Pantalla/Supervisor/Subervisor';
import LocalidadVias from '../Component/Localidad_Vias/LocalidadVias'; 
import Operador from '../screens/Pantalla/Operador/operador';
import MovimientoP from '../screens/Pantalla/Maquinista/MovimientoP';
import Incidente from '../screens/Pantalla/Maquinista/Incidente';

// 🔧 TIPOS CORREGIDOS PARA INCIDENTES
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Operador: undefined;
  Cliente: undefined;
  Movimientos: undefined;
  Localidad: undefined;
  Usuario: undefined;
  Supervisor: undefined;
  Maquinista: undefined;
  MovimientoP: { movimientoId: string; locomotora: string };
  // 🚨 TIPO CORREGIDO PARA COINCIDIR CON EL NOTIFICATION SERVICE
  Incidente: { 
    incidenteId?: string; 
    fromNotification?: boolean; 
    notificationData?: any 
  } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MovimientoP"
          component={MovimientoP}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: 'Inicio', headerShown: false }}
        />
        <Stack.Screen
          name="Supervisor"
          component={Supervisor}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Localidad"
          component={LocalidadVias}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="Maquinista"
          component={Maquinista}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Operador"
          component={Operador}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Cliente"
          component={Cliente}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Incidente" 
          component={Incidente}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Movimientos"
          component={Movimientos}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="Usuario"
          component={Usuario}
          options={{ headerShown: true }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
