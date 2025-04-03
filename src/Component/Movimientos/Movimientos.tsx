import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import MovimientosTable, { Movement } from './MovimientosTable';
import Tabs from './Tabs';
import NewMovementForm from './Formulario/NewMovementForm';

const Movimientos: React.FC = () => {
  // Estado: pestaña activa ('Actuales' o 'Pasados')
  const [activeTab, setActiveTab] = useState<'Actuales' | 'Pasados'>('Actuales');
  // Estado: datos a mostrar en la tabla
  const [data, setData] = useState<Movement[]>([]);
  // Estado: mostrar formulario de nuevo movimiento
  const [showNewMovement, setShowNewMovement] = useState(false);

  /**
   * Datos simulados para movimientos "Actuales"
   */
  const dataActuales: Movement[] = [
    {
      id: 1,
      locomotora: 123,
      viaOrigen: 5,
      viaDestino: 7,
      tipoAccion: 'EMPUJAR',
      clienteId: 10,
      supervisorId: 12,
      coordinadorId: 15,
      operadorId: 18,
      maquinistaId: null,
      empresaId: 3,
      fechaSolicitud: '2025-04-01 10:00:00',
      fechaInicio: '2025-04-01 10:15:00',
      fechaFin: '2025-04-01 10:45:00',
      estado: 'PENDIENTE',
      instrucciones: 'Cargar carga X',
      comentarioPostergacion: null,
      nuevaFechaPostergacion: null,
    },
  ];

  /**
   * Datos simulados para movimientos "Pasados"
   */
  const dataPasados: Movement[] = [
    {
      id: 2,
      locomotora: 124,
      viaOrigen: 3,
      viaDestino: 8,
      tipoAccion: 'JALAR',
      clienteId: 11,
      supervisorId: null,
      coordinadorId: 16,
      operadorId: 19,
      maquinistaId: 20,
      empresaId: 3,
      fechaSolicitud: '2025-04-01 11:00:00',
      fechaInicio: '2025-04-01 11:20:00',
      fechaFin: '2025-04-01 11:55:00',
      estado: 'CONCLUIDO',
      instrucciones: 'Descargar carga Y',
      comentarioPostergacion: 'Falla leve en el sistema',
      nuevaFechaPostergacion: '2025-04-02 09:00:00',
    },
  ];

  // Actualiza los datos a mostrar según la pestaña activa
  useEffect(() => {
    setShowNewMovement(false); // Oculta formulario al cambiar de pestaña
    setData(activeTab === 'Actuales' ? dataActuales : dataPasados);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {activeTab === 'Actuales' ? 'Movimientos Actuales' : 'Movimientos Pasados'}
      </Text>

      {/* Navegación por pestañas */}
      <Tabs
        tabs={['Actuales', 'Pasados']}
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab as 'Actuales' | 'Pasados')}
      />

      {/* Vista condicional: formulario o tabla */}
      {showNewMovement ? (
        <NewMovementForm onFinish={() => setShowNewMovement(false)} />
      ) : (
        <MovimientosTable data={data} />
      )}

      {/* Botón para registrar nuevo movimiento, centrado y separado */}
      {activeTab === 'Actuales' && !showNewMovement && (
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setShowNewMovement(true)}
        >
          <Text style={styles.newButtonText}>Nuevo Movimiento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Movimientos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F4F6F8',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D6A4F',
    textAlign: 'center',
    marginBottom: 20,
  },
  newButton: {
    alignSelf: 'center',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  newButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
