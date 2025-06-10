import React, { useEffect } from 'react';
import Navigation, { navigationRef } from './src/navigation/Navigation';
import { Alert, AppState, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export default function App() {
  useEffect(() => {
    // Foreground
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      const { title, body } = remoteMessage.notification || {};
      Alert.alert(title || 'Notificación', body || 'Nuevo mensaje recibido.');
    });

    // Background - al tocar notificación
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationNavigation(remoteMessage);
    });

    // App cerrada completamente
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNotificationNavigation(remoteMessage);
        }
      });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOpened();
    };
  }, []);

  const handleNotificationNavigation = (remoteMessage: any) => {
    const data = remoteMessage?.data;

    if (data?.pantalla === 'Incidente' && navigationRef.current) {
      navigationRef.current.navigate('Incidente');
    }
  };

  return <Navigation />;
}
