
// 2. Hook personalizado para manejar incidentes (hooks/useIncidentHandler.ts)
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService, { IncidentNotification } from '../navigation/NotificationService';

export const useIncidentHandler = () => {
  const [activeIncident, setActiveIncident] = useState<IncidentNotification | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      checkForActiveIncident();
    }, [])
  );

  const checkForActiveIncident = async () => {
    try {
      setLoading(true);
      
      const incident = await AsyncStorage.getItem('active_incident');
      const userJson = await AsyncStorage.getItem('user');
      
      if (incident && userJson) {
        const user = JSON.parse(userJson);
        const incidentData: IncidentNotification = JSON.parse(incident);
        
        // Solo bloquear si es CLIENTE
        if (user.rol === 'CLIENTE') {
          setActiveIncident(incidentData);
          setIsBlocked(true);
        }
      } else {
        setActiveIncident(null);
        setIsBlocked(false);
      }
    } catch (error) {
      console.error('❌ Error verificando incidente activo:', error);
      setActiveIncident(null);
      setIsBlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const resolveIncident = async () => {
    if (activeIncident) {
      try {
        await NotificationService.getInstance().resolveIncident(activeIncident.id);
        setActiveIncident(null);
        setIsBlocked(false);
      } catch (error) {
        console.error('❌ Error resolviendo incidente:', error);
      }
    }
  };

  return {
    activeIncident,
    isBlocked,
    loading,
    resolveIncident,
    checkForActiveIncident
  };
};
