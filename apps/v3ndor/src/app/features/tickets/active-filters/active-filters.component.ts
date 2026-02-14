import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TicketFilterParams } from '@org/shared/models';

interface FilterChip {
  key: keyof TicketFilterParams;
  label: string;
  value: string;
  removable: boolean;
}

@Component({
  selector: 'app-active-filters',
  standalone: true,
  imports: [CommonModule, ButtonModule, ChipModule],
  templateUrl: './active-filters.component.html',
  styleUrls: ['./active-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveFiltersComponent {
  @Input() set filters(value: TicketFilterParams) {
    this._filters = value;
    this.buildChips();
  }
  get filters(): TicketFilterParams {
    return this._filters;
  }

  @Output() editFilters = new EventEmitter<void>();
  @Output() removeFilter = new EventEmitter<TicketFilterParams>();

  chips: FilterChip[] = [];
  private _filters: TicketFilterParams = {};

  private readonly situationLabels: Record<string, string> = {
    A: 'Aberto',
    F: 'Fechado',
  };

  private buildChips(): void {
    this.chips = [];
    const f = this._filters;

    if (f.situation) {
      this.chips.push({
        key: 'situation',
        label: 'Situação',
        value: this.situationLabels[f.situation] ?? f.situation,
        removable: false,
      });
    }
    if (f.date_from) {
      this.chips.push({
        key: 'date_from',
        label: 'De',
        value: this.formatDateDisplay(f.date_from),
        removable: true,
      });
    }
    if (f.date_to) {
      this.chips.push({
        key: 'date_to',
        label: 'Até',
        value: this.formatDateDisplay(f.date_to),
        removable: true,
      });
    }
    if (f.responsible_id) {
      this.chips.push({
        key: 'responsible_id',
        label: 'Responsável',
        value: f.responsible_id,
        removable: true,
      });
    }
    if (f.developer_id) {
      this.chips.push({
        key: 'developer_id',
        label: 'Desenvolvedor',
        value: f.developer_id,
        removable: true,
      });
    }
  }

  onRemoveChip(chip: FilterChip): void {
    const updated = { ...this._filters };
    delete updated[chip.key];
    this.removeFilter.emit(updated);
  }

  onEditFilters(): void {
    this.editFilters.emit();
  }

  private formatDateDisplay(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}
