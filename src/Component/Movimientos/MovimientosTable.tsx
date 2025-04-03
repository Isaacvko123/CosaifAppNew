import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ListRenderItem,
} from 'react-native';

// Interfaz del movimiento (adaptado al modelo de Prisma)
export interface Movement {
  id: number;
  locomotora: number;
  viaOrigen: number;
  viaDestino: number;
  tipoAccion: string;
  clienteId: number;
  supervisorId?: number | null;
  coordinadorId?: number | null;
  operadorId?: number | null;
  maquinistaId?: number | null;
  empresaId: number;
  fechaSolicitud: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  estado: string;
  instrucciones?: string | null;
  comentarioPostergacion?: string | null;
  nuevaFechaPostergacion?: string | null;
}

interface Props {
  data: Movement[];
}

const MovimientosTable: React.FC<Props> = ({ data }) => {
  const renderItem: ListRenderItem<Movement> = ({ item, index }) => {
    const rowStyle = index % 2 === 0 ? styles.rowEven : styles.rowOdd;

    return (
      <View style={[styles.row, rowStyle]}>
        <Text style={[styles.cell, styles.colId]}>{item.id}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.locomotora}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.viaOrigen}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.viaDestino}</Text>
        <Text style={[styles.cell, styles.colMedium]}>{item.tipoAccion}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.clienteId}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.supervisorId ?? '-'}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.coordinadorId ?? '-'}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.operadorId ?? '-'}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.maquinistaId ?? '-'}</Text>
        <Text style={[styles.cell, styles.colShort]}>{item.empresaId}</Text>
        <Text style={[styles.cell, styles.colLong]}>{item.fechaSolicitud}</Text>
        <Text style={[styles.cell, styles.colLong]}>{item.fechaInicio || '-'}</Text>
        <Text style={[styles.cell, styles.colLong]}>{item.fechaFin || '-'}</Text>
        <Text style={[styles.cell, styles.colMedium]}>{item.estado}</Text>
        <Text style={[styles.cell, styles.colXL]}>{item.instrucciones || '-'}</Text>
        <Text style={[styles.cell, styles.colXL]}>{item.comentarioPostergacion || '-'}</Text>
        <Text style={[styles.cell, styles.colLong]}>{item.nuevaFechaPostergacion || '-'}</Text>
      </View>
    );
  };

  return (
    <ScrollView horizontal>
      <View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.colId]}>ID</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Locomotora</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Vía Origen</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Vía Destino</Text>
          <Text style={[styles.headerCell, styles.colMedium]}>Acción</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Cliente</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Supervisor</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Coordinador</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Operador</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Maquinista</Text>
          <Text style={[styles.headerCell, styles.colShort]}>Empresa</Text>
          <Text style={[styles.headerCell, styles.colLong]}>Fecha Solicitud</Text>
          <Text style={[styles.headerCell, styles.colLong]}>Fecha Inicio</Text>
          <Text style={[styles.headerCell, styles.colLong]}>Fecha Fin</Text>
          <Text style={[styles.headerCell, styles.colMedium]}>Estado</Text>
          <Text style={[styles.headerCell, styles.colXL]}>Instrucciones</Text>
          <Text style={[styles.headerCell, styles.colXL]}>Comentario</Text>
          <Text style={[styles.headerCell, styles.colLong]}>Nueva Fecha</Text>
        </View>

        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </ScrollView>
  );
};

export default MovimientosTable;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2D6A4F',
    paddingVertical: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 4,
  },
  headerCell: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#FFF',
    fontSize: 12,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#2D6A4F',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#F1F1F1',
  },
  cell: {
    textAlign: 'center',
    fontSize: 11,
    color: '#333',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  // Column widths
  colId: { width: 50 },
  colShort: { width: 90 },
  colMedium: { width: 120 },
  colLong: { width: 160 },
  colXL: { width: 220 },
});
