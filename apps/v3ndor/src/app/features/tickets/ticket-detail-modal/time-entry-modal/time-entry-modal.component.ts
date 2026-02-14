import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { AuthService } from '@org/core/auth';
import { TicketService } from '@org/shared/services';
import { TicketDetail, TicketLog } from '@org/shared/models';
import { FormBuilder } from '@angular/forms';

export type ActionType = 'comment' | 'attachment' | 'timeentry';

@Component({
  selector: 'app-time-entry-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './time-entry-modal.component.html',
  styleUrls: ['./time-entry-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntryModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly ticketService = inject(TicketService);

  @Input({ required: true }) ticket!: TicketDetail;
  @Input() ticketTimeEntries: TicketLog[] = [];

  @Input() set activeTimeEntry(value: TicketLog | null) {
    this._activeTimeEntry = value;
    // Atualizar aba quando o apontamento ativo mudar
    this.updateActiveTab();
  }

  get activeTimeEntry(): TicketLog | null {
    return this._activeTimeEntry;
  }

  private _activeTimeEntry: TicketLog | null = null;
  activeTab = signal<'new' | 'history'>('new');

  @Input() set visible(value: boolean) {
    this._visible = value;
    if (value) {
      // Quando o modal abrir, setar o status do ticket
      if (this.ticket?.status?.id) {
        this.timeEntryStatusId.set(this.ticket.status.id);
      }
      // Atualizar aba baseado no apontamento ativo
      this.updateActiveTab();
    }
  }

  get visible(): boolean {
    return this._visible;
  }

  private _visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() timeEntryAdded = new EventEmitter<TicketDetail>();
  @Output() timeEntryStopped = new EventEmitter<void>(); // Novo evento para encerramento

  // TimeEntry properties
  timeEntryDescription = signal('');
  timeEntryType = signal('Manutenção');
  timeEntryAttendanceType = signal('Interno');
  timeEntryDepartmentType = signal('Desenvolvimento Java');
  timeEntryStartDate = signal(new Date());
  timeEntryEndDate = signal<Date | null>(null);
  timeEntryTaskId = signal<string | null>(null);
  timeEntryStatusId = signal<string>('');
  sending = signal(false);

  // Mudar aba para new quando há apontamento ativo (para editar)
  private updateActiveTab() {
    // Se não tem activeTimeEntry vindo do pai, tentar detectar da lista
    if (!this._activeTimeEntry) {
      this.detectActiveTimeEntry();
    }

    if (this._activeTimeEntry) {
      this.activeTab.set('new');
      this.populateFormFromActiveEntry();
    } else {
      this.activeTab.set('new');
      this.resetForm();
    }
  }

  // Detectar apontamento ativo da lista de timeEntries
  private detectActiveTimeEntry(): void {
    if (this.ticketTimeEntries && this.ticketTimeEntries.length > 0) {
      const activeEntry = this.ticketTimeEntries.find(entry => !entry.end_date);
      if (activeEntry) {
        this._activeTimeEntry = activeEntry;
      }
    }
  }

  // Popular formulário com dados do apontamento ativo
  private populateFormFromActiveEntry(): void {
    if (!this._activeTimeEntry) return;

    this.timeEntryDescription.set(this._activeTimeEntry.description || '');
    this.timeEntryType.set(this._activeTimeEntry.type || 'Manutenção');
    this.timeEntryAttendanceType.set(this._activeTimeEntry.attendance_type || 'Interno');
    this.timeEntryDepartmentType.set(this._activeTimeEntry.department_type || 'Desenvolvimento Java');
    this.timeEntryStartDate.set(this._activeTimeEntry.start_date ? new Date(this._activeTimeEntry.start_date) : new Date());
    this.timeEntryEndDate.set(this._activeTimeEntry.end_date ? new Date(this._activeTimeEntry.end_date) : null);
    this.timeEntryTaskId.set(this._activeTimeEntry.task_id?.toString() || null);
    this.timeEntryStatusId.set(this.ticket?.status?.id || '');
  }

  // TimeEntry constants
  readonly timeTypes = [
    { label: 'Acompanhamento', value: 'Acompanhamento' },
    { label: 'Erro', value: 'Erro' },
    { label: 'Manutenção', value: 'Manutenção' },
    { label: 'Inovação', value: 'Inovação' }
  ];

  readonly attendanceTypes = [
    { label: 'Interno', value: 'Interno' },
    { label: 'Externo', value: 'Externo' }
  ];

  readonly departmentTypes = [
    { label: 'Analise', value: 'Analise' },
    { label: 'Desenvolvimento Delphi', value: 'Desenvolvimento Delphi' },
    { label: 'Desenvolvimento Java', value: 'Desenvolvimento Java' },
    { label: 'Externo', value: 'Externo' }
  ];

  // Computed properties
  taskOptions = computed(() => {
    if (!this.ticket?.tasks) return [];
    return this.ticket.tasks.map(task => ({
      label: task.summary || `Tarefa #${task.id}`,
      value: task.id
    }));
  });

  statusOptions = computed(() => {
    // Lista fixa de status comuns - pode ser ajustada conforme necessário
    const statuses = [
      { id: '1', description: 'Aberto' },
      { id: '2', description: 'Em Andamento' },
      { id: '3', description: 'Aguardando Cliente' },
      { id: '4', description: 'Resolvido' },
      { id: '5', description: 'Fechado' },
      { id: '6', description: 'Cancelado' }
    ];

    return statuses.map(status => ({
      label: status.description,
      value: status.id
    }));
  });

  ticketStatus = computed(() => {
    return this.ticket?.status?.description || 'Sem status';
  });

  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  }

  calculateDurationLog(entry: TicketLog): string {
    if (!entry.start_date) return '';

    const start = new Date(entry.start_date);
    const end = entry.end_date ? new Date(entry.end_date) : new Date();
    const diffMs = end.getTime() - start.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  // Lógica de abas
  showNewForm(): void {
    this.activeTab.set('new');
  }

  showHistory(): void {
    this.activeTab.set('history');
  }

  stopTimeEntry(): void {
    if (!this.activeTimeEntry) return;

    this.sending.set(true);

    const endTime = this.timeEntryEndDate() || new Date();

    // Chamada real à API para encerrar o apontamento
    this.ticketService
      .stopTimeEntry(this.ticket.id, {
        time_entry_id: this.activeTimeEntry.id,
        end_date: endTime.toISOString(),
      })
      .subscribe({
        next: (updatedTicket) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Apontamento Encerrado',
            detail: 'Apontamento encerrado com sucesso!'
          });

          // Emitir ticket atualizado para o componente pai
          this.timeEntryAdded.emit(updatedTicket);
          this.timeEntryStopped.emit();
          this.sending.set(false);
          this.onHide();
        },
        error: (err) => {
          console.error('Erro ao encerrar apontamento:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao encerrar apontamento. Tente novamente.',
            life: 5000,
          });
          this.sending.set(false);
        },
      });
  }

  onHide(): void {
    this.visibleChange.emit(false);
    this.resetForm();
  }

  onStartTimeEntry(): void {
    const description = this.timeEntryDescription().trim();
    if (!description) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Descrição é obrigatória',
        life: 3000,
      });
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    this.sending.set(true);

    this.ticketService
      .startTimeEntry(this.ticket.id, {
        description,
        user_id: user.id,
        attendance_type: this.timeEntryAttendanceType(),
        type: this.timeEntryType(),
        department_type: this.timeEntryDepartmentType(),
        start_date: this.timeEntryStartDate().toISOString(),
        task_id: this.timeEntryTaskId() || undefined,
        ticket_status_id: this.timeEntryStatusId(),
      })
      .subscribe({
        next: (updatedTicket) => {
          this.sending.set(false);
          this.timeEntryAdded.emit(updatedTicket);
          this.onHide(); // Close modal
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Apontamento iniciado',
            life: 3000,
          });
        },
        error: () => {
          this.sending.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao iniciar apontamento',
            life: 5000,
          });
        },
      });
  }

  private resetForm(): void {
    this.timeEntryDescription.set('');
    this.timeEntryType.set('Manutenção');
    this.timeEntryAttendanceType.set('Interno');
    this.timeEntryDepartmentType.set('Desenvolvimento Java');
    this.timeEntryStartDate.set(new Date());
    this.timeEntryEndDate.set(null);
    this.timeEntryTaskId.set(null);
    this.timeEntryStatusId.set(this.ticket?.status?.id || '');
    this.sending.set(false);
  }
}
