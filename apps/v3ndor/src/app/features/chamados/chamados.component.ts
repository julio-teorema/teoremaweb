import { Component, signal, OnInit } from '@angular/core';
import { Ticket, GridColumn, GridConfig } from '@org/shared/models';
import { MOCK_TICKETS } from '@org/shared/mocks';
import { AdvancedGridComponent } from '../../shared/advanced-grid/advanced-grid.component';

@Component({
  selector: 'app-chamados',
  standalone: true,
  imports: [AdvancedGridComponent],
  templateUrl: './chamados.component.html',
  styleUrls: ['./chamados.component.scss'],
})
export class ChamadosComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  loading = signal(false);

  columns: GridColumn[] = [
    { field: 'ticket_number_teorema', header: 'Número', width: '140px', sortable: true, filterable: true },
    { field: 'customer_name', header: 'Cliente', width: '200px', sortable: true, filterable: true },
    { field: 'system', header: 'Sistema', width: '200px', sortable: true, filterable: true },
    { field: 'problem', header: 'Problema', width: '350px', sortable: true, filterable: true },
    { field: 'status', header: 'Status', width: '160px', sortable: true, filterable: true },
    { field: 'priority', header: 'Prioridade', width: '120px', sortable: true, filterable: true, filterType: 'numeric', align: 'center' },
    { field: 'responsible', header: 'Responsável', width: '180px', sortable: true, filterable: true },
    {
      field: 'created_at',
      header: 'Criado em',
      width: '160px',
      sortable: true,
      filterable: false,
      format: (value: unknown) => {
        if (value instanceof Date) {
          return value.toLocaleDateString('pt-BR') + ' ' + value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        if (typeof value === 'string') {
          const d = new Date(value);
          return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return String(value ?? '');
      },
    },
  ];

  gridConfig: GridConfig = {
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [10, 25, 50],
    globalFilterFields: ['ticket_number_teorema', 'customer_name', 'problem', 'status', 'system', 'responsible'],
    scrollHeight: '600px',
    stripedRows: true,
  };

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.tickets.set(MOCK_TICKETS);
      this.loading.set(false);
    }, 500);
  }
}
