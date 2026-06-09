/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager' | 'staff' | 'cliente' | 'partner';

/** Cosa sceglie l'utente in fase di iscrizione. */
export type AccountType = 'cliente' | 'azienda' | 'team';

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
  sector?: 'studio' | 'strategico' | 'materico' | 'unico' | 'partner' | 'altro';
  // Controllo accessi (Firebase)
  status?: 'pending' | 'approved' | 'rejected';
  photoURL?: string;
  approvedBy?: string;
  approvedAt?: number;
  // ---- Onboarding / iscrizione ----
  accountType?: AccountType;     // cliente | azienda | team (scelto all'iscrizione)
  profileComplete?: boolean;     // true quando il form di registrazione è stato completato
  firstName?: string;
  lastName?: string;
  residenza?: string;            // indirizzo di residenza (privato)
  privacyAccepted?: boolean;
  privacyAcceptedAt?: number;
  // ---- Dati azienda (accountType === 'azienda') ----
  companyName?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  pec?: string;
  sdi?: string;                  // codice destinatario fatturazione elettronica
  companyAddress?: string;       // sede legale
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
  clientRecordId?: string | null;   // anagrafica nella Rubrica clienti (nodo `clients`)
  committente?: string | null;
  indirizzoImmobile?: string | null;
  foglio?: string | null;
  particella?: string | null;
  sub?: string | null;
  tipoIntervento?: string | null;
  interventoEdilizio?: string | null;   // id intervento edilizio (configuratore Studio)
  titoloAbilitativo?: string | null;    // id titolo abilitativo: CILA/SCIA/PdC...
  clientMessage?: string | null;
  clientMessageAt?: number | null;
  clientMessageBy?: string | null;
  phases: Record<string, Phase>;
  createdAt: number;
  updatedAt: number;
  division?: 'studio' | 'strategico' | 'materico' | 'unico';
  studioManagesArrediMobili?: boolean;   // lo Studio cura scelta+approvvigionamento arredi mobili → fee 20%
  studioFeePct?: number;                  // override % onorari Studio (default 0.15)
  arrediMobiliFeePct?: number;            // override % fee arredi mobili (default 0.20)
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

// ---- Unico (lato studio): operazioni immobiliari + investitori ----
export type UnicoDealStatus =
  | 'valutazione'      // immobile individuato, analisi
  | 'acquisizione'     // in fase di acquisto / raccolta capitale
  | 'ristrutturazione' // lavori in corso (via Materico)
  | 'vendita'          // sul mercato
  | 'concluso';        // venduto / operazione chiusa

export interface UnicoInvestor {
  id: string;
  name: string;
  amount: number;        // capitale conferito (€)
  contact?: string | null;
  at: number;
}

