import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ListRenderItem,
} from 'react-native';

export interface Movement {
  id: string;
  locomotiveNumber: string;
  fromTrack: string;
  toTrack: string;
  requestDateTime: string;
  movementTime: string;
  values: string;
  incidentRecord: string;
  Imprevisto: boolean;
  status: string;
}

interface MovimientosTableProps {
  data: Movement[];
}

const MovimientosTable: React.FC<MovimientosTableProps> = ({ data }) => {
  // Renderiza cada fila de la tabla
  const renderItem: ListRenderItem<Movement> = ({ item, index }) => {
    const rowBackground = index % 2 === 0 ? styles.rowEven : styles.rowOdd;
    return (
      <View style={[styles.row, rowBackground]}>
        <Text style={[styles.cell, styles.cellId]}>{item.id}</Text>
        <Text style={[styles.cell, styles.cellLocomotive]}>{item.locomotiveNumber}</Text>
        <Text style={[styles.cell, styles.cellFromTrack]}>{item.fromTrack}</Text>
        <Text style={[styles.cell, styles.cellToTrack]}>{item.toTrack}</Text>
        <Text style={[styles.cell, styles.cellDateTime]}>{item.requestDateTime}</Text>
        <Text style={[styles.cell, styles.cellMovementTime]}>{item.movementTime}</Text>
        <Text style={[styles.cell, styles.cellValues]}>{item.values}</Text>
        <Text style={[styles.cell, styles.cellIncident]}>{item.incidentRecord}</Text>
        <Text style={[styles.cell, styles.cellPrinted]}>
          {item.Imprevisto ? 'Imprevisto' : 'Sin imprevisto'}
        </Text>
        <Text style={[styles.cell, styles.cellStatus]}>{item.status}</Text>
      </View>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        {/* Encabezado de la tabla */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.cellId]}>#</Text>
          <Text style={[styles.headerCell, styles.cellLocomotive]}>No. Locomotora</Text>
          <Text style={[styles.headerCell, styles.cellFromTrack]}>De vía</Text>
          <Text style={[styles.headerCell, styles.cellToTrack]}>Para vía</Text>
          <Text style={[styles.headerCell, styles.cellDateTime]}>Fecha y hora</Text>
          <Text style={[styles.headerCell, styles.cellMovementTime]}>Tiempo</Text>
          <Text style={[styles.headerCell, styles.cellValues]}>Valores</Text>
          <Text style={[styles.headerCell, styles.cellIncident]}>Incidente</Text>
          <Text style={[styles.headerCell, styles.cellPrinted]}>Imprevisto</Text>
          <Text style={[styles.headerCell, styles.cellStatus]}>Estado</Text>
        </View>
        {/* Lista de datos */}
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      </View>
    </ScrollView>
  );
};

export default MovimientosTable;

// Estilos de la tabla
const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2D6A4F',
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  headerCell: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#FFF',
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: '#2D6A4F',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  rowEven: {
    backgroundColor: '#FFF',
  },
  rowOdd: {
    backgroundColor: '#F1F1F1',
  },
  cell: {
    textAlign: 'center',
    color: '#555',
    fontSize: 11,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  cellId: { width: 50 },
  cellLocomotive: { width: 100 },
  cellFromTrack: { width: 80 },
  cellToTrack: { width: 80 },
  cellDateTime: { width: 150 },
  cellMovementTime: { width: 120 },
  cellValues: { width: 80 },
  cellIncident: { width: 150 },
  cellPrinted: { width: 80 },
  cellStatus: { width: 100 },
  list: {
    marginTop: 8,
  },
});
