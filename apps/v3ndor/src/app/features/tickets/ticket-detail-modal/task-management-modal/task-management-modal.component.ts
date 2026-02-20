import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { OrderListModule } from 'primeng/orderlist';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TicketService } from '@org/shared/services';
import { TicketDetail, TicketTask, TaskProgressResponse } from '@org/shared/models';

interface TaskWithProgress extends TicketTask {
  progress: number;
}

@Component({
  selector: 'app-task-management-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    ProgressBarModule,
    ConfirmDialogModule,
    TooltipModule,
    OrderListModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './task-management-modal.component.html',
  styleUrls: ['./task-management-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskManagementModalComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) ticket!: TicketDetail;

  @Input() set visible(value: boolean) {
    this._visible = value;
    if (value) {
      this.loadTasksWithProgress();
      this.closeForm();
    }
  }

  get visible(): boolean {
    return this._visible;
  }

  private _visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() tasksUpdated = new EventEmitter<TicketTask[]>();
  @Output() startTimeEntry = new EventEmitter<string>();

  tasks = signal<TaskWithProgress[]>([]);
  showForm = signal(false);
  editingTask = signal<TicketTask | null>(null);
  saving = signal(false);
  draggedIndex = signal<number | null>(null);
  dropTarget = signal<{ index: number; position: 'top' | 'bottom' } | null>(null);

  formSummary = signal('');
  formDescription = signal('');
  formEstimatedEffort = signal<number | null>(null);
  formExpectedDate = signal<Date | null>(null);
  formDifficulty = signal('médio');
  formStatusId = signal<string | null>(null);
  formUserId = signal<string | null>(null);

  readonly difficultyOptions = [
    { label: 'Fácil', value: 'fácil' },
    { label: 'Médio', value: 'médio' },
    { label: 'Difícil', value: 'difícil' },
  ];

  readonly statusOptions = [
    { label: 'Aberta', value: '00c04680-59da-11ed-bb24-0242ac1b0002' },
    { label: 'Em Produção', value: '00c18a5e-59da-11ed-b4ca-0242ac1b0002' },
    { label: 'Produzir', value: '00c13e46-59da-11ed-b374-0242ac1b0002' },
    { label: 'Finalizada', value: '00c28f8a-59da-11ed-a676-0242ac1b0002' },
    { label: 'Cancelamento', value: '00c1da18-59da-11ed-b0fd-0242ac1b0002' },
  ];

  userOptions = computed(() => {
    const users: Array<{ label: string; value: string }> = [];
    const seen = new Set<string>();

    if (this.ticket?.participants) {
      for (const u of this.ticket.participants) {
        if (!seen.has(u.id)) {
          seen.add(u.id);
          users.push({ label: u.name, value: u.id });
        }
      }
    }

    if (this.ticket?.ticketUsers) {
      for (const tu of this.ticket.ticketUsers) {
        if (tu.user && !seen.has(tu.user.id)) {
          seen.add(tu.user.id);
          users.push({ label: tu.user.name, value: tu.user.id });
        }
      }
    }

    if (this.ticket?.developer && !seen.has(this.ticket.developer.id)) {
      users.push({ label: this.ticket.developer.name, value: this.ticket.developer.id });
    }

    return users;
  });

  totalPoints = computed(() => {
    return this.tasks().reduce((sum, t) => sum + (t.estimated_effort ?? 0), 0);
  });

  formTitle = computed(() => {
    return this.editingTask() ? 'Editar Tarefa' : 'Nova Tarefa';
  });

  ngOnInit(): void {
    this.loadTasksWithProgress();
  }

  private loadTasksWithProgress(): void {
    this.ticketService.listTasks(this.ticket.id).subscribe({
      next: (tasks: TicketTask[]) => {
        const sortedTasks = [...tasks].sort((a, b) => a.sequence - b.sequence);
        const tasksWithProgress: TaskWithProgress[] = sortedTasks.map(t => ({ ...t, progress: 0 }));
        this.tasks.set(tasksWithProgress);
        this.cdr.markForCheck();

        this.ticketService.getTasksProgress(this.ticket.id).subscribe({
          next: (progressData: TaskProgressResponse[]) => {
            const progressMap = new Map(Object.entries(progressData).map(([taskId, progress]) => [taskId, progress.percentage]));
            const updatedWithProgress = this.tasks().map(task => ({
              ...task,
              progress: progressMap.get(task.id) ?? 0,
            }));
            this.tasks.set(updatedWithProgress);
            this.cdr.markForCheck();
          },
          error: (err: unknown) => console.error('Error loading task progress:', err),
        });
      },
      error: (err: unknown) => {
        console.error('Error loading tasks:', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as tarefas.' });
      }
    });
  }

  openNewTaskForm(): void {
    this.resetForm();
    this.editingTask.set(null);
    if (this.ticket?.status?.id) {
      this.formStatusId.set(this.ticket.status.id);
    }
    if (this.ticket?.developer?.id) {
      this.formUserId.set(this.ticket.developer.id);
    } else if (this.ticket?.responsible?.id) {
      this.formUserId.set(this.ticket.responsible.id);
    }
    this.showForm.set(true);
  }

  openEditTaskForm(task: TicketTask): void {
    this.editingTask.set(task);
    this.formSummary.set(task.summary || '');
    this.formDescription.set(task.description || '');
    this.formEstimatedEffort.set(task.estimated_effort);
    this.formExpectedDate.set(task.expected_date ? new Date(task.expected_date) : null);
    this.formDifficulty.set(task.difficulty || 'médio');
    this.formStatusId.set(task.status?.id || null);
    this.formUserId.set(task.user?.id || null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingTask.set(null);
    this.resetForm();
  }

  private resetForm(): void {
    this.formSummary.set('');
    this.formDescription.set('');
    this.formEstimatedEffort.set(1);
    this.formExpectedDate.set(null);
    this.formDifficulty.set('médio');
    this.formStatusId.set(null);
    this.formUserId.set(null);
  }

  saveTask(): void {
    const summary = this.formSummary().trim();
    const description = this.formDescription().trim();
    const statusId = this.formStatusId();

    const userId = this.formUserId();

    const effort = this.formEstimatedEffort();

    if (!summary || !description || !statusId || !userId || !effort) {
      const missing: string[] = [];
      if (!summary) missing.push('descrição resumida');
      if (!description) missing.push('descrição completa');
      if (!statusId) missing.push('status');
      if (!userId) missing.push('desenvolvedor');
      if (!effort) missing.push('esforço técnico');
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: `Campo(s) obrigatório(s): ${missing.join(', ')}`,
        life: 3000,
      });
      return;
    }

    this.saving.set(true);

    const payload: Partial<TicketTask> & { ticket_status_id?: string | null; user_id?: string | null } = {
      summary,
      description,
      estimated_effort: this.formEstimatedEffort(),
      expected_date: this.formExpectedDate() ? this.toLocalISOString(this.formExpectedDate() as Date) : null,
      difficulty: this.formDifficulty(),
      ticket_status_id: statusId,
      user_id: userId
    };

    const editing = this.editingTask();
    if (editing) {
      this.ticketService.updateTask(this.ticket.id, editing.id, payload).subscribe({
        next: (updatedTask) => {
          this.tasks.update(currentTasks => {
            const index = currentTasks.findIndex(t => t.id === updatedTask.id);
            if (index > -1) {
              const newTasks = [...currentTasks];
              newTasks[index] = { ...newTasks[index], ...updatedTask, summary: updatedTask.summary || '' };
              return newTasks;
            }
            return currentTasks;
          });
          this.saving.set(false);
          this.closeForm();
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Tarefa atualizada' });
          this.tasksUpdated.emit(this.tasks());
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao atualizar tarefa',
            life: 5000,
          });
        },
      });
    } else {
      payload.sequence = (this.tasks()?.length ?? 0) + 1;
      this.ticketService.createTask(this.ticket.id, payload).subscribe({
        next: (newTask) => {
          this.tasks.update(currentTasks => [...currentTasks, { ...newTask, progress: 0 }]);
          this.saving.set(false);
          this.closeForm();
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Tarefa criada' });
          this.tasksUpdated.emit(this.tasks());
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao criar tarefa',
            life: 5000,
          });
        },
      });
    }
  }

  confirmDeleteTask(task: TicketTask): void {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a tarefa "${task.summary || task.description}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTask(task),
    });
  }

  private deleteTask(task: TicketTask): void {
    this.ticketService.deleteTask(this.ticket.id, task.id).subscribe({
      next: () => {
        this.tasks.update(currentTasks => currentTasks.filter(t => t.id !== task.id));
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Tarefa excluída' });
        this.tasksUpdated.emit(this.tasks());
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao excluir tarefa',
          life: 5000,
        });
      },
    });
  }

  toggleTaskFinished(task: TaskWithProgress): void {
    const newFinished = task.finished;
    this.ticketService.updateTask(this.ticket.id, task.id, { finished: newFinished }).subscribe({
      next: (updatedTask) => {
        this.tasks.update(currentTasks => {
          const index = currentTasks.findIndex(t => t.id === updatedTask.id);
          if (index > -1) {
            const newTasks = [...currentTasks];
            newTasks[index] = { ...newTasks[index], ...updatedTask, summary: updatedTask.summary || '' };
            return newTasks;
          }
          return currentTasks;
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Status da tarefa atualizado.',
          life: 3000,
        });
        this.tasksUpdated.emit(this.tasks());
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao atualizar tarefa',
          life: 5000,
        });
      },
    });
  }

  onStartTimeEntry(taskId: string): void {
    this.startTimeEntry.emit(taskId);
  }

  onDragStart(index: number): void {
    this.draggedIndex.set(index);
  }

  onDragEnd(): void {
    this.draggedIndex.set(null);
    this.dropTarget.set(null);
  }

  onDragLeave(): void {
    this.dropTarget.set(null);
  }


  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    const targetElement = (event.currentTarget as HTMLElement);
    const rect = targetElement.getBoundingClientRect();
    const isTopHalf = event.clientY < rect.top + rect.height / 2;
    this.dropTarget.set({ index, position: isTopHalf ? 'top' : 'bottom' });
  }


  onDrop(): void {
    const sourceIndex = this.draggedIndex();
    const dropTargetInfo = this.dropTarget();

    if (sourceIndex === null || dropTargetInfo === null) {
      this.draggedIndex.set(null);
      this.dropTarget.set(null);
      return;
    }

    let finalTargetIndex = dropTargetInfo.index;
    if (sourceIndex < dropTargetInfo.index && dropTargetInfo.position === 'top') {
      finalTargetIndex--;
    } else if (sourceIndex > dropTargetInfo.index && dropTargetInfo.position === 'bottom') {
      finalTargetIndex++;
    }

    if (sourceIndex === finalTargetIndex) {
      this.draggedIndex.set(null);
      this.dropTarget.set(null);
      return;
    }

    const tasks = [...this.tasks()];
    const [moved] = tasks.splice(sourceIndex, 1);
    tasks.splice(finalTargetIndex, 0, moved);

    // Update sequence property for all tasks
    const updatedTasksWithSequence = tasks.map((task, index) => ({ ...task, sequence: index + 1 }));

    this.tasks.set(updatedTasksWithSequence);
    this.draggedIndex.set(null);

    const payload = updatedTasksWithSequence.map(t => ({ id: t.id, sequence: t.sequence }));
    this.ticketService.reorderTasks(this.ticket.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ordem das tarefas salva.' });
        this.tasksUpdated.emit(this.tasks());
      },
      error: () => {
        this.loadTasksWithProgress();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao reordenar tarefas',
          life: 5000,
        });
      },
    });
  }


  onHide(): void {
    this.visibleChange.emit(false);
    this.closeForm();
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
        return 'difficulty-easy';
      case 'médio':
        return 'difficulty-medium';
      case 'difícil':
        return 'difficulty-hard';
      default:
        return 'difficulty-easy';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
        return 'Fácil';
      case 'médio':
        return 'Médio';
      case 'difícil':
        return 'Difícil';
      default:
        return 'Fácil';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return '#10b981';
    if (percentage >= 50) return '#3b82f6';
    if (percentage > 0) return '#f59e0b';
    return '#94a3b8';
  }

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
}
