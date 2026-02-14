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
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TicketService } from '@org/shared/services';
import { TimeEntry } from '@org/shared/models';

@Component({
  selector: 'app-active-time-entry',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './active-time-entry.component.html',
  styleUrls: ['./active-time-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveTimeEntryComponent {
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);

  @Input({ required: true }) ticketId!: string;
  @Input() activeTimeEntry: TimeEntry | null = null;
  @Output() timeEntryStopped = new EventEmitter<void>();

  sending = signal(false);

  onStopTimeEntry(): void {
    if (!this.activeTimeEntry?.id) return;

    this.sending.set(true);

    this.ticketService
      .stopTimeEntry(this.ticketId, {
        time_entry_id: this.activeTimeEntry.id,
        end_date: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.timeEntryStopped.emit();
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Apontamento encerrado',
            life: 3000,
          });
        },
        error: () => {
          this.sending.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao encerrar apontamento',
            life: 5000,
          });
        },
      });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
