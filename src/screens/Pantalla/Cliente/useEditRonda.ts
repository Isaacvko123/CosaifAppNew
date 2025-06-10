// useEditRonda.ts - Custom Hooks para EditRonda
import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://31.97.13.182:3000';

/* ---------- modelos ---------- */
export interface Ronda {
  id: number; 
  rondaNumero: number; 
  orden: number; 
  concluido: boolean;
  movimiento: {
    title: string;
    description: string;
    date: string;
    numLocomotora?: string;
  };
}

interface InfoExtra {
  empresa: { id: number; nombre: string };
  movimiento: {
    viaOrigen: { nombre: string };
    viaDestino: { nombre: string | null };
    lavado: boolean; 
    torno: boolean;
  };
}

interface User {
  token: string;
  empresaId: number;
}

/* ---------- Hook principal para gestión de datos ---------- */
export const useRondaData = (localidadId: number, onClose: () => void) => {
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<Ronda[]>([]);
  const [infoMap, setInfoMap] = useState<Record<number, InfoExtra>>({});
  const [loading, setLoading] = useState(true);
  const [groupedByRonda, setGroupedByRonda] = useState<Record<number, Ronda[]>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [uStr, token] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
        ]);
        if (!uStr || !token) throw new Error('Sesión expirada');
        const u = JSON.parse(uStr);
        setUser({ token, empresaId: u.empresaId });

        /* 1️⃣ rondas pendientes de la localidad */
        const rRes = await fetch(
          `${BASE_URL}/rondas/localidad/${localidadId}/estado/false`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const rondas: Ronda[] = await rRes.json();

        /* 2️⃣ info adicional por ronda */
        const extra: Record<number, InfoExtra> = {};
        await Promise.all(
          rondas.map(async r => {
            try {
              const res = await fetch(
                `${BASE_URL}/movimientos/ronda/${r.id}/info`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const info = await res.json();
              extra[r.id] = info;
            } catch (err) {
              console.warn(`⚠️  Error cargando info de la ronda ${r.id}:`, err);
            }
          })
        );
        setInfoMap(extra);

        /* 3️⃣ filtra solo las de la empresa del usuario */
        const propias = rondas
          .filter(r => extra[r.id]?.empresa.id === u.empresaId)
          .sort((a, b) => (a.rondaNumero - b.rondaNumero) || (a.orden - b.orden));

        setList(propias);
        
        // Agrupar por número de ronda
        const grouped: Record<number, Ronda[]> = {};
        propias.forEach(ronda => {
          if (!grouped[ronda.rondaNumero]) {
            grouped[ronda.rondaNumero] = [];
          }
          grouped[ronda.rondaNumero].push(ronda);
        });
        setGroupedByRonda(grouped);
        
      } catch (e: any) {
        Alert.alert('Error', e.message || 'No se pudieron cargar los datos');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [localidadId, onClose]);

  return {
    user,
    list,
    infoMap,
    loading,
    groupedByRonda,
    setGroupedByRonda,
    setList
  };
};

/* ---------- Hook para gestión de orden ---------- */
export const useOrderManagement = (
  user: User | null,
  groupedByRonda: Record<number, Ronda[]>,
  setGroupedByRonda: React.Dispatch<React.SetStateAction<Record<number, Ronda[]>>>,
  setList: React.Dispatch<React.SetStateAction<Ronda[]>>
) => {
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const swap = async (rondaId: number, i: number, j: number) => {
    if (!user) return;
    
    const rondaItems = [...(groupedByRonda[rondaId] || [])];
    if (i < 0 || j < 0 || i >= rondaItems.length || j >= rondaItems.length) return;
    
    const a = rondaItems[i];
    const b = rondaItems[j];
    if (!a || !b) return;

    // Actualizar estado local primero para UI inmediata
    setGroupedByRonda(prev => {
      const newGrouped = { ...prev };
      
      const newRondaItems = [...rondaItems];
      [newRondaItems[i], newRondaItems[j]] = [newRondaItems[j], newRondaItems[i]];
      [newRondaItems[i].orden, newRondaItems[j].orden] = [newRondaItems[j].orden, newRondaItems[i].orden];
      
      newGrouped[rondaId] = newRondaItems;
      
      return newGrouped;
    });

    // También actualizar la lista plana
    setList(prev => {
      const newList = [...prev];
      const aIndex = newList.findIndex(item => item.id === a.id);
      const bIndex = newList.findIndex(item => item.id === b.id);
      
      if (aIndex !== -1 && bIndex !== -1) {
        [newList[aIndex].orden, newList[bIndex].orden] = [newList[bIndex].orden, newList[aIndex].orden];
      }
      
      return newList.sort((x, y) => 
        (x.rondaNumero - y.rondaNumero) || (x.orden - y.orden)
      );
    });

    try {
      // Guardar en el backend
      await Promise.all([
        fetch(`${BASE_URL}/rondas/${a.id}/orden`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ orden: b.orden })
        }),
        fetch(`${BASE_URL}/rondas/${b.id}/orden`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ orden: a.orden })
        }),
      ]);
      
      setSnackMessage("Orden actualizado correctamente");
      setSnackVisible(true);
    } catch (err) {
      console.warn('❌  Error guardando nuevo orden', err);
      Alert.alert('Error', 'No se pudo guardar el nuevo orden');
    }
  };

  const moveUp = useCallback((rondaId: number, index: number) => 
    swap(rondaId, index, index - 1), [swap]);
  
  const moveDown = useCallback((rondaId: number, index: number) => 
    swap(rondaId, index, index + 1), [swap]);

  return {
    moveUp,
    moveDown,
    snackVisible,
    setSnackVisible,
    snackMessage,
    setSnackMessage
  };
};

/* ---------- Hook para animaciones ---------- */
export const useAnimations = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const animatePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  
  const animatePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return {
    fadeAnim,
    scaleAnim,
    animatePressIn,
    animatePressOut
  };
};