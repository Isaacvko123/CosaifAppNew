/**
 * App.tsx
 *
 * Punto de entrada principal de la aplicación móvil.
 *
 * Este componente monta el árbol de navegación principal usando React Navigation.
 * 
 * Estructura:
 * - Este archivo importa el componente `Navigation` desde `src/navigation/Navigation.tsx`.
 * - `Navigation` contiene la configuración de todas las pantallas, stacks y navegación.
 * 
 * Beneficios de esta estructura:
 * - Separa el control de navegación de la lógica de arranque de la app.
 * - Facilita la integración de providers globales (ej: AuthProvider, ThemeProvider, Redux, etc.).
 * - Hace que `App.tsx` sea limpio, declarativo y fácil de extender.
 *
 * Este archivo es utilizado por React Native como punto de montaje inicial en plataformas iOS y Android.
 */

import React from 'react';
import Navigation from './src/navigation/Navigation';

/**
 * Componente principal de la aplicación.
 * Retorna la estructura de navegación.
 */
export default function App() {
  return <Navigation />;
}
