import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { AuthService } from '@org/core/auth';
import { TicketService } from '@org/shared/services';
import { TicketDetail, TicketLog } from '@org/shared/models';
import { TimeEntryModalComponent } from '../time-entry-modal/time-entry-modal.component';

export type ActionType = 'comment' | 'attachment' | 'timeentry';

@Component({
  selector: 'app-ticket-action-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextareaModule,
    ButtonModule,
    TimeEntryModalComponent,
  ],
  templateUrl: './ticket-action-bar.component.html',
  styleUrls: ['./ticket-action-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketActionBarComponent {
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);

  @Input({ required: true }) set ticket(value: TicketDetail) {
    this._ticket = value;
    // Atualizar apontamento ativo quando o ticket mudar
    this.updateActiveTimeEntry();
  }

  get ticket(): TicketDetail {
    return this._ticket;
  }

  private _ticket!: TicketDetail;
  @Output() commentAdded = new EventEmitter<TicketDetail>();
  @Output() timeEntryAdded = new EventEmitter<TicketDetail>();
  @Output() attachmentAdded = new EventEmitter<TicketDetail>();

  activeAction = signal<ActionType>('comment');
  commentText = signal('');
  sending = signal(false);

  // TimeEntry properties
  showTimeEntryModal = signal(false);
  activeTimeEntry = signal<TicketLog | null>(null);

  // Detectar apontamento ativo
  private findActiveTimeEntry(): TicketLog | null {
    const timeEntries = this.getTimeEntries();
    return timeEntries.find(entry => !entry.end_date) || null;
  }

  // Obter label do botão de apontamento
  getApontamentoButtonLabel(): string {
    const activeEntry = this.findActiveTimeEntry();
    if (activeEntry && activeEntry.user?.name) {
      return `Apontamento (${activeEntry.user.name})`;
    }
    return 'Apontamento';
  }

  // Obter severity do botão de apontamento
  getApontamentoButtonSeverity(): 'secondary' | 'danger' {
    const activeEntry = this.findActiveTimeEntry();
    return activeEntry ? 'danger' : 'secondary';
  }

  uploading = signal(false);

  setAction(type: ActionType): void {
    this.activeAction.set(type);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const ticketNumber = this.ticket?.ticket_number_teorema;

    if (!ticketNumber) {
      console.error('Ticket number não encontrado');
      return;
    }

    this.uploading.set(true);

    this.ticketService.uploadDocument(ticketNumber, file).subscribe({
      next: (updatedTicket) => {
        this.uploading.set(false);
        this.attachmentAdded.emit(updatedTicket);
        this.activeAction.set('comment');
        input.value = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Anexo enviado com sucesso',
          life: 3000,
        });
      },
      error: (error) => {
        this.uploading.set(false);
        console.error('Erro ao fazer upload do anexo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao enviar anexo',
          life: 5000,
        });
      },
    });
  }

  onSendComment(): void {
    const text = this.commentText().trim();
    if (!text) return;

    const user = this.authService.currentUser();
    if (!user) return;

    this.sending.set(true);

    this.ticketService
      .addComment(this.ticket.id, {
        observation: text,
        user_id: user.id,
        user: { name: user.name },
        pub: false,
      })
      .subscribe({
        next: (updatedTicket) => {
          this.commentText.set('');
          this.sending.set(false);
          this.commentAdded.emit(updatedTicket);
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Comentário adicionado',
            life: 3000,
          });
        },
        error: () => {
          this.sending.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao adicionar comentário',
            life: 5000,
          });
        },
      });
  }

  getTimeEntries(): TicketLog[] {
    if (!this.ticket?.ticket_logs) return [];
    return this.ticket.ticket_logs
      .filter(log => log.type === 'Apontamento' || log.type === 'Manutenção' || log.type === 'Erro' || log.type === 'Inovação' || log.type === 'Acompanhamento')
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateB - dateA;
      });
  }

  openTimeEntryModal(): void {
    // Detectar apontamento ativo antes de abrir o modal
    const activeEntry = this.findActiveTimeEntry();
    this.activeTimeEntry.set(activeEntry);

    this.showTimeEntryModal.set(true);
  }

  closeTimeEntryModal(): void {
    this.showTimeEntryModal.set(false);
  }

  onTimeEntryModalSaved(ticket: TicketDetail): void {
    // Atualizar ticket local com dados retornados do backend
    this._ticket = ticket;

    this.timeEntryAdded.emit(ticket);
    this.closeTimeEntryModal();
    // Atualizar apontamento ativo após salvar
    this.updateActiveTimeEntry();
  }

  onStopTimeEntry(): void {
    // Limpar apontamento ativo imediatamente
    this.activeTimeEntry.set(null);

    // Recarregar ticket para obter dados atualizados do apontamento encerrado
    this.ticketService.getById(this.ticket.id).subscribe({
      next: (updatedTicket: TicketDetail) => {
        this.ticket = updatedTicket;
        this.timeEntryAdded.emit(updatedTicket); // Emitir ticket atualizado
      },
      error: (err: { message?: string; status?: number; error?: string }) => {
        console.error('Erro ao recarregar ticket após encerrar apontamento:', err);
      }
    });
  }

  // Sobrescrever para atualizar apontamentos ativos quando ticket mudar
  private updateActiveTimeEntry() {
    const activeEntry = this.findActiveTimeEntry();
    this.activeTimeEntry.set(activeEntry);
  }
}
