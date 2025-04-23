import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ListRenderItem,
} from 'react-native';

// Interfaz del movimiento
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableWrapper}>
        <View style={styles.headerRow}>
          {[
            { label: 'ID', style: styles.colId },
            { label: 'Locomotora', style: styles.colShort },
            { label: 'Vía Origen', style: styles.colShort },
            { label: 'Vía Destino', style: styles.colShort },
            { label: 'Acción', style: styles.colMedium },
            { label: 'Cliente', style: styles.colShort },
            { label: 'Supervisor', style: styles.colShort },
            { label: 'Coordinador', style: styles.colShort },
            { label: 'Operador', style: styles.colShort },
            { label: 'Maquinista', style: styles.colShort },
            { label: 'Empresa', style: styles.colShort },
            { label: 'Fecha Solicitud', style: styles.colLong },
            { label: 'Fecha Inicio', style: styles.colLong },
            { label: 'Fecha Fin', style: styles.colLong },
            { label: 'Estado', style: styles.colMedium },
            { label: 'Instrucciones', style: styles.colXL },
            { label: 'Comentario', style: styles.colXL },
            { label: 'Nueva Fecha', style: styles.colLong },
          ].map((col, idx) => (
            <Text key={idx} style={[styles.headerCell, col.style]}>
              {col.label}
            </Text>
          ))}
        </View>

        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </ScrollView>
  );
};

export default MovimientosTable;

const styles = StyleSheet.create({
  tableWrapper: {
    minWidth: 1200,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2D6A4F',
    paddingVertical: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCell: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#FFF',
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#1b4d3e',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingVertical: 6,
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#F6F6F6',
  },
  cell: {
    textAlign: 'center',
    fontSize: 11,
    color: '#333',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#EEE',
  },
  // Column widths
  colId: { width: 50 },
  colShort: { width: 90 },
  colMedium: { width: 120 },
  colLong: { width: 160 },
  colXL: { width: 220 },
});
