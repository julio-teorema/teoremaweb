import { Injectable, inject, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TicketFilterParams, TicketMassiveResponse, TicketDetail, TaskProgressResponse, TimeEntry } from '@org/shared/models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listMassive(filters: TicketFilterParams = {}): Observable<TicketMassiveResponse> {
    let params = new HttpParams();

    if (filters.situation) {
      params = params.set('situation', filters.situation);
    }
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    if (filters.responsible_id) {
      params = params.set('responsible_id', filters.responsible_id);
    }
    if (filters.developer_id) {
      params = params.set('developer_id', filters.developer_id);
    }

    return this.http.get<TicketMassiveResponse>(
      `${this.baseUrl}/tickets`,
      { params }
    );
  }

  getById(id: string): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.baseUrl}/tickets/${id}`);
  }

  addComment(ticketId: string, payload: { observation: string; user_id: string; user: { name: string }; pub: boolean }): Observable<TicketDetail> {
    return this.http.post<{ success: boolean; data: TicketDetail; message: string }>(`${this.baseUrl}/tickets/${ticketId}/details`, payload)
      .pipe(
        // Extrair o ticket da resposta
        map(response => response.data)
      );
  }

  getTasksProgress(ticketId: string): Observable<TaskProgressResponse[]> {
    return this.http.get<TaskProgressResponse[]>(`${this.baseUrl}/tasks/progress/${ticketId}`);
  }

  patchTicket(ticketId: string, fields: Record<string, unknown>): Observable<TicketDetail[]> {
    return this.http.patch<TicketDetail[]>(`${this.baseUrl}/tickets/patch-multiple`, [
      { id: ticketId, ...fields },
    ]);
  }

  startTimeEntry(ticketId: string, payload: {
    description: string;
    user_id: string;
    attendance_type: string;
    type: string;
    department_type: string;
    ticket_status_id?: string;
    task_id?: string;
    system_id?: string;
    start_date: string;
  }): Observable<TicketDetail> {
    return this.http.post<{ success: boolean; data: TicketDetail; message: string }>(`${this.baseUrl}/tickets/${ticketId}/timeentry/start`, payload)
      .pipe(
        map(response => response.data)
      );
  }

  stopTimeEntry(ticketId: string, payload: {
    time_entry_id: string;
    end_date: string;
  }): Observable<TicketDetail> {
    return this.http.post<{ success: boolean; data: TicketDetail; message: string }>(`${this.baseUrl}/tickets/${ticketId}/timeentry/stop`, payload)
      .pipe(
        map(response => response.data)
      );
  }

  getActiveTimeEntry(ticketId: string, userId: string): Observable<TimeEntry | null> {
    return this.http.get<{ success: boolean; data: TimeEntry | null; message: string }>(`${this.baseUrl}/tickets/${ticketId}/timeentry/active?user_id=${userId}`)
      .pipe(
        map(response => response.data)
      );
  }
}
