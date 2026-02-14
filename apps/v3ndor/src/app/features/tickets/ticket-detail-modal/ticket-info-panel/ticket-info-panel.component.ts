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
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TicketService } from '@org/shared/services';
import { TicketDetail } from '@org/shared/models';

@Component({
  selector: 'app-ticket-info-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    CheckboxModule,
    TooltipModule,
    InputNumberModule,
    DatePickerModule,
    ToggleSwitchModule,
    InputTextModule,
    SelectButtonModule,
    ButtonModule,
  ],
  templateUrl: './ticket-info-panel.component.html',
  styleUrls: ['./ticket-info-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketInfoPanelComponent {
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);

  @Input({ required: true }) ticket!: TicketDetail;
  @Output() ticketUpdated = new EventEmitter<TicketDetail>();

  editingField = signal<string | null>(null);
  saving = signal(false);

  // Editable field temp values
  editPriority = 0;
  editExpectedDate: Date | null = null;
  editUrgent = false;
  editResponsibleName = '';
  editDeveloperName = '';
  editStatusDescription = '';

  // Novos campos editáveis (ordem de importância)
  editCustomerId = '';
  editSystemId = '';
  editRequester = '';
  editResponsibleId = '';
  editStatusId = '';
  editDeveloperId = '';
  editEmail = '';
  editPhone = '';
  editAnalysisExpectedDate: Date | null = null;
  editDevelopmentExpectedDate: Date | null = null;
  editEstimatedEffort: number | null = null;
  editType = '';
  editTicketTypeId = '';

  // Dados para seleções (tipos definidos)
  customers = signal<{ id: string; name: string }[]>([]);
  systems = signal<{ id: string; description: string }[]>([]);
  users = signal<{ id: string; name: string }[]>([]);
  statuses = signal<{ id: string; description: string }[]>([]);
  ticketTypes = signal<{ id: string; description: string }[]>([]);

  startEdit(field: string): void {
    this.editingField.set(field);

    // Inicializar valores temporários
    switch (field) {
      case 'priority':
        this.editPriority = this.ticket.priority;
        break;
      case 'expected_date':
        this.editExpectedDate = this.ticket.expected_date ? new Date(this.ticket.expected_date) : null;
        break;
      case 'urgent':
        this.editUrgent = this.ticket.urgent === 1;
        break;
      case 'customer_id':
        this.editCustomerId = (this.ticket.customer as any)?.id || '';
        break;
      case 'system_id':
        this.editSystemId = this.ticket.system?.id || '';
        break;
      case 'requester':
        this.editRequester = this.ticket.requester || '';
        break;
      case 'responsible_id':
        this.editResponsibleId = this.ticket.responsible?.id || '';
        break;
      case 'ticket_status_id':
        this.editStatusId = this.ticket.status?.id || '';
        break;
      case 'developer_id':
        this.editDeveloperId = this.ticket.developer?.id || '';
        break;
      case 'estimated_effort':
        this.editEstimatedEffort = this.ticket.estimated_effort;
        break;
      case 'analysis_expected_date':
        this.editAnalysisExpectedDate = this.ticket.analysis_expected_date ?
          new Date(this.ticket.analysis_expected_date) : null;
        break;
      case 'development_expected_date':
        this.editDevelopmentExpectedDate = this.ticket.development_expected_date ?
          new Date(this.ticket.development_expected_date) : null;
        break;
      case 'type':
        this.editType = this.ticket.type || '';
        break;
      case 'ticket_type_id':
        this.editTicketTypeId = this.ticket.ticket_type?.id || '';
        break;
      case 'email':
        this.editEmail = this.ticket.email || '';
        break;
      case 'phone':
        this.editPhone = this.ticket.phone || '';
        break;
    }
  }

  cancelEdit(): void {
    this.editingField.set(null);
  }

  // Utilitário para formatação de datas
  private formatDateForAPI(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  saveField(field: string): void {
    let payload: Record<string, unknown> = {};

    switch (field) {
      case 'priority':
        payload = { priority: this.editPriority };
        break;
      case 'expected_date':
        payload = { expected_date: this.formatDateForAPI(this.editExpectedDate) };
        break;
      case 'urgent':
        payload = { urgent: this.editUrgent };
        break;
      case 'customer_id':
        payload = { customer_id: this.editCustomerId };
        break;
      case 'system_id':
        payload = { system_id: this.editSystemId };
        break;
      case 'requester':
        payload = { requester: this.editRequester };
        break;
      case 'responsible_id':
        payload = { responsible_id: this.editResponsibleId };
        break;
      case 'ticket_status_id':
        payload = { ticket_status_id: this.editStatusId };
        break;
      case 'developer_id':
        payload = { developer_id: this.editDeveloperId };
        break;
      case 'estimated_effort':
        payload = { estimated_effort: this.editEstimatedEffort };
        break;
      case 'analysis_expected_date':
        payload = { analysis_expected_date: this.formatDateForAPI(this.editAnalysisExpectedDate) };
        break;
      case 'development_expected_date':
        payload = { development_expected_date: this.formatDateForAPI(this.editDevelopmentExpectedDate) };
        break;
      case 'type':
        payload = { type: this.editType };
        break;
      case 'ticket_type_id':
        payload = { ticket_type_id: this.editTicketTypeId };
        break;
      case 'email':
        payload = { email: this.editEmail };
        break;
      case 'phone':
        payload = { phone: this.editPhone };
        break;
    }

    this.saving.set(true);
    this.ticketService.patchTicket(this.ticket.id, payload).subscribe({
      next: () => {
        this.applyLocal(field);
        this.saving.set(false);
        this.editingField.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Salvo',
          detail: 'Campo atualizado com sucesso',
          life: 2000,
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao salvar campo',
          life: 4000,
        });
      },
    });
  }

  toggleUrgent(): void {
    this.saving.set(true);
    this.ticketService.patchTicket(this.ticket.id, { urgent: !this.ticket.urgent }).subscribe({
      next: () => {
        this.ticket.urgent = this.editUrgent ? 1 : 0;
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Salvo',
          detail: 'Urgência atualizada',
          life: 2000,
        });
      },
      error: () => {
        this.editUrgent = this.ticket.urgent === 1;
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

  // Métodos específicos para Situação
  closeTicket(): void {
    this.saving.set(true);
    this.ticketService.patchTicket(this.ticket.id, { situation: 'F' }).subscribe({
      next: () => {
        this.ticket.situation = 'F';
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Chamado Fechado',
          detail: 'Chamado fechado com sucesso',
          life: 2000,
        });
        this.ticketUpdated.emit(this.ticket);
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
    this.saving.set(true);
    this.ticketService.patchTicket(this.ticket.id, { situation: 'A' }).subscribe({
      next: () => {
        this.ticket.situation = 'A';
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Chamado Reaberto',
          detail: 'Chamado reaberto com sucesso',
          life: 2000,
        });
        this.ticketUpdated.emit(this.ticket);
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

  private applyLocal(field: string): void {
    switch (field) {
      case 'priority':
        this.ticket.priority = this.editPriority;
        break;
      case 'expected_date':
        this.ticket.expected_date = this.editExpectedDate
          ? this.editExpectedDate.toISOString().split('T')[0]
          : null;
        break;
      case 'urgent':
        this.ticket.urgent = this.editUrgent ? 1 : 0;
        break;
    }
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateShort(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }
}
