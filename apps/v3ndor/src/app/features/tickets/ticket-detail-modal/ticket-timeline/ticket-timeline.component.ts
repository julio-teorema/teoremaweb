import { ChangeDetectionStrategy, Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { TicketTimelineEntry, TimelineCommentData } from '@org/shared/models';

export type TimelineFilter = 'all' | 'comments' | 'timeentries' | 'tasks' | 'attachments' | 'opened';

@Component({
  selector: 'app-ticket-timeline',
  standalone: true,
  imports: [CommonModule, TimelineModule, ButtonModule],
  templateUrl: './ticket-timeline.component.html',
  styleUrls: ['./ticket-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketTimelineComponent {
  @Input() set entries(value: TicketTimelineEntry[]) {
    this.entriesSignal.set(value);
  }

  @Input() highlightedEntryId: string | null = null;

  filter = signal<TimelineFilter>('all');
  entriesSignal = signal<TicketTimelineEntry[]>([]);

  filteredEntries = computed(() => {
    const filterType = this.filter();
    const allEntries = this.entriesSignal();

    switch (filterType) {
      case 'comments':
        return allEntries.filter(entry => entry.type === 'comment');
      case 'timeentries':
        return allEntries.filter(entry => entry.type === 'log' || entry.type === 'timeentry');
      case 'tasks':
        return allEntries.filter(entry => entry.type === 'task');
      case 'attachments':
        return allEntries.filter(entry => entry.type === 'attachment');
      case 'opened':
        return allEntries.filter(entry => entry.type === 'opened');
      case 'all':
      default:
        return allEntries;
    }
  });

  setFilter(filterType: TimelineFilter): void {
    this.filter.set(filterType);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  calcDuration(start: string | null | undefined, end: string | null | undefined): string {
    if (!start || !end) return '';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return '';
    const totalMin = Math.floor(diff / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `${h}h${m > 0 ? m + 'min' : ''}`;
    return `${m}min`;
  }

  isEntryHighlighted(entry: TicketTimelineEntry): boolean {
    if (!entry.data) return false;

    // Type guard para verificar se é TimelineCommentData
    const isCommentData = (data: unknown): data is TimelineCommentData => {
      return typeof data === 'object' && data !== null && 'id' in data;
    };

    return isCommentData(entry.data) ? entry.data.id === this.highlightedEntryId : false;
  }
}
