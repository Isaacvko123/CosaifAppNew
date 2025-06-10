// hooks/useMovimientos.ts
import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movement } from './MovimientosTable';

export default function useMovimientos() {
  const [tab, setTab] = useState<'Actuales'|'Pasados'>('Actuales');
  const [data, setData] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info'|'success'|'error' }|null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // aquí vas a tu API, guardas en cache y filtrado por `tab`
    // …
    setLoading(false);
    setRefreshing(false);
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // auto-refresh on reconnect
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && !refreshing) fetchData();
    });
    return unsub;
  }, [fetchData, refreshing]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const badges = { Actuales: data.filter(m => !m.finalizado).length };

  const emptyText = tab === 'Actuales'
    ? 'No hay movimientos activos'
    : 'No hay movimientos finalizados';

  return {
    tab, setTab,
    data, loading, refreshing, onRefresh,
    badges, emptyText,
    showForm, setShowForm,
    status, onDismissStatus: () => setStatus(null),
  };
}
