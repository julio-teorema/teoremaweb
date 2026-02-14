import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ViewChild,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FluidModule } from 'primeng/fluid';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { GridColumn, GridConfig } from '@org/shared/models';

@Component({
  selector: 'app-advanced-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    MultiSelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FluidModule,
    ToolbarModule,
    SelectModule,
  ],
  templateUrl: './advanced-grid.component.html',
  styleUrls: ['./advanced-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedGridComponent implements OnInit, OnDestroy, OnChanges {
  isMobile = signal(false);
  private mql!: MediaQueryList;
  private mqlHandler = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);
  @ViewChild('dt') table!: Table;

  @Input() data: unknown[] = [];
  @Input() columns: GridColumn[] = [];
  @Input() config: GridConfig = {};
  @Input() title = '';
  @Input() loading = false;

  @Output() rowSelect = new EventEmitter<unknown>();
  @Output() rowDblClick = new EventEmitter<unknown>();

  globalFilterValue = signal('');
  selectedColumns = signal<GridColumn[]>([]);
  private columnOrder = signal<string[]>([]);
  groupByField = signal<string | null>(null);
  expandedGroups = signal<Set<string>>(new Set());

  groupOptions = computed(() => {
    return [
      { label: 'Sem agrupamento', value: null },
      ...this.columns.map((c) => ({ label: c.header, value: c.field })),
    ];
  });

  sortedData = computed(() => {
    const field = this.groupByField();
    const source = field ? this.filteredData() : this.data;
    if (!field) return source;
    const col = this.columns.find((c) => c.field === field);
    return [...source].sort((a, b) => {
      const va = this.getFieldDisplayValue(a, field, col);
      const vb = this.getFieldDisplayValue(b, field, col);
      return va.localeCompare(vb);
    });
  });

  groupedData = computed(() => {
    const field = this.groupByField();
    if (!field) return this.data;
    const sorted = this.sortedData();
    const expanded = this.expandedGroups();
    const hasSearch = !!this.globalFilterValue();
    const col = this.columns.find((c) => c.field === field);
    const result: unknown[] = [];
    let lastGroup = '';
    for (const row of sorted) {
      const val = this.getFieldDisplayValue(row, field, col);
      if (val !== lastGroup) {
        lastGroup = val;
        const count = sorted.filter(
          (r) => this.getFieldDisplayValue(r, field, col) === val
        ).length;
        result.push({ _isGroupHeader: true, _groupValue: val, _groupCount: count });
        if (hasSearch || expanded.has(val)) {
          result.push(row);
        }
      } else if (hasSearch || expanded.has(lastGroup)) {
        result.push(row);
      }
    }
    return result;
  });

  private _filterOptionsCache = new Map<string, { label: string; value: string }[]>();

  getColumnFilterOptions(field: string): { label: string; value: string }[] {
    const cached = this._filterOptionsCache.get(field);
    if (cached) return cached;
    const col = this.columns.find((c) => c.field === field);
    const unique = new Set<string>();
    for (const row of this.data) {
      const val = this.getFieldDisplayValue(row, field, col);
      if (val && val !== '') {
        unique.add(val);
      }
    }
    const options = Array.from(unique)
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ label: v, value: v }));
    this._filterOptionsCache.set(field, options);
    return options;
  }

  private _columnStyleCache = new Map<string, Record<string, string>>();

  visibleColumns = computed(() => {
    const selected = this.selectedColumns();
    if (selected.length === 0) {
      return this.columns.filter((c) => c.visible !== false);
    }
    return selected;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this._filterOptionsCache.clear();
    }
    if (changes['columns']) {
      this._columnStyleCache.clear();
    }
  }

  ngOnInit(): void {
    const initial = this.columns.filter((c) => c.visible !== false);
    this.selectedColumns.set(initial);
    this.columnOrder.set(this.columns.map((c) => c.field));

    this.mql = window.matchMedia('(max-width: 768px)');
    this.isMobile.set(this.mql.matches);
    this.mql.addEventListener('change', this.mqlHandler);
  }

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', this.mqlHandler);
  }

  onCardFilter(value: string): void {
    this.globalFilterValue.set(value);
  }

  filteredData = computed(() => {
    const filter = this.globalFilterValue().toLowerCase();
    if (!filter) return this.data;
    const fields = this.getFilterFields();
    return this.data.filter((row) => {
      const r = row as Record<string, unknown>;
      return fields.some((f) => String(r[f] ?? '').toLowerCase().includes(filter));
    });
  });

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    if (!this.groupByField()) {
      this.table?.filterGlobal(value, 'contains');
    }
  }

  clearFilters(): void {
    this.table?.clear();
    this.globalFilterValue.set('');
  }

  onColumnToggle(cols: GridColumn[]): void {
    const selectedFields = new Set(cols.map((c) => c.field));
    const order = this.columnOrder();
    const colMap = new Map(this.columns.map((c) => [c.field, c]));
    const sorted = order
      .filter((f) => selectedFields.has(f) && colMap.has(f))
      .map((f) => colMap.get(f) as GridColumn);
    this.selectedColumns.set(sorted);
  }

  onColReorder(event: { columns?: GridColumn[] }): void {
    if (event.columns) {
      const reordered = event.columns;
      this.selectedColumns.set([...reordered]);
      const visibleFields = reordered.map((c) => c.field);
      const hiddenFields = this.columnOrder().filter(
        (f) => !visibleFields.includes(f)
      );
      // Rebuild full order: place hidden columns at their relative positions
      const newOrder: string[] = [...visibleFields];
      for (const hf of hiddenFields) {
        const oldOrder = this.columnOrder();
        const oldIdx = oldOrder.indexOf(hf);
        let insertAt = newOrder.length;
        for (let i = 0; i < newOrder.length; i++) {
          if (oldOrder.indexOf(newOrder[i]) > oldIdx) {
            insertAt = i;
            break;
          }
        }
        newOrder.splice(insertAt, 0, hf);
      }
      this.columnOrder.set(newOrder);
    }
  }

  exportCSV(): void {
    this.table?.exportCSV();
  }

  getFilterFields(): string[] {
    return (
      this.config.globalFilterFields ||
      this.columns.map((c) => c.field)
    );
  }

  getColumnStyle(col: GridColumn): Record<string, string> {
    const cached = this._columnStyleCache.get(col.field);
    if (cached) return cached;
    const style: Record<string, string> = {};
    if (col.width) style['width'] = col.width;
    if (col.width) style['min-width'] = col.width;
    if (col.align) style['text-align'] = col.align;
    this._columnStyleCache.set(col.field, style);
    return style;
  }

  getCellValue(row: unknown, col: GridColumn): string {
    const value = (row as Record<string, unknown>)[col.field];
    if (col.format) {
      return col.format(value);
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }
    return String(value ?? '');
  }

  getCellHtml(row: unknown, col: GridColumn): string | null {
    if (!col.htmlFormat) return null;
    const value = (row as Record<string, unknown>)[col.field];
    return col.htmlFormat(value, row as Record<string, unknown>);
  }

  highlightText(text: string, col?: GridColumn): string {
    if (!text) return text;

    const terms = new Set<string>();
    const global = this.globalFilterValue().trim();
    if (global) {
      terms.add(global);
    }

    if (col && this.table?.filters) {
      const rawMeta = (this.table.filters as Record<string, unknown>)[col.field];
      const metas = Array.isArray(rawMeta) ? rawMeta : rawMeta ? [rawMeta] : [];
      for (const meta of metas as Record<string, unknown>[]) {
        const value = meta?.['value'] as unknown;
        if (Array.isArray(value)) {
          for (const item of value) {
            const str = String(item ?? '').trim();
            if (str) terms.add(str);
          }
        } else if (value !== null && value !== undefined) {
          const str = String(value).trim();
          if (str) terms.add(str);
        }
      }
    }

    if (terms.size === 0) return text;

    const patterns = Array.from(terms).sort((a, b) => b.length - a.length);
    const escaped = patterns.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  toggleGroup(groupValue: string): void {
    const current = this.expandedGroups();
    const next = new Set(current);
    if (next.has(groupValue)) {
      next.delete(groupValue);
    } else {
      next.add(groupValue);
    }
    this.expandedGroups.set(next);
  }

  isGroupHeader(row: unknown): boolean {
    return !!(row as Record<string, unknown>)['_isGroupHeader'];
  }

  getGroupLabel(): string {
    const field = this.groupByField();
    if (!field) return '';
    const col = this.columns.find((c) => c.field === field);
    return col ? col.header : field;
  }

  getGroupValue(row: unknown): string {
    const field = this.groupByField();
    if (!field) return '';
    const value = (row as Record<string, unknown>)[field];
    const col = this.columns.find((c) => c.field === field);
    if (col?.format) return col.format(value);
    return String(value ?? '(vazio)');
  }

  getGroupCount(row: unknown): number {
    const field = this.groupByField();
    if (!field) return 0;
    const col = this.columns.find((c) => c.field === field);
    const groupVal = this.getFieldDisplayValue(row, field, col);
    return this.sortedData().filter(
      (r) => this.getFieldDisplayValue(r, field, col) === groupVal
    ).length;
  }

  private getFieldDisplayValue(row: unknown, field: string, col?: GridColumn): string {
    const value = (row as Record<string, unknown>)[field];
    if (col?.format) {
      return col.format(value);
    }
    return String(value ?? '');
  }
}
