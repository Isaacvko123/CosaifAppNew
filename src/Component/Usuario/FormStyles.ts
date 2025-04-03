import { StyleSheet } from 'react-native';

export const formStylesPorRol = {
  ADMINISTRADOR: StyleSheet.create({
    title: { color: '#2C3E50' },           // Azul oscuro, profesional
    confirmButton: { backgroundColor: '#2C3E50' },
    navButton: { backgroundColor: '#2C3E50' },
  }),
  SUPERVISOR: StyleSheet.create({
    title: { color: '#34495E' },           // Azul grisáceo, sobrio
    confirmButton: { backgroundColor: '#34495E' },
    navButton: { backgroundColor: '#34495E' },
  }),
  CLIENTE: StyleSheet.create({
    title: { color: '#7F8C8D' },           // Gris azulado, neutro
    confirmButton: { backgroundColor: '#7F8C8D' },
    navButton: { backgroundColor: '#7F8C8D' },
  }),
};

// Mapeo de rol (string) a la clave de estilos
export const rolFormMap: Record<string, keyof typeof formStylesPorRol> = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  SUPERVISOR: 'SUPERVISOR',
  CLIENTE: 'CLIENTE',
};
