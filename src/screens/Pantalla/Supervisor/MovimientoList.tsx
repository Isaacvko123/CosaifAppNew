import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

interface Movimiento {
  id: number;
  title: string;
  description: string;
  date: string;
}

interface Props {
  activeTab: 'pendientes' | 'terminados';
  onTabChange: (tab: 'pendientes' | 'terminados') => void;
}

const BASE_URL = 'http://192.168.101.20:4500';

const MovimientoList: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      setError(null);

      try {
        // 🔥 Recuperar e imprimir TODO el AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        const allItems = await AsyncStorage.multiGet(allKeys);

        console.log('📦 Contenido completo de AsyncStorage:');
        allItems.forEach(([key, value]) => {
          try {
            console.log(`🔑 ${key}:`, value ? JSON.parse(value) : null);
          } catch {
            console.log(`🔑 ${key}:`, value); // si no es JSON
          }
        });

        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado.');

        const url =
          activeTab === 'pendientes'
            ? `${BASE_URL}/movimientos/pendientes`
            : `${BASE_URL}/movimientos/terminados`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Error al obtener movimientos');

        const data = await response.json();
        setMovimientos(data);
      } catch (err: any) {
        console.error('❌ Error en fetchMovimientos:', err);
        setError(err.message || 'Fallo al obtener los movimientos.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [activeTab]);

  const renderMovimiento = useCallback(({ item }: { item: Movimiento }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome5 name="clipboard-list" size={20} color="#007BFF" />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <Text style={styles.cardDate}>{item.date}</Text>
    </View>
  ), []);

  const showEmptyMessage = useMemo(() => {
    if (loading) return null;
    if (error) return error;
    if (movimientos.length === 0) {
      return activeTab === 'pendientes'
        ? 'En espera de movimientos'
        : 'Sin movimientos concluidos en el día';
    }
    return null;
  }, [loading, error, movimientos, activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {['pendientes', 'terminados'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => onTabChange(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Cargando movimientos...</Text>
        </View>
      ) : showEmptyMessage ? (
        <View style={styles.center}>
          <Text style={styles.noDataText}>{showEmptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={movimientos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovimiento}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default MovimientoList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFF',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#007BFF',
  },
  cardDescription: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  cardDate: {
    fontSize: 14,
    color: '#777',
    textAlign: 'right',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007BFF',
  },
  noDataText: {
    fontSize: 18,
    color: '#007BFF',
    fontWeight: 'bold',
  },
});
