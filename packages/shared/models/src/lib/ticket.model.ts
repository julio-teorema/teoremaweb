export interface Ticket {
  id: string;
  ref: string;
  created_at: string;
  ticket_number_teorema: string;
  expected_date: string | null;
  summary: string | null;
  situation: string;
  type: string;
  problem: string;
  estimated_effort: number | null;
  commercial_estimated_effort: number | null;
  view_index: number | null;
  priority: number;
  project: string | null;
  issue: string | null;
  phase: string | null;
  sprint: string | null;
  analysis_expected_date: string | null;
  development_expected_date: string | null;
  urgent: number;
  status: string;
  ticket_type: string;
  ticket_tags: string[];
  tasks: unknown[];
  customer_name: string;
  system: string;
  developer: string | null;
  responsible: string;
  count_documents: number;
}

export interface TicketMassive {
  id: string;
  ref: string;
  ticket_number_teorema: string;
  created_at: string;
  summary: string | null;
  situation: string;
  priority: number;
  urgent: number;
  expected_date: string | null;
  customer_name: string;
  system_description: string;
  system: { description: string };
  status: { description: string };
  responsible: { name: string } | null;
  developer: { name: string } | null;
  count_tasks: number;
  count_documents: number;
}

export interface TicketStatus {
  id?: string;
  description: string;
}

export interface TicketUser {
  id: string;
  name: string;
  email?: string;
}

export interface TicketComment {
  id?: string;
  observation: string;
  pub: boolean | number;
  dark_side?: boolean;
  user_id?: string;
  user?: string | { name: string };
  created_at: string;
}

export interface TicketTask {
  id: string;
  description: string;
  summary: string;
  estimated_effort: number | null;
  finished: boolean;
  expected_date: string | null;
  original_expected_date: string | null;
  sequence: number;
  difficulty: string;
  status: TicketStatus | null;
  user: TicketUser | null;
  created_at: string;
}

export interface TicketDocument {
  id: string;
  name?: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at?: string;
}

export interface TicketLog {
  id: string;
  active?: boolean;
  ref?: string;
  attendance_type?: string;
  department_type?: string;
  description?: string;
  process?: string;
  situation?: number | string;
  type?: string;
  start_date: string | null;
  end_date: string | null;
  status?: TicketStatus | null;
  user?: TicketUser | null;
  user_id?: string;
  task?: { id: string; description: string } | null;
  task_id?: string;
  system?: { id?: string; description?: string } | null;
  system_id?: string;
  ticket_id?: string;
  ticket_status_id?: string;
  created_at: string;
}

export interface TicketTag {
  id: string;
  tag: { id: string; description: string };
}

export interface TicketDetail {
  id: string;
  ref: string;
  created_at: string;
  updated_at?: string;
  ticket_number_teorema: string;
  expected_date: string | null;
  summary: string | null;
  status: TicketStatus | null;
  customer_name: string;
  customer_code?: string;
  customer_document?: string;
  situation: string;
  system: { id?: string; description: string } | null;
  user_opened?: TicketUser | null;
  developer: TicketUser | null;
  executor?: TicketUser | null;
  responsible: TicketUser | null;
  ticket_type: { id?: string; description?: string } | null;
  type: string;
  agent?: string;
  problem: string;
  ticket_logs: TicketLog[];
  details: TicketComment[];
  documents: TicketDocument[];
  tasks: TicketTask[];
  ticketUsers: { id: string; user_type: string; user: TicketUser }[];
  participants?: TicketUser[];
  estimated_effort: number | null;
  commercial_estimated_effort: number | null;
  view_index: number | null;
  ticket_tags: TicketTag[];
  solution: string | null;
  observation: string | null;
  email: string | null;
  priority: number;
  customer?: unknown;
  company?: unknown;
  project: string | null;
  issue: string | null;
  phase: string | null;
  sprint: string | null;
  analysis_expected_date: string | null;
  development_expected_date: string | null;
  urgent: number;
  requester?: string | null;
  phone?: string | null;
  release_situation?: string | null;
}

export type TimelineEntryType = 'comment' | 'attachment' | 'task' | 'log' | 'opened' | 'timeentry';

export interface TimelineCommentData {
  id: string;
  observation: string;
  pub: boolean | number;
  dark_side?: boolean;
  user_id?: string;
  user?: string | { name: string };
  created_at: string;
}

export interface TicketTimelineEntry {
  type: TimelineEntryType;
  date: string;
  icon: string;
  color: string;
  title: string;
  description?: string;
  user?: string;
  data?: TimelineCommentData | TicketLog | TicketTask | TicketDocument | unknown;
  startDate?: string | null;
  endDate?: string | null;
  isOpen?: boolean;
}

export interface TaskProgressResponse {
  estimatedPoints: number | null;
  effectiveMinutes: number;
  estimatedMinutes: number;
  percentage: number;
  effectivePoints?: number;
}

export interface TimeEntry {
  id?: string;
  description: string;
  attendance_type: string; // Interno | Externo
  type: string; // Acompanhamento | Erro | Manutenção | Inovação
  department_type: string; // Analise | Desenvolvimento Delphi | Desenvolvimento Java | Externo
  ticket_status_id?: string;
  task_id?: string;
  start_date: string;
  end_date?: string;
  duration?: number;
  user_id?: string;
  user?: string;
  created_at: string;
}

export interface TicketFilterParams {
  situation?: string;
  date_from?: string;
  date_to?: string;
  responsible_id?: string;
  developer_id?: string;
}

export interface TicketMassiveResponse {
  total: number;
  data: TicketMassive[];
}
