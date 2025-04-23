import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

import MovimientosTable, { Movement } from './MovimientosTable';
import Tabs from './Tabs';
import NewMovementForm from './Formulario/NewMovementForm';

const Movimientos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Actuales' | 'Pasados'>('Actuales');
  const [data, setData] = useState<Movement[]>([]);
  const [showNewMovement, setShowNewMovement] = useState(false);

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

  useEffect(() => {
    setShowNewMovement(false);
    setData(activeTab === 'Actuales' ? dataActuales : dataPasados);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {showNewMovement ? (
        <NewMovementForm onFinish={() => setShowNewMovement(false)} />
      ) : (
        <>
          <Text style={styles.title}>
            {activeTab === 'Actuales' ? 'Movimientos Actuales' : 'Historial de Movimientos'}
          </Text>

          <Tabs
            tabs={['Actuales', 'Pasados']}
            activeTab={activeTab}
            onTabPress={(tab) => setActiveTab(tab as 'Actuales' | 'Pasados')}
          />

          <View style={styles.contentWrapper}>
            <MovimientosTable data={data} />
          </View>

          {activeTab === 'Actuales' && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => setShowNewMovement(true)}
            >
              <Text style={styles.newButtonText}>+ Nuevo Movimiento</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default Movimientos;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D6A4F',
    textAlign: 'center',
    marginBottom: 12,
  },
  contentWrapper: {
    flex: 1,
    marginTop: 12,
  },
  newButton: {
    alignSelf: 'center',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  newButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
