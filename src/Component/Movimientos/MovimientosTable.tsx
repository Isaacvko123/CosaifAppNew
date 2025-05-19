import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityInfo,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Color palette consistent with the app's design system
const COLORS = {
  primary: '#2D6A4F',
  primaryLight: '#4D8D6E',
  primaryDark: '#1b4d3e',
  background: '#FFFFFF',
  backgroundAlt: '#F6F6F6',
  border: '#DDD',
  borderLight: '#EEE',
  text: '#333333',
  textLight: '#777777',
  textPrimary: '#FFFFFF',
  shadow: '#000000',
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
};

export interface Movement {
  id: number;
  locomotora: number;
  localidadId: number;
  localidadNombre?: string;
  localidadEstado?: string;
  viaOrigen: number;
  viaDestino: number;
  tipoAccion: string;
  prioridad: string;
  tipoMovimiento: string;
  clienteId: number;
  supervisorId: number | null;
  coordinadorId: number | null;
  operadorId: number | null;
  maquinistaId: number | null;
  empresaId: number;
  fechaSolicitud: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
  instrucciones: string;
  incidenteGlobal: boolean;
  finalizado: boolean;
  lavado: boolean;
  torno: boolean;
  posicionCabina: string;
  posicionChimenea: string;
  direccionEmpuje: string;
  comentarioPostergacion?: string;
  nuevaFechaPostergacion?: string | null;
}

// Column definition type
interface ColumnDefinition {
  key: keyof Movement;
  title: string;
  width?: number;
  render?: (value: any, item: Movement) => React.ReactNode;
  sortable?: boolean;
}

interface Props {
  data: Movement[];
  loading?: boolean;
  columns?: ColumnDefinition[];
  onRowPress?: (item: Movement) => void;
  onSort?: (key: keyof Movement, direction: 'asc' | 'desc') => void;
  stickyHeaderIndices?: number[];
  initialSortKey?: keyof Movement;
  initialSortDirection?: 'asc' | 'desc';
  emptyStateText?: string;
  showAllColumns?: boolean;
}

