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

  @Input() initialTaskId: string | null = null;

  @Input() set visible(value: boolean) {
    this._visible = value;
    if (value) {
      // Quando o modal abrir, se não há apontamento ativo, setar o status default
      if (!this._activeTimeEntry) {
        this.timeEntryStatusId.set('00c18a5e-59da-11ed-b4ca-0242ac1b0002'); // UUID de "Em Produção"
      }
      // Pré-selecionar tarefa se fornecida
      if (this.initialTaskId && !this._activeTimeEntry) {
        this.timeEntryTaskId.set(this.initialTaskId);
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
  timeEntryStatusId = signal<string>('2'); // Default: "Em Andamento"
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
    this.timeEntryStatusId.set(this._activeTimeEntry.ticket_status_id || this.ticket?.status?.id || '2'); // Default: "Em Andamento"
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
    // Lista fixa de status com UUIDs reais do banco
    const statuses = [
      { id: '00c04680-59da-11ed-bb24-0242ac1b0002', description: 'Aberta' },
      { id: '00c18a5e-59da-11ed-b4ca-0242ac1b0002', description: 'Em Produção' },
      { id: '00c13e46-59da-11ed-b374-0242ac1b0002', description: 'Produzir' },
      { id: '00c28f8a-59da-11ed-a676-0242ac1b0002', description: 'Finalizada' },
      { id: '00c1da18-59da-11ed-b0fd-0242ac1b0002', description: 'Cancelamento' }
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

  // Função para converter data para ISO string com fuso horário local
  private toLocalISOString(date: Date): string {
    const offset = -date.getTimezoneOffset();
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetHours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
    const offsetMinutes = (Math.abs(offset) % 60).toString().padStart(2, '0');

    return date.getFullYear() +
      '-' + (date.getMonth() + 1).toString().padStart(2, '0') +
      '-' + date.getDate().toString().padStart(2, '0') +
      'T' + date.getHours().toString().padStart(2, '0') +
      ':' + date.getMinutes().toString().padStart(2, '0') +
      ':' + date.getSeconds().toString().padStart(2, '0') +
      offsetSign + offsetHours + ':' + offsetMinutes;
  }

  stopTimeEntry(): void {
    if (!this.activeTimeEntry) return;

    const description = this.timeEntryDescription().trim();
    if (!description) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Descrição é obrigatória ao encerrar o apontamento',
        life: 3000,
      });
      return;
    }

    this.sending.set(true);

    const endTime = this.timeEntryEndDate() || new Date();

    // Verificação segura para obter o ID do apontamento
    if (!this.activeTimeEntry?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Apontamento não encontrado',
        life: 3000,
      });
      this.sending.set(false);
      return;
    }

    const timeEntryId = this.activeTimeEntry.id;

    // Encerrar o apontamento (a descrição já foi salva ao iniciar)
    this.ticketService
      .stopTimeEntry(this.ticket.id, {
        time_entry_id: timeEntryId,
        end_date: this.toLocalISOString(endTime),
        description: description,
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
    const user = this.authService.currentUser();
    if (!user) return;

    // Validações
    if (!this.timeEntryStatusId()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Status é obrigatório',
        life: 3000,
      });
      return;
    }

    this.sending.set(true);

    this.ticketService
      .startTimeEntry(this.ticket.id, {
        description: this.timeEntryDescription().trim(), // Deixar vazio se não preenchido
        user_id: user.id,
        attendance_type: this.timeEntryAttendanceType(),
        type: this.timeEntryType(),
        department_type: this.timeEntryDepartmentType(),
        start_date: this.toLocalISOString(this.timeEntryStartDate()),
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
    this.timeEntryStatusId.set('00c18a5e-59da-11ed-b4ca-0242ac1b0002'); // UUID de "Em Produção"
    this.sending.set(false);
  }
}
