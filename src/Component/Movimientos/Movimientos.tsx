import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import MovimientosTable, { Movement } from './MovimientosTable';
import Tabs from './Tabs';
import NewMovementForm from './Formulario/NewMovementForm';

const Movimientos: React.FC = () => {
  // Manejo de pestaña activa
  const [activeTab, setActiveTab] = useState<'Actuales' | 'Pasados'>('Actuales');
  // Manejo de data
  const [data, setData] = useState<Movement[]>([]);
  // Controlar la vista de "Nuevo Movimiento"
  const [showNewMovement, setShowNewMovement] = useState(false);

  // Datos simulados para "Actuales"
  const dataActuales: Movement[] = [
    {
      id: 'ACT001',
      locomotiveNumber: '1001',
      fromTrack: 'Vía 1',
      toTrack: 'Vía 3',
      requestDateTime: '10-05-2025 08:00:00',
      movementTime: '0:10:00',
      values: 'N/A',
      incidentRecord: 'Sin incidentes',
      Imprevisto: false,
      status: 'En proceso',
    },
    // ...agrega más
  ];

  // Datos simulados para "Pasados"
  const dataPasados: Movement[] = [
    {
      id: 'PAS0089',
      locomotiveNumber: '2020',
      fromTrack: 'Vía 2',
      toTrack: 'Vía 4',
      requestDateTime: '01-05-2025 10:20:00',
      movementTime: '0:15:30',
      values: 'N/A',
      incidentRecord: 'Falla leve',
      Imprevisto: true,
      status: 'Realizado',
    },
    // ...agrega más
  ];

  // Actualiza la data en función de la pestaña activa
  useEffect(() => {
    setShowNewMovement(false); // Al cambiar de pestaña, ocultamos el formulario
    if (activeTab === 'Actuales') {
      setData(dataActuales);
    } else {
      setData(dataPasados);
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {activeTab === 'Actuales' ? 'Movimientos Actuales' : 'Movimientos Pasados'}
      </Text>
      
      {/* Pestañas */}
      <Tabs
        tabs={['Actuales', 'Pasados']}
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab as 'Actuales' | 'Pasados')}
      />

      {/* Muestra el botón "Nuevo" solo en la pestaña "Actuales" si no se está creando */}
      {activeTab === 'Actuales' && !showNewMovement && (
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setShowNewMovement(true)}
        >
          <Text style={styles.newButtonText}>Nuevo</Text>
        </TouchableOpacity>
      )}

      {/* Si se presiona "Nuevo", se muestra el formulario. De lo contrario, la tabla */}
      {showNewMovement ? (
        // Se pasa el callback onFinish para que NewMovementForm notifique que finalizó
        <NewMovementForm onFinish={() => setShowNewMovement(false)} />
      ) : (
        <MovimientosTable data={data} />
      )}
    </View>
  );
};

export default Movimientos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  newButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