const MovimientosTable: React.FC<Props> = ({
  data,
  loading = false,
  columns,
  onRowPress,
  onSort,
  initialSortKey,
  initialSortDirection = 'asc',
  emptyStateText = 'No hay movimientos para mostrar',
  showAllColumns = false,
}) => {
  const screenWidth = Dimensions.get('window').width;
  
  // State for sorting
  const [sortKey, setSortKey] = useState<keyof Movement | undefined>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  
  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  
  // Define the default columns to show
  const defaultColumns: ColumnDefinition[] = useMemo(() => [
    { key: 'id', title: 'ID', width: 80, sortable: true },
    { key: 'localidadNombre', title: 'Localidad', width: 150, sortable: true },
    { key: 'locomotora', title: 'Locomotora', width: 120, sortable: true },
    { key: 'viaOrigen', title: 'Vía Origen', width: 100, sortable: true },
    { key: 'viaDestino', title: 'Vía Destino', width: 100, sortable: true },
    { key: 'tipoAccion', title: 'Acción', width: 120, sortable: true },
    { key: 'prioridad', title: 'Prioridad', width: 100, sortable: true },
    { 
      key: 'estado', 
      title: 'Estado', 
      width: 120, 
      sortable: true,
      render: (value) => {
        let color = COLORS.textLight;
        if (value === 'FINALIZADO') color = COLORS.success;
        if (value === 'PENDIENTE') color = COLORS.warning;
        if (value === 'CANCELADO') color = COLORS.error;
        
        return (
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{value}</Text>
          </View>
        );
      }
    },
    { key: 'fechaInicio', title: 'Fecha Inicio', width: 150, sortable: true },
    { 
      key: 'finalizado', 
      title: 'Finalizado', 
      width: 100,
      render: (value) => (
        <View style={styles.booleanIndicator}>
          {value ? (
            <Feather name="check-circle" size={18} color={COLORS.success} />
          ) : (
            <Feather name="circle" size={18} color={COLORS.textLight} />
          )}
        </View>
      )
    },
  ], []);

  // All available columns for expanded view
  const allColumns: ColumnDefinition[] = useMemo(() => [
    ...defaultColumns,
    { key: 'localidadEstado', title: 'Estado Localidad', width: 150 },
    { key: 'tipoMovimiento', title: 'Tipo Movimiento', width: 150 },
    { key: 'clienteId', title: 'Cliente', width: 100 },
    { key: 'supervisorId', title: 'Supervisor', width: 100 },
    { key: 'coordinadorId', title: 'Coordinador', width: 100 },
    { key: 'operadorId', title: 'Operador', width: 100 },
    { key: 'maquinistaId', title: 'Maquinista', width: 100 },
    { key: 'empresaId', title: 'Empresa', width: 100 },
    { key: 'fechaSolicitud', title: 'Fecha Solicitud', width: 150 },
    { key: 'fechaFin', title: 'Fecha Fin', width: 150 },
    { key: 'instrucciones', title: 'Instrucciones', width: 200 },
    { 
      key: 'incidenteGlobal', 
      title: 'Incidente Global', 
      width: 140,
      render: (value) => (
        <Text style={styles.cell}>
          {value ? 'Sí' : 'No'}
        </Text>
      )
    },
    { 
      key: 'lavado', 
      title: 'Lavado', 
      width: 100,
      render: (value) => (
        <Text style={styles.cell}>
          {value ? 'Sí' : 'No'}
        </Text>
      )
    },
    { 
      key: 'torno', 
      title: 'Torno', 
      width: 100,
      render: (value) => (
        <Text style={styles.cell}>
          {value ? 'Sí' : 'No'}
        </Text>
      )
    },
    { key: 'posicionCabina', title: 'Posición Cabina', width: 150 },
    { key: 'posicionChimenea', title: 'Posición Chimenea', width: 170 },
    { key: 'direccionEmpuje', title: 'Dirección Empuje', width: 150 },
    { key: 'comentarioPostergacion', title: 'Comentario', width: 200 },
    { key: 'nuevaFechaPostergacion', title: 'Nueva Fecha', width: 150 },
  ], [defaultColumns]);

  // Determine which columns to display
  const displayColumns = useMemo(() => 
    columns || (showAllColumns ? allColumns : defaultColumns),
  [columns, showAllColumns, defaultColumns, allColumns]);

  // Sort data if needed
  const sortedData = useMemo(() => {
    if (!sortKey || !onSort) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      
      // Handle different value types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortDirection === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? 1 : -1)
          : (aValue === bValue ? 0 : aValue ? -1 : 1);
      }
      
      // Fallback to string comparison
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [data, sortKey, sortDirection, onSort]);

  // Handle column header click for sorting
  const handleSort = useCallback((key: keyof Movement) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Update sort state
    const newDirection = 
      key === sortKey && sortDirection === 'asc' ? 'desc' : 'asc';
      
    setSortKey(key);
    setSortDirection(newDirection);
    
    // Call external handler if provided
    if (onSort) {
      onSort(key, newDirection);
    }
    
    // Announce sort for accessibility
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const columnTitle = displayColumns.find(col => col.key === key)?.title || String(key);
      const message = `Ordenado por ${columnTitle} en orden ${newDirection === 'asc' ? 'ascendente' : 'descendente'}`;
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [displayColumns, onSort, sortKey, sortDirection]);

  // Handle row expansion toggle
  const toggleRowExpansion = useCallback((id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Render table header
  const renderHeader = useCallback(() => (
    <View style={styles.headerRow}>
      {/* Add an expander column */}
      <View style={[styles.headerCell, { width: 50 }]}>
        <Text style={styles.headerCellText}></Text>
      </View>
      
      {/* Render column headers */}
      {displayColumns.map((column) => (
        <TouchableOpacity
          key={String(column.key)}
          style={[
            styles.headerCell, 
            { width: column.width || 150 },
            sortKey === column.key && styles.headerCellActive
          ]}
          onPress={() => column.sortable && handleSort(column.key)}
          disabled={!column.sortable}
          accessibilityRole="button"
          accessibilityLabel={`Ordenar por ${column.title}`}
          accessibilityHint={column.sortable ? "Doble toque para ordenar esta columna" : ""}
        >
          <View style={styles.headerCellContent}>
            <Text style={styles.headerCellText}>{column.title}</Text>
            {column.sortable && sortKey === column.key && (
              <Feather 
                name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={COLORS.textPrimary} 
                style={styles.sortIcon} 
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  ), [displayColumns, sortKey, sortDirection, handleSort]);

  // Render a table row
  const renderItem = useCallback(({ item, index }: { item: Movement, index: number }) => {
    const rowStyle = index % 2 === 0 ? styles.rowEven : styles.rowOdd;
    const isExpanded = expandedRows[item.id] || false;
    
    return (
      <>
        <TouchableOpacity 
          style={[styles.row, rowStyle]}
          onPress={() => onRowPress ? onRowPress(item) : toggleRowExpansion(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Movimiento ID ${item.id}`}
          accessibilityHint="Doble toque para expandir detalles"
        >
          {/* Expander button */}
          <View style={[styles.cell, { width: 50 }]}>
            <Feather 
              name={isExpanded ? 'chevron-down' : 'chevron-right'} 
              size={18} 
              color={COLORS.textLight} 
            />
          </View>
          
          {/* Display cells for each column */}
          {displayColumns.map((column) => {
            const cellValue = item[column.key];
            const formattedValue = 
              cellValue === null || cellValue === undefined ? '-' : cellValue;
              
            return (
              <View 
                key={`${item.id}-${String(column.key)}`} 
                style={[styles.cell, { width: column.width || 150 }]}
              >
                {column.render ? (
                  column.render(cellValue, item)
                ) : (
                  <Text 
                    style={styles.cellText} 
                    numberOfLines={1}
                  >
                    {typeof formattedValue === 'boolean' 
                      ? (formattedValue ? 'Sí' : 'No') 
                      : String(formattedValue)}
                  </Text>
                )}
              </View>
            );
          })}
        </TouchableOpacity>
        
        {/* Expanded row details */}
        {isExpanded && (
          <View style={[styles.expandedRow, rowStyle]}>
            <View style={styles.expandedContent}>
              {/* Display additional details in a more readable format */}
              <View style={styles.detailsGrid}>
                {allColumns
                  .filter(col => !displayColumns.some(c => c.key === col.key))
                  .map(column => (
                    <View key={String(column.key)} style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{column.title}:</Text>
                      {column.render ? (
                        column.render(item[column.key], item)
                      ) : (
                        <Text style={styles.detailValue}>
                          {item[column.key] === null || item[column.key] === undefined 
                            ? '-' 
                            : typeof item[column.key] === 'boolean'
                              ? (item[column.key] ? 'Sí' : 'No')
                              : String(item[column.key])}
                        </Text>
                      )}
                    </View>
                  ))}
              </View>
              
              {/* Show instructions in a more prominent way */}
              {item.instrucciones && (
                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsLabel}>Instrucciones:</Text>
                  <Text style={styles.instructionsText}>{item.instrucciones}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </>
    );
  }, [displayColumns, expandedRows, onRowPress, toggleRowExpansion, allColumns]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <>
          <Feather name="inbox" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>{emptyStateText}</Text>
        </>
      )}
    </View>
  ), [loading, emptyStateText]);

  // Calculate total width of the table
  const tableWidth = useMemo(() => {
    const columnsWidth = displayColumns.reduce((sum, col) => sum + (col.width || 150), 0);
    return Math.max(columnsWidth + 50, screenWidth); // Add width for expander column
  }, [displayColumns, screenWidth]);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={[styles.tableWrapper, { width: tableWidth }]}>
          {renderHeader()}
          
          {data.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={sortedData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              initialNumToRender={15}
              windowSize={10}
              getItemLayout={(data, index) => ({
                length: 40, // Approximate height of a row
                offset: 40 * index,
                index,
              })}
              ListFooterComponent={<View style={{ height: 40 }} />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MovimientosTable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableWrapper: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerCell: {
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.primaryDark,
  },
  headerCellActive: {
    backgroundColor: COLORS.primaryLight,
  },
  headerCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCellText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  sortIcon: {
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 44,
  },
  rowEven: {
    backgroundColor: COLORS.background,
  },
  rowOdd: {
    backgroundColor: COLORS.backgroundAlt,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  cellText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  expandedRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expandedContent: {
    marginLeft: 50, // Align with the row content
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    width: '33.33%', // 3 items per row
    paddingVertical: 6,
    paddingRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
  },
  instructionsBox: {
    backgroundColor: COLORS.backgroundAlt,
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  booleanIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});