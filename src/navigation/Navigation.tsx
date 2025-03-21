import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import Login from '../screens/Login';
import Movimientos from '../Component/Movimientos/Movimientos';
import Cliente from '../screens/Pantalla/Cliente/Cliente';
export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Movimientos: undefined; 
};

const Stack = createStackNavigator();

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
          name="Login"
          component={Login}
          options={{ title: 'Inicio', headerShown: false }}
        />

<Stack.Screen
name = "Cliente"
component = {Cliente}
options={{ headerShown: false}}
/>
<Stack.Screen
  name="Movimientos"
  component={Movimientos}
  options={{ headerShown: true }}
/>

      </Stack.Navigator>
      

      
    </NavigationContainer>
  );
};
