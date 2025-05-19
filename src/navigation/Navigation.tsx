/**
 * Navigation.tsx
 * 
 * Configuración centralizada del sistema de navegación de la aplicación.
 *
 * Este archivo define la estructura de navegación principal utilizando
 * `createStackNavigator` de React Navigation.
 * 
 * Pantallas configuradas:
 * - SplashScreen (pantalla inicial con animación)
 * - Login (pantalla de autenticación)
 * - Supervisor (vista principal para usuarios con rol admin)
 * - Cliente (pantalla dedicada a clientes)
 * - Movimientos (vista de gestión de movimientos logísticos)
 * - Usuario (pantalla para gestión de usuarios)
 * 
 * Características:
 * - Navegación basada en stack.
 * - Cada pantalla se registra en el stack navigator con su componente y opciones.
 * - La navegación se inicia desde "Splash".
 * - Algunas pantallas ocultan la cabecera para personalizar la UI.
 *
 * Tipado:
 * - `RootStackParamList` define la firma de rutas esperadas para garantizar seguridad de navegación.
 * 
 * Requisitos:
 * - `@react-navigation/native`
 * - `@react-navigation/stack`
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

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
import MovimientoP from '../screens/Pantalla/Maquinista/MovimientoP'
// Nueva pantalla para "Localidad y Vi
// Definición del stack y tipado de rutas
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
};

// Inicializa el stack navigator con tipado fuerte
const Stack = createStackNavigator<RootStackParamList>();

/*
 * Componente Navigation
 * 
 * Retorna el contenedor de navegación con todas las rutas registradas.
 */
export default function Navigation() {
  return (
    <NavigationContainer>
      
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
        name= "MovimientoP"
        component={MovimientoP}
        options={{ headerShown: false }}
        ></Stack.Screen>
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

{/*Maquinista */}
        <Stack.Screen
          name="Maquinista"
          component={Maquinista}
          options={{ headerShown:  false }}
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