export interface UnicoDeal {
  id: string;
  title: string;
  type: string;              // Trullo, Masseria, Villa, Palazzo...
  location: string;
  status: UnicoDealStatus;
  acquisitionCost: number;   // costo di acquisto
  renovationBudget: number;  // budget ristrutturazione (Materico)
  targetSalePrice: number;   // prezzo di rivendita atteso
  capitalGoal: number;       // capitale da raccogliere dagli investitori
  minInvestment?: number;    // quota minima (vetrina)
  targetRoi?: number;        // rendimento atteso annuo % (vetrina)
  durationMonths?: number;
  investors: UnicoInvestor[];
  matericoProjectId?: string | null; // commessa Materico collegata (ristrutturazione)
  published?: boolean;       // pubblicato nella vetrina Unico
  notes?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface Furnishing {
  id: string;
  projectId: string;
  kind: 'fisso' | 'mobile';                 // fisso = impatto progettuale; mobile = estetico
  category?: string | null;                  // es. 'Sanitari','Cucina','Armadi a incasso','Illuminazione','Tessili'
  title: string;
  status: 'da_scegliere' | 'proposto' | 'scelto' | 'confermato';
  deadline?: string | null;                  // yyyy-mm-dd (per voce; rilevante per i fissi)
  imageUrl?: string | null;                  // immagine di riferimento (URL incollato)
  link?: string | null;                      // link prodotto/riferimento
  color?: string | null;                     // swatch colore (campioni/moodboard)
  note?: string | null;
  board?: { x: number; y: number; w?: number; rot?: number } | null; // posizione sulla lavagna moodboard
  price?: number | null;                     // prezzo unitario (€) — base parcella arredi
  quantity?: number | null;                  // quantità (default 1)
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  at: number;
  updatedAt?: number;
}

// ============================================================
// Modulo Cantiere (multi-attore studio ↔ impresa partner)
// Nodo `cantieri/<cid>` + sotto-collezioni granulari per-elemento.
// ============================================================
export type CantiereStatus = 'pianificazione' | 'in_corso' | 'sospeso' | 'concluso';

export interface Cantiere {
  id: string;
  projectId: string;
  name: string;
  status: CantiereStatus;
  division: 'studio' | 'materico' | 'unico';
  partnerUids?: Record<string, boolean>;       // imprese partner assegnate
  taskRefs?: Record<string, boolean>;          // '<phId>::<tId>' → riferimenti SOLO lettura ai task del fascicolo
  progressPct?: number | null;                 // avanzamento 0-100 (gestito dallo studio)
  startDate?: string | null;
  dueDate?: string | null;
  location?: string | null;
  notes?: string | null;
  createdBy: string;
  createdByName?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Rapportino {
  id: string;
  date: string;                                // yyyy-mm-dd
  partnerUid: string;
  partnerName?: string;
  meteo?: string | null;
  ore?: number | null;                         // ore lavorate complessive
  descrizione: string;
  fotoIds?: string[];                          // riferimenti a cantiereFoto
  status: 'inviato' | 'approvato' | 'rifiutato';
  approvedBy?: string;                         // solo studio
  at: number;
}

export interface Presenza {
  id: string;
  date: string;
  partnerUid: string;
  lavoratore: string;
  ore: number;
  mansione?: string | null;
  at: number;
}

export interface CantiereFoto {
  id: string;
  driveFileId?: string | null;                 // upload reale su Google Drive
  driveUrl?: string | null;
  link?: string | null;                        // fallback: link incollato
  caption?: string | null;
  by: string;
  role: string;
  at: number;
}

export interface CantiereMateriale {
  id: string;
  desc: string;
  qty: number;
  unit: string;
  tipo: 'consegna' | 'impiego';
  date: string;
  by: string;
  note?: string | null;
  at: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  doneBy?: string | null;
  doneAt?: number | null;
  category?: string | null;
  order: number;
}

export interface CantiereDoc {
  id: string;
  name: string;
  driveFileId?: string | null;
  driveUrl?: string | null;
  link?: string | null;
  section?: string | null;     // sezione di destinazione (es. 'documenti','sicurezza','verbali','permessi'…)
  category?: string | null;    // sotto-categoria libera (es. 'Disegni','Contratti','POS','DURC'…)
  expiry?: string | null;      // yyyy-mm-dd: scadenza documento (DURC/polizze/permessi…)
  by: string;
  role: string;
  at: number;
}

/**
 * Registro voci generico per-cantiere (sezioni "lista" della struttura PDF:
 * non conformità, ordini di servizio, verifica lavorazioni, varianti, collaudi,
 * test, scadenze, cronoprogramma…). Discriminato da `section`.
 */
export interface CantiereRecord {
  id: string;
  section: string;             // es. 'nonconformita','ordini_servizio','cronoprogramma','scadenze'…
  title: string;
  date?: string | null;        // yyyy-mm-dd (data evento/scadenza/inizio)
  dateEnd?: string | null;     // yyyy-mm-dd (fine, per cronoprogramma)
  status?: string | null;      // stato libero per sezione (es. 'aperta','chiusa','in_corso')
  fields?: Record<string, string>; // campi extra specifici della sezione
  note?: string | null;
  by: string;
  byName?: string | null;
  role?: string | null;
  at: number;
}

/** Chat di cantiere (mirror del pattern projectMessages, per-cantiere). */
export interface CantiereMessage {
  id: string;
  from: string;
  role: UserRole;
  name: string;
  text: string;
  at: number;
}

// ---- Area Impresa: profilo dell'impresa partner (riusabile su tutti i suoi cantieri) ----
/** Documentazione impresa: DURC, Visure, Polizze, Certificazioni SOA, Documenti dipendenti. */
export interface ImpresaDoc {
  id: string;
  docType: string;             // es. 'DURC','visura','polizza','SOA','dipendente'
  name: string;
  expiry?: string | null;      // yyyy-mm-dd: scadenza (DURC/polizze…)
  driveFileId?: string | null;
  driveUrl?: string | null;
  link?: string | null;
  note?: string | null;
  by: string;
  at: number;
}

/** Registro voci dell'impresa: squadre, operai, mezzi, attrezzature, DPI, formazione… */
export interface ImpresaRecord {
  id: string;
  section: string;             // es. 'squadre','operai','mezzi','attrezzature','dpi','formazione','incidenti'…
  title: string;
  date?: string | null;
  status?: string | null;
  fields?: Record<string, string>;
  note?: string | null;
  by: string;
  at: number;
}

// ---- Rubrica clienti (anagrafica riutilizzabile, anche senza login) ----
export interface ClientRecord {
  id: string;
  type: 'privato' | 'azienda';
  name: string;                // nome completo o ragione sociale (display)
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;     // residenza / sede legale
  codiceFiscale?: string | null;
  companyName?: string | null; // (azienda)
  partitaIva?: string | null;  // (azienda)
  pec?: string | null;         // (azienda)
  sdi?: string | null;         // (azienda) codice destinatario FE
  accountUid?: string | null;  // opz.: account portale collegato (users/<uid>)
  notes?: string | null;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface CantiereSal {
  id: string;
  number: number;
  periodFrom?: string | null;
  periodTo?: string | null;
  descrizione?: string | null;
  importo?: number | null;
  progressPct?: number | null;
  status: 'bozza' | 'inviato' | 'approvato';
  approvedBy?: string;
  linkedInvoiceId?: string | null;             // collega cantiere ↔ fattura attiva (finanza)
  at: number;
}

export interface CantiereLog {
  id: string;
  action: string;                              // es. 'rapportino.approvato'
  entity: string;                              // es. 'rapportino'
  by: string;
  role: string;
  at: number;
  detail?: string | null;
}

export interface MatericoItem {
  id: string;
  desc: string;
  qty: number;
  unit: string;
}
export interface MatericoOffer {
  partnerUid: string;
  partnerName: string;
  amount: number;
  note?: string;
  at: number;
}
export interface MatericoRequest {
  id: string;
  clientUid: string;
  clientName: string;
  title: string;
  description?: string;
  category?: string;          // tipo di lavorazione (es. "Gres/Pavimenti")
  items?: MatericoItem[];      // quantità inserite dal cliente
  links?: string[];
  note?: string;
  status: 'nuova' | 'inoltrata' | 'offerte' | 'inviata_cliente' | 'accettata' | 'rifiutata';
  forwardedTo?: string[];      // uid partner a cui è stata inoltrata
  offers?: Record<string, MatericoOffer>;
  selectedPartnerUid?: string | null;
  marginPct?: number;
  clientPrice?: number | null; // prezzo finale al cliente (con margine Materico)
  contractText?: string | null;
  createdAt: number;
  updatedAt?: number;
}
