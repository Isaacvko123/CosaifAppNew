// notifications.ts
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export async function registerFcmToken(jwtToken: string) {
  // 1) Asegúrate de registrar el dispositivo para recibir mensajes
  await messaging().registerDeviceForRemoteMessages();

  // 2) Solicita permisos (iOS) / chequea en Android API>=33
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) {
    console.warn('Permisos de notificación no concedidos');
    return null;
  }

  // 3) Obtén el token FCM
  const fcmToken = await messaging().getToken();
  console.log('FCM Token:', fcmToken);
  if (!fcmToken) return null;

  // 4) Envía el token a tu API junto con el JWT
  await fetch('https://tu-api.com/usuarios/me/fcm-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ token: fcmToken }),
  });

  // 5) Escucha actualizaciones de token (si Google lo renueva)
  messaging().onTokenRefresh(newToken => {
    fetch('https://tu-api.com/usuarios/me/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ token: newToken }),
    });
  });

  return fcmToken;
}

// Manejo de mensajes en background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Notificación en background:', remoteMessage);
});

// Opcional: handler en foreground
export function onForegroundMessage(handler: (msg: any) => void) {
  return messaging().onMessage(async remoteMessage => {
    handler(remoteMessage);
  });
}
