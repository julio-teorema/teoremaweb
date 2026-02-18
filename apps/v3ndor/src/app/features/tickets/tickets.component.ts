import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { GridColumn, GridConfig, TicketFilterParams, TicketMassive, TicketDetail } from '@org/shared/models';
import { TicketService } from '@org/shared/services';
import { AuthService } from '@org/core/auth';
import { MessageService } from 'primeng/api';
import { AdvancedGridComponent } from '../../shared/advanced-grid/advanced-grid.component';
import { ActiveFiltersComponent } from './active-filters/active-filters.component';
import { TicketFilterPanelComponent } from './ticket-filter-panel/ticket-filter-panel.component';
import { TicketDetailModalComponent } from './ticket-detail-modal/ticket-detail-modal.component';

type ViewState = 'filters' | 'results';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [AdvancedGridComponent, TicketFilterPanelComponent, ActiveFiltersComponent, TicketDetailModalComponent],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);

  tickets = signal<Record<string, unknown>[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  viewState = signal<ViewState>('filters');
  currentFilters = signal<TicketFilterParams>({});
  selectedTicketId = signal<string | null>(null);
  modalVisible = signal(false);

  // Chave do localStorage para filtros por usuário
  private getFiltersKey(): string {
    const user = this.authService.currentUser();
    const userId = user?.id || 'anonymous';
    return `ticket_filters_${userId}`;
  }

  // Salvar filtros no localStorage
  private saveFilters(filters: TicketFilterParams): void {
    try {
      const key = this.getFiltersKey();
      localStorage.setItem(key, JSON.stringify(filters));
    } catch (error) {
      console.warn('Erro ao salvar filtros no localStorage:', error);
    }
  }

  // Carregar filtros do localStorage
  private loadFilters(): TicketFilterParams {
    try {
      const key = this.getFiltersKey();
      const saved = localStorage.getItem(key);
      if (!saved) return {};

      const parsed = JSON.parse(saved);
      // Validar que o objeto tem a estrutura esperada
      return typeof parsed === 'object' && parsed !== null ? parsed as TicketFilterParams : {};
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error);
      return {};
    }
  }

  columns: GridColumn[] = [
    {
      field: 'ticket_number_teorema', header: 'Número', width: '160px', sortable: true, filterable: true,
      htmlFormat: (_value: unknown, row: Record<string, unknown>) => {
        const num = String(row['ticket_number_teorema'] ?? '');
        const badge = row['urgent'] === 1
          ? ' <span class="v-urgent-badge">URGENTE</span>'
          : '';
        return `<span>${num}</span>${badge}`;
      },
    },
    {
      field: 'created_at',
      header: 'Criado em',
      width: '160px',
      sortable: true,
      filterable: false,
      format: (value: unknown) => {
        if (typeof value === 'string') {
          const d = new Date(value);
          return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return String(value ?? '');
      },
    },
    { field: 'customer_name', header: 'Cliente', width: '200px', sortable: true, filterable: true },
    { field: 'system_description', header: 'Sistema', width: '200px', sortable: true, filterable: true, filterType: 'dropdown' },
    { field: 'summary', header: 'Resumo', width: '350px', sortable: true, filterable: true },
    { field: 'status_description', header: 'Status', width: '160px', sortable: true, filterable: true, filterType: 'dropdown' },
    { field: 'responsible_name', header: 'Responsável', width: '180px', sortable: true, filterable: true, filterType: 'dropdown' },
    { field: 'developer_name', header: 'Desenvolvedor', width: '180px', sortable: true, filterable: true, filterType: 'dropdown' },
    { field: 'priority', header: 'Prioridade', width: '100px', sortable: true, filterable: true, filterType: 'numeric', align: 'center' },
  ];

  gridConfig: GridConfig = {
    paginator: true,
    rows: 25,
    rowsPerPageOptions: [10, 25, 50, 100],
    globalFilterFields: ['ticket_number_teorema', 'customer_name', 'system_description', 'summary'],
    scrollHeight: '600px',
    stripedRows: true,
  };

  onSearchFilters(filters: TicketFilterParams): void {
    this.currentFilters.set(filters);
    this.saveFilters(filters); // Salvar filtros no localStorage
    this.loadTickets(filters);
  }

  // Inicializar componente com filtros salvos
  ngOnInit(): void {
    const savedFilters = this.loadFilters();
    if (Object.keys(savedFilters).length > 0) {
      // Se há filtros salvos, aplica-os e busca automaticamente
      // Inicia diretamente na view de resultados para evitar flash
      this.viewState.set('results');
      this.currentFilters.set(savedFilters);
      this.loadTickets(savedFilters);
    }
  }

  onEditFilters(): void {
    this.viewState.set('filters');
  }

  onRowClick(row: unknown): void {
    const r = row as Record<string, unknown>;
    const id = r['id'] as string;
    if (id) {
      this.selectedTicketId.set(id);
      this.modalVisible.set(true);
    }
  }

  onModalVisibleChange(visible: boolean): void {
    this.modalVisible.set(visible);
    if (!visible) {
      this.selectedTicketId.set(null);
    }
  }

  onTicketUpdated(updatedTicket: TicketDetail): void {
    // Atualizar o ticket correspondente na lista
    const currentTickets = this.tickets();
    const ticketIndex = currentTickets.findIndex(t => t['id'] === updatedTicket.id);

    if (ticketIndex !== -1) {
      // Criar cópia atualizada do ticket no formato da grid
      // Converter TicketDetail para o formato esperado pela grid
      const updatedRow: Record<string, unknown> = {
        ...updatedTicket,
        system_description: updatedTicket.system?.description || '',
        count_tasks: updatedTicket.tasks?.length || 0,
        count_documents: updatedTicket.documents?.length || 0,
        status_description: updatedTicket.status?.description ?? '',
        responsible_name: updatedTicket.responsible?.name ?? '',
        developer_name: updatedTicket.developer?.name ?? '',
      };

      // Atualizar o array mantendo a imutabilidade
      const newTickets = [...currentTickets];
      newTickets[ticketIndex] = updatedRow;

      // Atualizar o signal
      this.tickets.set(newTickets);
    }
  }

  onRemoveFilter(updatedFilters: TicketFilterParams): void {
    this.currentFilters.set(updatedFilters);
    this.saveFilters(updatedFilters); // Salvar filtros atualizados
    this.loadTickets(updatedFilters);
  }

  private flattenTickets(data: TicketMassive[]): Record<string, unknown>[] {
    return data.map((t) => ({
      ...t,
      status_description: t.status?.description ?? '',
      responsible_name: t.responsible?.name ?? '',
      developer_name: t.developer?.name ?? '',
    }));
  }

  private loadTickets(filters: TicketFilterParams): void {
    this.loading.set(true);

    this.ticketService.listMassive(filters).subscribe({
      next: (response) => {
        this.tickets.set(this.flattenTickets(response.data));
        this.totalRecords.set(response.total);
        this.loading.set(false);
        this.viewState.set('results');
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `${response.total} chamado(s) encontrado(s)`,
          life: 3000,
        });
      },
      error: (err) => {
        console.error('Erro ao buscar chamados:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar chamados. Verifique sua conexão e tente novamente.',
          life: 5000,
        });
      },
    });
  }
}
