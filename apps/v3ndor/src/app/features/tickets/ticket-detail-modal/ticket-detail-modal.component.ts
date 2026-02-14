import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TicketService } from '@org/shared/services';
import {
  TicketDetail,
  TicketTimelineEntry,
  TicketComment,
  TicketTask,
  TicketDocument,
  TicketLog,
} from '@org/shared/models';
import { TicketInfoPanelComponent } from './ticket-info-panel/ticket-info-panel.component';
import { TicketActionsComponent } from './ticket-actions/ticket-actions.component';
import { TicketTimelineComponent } from './ticket-timeline/ticket-timeline.component';
import { TicketActionBarComponent } from './ticket-action-bar/ticket-action-bar.component';

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    SkeletonModule,
    TagModule,
    ButtonModule,
    CheckboxModule,
    TicketInfoPanelComponent,
    TicketActionsComponent,
    TicketTimelineComponent,
    TicketActionBarComponent,
  ],
  templateUrl: './ticket-detail-modal.component.html',
  styleUrls: ['./ticket-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailModalComponent implements OnChanges {
  private readonly ticketService = inject(TicketService);

  @Input() ticketId: string | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ticketUpdated = new EventEmitter<TicketDetail>();

  ticket = signal<TicketDetail | null>(null);
  loading = signal(false);
  timelineEntries = signal<TicketTimelineEntry[]>([]);

  headerTitle = computed(() => {
    const t = this.ticket();
    if (!t) return 'Carregando...';
    const creationDate = t.created_at ? this.formatDateShort(t.created_at) : '';
    return creationDate ? `#${t.ticket_number_teorema} - ${creationDate}` : `#${t.ticket_number_teorema}`;
  });

  activeLog = computed(() => {
    const t = this.ticket();
    if (!t?.ticket_logs) return null;
    return t.ticket_logs.find(log => log.start_date && !log.end_date) ?? null;
  });

  formatDateShort(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticketId'] && this.ticketId && this.visible) {
      this.loadTicket(this.ticketId);
    }
    if (changes['visible'] && this.visible && this.ticketId) {
      this.loadTicket(this.ticketId);
    }
  }

  onHide(): void {
    this.visibleChange.emit(false);
    this.ticket.set(null);
    this.timelineEntries.set([]);
  }

  onCommentAdded(ticket: TicketDetail): void {
    this.ticket.set(ticket);
    this.timelineEntries.set(this.buildTimeline(ticket));
    this.ticketUpdated.emit(ticket);
  }

  onTimeEntryAdded(ticket: TicketDetail): void {
    this.ticket.set(ticket);
    this.timelineEntries.set(this.buildTimeline(ticket));
    this.ticketUpdated.emit(ticket);
  }

  onTicketUpdated(ticket: TicketDetail): void {
    this.ticket.set(ticket);
    this.timelineEntries.set(this.buildTimeline(ticket));
    this.ticketUpdated.emit(ticket);
  }

  private loadTicket(id: string): void {
    this.loading.set(true);
    this.ticketService.getById(id).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.timelineEntries.set(this.buildTimeline(data));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private buildTimeline(ticket: TicketDetail): TicketTimelineEntry[] {
    const entries: TicketTimelineEntry[] = [];

    // Comments
    if (ticket.details) {
      for (const detail of ticket.details) {
        if (detail.observation?.trim()) {
          entries.push(this.commentToEntry(detail));
        }
      }
    }

    // Tasks
    if (ticket.tasks) {
      for (const task of ticket.tasks) {
        entries.push(this.taskToEntry(task));
      }
    }

    // Documents
    if (ticket.documents) {
      for (const doc of ticket.documents) {
        entries.push(this.documentToEntry(doc));
      }
    }

    // Logs
    if (ticket.ticket_logs) {
      for (const log of ticket.ticket_logs) {
        entries.push(this.logToEntry(log));
      }
    }

    // Opened event
    entries.push({
      type: 'opened',
      date: ticket.created_at,
      icon: 'pi pi-plus-circle',
      color: '#10b981',
      title: 'Chamado aberto',
      description: ticket.summary ?? '',
      user: ticket.user_opened?.name ?? '',
    });

    // Sort desc by date
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return entries;
  }

  private commentToEntry(detail: TicketComment): TicketTimelineEntry {
    // Extrair nome do usuário de forma segura
    let userName = '';
    if (typeof detail.user === 'string') {
      userName = detail.user;
    } else if (detail.user && typeof detail.user === 'object' && 'name' in detail.user) {
      userName = (detail.user as { name: string }).name;
    }

    return {
      type: 'comment',
      date: detail.created_at,
      icon: 'pi pi-comment',
      color: '#3b82f6',
      title: 'Comentário',
      description: detail.observation,
      user: userName,
      data: detail,
    };
  }

  private taskToEntry(task: TicketTask): TicketTimelineEntry {
    return {
      type: 'task',
      date: task.created_at,
      icon: 'pi pi-check-square',
      color: '#8b5cf6',
      title: task.finished ? 'Tarefa concluída' : 'Tarefa criada',
      description: task.description,
      user: task.user?.name ?? '',
      data: task,
    };
  }

  private documentToEntry(doc: TicketDocument): TicketTimelineEntry {
    return {
      type: 'attachment',
      date: doc.created_at ?? '',
      icon: 'pi pi-paperclip',
      color: '#f59e0b',
      title: 'Anexo',
      description: doc.file_name ?? doc.name ?? 'Documento',
      data: doc,
    };
  }

  private logToEntry(log: TicketLog): TicketTimelineEntry {
    const isOpen = !!log.start_date && !log.end_date;
    return {
      type: 'log',
      date: log.start_date ?? log.created_at,
      icon: isOpen ? 'pi pi-spin pi-clock' : 'pi pi-clock',
      color: isOpen ? '#ef4444' : '#6366f1',
      title: isOpen ? 'Apontamento em andamento' : 'Apontamento',
      description: log.description ?? '',
      user: log.user?.name ?? '',
      data: log,
      startDate: log.start_date,
      endDate: log.end_date,
      isOpen,
    };
  }
}
