/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager' | 'staff' | 'cliente' | 'partner';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  functions?: string[];
  active?: boolean;
  createdAt: number;
  projectIds?: Record<string, boolean>;
  telefono?: string;
  pending?: boolean;
  sector?: 'studio' | 'strategico' | 'materico' | 'partner';
  // Controllo accessi (Firebase)
  status?: 'pending' | 'approved' | 'rejected';
  photoURL?: string;
  approvedBy?: string;
  approvedAt?: number;
}

export interface ProjectTask {
  id?: string;
  title: string;
  order: number;
  done: boolean;
  role?: string | null;
  assignee?: string | null;
  due?: string | null;
}

export interface Phase {
  id?: string;
  name: string;
  order: number;
  tasks: Record<string, ProjectTask>;
}

export interface Project {
  id: string;
  name: string;
  code?: string | null;
  client?: string | null;
  location?: string | null;
  manager?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  status: 'attivo' | 'completato' | 'sospeso' | 'annullato';
  icon?: string;
  templateId?: string | null;
  templateName?: string | null;
  clientUid?: string | null;
  committente?: string | null;
  indirizzoImmobile?: string | null;
  foglio?: string | null;
  particella?: string | null;
  sub?: string | null;
  tipoIntervento?: string | null;
  clientMessage?: string | null;
  clientMessageAt?: number | null;
  clientMessageBy?: string | null;
  phases: Record<string, Phase>;
  createdAt: number;
  updatedAt: number;
  division?: 'studio' | 'strategico' | 'materico' | 'unico';
  marketingBudget?: number;
  marketingChannels?: string;
  marketingGoal?: string;
  matericoEstimatedBudget?: number;
  matericoFinitureType?: string;
  matericoSottofondiStatus?: string;
}

export interface MatericoEstimate {
  id: string;
  projectId: string;
  itemName?: string;
  itemDescription?: string;
  partnerName: string;
  basePrice?: number;
  baseCost?: number;
  markupPercent?: number;
  markupPercentage?: number;
  finalPrice?: number;
  finalClientPrice?: number;
  status: 'richiesto' | 'preventivato_partner' | 'proposto_cliente' | 'accettato' | 'rifiutato' | 'pending_client' | 'approvato';
  notes?: string;
  requestNotes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  priority: 'alta' | 'media' | 'bassa';
  assignee?: string | null;
  projectId?: string | null;
  owner?: string | null;
  notes?: string | null;
  done: boolean;
  completions?: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  _proj?: boolean; // synthesized flag for client-side project task mapping
}

export interface TemplateTask {
  title: string;
  order: number;
  role?: string | null;
}

export interface TemplatePhase {
  name: string;
  order: number;
  tasks: Record<string, TemplateTask>;
}

export interface Template {
  id: string;
  name: string;
  desc?: string | null;
  icon: string;
  builtin?: boolean;
  order: number;
  phases: Record<string, TemplatePhase>;
  createdAt: number;
  createdBy?: string;
}

export interface FinanceMovement {
  id: string;
  kind: 'entrata' | 'uscita';
  desc: string;
  amount: number;
  date: string;
  category: string;
  note?: string | null;
  projectId?: string | null;
  by: string;
  at: number;
}

export interface ProjectMessage {
  id: string;
  from: string;
  role: UserRole;
  name: string;
  text: string;
  at: number;
}

export interface TaskAttachment {
  name: string;
  size?: number;
  type?: string;
  url: string;
  path?: string;
  by: string;
  at: number;
}

export interface TaskMeta {
  note?: string | null;
  attachments?: Record<string, TaskAttachment>;
}

export interface ProjectInternal {
  notes?: string | null;
  taskMeta?: Record<string, Record<string, TaskMeta>>; // phId -> tId -> TaskMeta
}

export interface Appointment {
  id: string;
  title: string;
  date: string;            // ISO yyyy-mm-dd
  time?: string | null;
  ownerUid: string;        // di chi è l'agenda
  ownerName?: string;
  createdBy: string;       // uid creatore
  createdByName?: string;
  withName?: string;       // controparte (cliente/partner/altro)
  note?: string;
  kind: 'appuntamento' | 'nota';
  status: 'confermato' | 'pending' | 'rifiutato';
  projectId?: string | null;
  createdAt: number;
}
