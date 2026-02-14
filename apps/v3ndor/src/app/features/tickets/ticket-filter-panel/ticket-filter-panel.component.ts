import { ChangeDetectionStrategy, Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TicketFilterParams } from '@org/shared/models';

interface SituationOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-ticket-filter-panel',
  standalone: true,
  imports: [FormsModule, SelectModule, DatePickerModule, InputTextModule, ButtonModule],
  templateUrl: './ticket-filter-panel.component.html',
  styleUrls: ['./ticket-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketFilterPanelComponent {
  @Input() set filters(value: TicketFilterParams) {
    if (value) {
      this.situation = value.situation ?? 'A';
      this.dateFrom = value.date_from ? new Date(value.date_from) : null;
      this.dateTo = value.date_to ? new Date(value.date_to) : null;
      this.responsibleId = value.responsible_id ?? '';
      this.developerId = value.developer_id ?? '';
    }
  }

  @Input() loading = false;

  @Output() searchFilters = new EventEmitter<TicketFilterParams>();

  situation = 'A';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  responsibleId = '';
  developerId = '';

  situationOptions: SituationOption[] = [
    { label: 'Aberto', value: 'A' },
    { label: 'Fechado', value: 'F' },
  ];

  onSearch(): void {
    const filters: TicketFilterParams = {};

    if (this.situation) {
      filters.situation = this.situation;
    }
    if (this.dateFrom) {
      filters.date_from = this.formatDate(this.dateFrom);
    }
    if (this.dateTo) {
      filters.date_to = this.formatDate(this.dateTo);
    }
    if (this.responsibleId?.trim()) {
      filters.responsible_id = this.responsibleId.trim();
    }
    if (this.developerId?.trim()) {
      filters.developer_id = this.developerId.trim();
    }

    this.searchFilters.emit(filters);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
