import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TicketService } from '@org/shared/services';
import { TicketDetail } from '@org/shared/models';

@Component({
  selector: 'app-ticket-actions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    ToggleSwitchModule,
    ButtonModule,
    ConfirmDialogModule,
  ],
  templateUrl: './ticket-actions.component.html',
  styleUrls: ['./ticket-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketActionsComponent {
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  @Input({ required: true }) ticket!: TicketDetail;
  @Output() ticketUpdated = new EventEmitter<TicketDetail>();

  saving = signal(false);

  closeTicket(): void {
    this.confirmationService.confirm({
      header: 'Confirmar Fechamento',
      message: 'Tem certeza que deseja fechar este chamado?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Fechar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm p-button-outlined',
      accept: () => {
        this.executeCloseTicket();
      }
    });
  }

  private executeCloseTicket(): void {
    this.saving.set(true);
    this.ticketService.patchTicket(this.ticket.id, { situation: 'F' }).subscribe({
      next: () => {
        this.ticket.situation = 'F';
        this.saving.set(false);
        this.ticketUpdated.emit(this.ticket);
        this.messageService.add({
          severity: 'success',
          summary: 'Chamado Fechado',
          detail: 'Chamado fechado com sucesso',
          life: 2000,
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao fechar chamado',
          life: 4000,
        });
      },
    });
  }

  reopenTicket(): void {
    this.confirmationService.confirm({
      header: 'Confirmar Reabertura',
      message: 'Tem certeza que deseja reabrir este chamado?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Reabrir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm p-button-outlined',
      accept: () => {
        this.executeReopenTicket();
      }
    });
  }

  private executeReopenTicket(): void {
    this.saving.set(true);
    this.ticketService.patchTicket(this.ticket.id, { situation: 'A' }).subscribe({
      next: () => {
        this.ticket.situation = 'A';
        this.saving.set(false);
        this.ticketUpdated.emit(this.ticket);
        this.messageService.add({
          severity: 'success',
          summary: 'Chamado Reaberto',
          detail: 'Chamado reaberto com sucesso',
          life: 2000,
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao reabrir chamado',
          life: 4000,
        });
      },
    });
  }

  toggleUrgent(): void {
    this.saving.set(true);
    const newUrgent = this.ticket.urgent === 1 ? 0 : 1;

    this.ticketService.patchTicket(this.ticket.id, { urgent: newUrgent }).subscribe({
      next: () => {
        this.ticket.urgent = newUrgent;
        this.saving.set(false);
        this.ticketUpdated.emit(this.ticket);
        this.messageService.add({
          severity: 'success',
          summary: 'Urgência Atualizada',
          detail: `Chamado marcado como ${newUrgent === 1 ? 'Urgente' : 'Normal'}`,
          life: 2000,
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao atualizar urgência',
          life: 4000,
        });
      },
    });
  }
}
