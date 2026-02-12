export type FilterType = 'text' | 'numeric' | 'date' | 'dropdown' | 'boolean';

export interface GridColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  width?: string;
  visible?: boolean;
  frozen?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
}

export interface GridConfig {
  paginator?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  globalFilterFields?: string[];
  selectionMode?: 'single' | 'multiple' | null;
  lazy?: boolean;
  virtualScroll?: boolean;
  scrollHeight?: string;
  resizableColumns?: boolean;
  reorderableColumns?: boolean;
  showGridlines?: boolean;
  stripedRows?: boolean;
  responsiveLayout?: 'scroll' | 'stack';
}

export interface GridState {
  first?: number;
  rows?: number;
  sortField?: string;
  sortOrder?: number;
  filters?: Record<string, unknown>;
  globalFilter?: string;
}

export interface GridFilterValue {
  value: unknown;
  matchMode: string;
}
