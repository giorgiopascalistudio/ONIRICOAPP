/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Folder,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  AlertTriangle,
  LogOut,
  User,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkle,
  Bell
} from 'lucide-react';

import {
  UserProfile,
  Project,
  Task,
  Template,
  FinanceMovement,
  ProjectMessage,
  ProjectInternal,
  Phase,
  ProjectTask,
  TaskAttachment,
  MatericoEstimate,
  Appointment,
  MatericoRequest,
  UnicoDeal,
  Furnishing,
  Cantiere,
  Rapportino,
  Presenza,
  CantiereFoto,
  CantiereMateriale,
  ChecklistItem,
  CantiereDoc,
  CantiereSal,
  CantiereLog,
  CantiereRecord,
  CantiereMessage,
  ImpresaDoc,
  ImpresaRecord,
  ClientRecord,
  Notification,
  TeamLeave,
  Quote,
  PaymentMilestone,
  TrashItem
} from './types';

import {
  SEED_USERS,
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_FINANCE,
  SEED_TEMPLATES,
  SEED_INTERNAL,
  SEED_ESTIMATES,
  MANSIONI
} from './constants';

import {
  isoDate,
  todayISO,
  fmtDay,
  eur,
  initials,
  avColor,
  sameDay
} from './utils';

import {
  INTERVENTI_EDILIZI,
  TITOLI_ABILITATIVI,
  STUDIO_CATEGORIE_BY_FASE,
  buildStudioPhases,
  studioSummary,
  interventoById,
  interventoLabel,
  DEFAULT_INTERVENTO
} from './studioConfig';

// Subviews
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { ProjectsView } from './components/ProjectsView';
import { ClientPortalView } from './components/ClientPortalView';
import { FinanzeView } from './components/FinanzeView';
import { TeamView } from './components/TeamView';
import { InteractiveView } from './components/InteractiveView';

// Subcomponents
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Modal } from './components/Modal';
import { AppleSwitch } from './components/AppleSwitch';
import { injectSmartTextStyles } from './components/SmartText';
import { AuthFlow } from './components/AuthFlow';
import { AccessRequests } from './components/AccessRequests';
import { DocumentsView } from './components/DocumentsView';
import { CrmView, type Lead, type Supplier } from './components/CrmView';
import { ConfirmDeleteModal, type ConfirmDeleteRequest } from './components/ConfirmDeleteModal';
import { TrashView, TRASH_RETENTION_DAYS } from './components/TrashView';
import {
  watchAuth,
  logoutGoogle,
  watchAccounts,
  watchOwnAccount,
  getAccounts,
  setAccount,
  updateAccount,
  removeAccount,
  watchNode,
  getNode,
  writeNode,
  updateNode,
  removeNode,
  type User as GUser
} from './firebase';

import {
  Computo,
  InvoiceActive,
  InvoicePassive,
  ScadenzaItem
} from './finance';

interface Toast {
  id: string;
  msg: string;
  type?: 'ok' | 'err';
}

// Metadati divisioni (settori): il modale "nuova commessa" si adatta al settore selezionato in Progetti.
const DIVISION_META: Record<'studio' | 'strategico' | 'materico' | 'unico', { label: string; color: string; desc: string; cta: string }> = {
  studio: { label: 'Studio', color: '#161616', desc: 'Architettura, pratiche edilizie e catasto', cta: 'Crea pratica Studio' },
  strategico: { label: 'Strategico', color: '#b45309', desc: 'Marketing, brand e campagne', cta: 'Crea progetto Strategico' },
  materico: { label: 'Materico', color: '#c2410c', desc: 'Forniture e posa con partner', cta: 'Crea commessa Materico' },
  unico: { label: 'Unico', color: '#4338ca', desc: 'Atelier di lusso su misura', cta: 'Crea progetto Unico' }
};

const projTaskCounts = (p: Project) => {
  let done = 0, tot = 0;
  Object.values(p.phases || {}).forEach(ph => {
    Object.values(ph.tasks || {}).forEach(t => {
      tot++;
      if (t.done) done++;
    });
  });
  return { done, tot };
};

const autoUpdateProjectsCompletion = (allProjects: Record<string, Project>): Record<string, Project> => {
  const next = { ...allProjects };
  Object.keys(next).forEach(id => {
    const p = next[id];
    const { done, tot } = projTaskCounts(p);
    if (tot > 0 && done === tot) {
      if (p.status !== 'completato') {
        next[id] = { ...p, status: 'completato', updatedAt: Date.now() };
      }
    } else if (p.status === 'completato' && tot > 0 && done < tot) {
      next[id] = { ...p, status: 'attivo', updatedAt: Date.now() };
    }
  });
  return next;
};

export default function App() {
  // ----------------------------------------------------
  // LOCAL PERSISTENCE + SEED STATE
  // ----------------------------------------------------
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [finances, setFinances] = useState<Record<string, FinanceMovement>>({});
  // Nodi finanza strutturati (admin/manager): condivisi con FinanzeView + contabilità di commessa
  const [finComputi, setFinComputi] = useState<Computo[]>([]);
  const [finInvoicesActive, setFinInvoicesActive] = useState<InvoiceActive[]>([]);
  const [finInvoicesPassive, setFinInvoicesPassive] = useState<InvoicePassive[]>([]);
  const [finScadenze, setFinScadenze] = useState<ScadenzaItem[]>([]);
  const [projectsInternal, setProjectsInternal] = useState<Record<string, ProjectInternal>>({});
  const [projectMessages, setProjectMessages] = useState<Record<string, Record<string, ProjectMessage>>>({});
  const [documents, setDocuments] = useState<Record<string, Record<string, any>>>({});
  const [furnishings, setFurnishings] = useState<Record<string, Record<string, Furnishing>>>({});
  // Moodboard 3D per progetto: projectMoodboard3d/<pid> = { elements: BoardElement[], updatedAt, by }
  const [moodboard3d, setMoodboard3d] = useState<Record<string, any>>({});

  // Modulo Cantiere (record + sotto-collezioni keyed per cantiereId)
  const [cantieri, setCantieri] = useState<Record<string, Cantiere>>({});
  const [cantRapportini, setCantRapportini] = useState<Record<string, Record<string, Rapportino>>>({});
  const [cantPresenze, setCantPresenze] = useState<Record<string, Record<string, Presenza>>>({});
  const [cantFoto, setCantFoto] = useState<Record<string, Record<string, CantiereFoto>>>({});
  const [cantMateriali, setCantMateriali] = useState<Record<string, Record<string, CantiereMateriale>>>({});
  const [cantChecklist, setCantChecklist] = useState<Record<string, Record<string, ChecklistItem>>>({});
  const [cantDocumenti, setCantDocumenti] = useState<Record<string, Record<string, CantiereDoc>>>({});
  const [cantSal, setCantSal] = useState<Record<string, Record<string, CantiereSal>>>({});
  const [cantLog, setCantLog] = useState<Record<string, Record<string, CantiereLog>>>({});
  const [cantRecords, setCantRecords] = useState<Record<string, Record<string, CantiereRecord>>>({});
  const [cantMessages, setCantMessages] = useState<Record<string, Record<string, CantiereMessage>>>({});

  // Area Impresa — profilo dell'impresa partner (riusabile su tutti i suoi cantieri), keyed per uid
  const [impresaDocs, setImpresaDocs] = useState<Record<string, Record<string, ImpresaDoc>>>({});
  const [impresaRecords, setImpresaRecords] = useState<Record<string, Record<string, ImpresaRecord>>>({});

  // Rubrica clienti (anagrafica riutilizzabile)
  const [clients, setClients] = useState<Record<string, ClientRecord>>({});
  // Preventivi studio
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  // Cestino condiviso (elementi eliminati, conservati 60 giorni)
  const [trash, setTrash] = useState<Record<string, TrashItem>>({});
  // Doppia conferma eliminazione (modale condivisa)
  const [confirmDel, setConfirmDel] = useState<ConfirmDeleteRequest | null>(null);
  // Tab iniziale di Finanze (es. 'preventivi' arrivando da #preventivi)
  const [finStartTab, setFinStartTab] = useState<string | null>(null);

  // CRM (pipeline lead + fornitori)
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [crmSuppliers, setCrmSuppliers] = useState<Supplier[]>([]);
  const [unicoDeals, setUnicoDeals] = useState<UnicoDeal[]>([]);

  // Agenda condivisa (appuntamenti / note tra utenti)
  const [appointments, setAppointments] = useState<Record<string, Appointment>>({});
  const [apptOpen, setApptOpen] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTitle, setApptTitle] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptOwner, setApptOwner] = useState('');
  const [apptWith, setApptWith] = useState('');
  const [apptNote, setApptNote] = useState('');
  const [apptKind, setApptKind] = useState<'appuntamento' | 'nota'>('appuntamento');

  // Elenco pubblico dei membri studio (per i portali cliente/partner)
  const [directory, setDirectory] = useState<Record<string, { name: string; role: string }>>({});

  // Materico — richieste forniture/posa
  const [matericoRequests, setMatericoRequests] = useState<Record<string, MatericoRequest>>({});
  const [estimates, setEstimates] = useState<Record<string, MatericoEstimate>>({});

  // Active session profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  // Proprio record users/<uid> SEMPRE disponibile (anche se non attivo): serve
  // a decidere registrazione/attesa/rifiuto anche per cliente/azienda non-active.
  const [ownProfile, setOwnProfile] = useState<UserProfile | null>(null);

  // Google (Firebase) authentication gate
  const [gUser, setGUser] = useState<GUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Controllo accessi (Realtime Database)
  const [accounts, setAccounts] = useState<Record<string, UserProfile>>({});
  const [accountsReady, setAccountsReady] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false); // modale admin
  const creatingRef = useRef(false); // evita doppia creazione record

  // Router route & params
  const [route, setRoute] = useState<string>('dashboard');
  const [routeParam, setRouteParam] = useState<string | null>(null);
  const [peopleTab, setPeopleTab] = useState<'team' | 'clienti' | 'partner'>('team');

  // Navigation calendar states
  const [calView, setCalView] = useState<'month' | 'week' | 'day'>('day');
  const [calDate, setCalDate] = useState<Date>(new Date());

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Notifications states (persistite su notifications/<uid>)
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Ferie/assenze team
  const [teamLeave, setTeamLeave] = useState<Record<string, TeamLeave>>({});

  // ----------------------------------------------------
  // INITIALIZATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // Inject custom animation styles for smart letters
    injectSmartTextStyles();

    // NB: tutti i dati dell'app ora vivono sul Realtime Database condiviso.
    // Il caricamento avviene nell'effetto di sincronizzazione (vedi sotto),
    // in base al ruolo dell'utente approvato. Niente più seed in localStorage.

    // Handle hash router on load
    const handleHash = () => {
      const hash = window.location.hash.slice(1).split('/');
      let r = hash[0] || 'dashboard';
      // Materico non è più una sezione a sé: ora vive dentro "Progetti".
      if (r === 'materico') {
        r = 'progetti';
        setActiveDivision('materico');
      }
      // Preventivi non è più una sezione a sé: ora vive dentro "Finanze".
      if (r === 'preventivi') {
        r = 'finanze';
        setFinStartTab('preventivi');
      } else {
        setFinStartTab(null);
      }
      setRoute(r);
      setRouteParam(hash[1] || null);
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Watch Firebase Google auth state (gate the whole app)
  useEffect(() => {
    const unsub = watchAuth((u) => {
      setGUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Controllo accessi sul nodo "users". Sottoscrive il PROPRIO record (sempre
  // leggibile dalle regole) e, se sei team attivo, l'intera lista utenti.
  useEffect(() => {
    if (!gUser) {
      setAccounts({});
      setAccountsReady(false);
      setCurrentUser(null);
      setOwnProfile(null);
      setUsers({});
      creatingRef.current = false;
      return;
    }

    let unsubAll: (() => void) | null = null;

    const unsubOwn = watchOwnAccount(gUser.uid, async (mine: any) => {
      setAccountsReady(true);
      setOwnProfile(mine || null);

      if (!mine) {
        // Bootstrap admin: il proprietario o il primissimo utente diventa admin
        // attivo. Tutti gli altri completano la scheda dal form di registrazione
        // (AuthFlow) — qui NON creiamo un record parziale.
        if (!creatingRef.current) {
          creatingRef.current = true;
          const OWNER_EMAIL = 'giorgio.pascali990@gmail.com';
          const email = (gUser.email || '').toLowerCase();
          const isAdminEmail = email === OWNER_EMAIL;
          let isFirst = false;
          try {
            const all = await getAccounts(); // leggibile solo se il nodo è vuoto (bootstrap)
            isFirst = !all || Object.keys(all).length === 0;
          } catch (_) {
            isFirst = false;
          }
          if (isFirst || isAdminEmail) {
            setAccount(gUser.uid, {
              uid: gUser.uid,
              name: gUser.displayName || gUser.email || 'Amministratore',
              email: gUser.email || '',
              photoURL: gUser.photoURL || '',
              createdAt: Date.now(),
              role: 'admin',
              status: 'approved',
              active: true,
              accountType: 'team',
              profileComplete: true
            }).catch(() => {});
          } else {
            // niente record: lascia che AuthFlow mostri il completamento profilo
            creatingRef.current = false;
          }
        }
        setCurrentUser(null);
        return;
      }

      creatingRef.current = false;

      const approvedOk = mine.status === 'approved' && !!mine.role;
      if (approvedOk) {
        setCurrentUser(mine);
        // Solo il team "active" può leggere l'intera lista utenti.
        if (mine.active === true && !unsubAll) {
          unsubAll = watchAccounts(
            (all) => {
              setAccounts(all);
              const approved: Record<string, UserProfile> = {};
              Object.entries(all).forEach(([uid, u]: any) => {
                if (u?.status === 'approved') approved[uid] = u;
              });
              setUsers(approved);
              // L'admin mantiene l'elenco pubblico dei membri studio per i portali
              if (mine.role === 'admin') {
                const dir: Record<string, { name: string; role: string }> = {};
                Object.values(approved).forEach((u: any) => {
                  if (u.role === 'admin' || u.role === 'manager' || u.role === 'staff') {
                    dir[u.uid] = { name: u.name || '', role: u.role };
                  }
                });
                writeNode('directory', dir).catch(() => {});
              }
            },
            () => {}
          );
        }
      } else {
        setCurrentUser(null);
      }
    }, () => { setAccountsReady(true); });

    return () => {
      unsubOwn();
      if (unsubAll) unsubAll();
    };
  }, [gUser]);

  // ---- Azioni admin sul controllo accessi ----
  const isStudioRole = (r: string) => r === 'admin' || r === 'manager' || r === 'staff';
  const handleApproveAccount = (uid: string, role: any, sector?: string) => {
    const patch: any = {
      status: 'approved',
      role,
      active: isStudioRole(role), // studio attivo; cliente/partner accedono solo ai propri progetti
      approvedBy: gUser?.uid || null,
      approvedAt: Date.now()
    };
    if (role === 'cliente' && sector) patch.sector = sector;
    updateAccount(uid, patch)
      .then(() => showToast('Account approvato.'))
      .catch(() => showToast('Errore: controlla le regole del Database.', 'err'));
  };
  const handleRejectAccount = (uid: string) => {
    updateAccount(uid, { status: 'rejected', active: false })
      .then(() => showToast('Richiesta rifiutata.', 'err'))
      .catch(() => showToast('Errore di scrittura.', 'err'));
  };
  const handleChangeAccountRole = (uid: string, role: any, sector?: string) => {
    const patch: any = { role, active: isStudioRole(role) };
    if (role === 'cliente' && sector) patch.sector = sector;
    updateAccount(uid, patch)
      .then(() => showToast('Ruolo aggiornato.'))
      .catch(() => showToast('Errore di scrittura.', 'err'));
  };
  const handleRevokeAccount = (uid: string) => {
    updateAccount(uid, { status: 'pending', active: false })
      .then(() => showToast('Account rimesso in attesa.'))
      .catch(() => showToast('Errore di scrittura.', 'err'));
  };
  const handleRemoveAccount = (uid: string) => {
    askDelete('Eliminare questo account?', 'L\'account verrà eliminato definitivamente (non passa dal Cestino).', () => {
      removeAccount(uid)
        .then(() => showToast('Account eliminato.', 'err'))
        .catch(() => showToast('Errore di scrittura.', 'err'));
    }, true);
  };

  // Mappa chiave-stato -> nodo del Database (le tue regole usano "studioFinance")
  const KEY2PATH: Record<string, string> = { finance: 'studioFinance' };

  // Ogni modifica dell'app viene scritta sul Database condiviso.
  const syncState = (key: string, val: any) => {
    if (key === 'users') {
      // gli utenti si scrivono per-uid (le regole proteggono ogni record)
      Object.entries(val || {}).forEach(([uid, u]) => setAccount(uid, u).catch(() => {}));
      return;
    }
    const path = KEY2PATH[key] || key;
    writeNode(path, val).catch(() => {});
  };

  // ---- CRM: salvataggio + conversione lead in commessa ----
  const saveLeads = (arr: Lead[]) => {
    setCrmLeads(arr);
    writeNode('crmLeads', arr).catch(() => {});
  };
  const saveSuppliers = (arr: Supplier[]) => {
    setCrmSuppliers(arr);
    writeNode('crmSuppliers', arr).catch(() => {});
  };
  // Unico (lato studio): operazioni immobiliari + investitori (nodo array)
  const saveUnicoDeals = (arr: UnicoDeal[]) => {
    setUnicoDeals(arr);
    writeNode('unicoDeals', arr).catch(() => {});
  };
  const handleConvertLead = (lead: Lead) => {
    const pid = `p-${Date.now()}`;
    const div = (lead.sector || 'studio') as any;
    const newProject: any = {
      id: pid,
      name: lead.company || lead.name,
      code: `${div.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      client: lead.name,
      committente: lead.name,
      status: 'attivo',
      division: div,
      phases: {},
      createdAt: Date.now()
    };
    setProjects((prev) => {
      const next = { ...prev, [pid]: newProject };
      syncState('projects', next);
      return next;
    });
    showToast('Lead convertito in commessa.');
  };

  // ---- Agenda: appuntamenti / note tra utenti ----
  const handleSaveAppointment = (a: Appointment) => {
    setAppointments((prev) => ({ ...prev, [a.id]: a }));
    writeNode(`appointments/${a.id}`, a).catch(() => showToast('Errore salvataggio appuntamento.', 'err'));
  };
  const handleConfirmAppointment = (id: string) => {
    const a = appointments[id];
    if (!a) return;
    handleSaveAppointment({ ...a, status: 'confermato' });
    showToast('Appuntamento confermato.');
  };
  const handleDeclineAppointment = (id: string) => {
    const a = appointments[id];
    if (!a) return;
    handleSaveAppointment({ ...a, status: 'rifiutato' });
    showToast('Appuntamento rifiutato.', 'err');
  };
  const handleDeleteAppointment = (id: string) => {
    const a = appointments[id];
    askDelete('Eliminare l\'appuntamento?', a ? `"${a.title}" · ${a.date}` : null, () => {
      if (a) moveToTrash('appuntamenti', a.title || 'Appuntamento', a, undefined, a.date);
      setAppointments((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      removeNode(`appointments/${id}`).catch(() => {});
      showToast('Appuntamento spostato nel Cestino.', 'err');
    });
  };

  const handleOpenNewAppointment = (presetDate?: string) => {
    setApptDate(presetDate || todayISO());
    setApptTitle('');
    setApptTime('');
    setApptOwner(currentUser?.uid || '');
    setApptWith('');
    setApptNote('');
    setApptKind('appuntamento');
    setApptOpen(true);
  };
  const handleSubmitAppointment = () => {
    if (!apptTitle.trim() || !apptDate) {
      showToast('Inserisci titolo e data.', 'err');
      return;
    }
    const ownerUid = apptOwner || currentUser!.uid;
    const owner = users[ownerUid];
    const a: Appointment = {
      id: `appt-${Date.now()}`,
      title: apptTitle.trim(),
      date: apptDate,
      time: apptTime || null,
      ownerUid,
      ownerName: owner?.name || '',
      createdBy: currentUser!.uid,
      createdByName: currentUser!.name,
      withName: apptWith.trim() || undefined,
      note: apptNote.trim() || undefined,
      kind: apptKind,
      // se lo assegni a un altro membro resta confermato (è un'aggiunta interna)
      status: 'confermato',
      createdAt: Date.now()
    };
    handleSaveAppointment(a);
    setApptOpen(false);
    showToast(ownerUid === currentUser!.uid ? 'Aggiunto in agenda.' : `Aggiunto all'agenda di ${owner?.name || 'utente'}.`);
  };

  // Richiesta appuntamento dai portali cliente/partner (resta "in attesa")
  const handleRequestAppointment = (memberUid: string, memberName: string, date: string, time: string, note: string) => {
    const a: Appointment = {
      id: `appt-${Date.now()}`,
      title: `Richiesta appuntamento — ${currentUser!.name}`,
      date,
      time: time || null,
      ownerUid: memberUid,
      ownerName: memberName,
      createdBy: currentUser!.uid,
      createdByName: currentUser!.name,
      withName: currentUser!.name,
      note: note || undefined,
      kind: 'appuntamento',
      status: 'pending',
      createdAt: Date.now()
    };
    handleSaveAppointment(a);
    showToast('Richiesta inviata. In attesa di conferma.');
  };

  // ---- MATERICO: richieste, offerte, accettazione ----
  const saveMatericoRequest = (req: MatericoRequest) => {
    setMatericoRequests((prev) => ({ ...prev, [req.id]: req }));
    writeNode(`matericoRequests/${req.id}`, req).catch(() => showToast('Errore salvataggio richiesta.', 'err'));
  };
  const handleCreateMatericoRequest = (req: MatericoRequest) => {
    saveMatericoRequest(req);
    showToast('Richiesta inviata a Materico.');
  };
  const handleUpdateMatericoRequest = (req: MatericoRequest) => {
    saveMatericoRequest({ ...req, updatedAt: Date.now() });
  };
  const handleDeleteMatericoRequest = (id: string) => {
    const r = matericoRequests[id];
    askDelete('Eliminare la richiesta Materico?', r ? `"${r.title}" di ${r.clientName}` : null, () => {
      if (r) moveToTrash('materico', r.title || 'Richiesta', r, undefined, r.clientName);
      setMatericoRequests((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      removeNode(`matericoRequests/${id}`).catch(() => {});
      showToast('Richiesta spostata nel Cestino.', 'err');
    });
  };
  const handleSubmitMatericoOffer = (reqId: string, amount: number, note: string) => {
    const r = matericoRequests[reqId];
    if (!r) return;
    const offers = { ...(r.offers || {}) };
    offers[currentUser!.uid] = {
      partnerUid: currentUser!.uid,
      partnerName: currentUser!.name,
      amount,
      note: note || undefined,
      at: Date.now()
    };
    saveMatericoRequest({ ...r, offers, status: 'offerte', updatedAt: Date.now() });
    showToast('Offerta inviata a Materico.');
  };
  const handleAcceptMatericoOffer = (reqId: string, accept: boolean) => {
    const r = matericoRequests[reqId];
    if (!r) return;
    saveMatericoRequest({ ...r, status: accept ? 'accettata' : 'rifiutata', updatedAt: Date.now() });
    showToast(accept ? 'Offerta accettata. Lavoro avviato.' : 'Offerta rifiutata.', accept ? 'ok' : 'err');
  };

  const seededRef = useRef(false);
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    const studio = isStudioRole(role);
    const canFinance = role === 'admin' || role === 'manager';
    const subs: Array<() => void> = [];
    const add = (path: string, fn: (v: any) => void) =>
      subs.push(watchNode(path, (v) => fn(v || {}), () => {}));

    // Notifiche persistenti del proprio account (tutti i ruoli)
    subs.push(watchNode(`notifications/${currentUser.uid}`, (v) => {
      const arr = (v ? Object.values(v) : []) as Notification[];
      setNotifications(arr.sort((a, b) => b.at - a.at));
    }, () => {}));

    if (studio) {
      // Seed iniziale dei template (solo admin, solo se vuoti)
      if (role === 'admin' && !seededRef.current) {
        seededRef.current = true;
        getNode('templates')
          .then((t) => {
            if (!t || Object.keys(t).length === 0) writeNode('templates', SEED_TEMPLATES).catch(() => {});
          })
          .catch(() => {});
        // Pulizia: rimuove eventuali account di test rimasti nel Database
        getNode('users')
          .then((all) => {
            Object.entries(all || {}).forEach(([uid, u]: any) => {
              if (u && (u.isTest === true || String(uid).startsWith('test-'))) {
                removeAccount(uid).catch(() => {});
              }
            });
          })
          .catch(() => {});
      }
      add('projects', (v) => setProjects(autoUpdateProjectsCompletion(v)));
      add('tasks', setTasks);
      add('templates', setTemplates);
      add('projectsInternal', setProjectsInternal);
      add('projectMessages', setProjectMessages);
      add('documents', setDocuments);
      add('projectFurnishings', setFurnishings);
      add('projectMoodboard3d', setMoodboard3d);
      add('estimates', setEstimates);
      // CRM (array nodes)
      const toArr = (v: any) => (Array.isArray(v) ? v : v ? Object.values(v) : []);
      if (canFinance) {
        add('studioFinance', setFinances);
        // Nodi finanza strutturati: stessa fonte di FinanzeView, serve alla contabilità di commessa
        // items normalizzato ad array (Firebase non salva gli array vuoti)
        subs.push(watchNode('finComputi', (v) => setFinComputi(toArr(v).map((c: any) => ({ ...c, items: Array.isArray(c.items) ? c.items : c.items ? Object.values(c.items) : [] }))), () => {}));
        subs.push(watchNode('finInvoicesActive', (v) => setFinInvoicesActive(toArr(v)), () => {}));
        subs.push(watchNode('finInvoicesPassive', (v) => setFinInvoicesPassive(toArr(v)), () => {}));
        subs.push(watchNode('finScadenze', (v) => setFinScadenze(toArr(v)), () => {}));
        add('quotes', setQuotes);
      }
      subs.push(watchNode('crmLeads', (v) => setCrmLeads(toArr(v)), () => {}));
      subs.push(watchNode('crmSuppliers', (v) => setCrmSuppliers(toArr(v)), () => {}));
      subs.push(watchNode('unicoDeals', (v) => setUnicoDeals(toArr(v)), () => {}));
      subs.push(watchNode('appointments', (v) => setAppointments(v || {}), () => {}));
      subs.push(watchNode('directory', (v) => setDirectory(v || {}), () => {}));
      subs.push(watchNode('matericoRequests', (v) => setMatericoRequests(v || {}), () => {}));
      // Cantiere (studio vede tutto)
      add('cantieri', setCantieri);
      add('cantiereRapportini', setCantRapportini);
      add('cantierePresenze', setCantPresenze);
      add('cantiereFoto', setCantFoto);
      add('cantiereMateriali', setCantMateriali);
      add('cantiereChecklist', setCantChecklist);
      add('cantiereDocumenti', setCantDocumenti);
      add('cantiereSal', setCantSal);
      add('cantiereLog', setCantLog);
      add('cantiereRecords', setCantRecords);
      add('cantiereMessages', setCantMessages);
      // Area Impresa: profili di tutte le imprese partner (riusabili sui cantieri)
      add('impresaDocs', setImpresaDocs);
      add('impresaRecords', setImpresaRecords);
      // Rubrica clienti
      add('clients', setClients);
      // Ferie/assenze team
      add('teamLeave', setTeamLeave);
      // Cestino condiviso (elementi eliminati, 60 giorni)
      add('trash', setTrash);
    } else {
      // Cliente/Partner: solo i propri progetti (regole via clientUid)
      subs.push(watchNode('directory', (v) => setDirectory(v || {}), () => {}));
      subs.push(watchNode('matericoRequests', (v) => setMatericoRequests(v || {}), () => {}));
      const pids = Object.keys(currentUser.projectIds || {});
      pids.forEach((pid) => {
        subs.push(watchNode(`projects/${pid}`, (v) => {
          if (v) setProjects((p) => ({ ...p, [pid]: v }));
        }, () => {}));
        subs.push(watchNode(`documents/${pid}`, (v) => {
          setDocuments((d) => ({ ...d, [pid]: v || {} }));
        }, () => {}));
        subs.push(watchNode(`projectMessages/${pid}`, (v) => {
          setProjectMessages((m) => ({ ...m, [pid]: v || {} }));
        }, () => {}));
        subs.push(watchNode(`projectFurnishings/${pid}`, (v) => {
          setFurnishings((f) => ({ ...f, [pid]: v || {} }));
        }, () => {}));
        subs.push(watchNode(`projectMoodboard3d/${pid}`, (v) => {
          setMoodboard3d((m) => ({ ...m, [pid]: v || {} }));
        }, () => {}));
      });
      // Partner: elenca i cantieri assegnati via indice inverso, poi sottoscrive per-cid.
      if (currentUser.role === 'partner') {
        const watched = new Set<string>();
        // Area Impresa propria (riusabile su tutti i cantieri)
        subs.push(watchNode(`impresaDocs/${currentUser.uid}`, (v) => setImpresaDocs((m) => ({ ...m, [currentUser.uid]: v || {} })), () => {}));
        subs.push(watchNode(`impresaRecords/${currentUser.uid}`, (v) => setImpresaRecords((m) => ({ ...m, [currentUser.uid]: v || {} })), () => {}));
        subs.push(watchNode(`partnerCantieri/${currentUser.uid}`, (v) => {
          Object.keys(v || {}).forEach((cid) => {
            if (watched.has(cid)) return;
            watched.add(cid);
            subs.push(watchNode(`cantieri/${cid}`, (cv) => {
              setCantieri((m) => { const n = { ...m }; if (cv) n[cid] = cv; else delete n[cid]; return n; });
            }, () => {}));
            subs.push(watchNode(`cantiereRapportini/${cid}`, (cv) => setCantRapportini((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantierePresenze/${cid}`, (cv) => setCantPresenze((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereFoto/${cid}`, (cv) => setCantFoto((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereMateriali/${cid}`, (cv) => setCantMateriali((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereChecklist/${cid}`, (cv) => setCantChecklist((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereDocumenti/${cid}`, (cv) => setCantDocumenti((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereSal/${cid}`, (cv) => setCantSal((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereRecords/${cid}`, (cv) => setCantRecords((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereMessages/${cid}`, (cv) => setCantMessages((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereLog/${cid}`, (cv) => setCantLog((m) => ({ ...m, [cid]: cv || {} })), () => {}));
          });
        }, () => {}));
      }
    }

    return () => subs.forEach((u) => u());
  }, [currentUser?.uid, currentUser?.role]);

  // ----------------------------------------------------
  // CESTINO (nodo trash) + DOPPIA CONFERMA ELIMINAZIONE
  // ----------------------------------------------------
  // Purge automatico: gli elementi più vecchi di 60 giorni vengono eliminati definitivamente.
  const purgedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUser || !isStudioRole(currentUser.role)) return;
    const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86400000;
    Object.values(trash).forEach((t) => {
      if (t.deletedAt < cutoff && !purgedRef.current.has(t.id)) {
        purgedRef.current.add(t.id);
        removeNode(`trash/${t.id}`).catch(() => {});
      }
    });
  }, [trash, currentUser?.uid]);

  /** Sposta un elemento eliminato nel Cestino (solo ruoli studio: i portali non hanno write su trash). */
  const moveToTrash = (section: string, label: string, payload: any, meta?: Record<string, string>, detail?: string) => {
    if (!currentUser || !isStudioRole(currentUser.role)) return;
    const tid = `tr-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const item: TrashItem = {
      id: tid, section, label, detail: detail || null, payload, meta: meta || null,
      deletedAt: Date.now(), deletedBy: currentUser.uid, deletedByName: currentUser.name || null
    };
    setTrash((prev) => ({ ...prev, [tid]: item }));
    writeNode(`trash/${tid}`, item).catch(() => {});
  };

  /** Doppia conferma: apre la modale condivisa; l'azione parte solo dopo la seconda conferma. */
  const askDelete = (title: string, message: string | null, onConfirm: () => void, permanent = false) =>
    setConfirmDel({ title, message, onConfirm, permanent });

  /** Ripristino dal Cestino: riscrive l'elemento nella sua collezione di origine. */
  const handleRestoreTrash = (item: TrashItem) => {
    const pl = item.payload;
    const id = pl?.id;
    try {
      switch (item.section) {
        case 'progetti':
          setProjects((prev) => { const n = { ...prev, [id]: pl }; syncState('projects', n); return n; });
          break;
        case 'task':
          setTasks((prev) => { const n = { ...prev, [id]: pl }; syncState('tasks', n); return n; });
          break;
        case 'preventivi':
          setQuotes((prev) => ({ ...prev, [id]: pl }));
          writeNode(`quotes/${id}`, pl).catch(() => {});
          break;
        case 'fatture_attive':
          handleSaveFinanceItem('finInvoicesActive', pl);
          break;
        case 'fatture_passive':
          handleSaveFinanceItem('finInvoicesPassive', pl);
          break;
        case 'scadenze':
          handleSaveFinanceItem('finScadenze', pl);
          break;
        case 'movimenti':
          setFinances((prev) => { const n = { ...prev, [id]: pl }; syncState('finance', n); return n; });
          break;
        case 'documenti':
          if (item.meta?.pid) {
            setDocuments((prev) => ({ ...prev, [item.meta!.pid]: { ...(prev[item.meta!.pid] || {}), [id]: pl } }));
            writeNode(`documents/${item.meta.pid}/${id}`, pl).catch(() => {});
          }
          break;
        case 'arredi':
          if (item.meta?.pid) {
            setFurnishings((prev) => ({ ...prev, [item.meta!.pid]: { ...(prev[item.meta!.pid] || {}), [id]: pl } }));
            writeNode(`projectFurnishings/${item.meta.pid}/${id}`, pl).catch(() => {});
          }
          break;
        case 'appuntamenti':
          setAppointments((prev) => ({ ...prev, [id]: pl }));
          writeNode(`appointments/${id}`, pl).catch(() => {});
          break;
        case 'materico':
          setMatericoRequests((prev) => ({ ...prev, [id]: pl }));
          writeNode(`matericoRequests/${id}`, pl).catch(() => {});
          break;
        case 'estimates':
          setEstimates((prev) => { const n = { ...prev, [id]: pl }; syncState('estimates', n); return n; });
          break;
        case 'rubrica':
          setClients((prev) => ({ ...prev, [id]: pl }));
          writeNode(`clients/${id}`, pl).catch(() => {});
          break;
        case 'crm_lead':
          saveLeads([...crmLeads.filter((l) => l.id !== id), pl]);
          break;
        case 'crm_supplier':
          saveSuppliers([...crmSuppliers.filter((s) => s.id !== id), pl]);
          break;
        case 'unico':
          saveUnicoDeals([...unicoDeals.filter((d) => d.id !== id), pl]);
          break;
        case 'cantieri':
          setCantieri((prev) => ({ ...prev, [id]: pl }));
          writeNode(`cantieri/${id}`, pl).catch(() => {});
          Object.keys(pl?.partnerUids || {}).forEach((uid) => writeNode(`partnerCantieri/${uid}/${id}`, true).catch(() => {}));
          break;
        case 'cantiere':
          if (item.meta?.coll && item.meta?.cid) writeNode(`${item.meta.coll}/${item.meta.cid}/${id}`, pl).catch(() => {});
          break;
        case 'impresa':
          if (item.meta?.coll && item.meta?.uid) writeNode(`${item.meta.coll}/${item.meta.uid}/${id}`, pl).catch(() => {});
          break;
        case 'ferie':
          setTeamLeave((prev) => ({ ...prev, [id]: pl }));
          writeNode(`teamLeave/${id}`, pl).catch(() => {});
          break;
        default:
          showToast('Sezione non ripristinabile automaticamente.', 'err');
          return;
      }
      setTrash((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      removeNode(`trash/${item.id}`).catch(() => {});
      showToast('Elemento ripristinato.');
    } catch {
      showToast('Errore nel ripristino.', 'err');
    }
  };

  /** Eliminazione definitiva dal Cestino (con doppia conferma). */
  const handleTrashDeleteForever = (item: TrashItem) => {
    askDelete('Eliminare definitivamente?', `"${item.label}" verrà rimosso per sempre dal Cestino.`, () => {
      setTrash((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      removeNode(`trash/${item.id}`).catch(() => {});
      showToast('Elemento eliminato definitivamente.', 'err');
    }, true);
  };

  // Riconciliazione rubrica: ogni cliente/partner registrato viene salvato in automatico
  // in `clients` (diviso per categoria). Gira lato studio (admin/manager hanno write su clients).
  // Idempotente: crea solo i record mancanti (id deterministico `cli-<uid>`).
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) return;
    const existingUids = new Set(Object.values(clients).map((c) => c.accountUid).filter(Boolean));
    Object.values(users).forEach((u: any) => {
      if (!u || (u.role !== 'cliente' && u.role !== 'partner')) return;
      const recId = `cli-${u.uid}`;
      if (existingUids.has(u.uid) || clients[recId]) return;
      const isAzienda = u.accountType === 'azienda' || u.role === 'partner';
      const rec: ClientRecord = {
        id: recId,
        category: u.role === 'partner' ? 'partner' : 'cliente',
        type: isAzienda ? 'azienda' : 'privato',
        name: (u.role === 'partner' || isAzienda) ? (u.companyName || u.name) : u.name,
        firstName: u.firstName || null,
        lastName: u.lastName || null,
        email: u.email || null,
        phone: u.telefono || null,
        whatsapp: null,
        address: u.companyAddress || u.residenza || null,
        codiceFiscale: u.codiceFiscale || null,
        companyName: u.companyName || null,
        partitaIva: u.partitaIva || null,
        pec: u.pec || null,
        sdi: u.sdi || null,
        tier: null,
        accountUid: u.uid,
        notes: null,
        createdBy: 'system',
        createdAt: u.createdAt || Date.now()
      };
      setClients((prev) => ({ ...prev, [recId]: rec }));
      writeNode(`clients/${recId}`, rec).catch(() => {});
    });
  }, [users, clients, currentUser?.uid, currentUser?.role]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  };

  // ----------------------------------------------------
  // PROFILE SWITCH CHANGER (useful to play around)
  // ----------------------------------------------------
  const handleProfileSwitch = (uid: string) => {
    if (users[uid]) {
      setCurrentUser(users[uid]);
      localStorage.setItem('onirico_logged_uid', uid);
      setRoute('dashboard');
      window.location.hash = '#dashboard';
      showToast(`Accesso cambiato su: ${users[uid].name}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('onirico_logged_uid');
    // For playability, logging out loops back to login options
    setCurrentUser(null);
    // Also sign out from Google so the auth gate is re-shown
    logoutGoogle().catch(() => {});
  };

  // ----------------------------------------------------
  // MODAL SWITCH CONTROLS
  // ----------------------------------------------------
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Tasks Form (Agenda)
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined);

  const [tTitle, setTTitle] = useState('');
  const [tDateInput, setTDateInput] = useState('');
  const [tTimeInput, setTTimeInput] = useState('');
  const [tFreq, setTFreq] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [tPrio, setTPrio] = useState<'urgente' | 'alta' | 'media' | 'bassa'>('media');
  const [tTipo, setTTipo] = useState('');
  const [tAssignee, setTAssignee] = useState('');
  const [tProjectId, setTProjectId] = useState('');
  const [tNotes, setTNotes] = useState('');

  // Project Form
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [pTmplPicked, setPTmplPicked] = useState('arch-completo');
  const [pName, setPName] = useState('');
  const [pCode, setPCode] = useState('');
  const [pClient, setPClient] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pClientUid, setPClientUid] = useState('');
  const [pClientRecordId, setPClientRecordId] = useState('');
  // Nuovo cliente inline in rubrica (dal form progetto)
  const [newRubricaOpen, setNewRubricaOpen] = useState(false);
  const [ncDraft, setNcDraft] = useState<Partial<ClientRecord>>({ type: 'privato' });
  const [pManager, setPManager] = useState('admin');
  const [pStart, setPStart] = useState('');
  const [pDue, setPDue] = useState('');
  const [pCommittente, setPCommittente] = useState('');
  const [pIndirizzo, setPIndirizzo] = useState('');
  const [pFoglio, setPFoglio] = useState('');
  const [pParticella, setPParticella] = useState('');
  const [pSub, setPSub] = useState('');
  const [pTipo, setPTipo] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pDivision, setPDivision] = useState<'studio' | 'strategico' | 'materico' | 'unico'>('studio');
  const [activeDivision, setActiveDivision] = useState<'studio' | 'strategico' | 'materico' | 'unico'>('studio');

  // Marketing custom inputs
  const [pMarketingBudget, setPMarketingBudget] = useState<number | ''>('');
  const [pMarketingChannels, setPMarketingChannels] = useState<string>('');
  const [pMarketingGoal, setPMarketingGoal] = useState<string>('');

  // Materico custom inputs
  const [pMatericoEstimatedBudget, setPMatericoEstimatedBudget] = useState<number | ''>('');
  const [pMatericoFinitureType, setPMatericoFinitureType] = useState<string>('');
  const [pMatericoSottofondiStatus, setPMatericoSottofondiStatus] = useState<string>('');

  // Studio configurator (tipo intervento → titolo abilitativo → categorie di lavorazione)
  const [pIntervento, setPIntervento] = useState<string>(DEFAULT_INTERVENTO);
  const [pTitolo, setPTitolo] = useState<string>('scia');
  const [pCategorie, setPCategorie] = useState<string[]>([]);

  // Project Editing
  const [editProjOpen, setEditProjOpen] = useState(false);
  const [editProjId, setEditProjId] = useState<string | null>(null);

  // Phase Form
  const [phaseOpen, setPhaseOpen] = useState(false);
  const [phasePrjId, setPhasePrjId] = useState<string | null>(null);
  const [phaseEditId, setPhaseEditId] = useState<string | null>(null);
  const [phaseName, setPhaseName] = useState('');

  // Project Task (Activity) Form
  const [ptaskOpen, setPtaskOpen] = useState(false);
  const [ptaskPrjId, setPtaskPrjId] = useState<string | null>(null);
  const [ptaskPhId, setPtaskPhId] = useState<string | null>(null);
  const [ptaskEditId, setPtaskEditId] = useState<string | null>(null);
  const [ptTitle, setPtTitle] = useState('');
  const [ptRole, setPtRole] = useState('');
  const [ptAssignee, setPtAssignee] = useState('');
  const [ptDue, setPtDue] = useState('');
  const [ptNote, setPtNote] = useState('');

  // Financial Form
  const [finOpen, setFinOpen] = useState(false);
  const [finCtx, setFinCtx] = useState<'studio' | string>('studio'); // 'studio' or project ID
  const [fnKind, setFnKind] = useState<'entrata' | 'uscita'>('entrata');
  const [fnDesc, setFnDesc] = useState('');
  const [fnAmount, setFnAmount] = useState('');
  const [fnDate, setFnDate] = useState('');
  const [fnCat, setFnCat] = useState('');
  const [fnProjLink, setFnProjLink] = useState('');
  const [fnNote, setFnNote] = useState('');

  // New Account / Client Form
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const [nuName, setNuName] = useState('');
  const [nuEmail, setNuEmail] = useState('');
  const [nuPass, setNuPass] = useState('');
  const [nuRole, setNuRole] = useState<'admin' | 'manager' | 'staff' | 'cliente'>('staff');
  const [nuTitle, setNuTitle] = useState('');
  const [nuFns, setNuFns] = useState<string[]>([]);
  const [nuActive, setNuActive] = useState(true);

  // Client description modal
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descTitle, setDescTitle] = useState('');
  const [descBody, setDescBody] = useState('');

  // Anagrafica Practice Forms
  const [anagOpen, setAnagOpen] = useState(false);
  const [anagProjId, setAnagProjId] = useState<string | null>(null);
  const [anagData, setAnagData] = useState<Record<string, Record<string, string>>>({});

  // Client Portal States
  const [clientActivePid, setClientActivePid] = useState<string | null>(null);
  const [clientOpenPh, setClientOpenPh] = useState<string | undefined>(undefined);
  const [isPreview, setIsPreview] = useState(false);

  // ----------------------------------------------------
  // EVENT TRIGGER HANDLERS
  // ----------------------------------------------------
  
  // 1. Task checklist operations
  const handleToggleTask = (id: string, date: string) => {
    setTasks(prev => {
      const t = prev[id];
      if (!t) return prev;
      const nextTasks = { ...prev };
      if (t.frequency === 'once') {
        nextTasks[id] = { ...t, done: !t.done, updatedAt: Date.now() };
      } else {
        const completions = { ...(t.completions || {}) };
        if (completions[date]) {
          delete completions[date];
        } else {
          completions[date] = true;
        }
        nextTasks[id] = { ...t, completions, updatedAt: Date.now() };
      }
      syncState('tasks', nextTasks);
      return nextTasks;
    });
    showToast('Stato task aggiornato!');
  };

  const handleTogglePtask = (projId: string, phId: string, tId: string) => {
    setProjects(prev => {
      const p = prev[projId];
      if (!p || !p.phases[phId] || !p.phases[phId].tasks[tId]) return prev;
      
      const nextProjects = { ...prev };
      const task = nextProjects[projId].phases[phId].tasks[tId];
      nextProjects[projId].phases[phId].tasks[tId] = {
        ...task,
        done: !task.done
      };
      nextProjects[projId].updatedAt = Date.now();
      const updated = autoUpdateProjectsCompletion(nextProjects);
      syncState('projects', updated);
      return updated;
    });
    showToast('Stato attività cantiere aggiornato!');
  };

  const handleEditTask = (id: string) => {
    const t = tasks[id];
    if (!t) return;
    setEditTaskId(id);
    setTTitle(t.title);
    setTDateInput(t.date);
    setTTimeInput(t.time || '');
    setTFreq(t.frequency);
    setTPrio(t.priority);
    setTTipo(t.tipo || '');
    setTAssignee(t.assignee || '');
    setTProjectId(t.projectId || '');
    setTNotes(t.notes || '');
    setTaskEditorOpen(true);
  };

  const handleSaveTask = () => {
    if (!tTitle.trim()) {
      showToast('Inserisci il titolo del task!', 'err');
      return;
    }

    // notifica al collaboratore se l'assegnatario è nuovo o cambiato (riassegnazione)
    const prevAssignee = editTaskId ? tasks[editTaskId]?.assignee || '' : '';
    if (tAssignee && tAssignee !== prevAssignee && tAssignee !== currentUser?.uid) {
      pushNotification(tAssignee, {
        type: 'task',
        title: `Attività assegnata: ${tTitle.trim()}`,
        body: `${currentUser?.name || 'Lo studio'} ti ha assegnato un'attività${tDateInput ? ` per il ${tDateInput}` : ''}.`,
        link: '#calendario'
      });
    }

    setTasks(prev => {
      const nextTasks = { ...prev };
      const date = tDateInput || todayISO();

      if (editTaskId && prev[editTaskId]) {
        nextTasks[editTaskId] = {
          ...prev[editTaskId],
          title: tTitle.trim(),
          date,
          time: tTimeInput || null,
          frequency: tFreq,
          priority: tPrio,
          tipo: tTipo.trim() || null,
          assignee: tAssignee || null,
          projectId: tProjectId || null,
          notes: tNotes.trim() || null,
          updatedAt: Date.now()
        };
        showToast('Task modificato con successo!');
      } else {
        const newId = `task-${Date.now()}`;
        nextTasks[newId] = {
          id: newId,
          title: tTitle.trim(),
          date,
          time: tTimeInput || null,
          frequency: tFreq,
          priority: tPrio,
          tipo: tTipo.trim() || null,
          assignee: tAssignee || null,
          projectId: tProjectId || null,
          notes: tNotes.trim() || null,
          done: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: currentUser?.uid || 'admin'
        };
        showToast('Nuovo task aggiunto in agenda!');
      }

      syncState('tasks', nextTasks);
      return nextTasks;
    });

    setTaskEditorOpen(false);
    setEditTaskId(null);
  };

  const handleDeleteTask = () => {
    if (editTaskId) {
      const t = tasks[editTaskId];
      askDelete('Eliminare il task?', t ? `"${t.title}" · ${t.date}` : null, () => {
        if (t) moveToTrash('task', t.title || 'Task', t, undefined, t.date);
        setTasks(prev => {
          const nextTasks = { ...prev };
          delete nextTasks[editTaskId];
          syncState('tasks', nextTasks);
          return nextTasks;
        });
        showToast('Task spostato nel Cestino.', 'err');
        setTaskEditorOpen(false);
        setEditTaskId(null);
      });
    }
  };

  // 2. Project actions
  const handleOpenNewProject = (forcedDiv?: 'studio' | 'strategico' | 'materico' | 'unico' | any) => {
    const div = (forcedDiv && typeof forcedDiv === 'string' && ['studio', 'strategico', 'materico', 'unico'].includes(forcedDiv))
      ? (forcedDiv as 'studio' | 'strategico' | 'materico' | 'unico')
      : (activeDivision || 'studio');
    setPDivision(div);

    // Generate default code and template based on division
    const yr = new Date().getFullYear();
    const count = Object.values(projects).length + 1;
    let prefix = 'ARC';
    let defaultTemplate = 'arch-completo';
    if (div === 'strategico') {
      prefix = 'STR';
      defaultTemplate = 'marketing-strategico';
    } else if (div === 'materico') {
      prefix = 'MAT';
      defaultTemplate = 'fornitura-materico';
    } else if (div === 'unico') {
      prefix = 'UNI';
      defaultTemplate = 'concept-unico';
    }
    setPTmplPicked(defaultTemplate);

    setPCode(`${prefix}-${yr}-${String(count).padStart(3, '0')}`);
    setPName('');
    setPClient('');
    setPLocation('');
    setPClientUid('');
    setPClientRecordId('');
    setPManager('admin');
    setPStart(todayISO());
    setPDue('');
    setPCommittente('');
    setPIndirizzo('');
    setPFoglio('');
    setPParticella('');
    setPSub('');
    setPTipo('');
    setPNotes('');

    setPMarketingBudget('');
    setPMarketingChannels('');
    setPMarketingGoal('');

    setPMatericoEstimatedBudget('');
    setPMatericoFinitureType('');
    setPMatericoSottofondiStatus('');

    // Configuratore Studio: imposta intervento di default + titolo/categorie suggeriti.
    if (div === 'studio') {
      const it = interventoById(DEFAULT_INTERVENTO) || INTERVENTI_EDILIZI[0];
      setPIntervento(it.id);
      setPTitolo(it.titolo);
      setPCategorie(it.categorie);
    } else {
      setPCategorie([]);
    }

    setNewProjOpen(true);
  };

  // Cambio tipo di intervento edilizio: auto-suggerisce titolo abilitativo e categorie.
  const handleInterventoChange = (id: string) => {
    setPIntervento(id);
    const it = interventoById(id);
    if (it) {
      setPTitolo(it.titolo);
      setPCategorie(it.categorie);
    }
  };

  const toggleCategoria = (cat: string) => {
    setPCategorie(prev => (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]));
  };

  const handlePDivisionChange = (newDiv: 'studio' | 'strategico' | 'materico' | 'unico') => {
    setPDivision(newDiv);
    const yr = new Date().getFullYear();
    const count = Object.values(projects).length + 1;
    let prefix = 'ARC';
    let defaultTemplate = 'arch-completo';
    if (newDiv === 'strategico') {
      prefix = 'STR';
      defaultTemplate = 'marketing-strategico';
    } else if (newDiv === 'materico') {
      prefix = 'MAT';
      defaultTemplate = 'fornitura-materico';
    } else if (newDiv === 'unico') {
      prefix = 'UNI';
      defaultTemplate = 'concept-unico';
    }
    setPTmplPicked(defaultTemplate);
    setPCode(`${prefix}-${yr}-${String(count).padStart(3, '0')}`);

    // Configuratore Studio: reimposta intervento/titolo/categorie alla scelta della divisione.
    if (newDiv === 'studio') {
      const it = interventoById(pIntervento) || interventoById(DEFAULT_INTERVENTO) || INTERVENTI_EDILIZI[0];
      setPIntervento(it.id);
      setPTitolo(it.titolo);
      setPCategorie(it.categorie);
    } else {
      setPCategorie([]);
    }
  };

  const handleCreateProject = () => {
    if (!pName.trim()) {
      showToast('Inserisci il nome del progetto!', 'err');
      return;
    }

    const nId = `p-${Date.now()}`;
    // Studio: se sono state scelte delle categorie, le fasi/task nascono dalla libreria reale.
    const isStudioConfig = pDivision === 'studio' && pCategorie.length > 0;
    const tm = (!isStudioConfig && pTmplPicked !== '__blank__') ? (templates[pTmplPicked] as any) : null;
    let phases: Record<string, Phase> = {};

    if (isStudioConfig) {
      phases = buildStudioPhases(pCategorie, pTitolo);
    } else if (tm) {
      Object.entries(tm.phases || {}).forEach(([k, ph]: [string, any]) => {
        const tasksMap: Record<string, ProjectTask> = {};
        Object.entries(ph.tasks || {}).forEach(([tk, tt]: [string, any]) => {
          tasksMap[tk] = {
            id: tk,
            title: tt.title,
            order: tt.order,
            done: false,
            role: tt.role || null
          };
        });
        phases[k] = {
          id: k,
          name: ph.name,
          order: ph.order,
          tasks: tasksMap
        };
      });
    }

    const newProj: Project = {
      id: nId,
      name: pName.trim(),
      code: pCode.trim() || null,
      client: pClient.trim() || null,
      location: pLocation.trim() || null,
      manager: pManager || null,
      startDate: pStart || todayISO(),
      dueDate: pDue || null,
      status: 'attivo',
      icon: isStudioConfig ? 'building' : (tm ? tm.icon : 'folder'),
      templateId: isStudioConfig ? null : (tm ? tm.id : null),
      templateName: isStudioConfig ? interventoLabel(pIntervento) : (tm ? tm.name : null),
      clientUid: pClientUid || null,
      clientRecordId: pClientRecordId || null,
      committente: pCommittente.trim() || null,
      indirizzoImmobile: pIndirizzo.trim() || null,
      foglio: pFoglio.trim() || null,
      particella: pParticella.trim() || null,
      sub: pSub.trim() || null,
      tipoIntervento: pDivision === 'studio' ? interventoLabel(pIntervento) : (pTipo.trim() || null),
      interventoEdilizio: pDivision === 'studio' ? pIntervento : undefined,
      titoloAbilitativo: pDivision === 'studio' ? pTitolo : undefined,
      phases,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      division: pDivision,
      marketingBudget: pDivision === 'strategico' && pMarketingBudget !== '' ? Number(pMarketingBudget) : undefined,
      marketingChannels: pDivision === 'strategico' ? pMarketingChannels : undefined,
      marketingGoal: pDivision === 'strategico' ? pMarketingGoal : undefined,
      matericoEstimatedBudget: pDivision === 'materico' && pMatericoEstimatedBudget !== '' ? Number(pMatericoEstimatedBudget) : undefined,
      matericoFinitureType: pDivision === 'materico' ? pMatericoFinitureType : undefined,
      matericoSottofondiStatus: pDivision === 'materico' ? pMatericoSottofondiStatus : undefined,
    };

    setProjects(prev => {
      const nextProjects = { ...prev, [nId]: newProj };
      const updated = autoUpdateProjectsCompletion(nextProjects);
      syncState('projects', updated);
      return updated;
    });

    if (pNotes.trim()) {
      setProjectsInternal(prev => {
        const next = { ...prev, [nId]: { ...prev[nId], notes: pNotes.trim() } };
        syncState('projectsInternal', next);
        return next;
      });
    }

    if (pClientUid) {
      setUsers(prev => {
        const u = prev[pClientUid];
        if (u) {
          const nextUsers = { ...prev };
          nextUsers[pClientUid] = {
            ...u,
            projectIds: { ...(u.projectIds || {}), [nId]: true }
          };
          syncState('users', nextUsers);
          return nextUsers;
        }
        return prev;
      });
    }

    showToast('Incarico creato con successo!');
    setNewProjOpen(false);
    window.location.hash = `#progetto/${nId}`;
  };

  const handleEditProject = (id: string) => {
    const p = projects[id];
    if (!p) return;
    setEditProjId(id);
    setPName(p.name);
    setPCode(p.code || '');
    setPClient(p.client || '');
    setPLocation(p.location || '');
    setPClientUid(p.clientUid || '');
    setPClientRecordId(p.clientRecordId || '');
    setPManager(p.manager || 'admin');
    setPStart(p.startDate || '');
    setPDue(p.dueDate || '');
    setPCommittente(p.committente || '');
    setPIndirizzo(p.indirizzoImmobile || '');
    setPFoglio(p.foglio || '');
    setPParticella(p.particella || '');
    setPSub(p.sub || '');
    setPTipo(p.tipoIntervento || '');
    setPDivision(p.division || 'studio');
    
    const internal = projectsInternal[id];
    setPNotes(internal?.notes || '');
    setEditProjOpen(true);
  };

  const handleSaveEditProject = () => {
    if (!editProjId) return;
    const p = projects[editProjId];
    if (!p) return;

    setProjects(prev => {
      const next = { ...prev };
      next[editProjId] = {
        ...p,
        name: pName.trim(),
        code: pCode.trim() || null,
        client: pClient.trim() || null,
        location: pLocation.trim() || null,
        clientUid: pClientUid || null,
        clientRecordId: pClientRecordId || null,
        manager: pManager,
        startDate: pStart || null,
        dueDate: pDue || null,
        committente: pCommittente.trim() || null,
        indirizzoImmobile: pIndirizzo.trim() || null,
        foglio: pFoglio.trim() || null,
        particella: pParticella.trim() || null,
        sub: pSub.trim() || null,
        tipoIntervento: pTipo.trim() || null,
        division: pDivision,
        updatedAt: Date.now()
      };
      const updated = autoUpdateProjectsCompletion(next);
      syncState('projects', updated);
      return updated;
    });

    setProjectsInternal(prev => {
      const next = { ...prev };
      next[editProjId] = { ...prev[editProjId], notes: pNotes.trim() || null };
      syncState('projectsInternal', next);
      return next;
    });

    showToast('Fascicolo modificato.');
    setEditProjOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const p = projects[id];
    askDelete('Eliminare la pratica?', p ? `"${p.name}" e il suo fascicolo finiranno nel Cestino per ${TRASH_RETENTION_DAYS} giorni.` : null, () => {
      if (p) moveToTrash('progetti', p.name, p, undefined, p.client || undefined);
      setProjects(prev => {
        const next = { ...prev };
        delete next[id];
        syncState('projects', next);
        return next;
      });
      setEditProjOpen(false);
      showToast('Pratica spostata nel Cestino.', 'err');
      window.location.hash = '#progetti';
    });
  };

  // Archivia/ripristina una pratica (esce dalle liste di default, filtro "Archivio")
  const handleToggleArchiveProject = (id: string) => {
    setProjects(prev => {
      const p = prev[id];
      if (!p) return prev;
      const next = { ...prev, [id]: { ...p, archived: !p.archived, updatedAt: Date.now() } };
      syncState('projects', next);
      showToast(p.archived ? 'Pratica ripristinata dall\'archivio.' : 'Pratica archiviata.');
      return next;
    });
  };

  const handleSaveEstimate = (est: MatericoEstimate) => {
    setEstimates(prev => {
      const next = { ...prev, [est.id]: est };
      syncState('estimates', next);
      return next;
    });
    showToast('Preventivo registrato.');
  };

  const handleDeleteEstimate = (id: string) => {
    const est = estimates[id];
    askDelete('Eliminare il preventivo Materico?', est ? `"${est.itemName || est.itemDescription || est.partnerName}"` : null, () => {
      if (est) moveToTrash('estimates', est.itemName || est.itemDescription || 'Preventivo Materico', est, undefined, est.partnerName);
      setEstimates(prev => {
        const next = { ...prev };
        delete next[id];
        syncState('estimates', next);
        return next;
      });
      showToast('Preventivo spostato nel Cestino.', 'err');
    });
  };

  // 3. Document manager
  const handleUploadDocument = (projId: string, file: File, kind: string = 'allegato') => {
    // Generate mock visual path mapping on local system
    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const newDoc = {
      id: docId,
      name: file.name,
      kind,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200',
      byName: currentUser?.name || 'Studio Admin',
      by: currentUser?.uid || 'admin',
      at: Date.now()
    };

    setDocuments(prev => {
      const prjDocs = { ...(prev[projId] || {}) };
      prjDocs[docId] = newDoc;
      const next = { ...prev, [projId]: prjDocs };
      return next;
    });
    // Scrittura mirata (compatibile con le regole: anche i clienti possono creare)
    writeNode(`documents/${projId}/${docId}`, newDoc).catch(() => {});
    showToast('Documento caricato!');
  };

  const handleDeleteDocument = (projId: string, docId: string) => {
    const doc = (documents[projId] || {})[docId];
    askDelete(doc?.kind === 'contratto' ? 'Eliminare il contratto?' : 'Eliminare il documento?', doc ? `"${doc.name}"` : null, () => {
      if (doc) moveToTrash('documenti', doc.name || 'Documento', doc, { pid: projId }, projects[projId]?.name);
      setDocuments(prev => {
        const prjDocs = { ...(prev[projId] || {}) };
        delete prjDocs[docId];
        const next = { ...prev, [projId]: prjDocs };
        return next;
      });
      removeNode(`documents/${projId}/${docId}`).catch(() => {});
      showToast('Documento spostato nel Cestino.', 'err');
    });
  };

  // 3b. Arredi & Moodboard (scrittura mirata per-elemento, come i documenti)
  const handleSaveFurnishing = (projId: string, item: Furnishing) => {
    const enriched: Furnishing = {
      ...item,
      createdByName: item.createdByName || currentUser?.name
    };
    setFurnishings((prev) => {
      const prj = { ...(prev[projId] || {}) };
      prj[item.id] = enriched;
      return { ...prev, [projId]: prj };
    });
    writeNode(`projectFurnishings/${projId}/${item.id}`, enriched).catch((e: any) =>
      showToast('Errore salvataggio arredo: ' + (e?.message || e?.code || 'controlla regole/permessi'), 'err')
    );
  };

  const handleDeleteFurnishing = (projId: string, itemId: string) => {
    const item = (furnishings[projId] || {})[itemId];
    askDelete('Eliminare l\'arredo?', item ? `"${item.title}"` : null, () => {
      if (item) moveToTrash('arredi', item.title || 'Arredo', item, { pid: projId }, projects[projId]?.name);
      setFurnishings((prev) => {
        const prj = { ...(prev[projId] || {}) };
        delete prj[itemId];
        return { ...prev, [projId]: prj };
      });
      removeNode(`projectFurnishings/${projId}/${itemId}`).catch(() =>
        showToast('Errore eliminazione arredo (controlla regole/permessi).', 'err')
      );
    });
  };

  // 3b-bis. Moodboard 3D: salva la scena per-progetto (nodo intero)
  const handleSaveMoodboard3d = (projId: string, elements: any[]) => {
    const payload = { elements: elements || [], updatedAt: Date.now(), by: currentUser?.uid || null };
    setMoodboard3d((prev) => ({ ...prev, [projId]: payload }));
    writeNode(`projectMoodboard3d/${projId}`, payload).catch((e: any) =>
      showToast('Errore salvataggio moodboard 3D: ' + (e?.message || e?.code || 'controlla regole/permessi'), 'err')
    );
  };

  // 3c. Flag "lo Studio gestisce gli arredi mobili" (→ fee 20%) sul progetto
  const handleToggleStudioManagesMobili = (projId: string, value: boolean) => {
    setProjects((prev) => {
      const p = prev[projId];
      if (!p) return prev;
      const next = { ...prev, [projId]: { ...p, studioManagesArrediMobili: value, updatedAt: Date.now() } };
      syncState('projects', next);
      return next;
    });
  };

  // 3d. Modulo Cantiere
  const cantSetters: Record<string, (updater: (m: any) => any) => void> = {
    cantiereRapportini: setCantRapportini as any,
    cantierePresenze: setCantPresenze as any,
    cantiereFoto: setCantFoto as any,
    cantiereMateriali: setCantMateriali as any,
    cantiereChecklist: setCantChecklist as any,
    cantiereDocumenti: setCantDocumenti as any,
    cantiereSal: setCantSal as any,
    cantiereRecords: setCantRecords as any,
    cantiereMessages: setCantMessages as any
  };
  // Area Impresa: collection keyed per uid (profilo riusabile del partner)
  const impresaSetters: Record<string, (updater: (m: any) => any) => void> = {
    impresaDocs: setImpresaDocs as any,
    impresaRecords: setImpresaRecords as any
  };
  const cantErr = () => showToast('Errore cantiere (controlla regole/permessi).', 'err');
  // Storico/audit (scrittura solo lato studio: le regole vietano la scrittura ai partner)
  const logCantiere = (cid: string, action: string, entity: string, detail?: string) => {
    if (!currentUser || currentUser.role === 'cliente' || currentUser.role === 'partner') return;
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const entry: CantiereLog = { id, action, entity, by: currentUser.uid, role: currentUser.role, at: Date.now(), detail: detail || null };
    setCantLog((m) => ({ ...m, [cid]: { ...(m[cid] || {}), [id]: entry } }));
    writeNode(`cantiereLog/${cid}/${id}`, entry).catch(() => {});
  };

  const handleSaveCantiere = (c: Cantiere) => {
    const enriched: Cantiere = { ...c, createdByName: c.createdByName || currentUser?.name, updatedAt: Date.now() };
    setCantieri((prev) => ({ ...prev, [c.id]: enriched }));
    writeNode(`cantieri/${c.id}`, enriched).catch(cantErr);
    logCantiere(c.id, 'cantiere.salvato', 'cantiere', c.name);
  };
  const handleDeleteCantiere = (cid: string) => {
    const c = cantieri[cid];
    askDelete('Eliminare il cantiere?', c ? `"${c.name}" finirà nel Cestino per ${TRASH_RETENTION_DAYS} giorni.` : null, () => {
      if (c) moveToTrash('cantieri', c.name || 'Cantiere', c);
      setCantieri((prev) => { const n = { ...prev }; delete n[cid]; return n; });
      removeNode(`cantieri/${cid}`).catch(cantErr);
      // ripulisce l'indice inverso dei partner assegnati
      Object.keys(c?.partnerUids || {}).forEach((uid) => removeNode(`partnerCantieri/${uid}/${cid}`).catch(() => {}));
      showToast('Cantiere spostato nel Cestino.', 'err');
    });
  };
  const handleAssignPartner = (cid: string, uid: string, name: string, on: boolean) => {
    setCantieri((prev) => {
      const c = prev[cid];
      if (!c) return prev;
      const partnerUids = { ...(c.partnerUids || {}) };
      if (on) partnerUids[uid] = true; else delete partnerUids[uid];
      return { ...prev, [cid]: { ...c, partnerUids } };
    });
    if (on) {
      writeNode(`cantieri/${cid}/partnerUids/${uid}`, true).catch(cantErr);
      writeNode(`partnerCantieri/${uid}/${cid}`, true).catch(cantErr);
    } else {
      removeNode(`cantieri/${cid}/partnerUids/${uid}`).catch(cantErr);
      removeNode(`partnerCantieri/${uid}/${cid}`).catch(cantErr);
    }
    logCantiere(cid, on ? 'partner.assegnato' : 'partner.rimosso', 'partner', name);
  };
  const handleSaveCantEntity = (coll: string, cid: string, item: any) => {
    cantSetters[coll]?.((m) => ({ ...m, [cid]: { ...(m[cid] || {}), [item.id]: item } }));
    writeNode(`${coll}/${cid}/${item.id}`, item).catch(cantErr);
  };
  const handleDeleteCantEntity = (coll: string, cid: string, id: string) => {
    const getter: Record<string, any> = {
      cantiereRapportini: cantRapportini, cantierePresenze: cantPresenze, cantiereFoto: cantFoto,
      cantiereMateriali: cantMateriali, cantiereChecklist: cantChecklist, cantiereDocumenti: cantDocumenti,
      cantiereSal: cantSal, cantiereRecords: cantRecords, cantiereMessages: cantMessages
    };
    const item = getter[coll]?.[cid]?.[id];
    const label = item?.name || item?.title || item?.descrizione || item?.desc || item?.caption || 'Voce di cantiere';
    askDelete('Eliminare questa voce di cantiere?', `"${label}"`, () => {
      if (item) moveToTrash('cantiere', label, item, { coll, cid }, cantieri[cid]?.name);
      cantSetters[coll]?.((m) => { const sub = { ...(m[cid] || {}) }; delete sub[id]; return { ...m, [cid]: sub }; });
      removeNode(`${coll}/${cid}/${id}`).catch(cantErr);
    });
  };
  const handleApproveRapportino = (cid: string, id: string, approve: boolean) => {
    const r = cantRapportini[cid]?.[id];
    if (!r) return;
    const next: Rapportino = { ...r, status: approve ? 'approvato' : 'rifiutato', approvedBy: currentUser?.uid };
    handleSaveCantEntity('cantiereRapportini', cid, next);
    logCantiere(cid, approve ? 'rapportino.approvato' : 'rapportino.rifiutato', 'rapportino', r.partnerName || '');
    showToast(approve ? 'Rapportino approvato.' : 'Rapportino rifiutato.', approve ? 'ok' : 'err');
  };
  const handleApproveSal = (cid: string, id: string) => {
    const s = cantSal[cid]?.[id];
    if (!s) return;
    const next: CantiereSal = { ...s, status: 'approvato', approvedBy: currentUser?.uid };
    handleSaveCantEntity('cantiereSal', cid, next);
    logCantiere(cid, 'sal.approvato', 'sal', `SAL ${s.number}`);
    showToast('SAL approvato. Emetti la bozza fattura da Finanze → SAL.', 'ok');
  };
  // Collega un SAL di cantiere alla fattura generata (chiamato da FinanzeView)
  const handleLinkCantiereSalInvoice = (cid: string, salId: string, invoiceId: string) => {
    const s = cantSal[cid]?.[salId];
    if (!s) return;
    handleSaveCantEntity('cantiereSal', cid, { ...s, linkedInvoiceId: invoiceId });
    logCantiere(cid, 'sal.fatturato', 'sal', invoiceId);
  };
  // Chat di cantiere (studio + partner assegnato)
  const handleSendCantiereMessage = (cid: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const id = `cmsg-${Date.now()}`;
    const msg: CantiereMessage = {
      id, from: currentUser.uid, role: currentUser.role,
      name: currentUser.name, text: text.trim(), at: Date.now()
    };
    handleSaveCantEntity('cantiereMessages', cid, msg);
  };
  // Area Impresa: save/delete generici keyed per uid del partner
  const handleSaveImpresaEntity = (coll: string, uid: string, item: any) => {
    impresaSetters[coll]?.((m) => ({ ...m, [uid]: { ...(m[uid] || {}), [item.id]: item } }));
    writeNode(`${coll}/${uid}/${item.id}`, item).catch(() => showToast('Errore impresa (controlla regole/permessi).', 'err'));
  };
  const handleDeleteImpresaEntity = (coll: string, uid: string, id: string) => {
    const item = (coll === 'impresaDocs' ? impresaDocs : impresaRecords)[uid]?.[id] as any;
    const label = item?.name || item?.title || 'Voce impresa';
    askDelete('Eliminare questa voce dell\'impresa?', `"${label}"`, () => {
      if (item) moveToTrash('impresa', label, item, { coll, uid });
      impresaSetters[coll]?.((m) => { const sub = { ...(m[uid] || {}) }; delete sub[id]; return { ...m, [uid]: sub }; });
      removeNode(`${coll}/${uid}/${id}`).catch(() => showToast('Errore impresa (controlla regole/permessi).', 'err'));
    });
  };
  // Rubrica clienti (admin/manager)
  const handleSaveClient = (rec: ClientRecord) => {
    const enriched: ClientRecord = { ...rec, createdBy: rec.createdBy || currentUser?.uid || 'admin', updatedAt: Date.now() };
    setClients((prev) => ({ ...prev, [rec.id]: enriched }));
    writeNode(`clients/${rec.id}`, enriched).catch(() => showToast('Errore rubrica clienti (controlla regole).', 'err'));
  };
  const handleDeleteClient = (id: string) => {
    const rec = clients[id];
    askDelete('Eliminare il cliente dalla rubrica?', rec ? `"${rec.name}"` : null, () => {
      if (rec) moveToTrash('rubrica', rec.name || 'Cliente', rec);
      setClients((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`clients/${id}`).catch(() => showToast('Errore rubrica clienti (controlla regole).', 'err'));
      showToast('Cliente spostato nel Cestino.', 'err');
    });
  };

  // ---- Notifiche persistenti (notifications/<uid>) ----
  const pushNotification = (uid: string, payload: { type: string; title: string; body?: string | null; link?: string | null }) => {
    if (!uid) return;
    const id = `ntf-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
    const ntf: Notification = {
      id, type: payload.type, title: payload.title, body: payload.body || null, link: payload.link || null,
      read: false, at: Date.now(), by: currentUser?.uid || null, byName: currentUser?.name || null
    };
    writeNode(`notifications/${uid}/${id}`, ntf).catch(() => {});
  };
  // Notifica a tutti i membri studio (esclude opzionalmente un uid, es. l'autore)
  const notifyStudio = (payload: { type: string; title: string; body?: string | null; link?: string | null }, exceptUid?: string) => {
    const uids = new Set<string>([
      ...Object.keys(directory || {}),
      ...Object.values(users).filter((u: any) => u && u.active && u.role !== 'cliente' && u.role !== 'partner').map((u: any) => u.uid)
    ]);
    uids.forEach((uid) => { if (uid && uid !== exceptUid) pushNotification(uid, payload); });
  };
  const markNotificationRead = (id: string) => {
    if (!currentUser) return;
    if (!notifications.some((n) => n.id === id)) return; // sintetiche (es. richieste appuntamento): non persistite
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    updateNode(`notifications/${currentUser.uid}/${id}`, { read: true }).catch(() => {});
  };
  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    notifications.filter((n) => !n.read).forEach((n) => updateNode(`notifications/${currentUser.uid}/${n.id}`, { read: true }).catch(() => {}));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const clearNotifications = () => {
    if (!currentUser) return;
    setNotifications([]);
    removeNode(`notifications/${currentUser.uid}`).catch(() => {});
  };

  // ---- Ferie/assenze team (teamLeave/<id>) ----
  const handleSaveLeave = (leave: TeamLeave) => {
    setTeamLeave((prev) => ({ ...prev, [leave.id]: leave }));
    writeNode(`teamLeave/${leave.id}`, leave)
      .then(() => {
        // notifica in-app a tutto il team (escluso l'autore)
        notifyStudio({
          type: 'ferie',
          title: `${leave.name}: ${leave.type} dal ${leave.dateFrom}`,
          body: leave.dateFrom === leave.dateTo ? `Giorno ${leave.dateFrom}` : `Dal ${leave.dateFrom} al ${leave.dateTo}`,
          link: '#calendario'
        }, leave.uid);
      })
      .catch(() => showToast('Errore ferie (controlla regole/permessi).', 'err'));
  };
  const handleDeleteLeave = (id: string) => {
    const lv = teamLeave[id];
    askDelete('Eliminare l\'assenza?', lv ? `${lv.name}: ${lv.type} dal ${lv.dateFrom}` : null, () => {
      if (lv) moveToTrash('ferie', `${lv.name} · ${lv.type}`, lv, undefined, `${lv.dateFrom} → ${lv.dateTo}`);
      setTeamLeave((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`teamLeave/${id}`).catch(() => showToast('Errore ferie (controlla regole/permessi).', 'err'));
    });
  };
  // Auto-compila i campi del progetto dall'anagrafica selezionata (committente solo se vuoto;
  // pIndirizzo NON viene toccato: è l'indirizzo dell'immobile, non la residenza del cliente)
  const applyClientRecord = (rec: ClientRecord | null) => {
    if (!rec) return;
    setPClient(rec.name || '');
    setPCommittente((prev) => prev || rec.name || '');
    if (rec.accountUid) setPClientUid(rec.accountUid);
  };
  const handleSaveInlineClient = () => {
    const d = ncDraft;
    const name = (d.type === 'azienda' ? (d.companyName || d.name) : (d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim())) || '';
    if (!name.trim()) { showToast('Inserisci nome/ragione sociale del cliente.', 'err'); return; }
    const id = `cli-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const rec: ClientRecord = {
      id,
      category: 'cliente',
      type: (d.type as any) || 'privato',
      name: name.trim(),
      firstName: d.firstName || null,
      lastName: d.lastName || null,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      codiceFiscale: d.codiceFiscale || null,
      companyName: d.companyName || null,
      partitaIva: d.partitaIva || null,
      pec: d.pec || null,
      sdi: d.sdi || null,
      accountUid: d.accountUid || null,
      notes: null,
      createdBy: currentUser?.uid || 'admin',
      createdAt: Date.now()
    };
    handleSaveClient(rec);
    setPClientRecordId(id);
    applyClientRecord(rec);
    setNewRubricaOpen(false);
    setNcDraft({ type: 'privato' });
    showToast('Cliente aggiunto alla rubrica.');
  };

  // 4. Chat messages
  const handleSendClientMessage = (projId: string, text: string) => {
    const mId = `msg-${Date.now()}`;
    const newMsg: ProjectMessage = {
      id: mId,
      from: currentUser?.uid || 'admin',
      role: currentUser?.role || 'admin',
      name: currentUser?.name || 'Progettista',
      text: text.trim(),
      at: Date.now()
    };

    setProjectMessages(prev => {
      const prjMsgs = { ...(prev[projId] || {}) };
      prjMsgs[mId] = newMsg;
      const next = { ...prev, [projId]: prjMsgs };
      return next;
    });
    // Scrittura mirata del singolo messaggio (regole: create consentito anche al cliente)
    writeNode(`projectMessages/${projId}/${mId}`, newMsg).catch(() => {});
  };

  // 5. User accounts additions
  const handleCreateUser = () => {
    if (!nuName.trim() || !nuEmail.trim()) {
      showToast('Compila nome ed email!', 'err');
      return;
    }

    const nUid = `u-${Date.now()}`;
    const newUser: UserProfile = {
      uid: nUid,
      name: nuName.trim(),
      email: nuEmail.trim(),
      role: nuRole,
      title: nuTitle.trim() || undefined,
      functions: nuFns.length ? nuFns : undefined,
      active: true,
      createdAt: Date.now()
    };

    setUsers(prev => {
      const next = { ...prev, [nUid]: newUser };
      syncState('users', next);
      return next;
    });

    showToast('Nuovo collaboratore inserito!');
    setNewUserOpen(false);
  };

  const handleCreateClient = () => {
    if (!nuName.trim() || !nuEmail.trim()) {
      showToast('Compila nome ed email!', 'err');
      return;
    }

    const nUid = `u-${Date.now()}`;
    const nextRole = nuRole === 'partner' ? 'partner' : 'cliente';
    const nextSector = nuRole === 'partner' ? 'partner' : (nuTitle as any || 'studio');

    const newClient: UserProfile = {
      uid: nUid,
      name: nuName.trim(),
      email: nuEmail.trim(),
      role: nextRole,
      sector: nextSector,
      title: nextRole === 'partner' ? 'Partner B2B (Fornitore)' : `Cliente Portale ${nextSector === 'strategico' ? 'Strategico' : nextSector === 'materico' ? 'Materico' : 'Studio'}`,
      active: true,
      createdAt: Date.now()
    };

    setUsers(prev => {
      const next = { ...prev, [nUid]: newClient };
      syncState('users', next);
      return next;
    });

    showToast(nextRole === 'partner' ? 'Nuovo partner B2B registrato!' : 'Nuova anagrafica cliente inserita con successo!');
    setNewClientOpen(false);
  };

  // 6. Finances log moves
  const handleCreateMovement = () => {
    if (!fnDesc.trim() || !fnAmount) {
      showToast('Compila descrizione e importo!', 'err');
      return;
    }

    const amt = parseFloat(fnAmount.replace(/,/g, '.'));
    if (isNaN(amt)) {
      showToast('Importo numerico non valido!', 'err');
      return;
    }

    const mId = `mov-${Date.now()}`;
    const newM: FinanceMovement = {
      id: mId,
      kind: fnKind,
      desc: fnDesc.trim(),
      amount: amt,
      date: fnDate || todayISO(),
      category: fnCat,
      note: fnNote.trim() || null,
      projectId: finCtx === 'studio' ? (fnProjLink || null) : finCtx,
      by: currentUser?.uid || 'admin',
      at: Date.now()
    };

    setFinances(prev => {
      const next = { ...prev, [mId]: newM };
      syncState('finance', next);
      return next;
    });

    showToast('Movimento di bilancio registrato.');
    setFinOpen(false);
  };

  const handleDeleteMovement = (id: string) => {
    const m = finances[id];
    askDelete('Eliminare il movimento?', m ? `"${m.desc}" · ${eur(m.amount)}` : null, () => {
      if (m) moveToTrash('movimenti', m.desc || 'Movimento', m, undefined, `${m.kind} · ${eur(m.amount)}`);
      setFinances(prev => {
        const next = { ...prev };
        delete next[id];
        syncState('finance', next);
        return next;
      });
      showToast('Movimento spostato nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Contabilità di commessa: scritture sui nodi finanza
  // strutturati (fatture attive/passive, scadenze). Stessa
  // fonte di FinanzeView → confluiscono nel consolidato.
  // ----------------------------------------------------
  type FinNode = 'finInvoicesActive' | 'finInvoicesPassive' | 'finScadenze';
  const finStateFor = (node: FinNode): [any[], (v: any[]) => void] =>
    node === 'finInvoicesActive' ? [finInvoicesActive, setFinInvoicesActive] :
    node === 'finInvoicesPassive' ? [finInvoicesPassive, setFinInvoicesPassive] :
    [finScadenze, setFinScadenze];

  const handleSaveFinanceItem = (node: FinNode, item: any) => {
    const [arr, setArr] = finStateFor(node);
    const next = [...arr.filter((x: any) => x.id !== item.id), item];
    setArr(next);
    writeNode(node, next).catch((e: any) =>
      showToast('Errore salvataggio (permessi?): ' + (e?.message || e?.code || ''), 'err')
    );
    showToast('Registrato in contabilità di commessa.');
  };

  const handleDeleteFinanceItem = (node: FinNode, id: string) => {
    const [arr, setArr] = finStateFor(node);
    const item = arr.find((x: any) => x.id === id);
    const section = node === 'finInvoicesActive' ? 'fatture_attive' : node === 'finInvoicesPassive' ? 'fatture_passive' : 'scadenze';
    const label = item
      ? (node === 'finInvoicesActive' ? `Fattura ${item.id} · ${item.clientName || ''}`
        : node === 'finInvoicesPassive' ? `Fattura ${item.id} · ${item.supplierName || ''}`
        : `${item.desc || 'Scadenza'} · ${item.clientOrSupplier || ''}`)
      : 'Voce contabile';
    askDelete('Eliminare la voce contabile?', `${label} (${eur(Number(item?.amount) || 0)})`, () => {
      if (item) moveToTrash(section, label, item, undefined, eur(Number(item.amount) || 0));
      const next = arr.filter((x: any) => x.id !== id);
      setArr(next);
      writeNode(node, next).catch(() => {});
      showToast('Voce spostata nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Preventivi studio (quotes/<id>)
  // ----------------------------------------------------
  const handleSaveQuote = (q: Quote) => {
    const enriched: Quote = { ...q, createdBy: q.createdBy || currentUser?.uid, updatedAt: Date.now() };
    setQuotes((prev) => ({ ...prev, [q.id]: enriched }));
    writeNode(`quotes/${q.id}`, enriched).catch(() => showToast('Errore preventivi (controlla regole).', 'err'));
  };
  const handleDeleteQuote = (id: string) => {
    const q = quotes[id];
    const kindLbl = q?.docKind === 'parcella' ? 'la parcella' : 'il preventivo';
    askDelete(`Eliminare ${kindLbl}?`, q ? `"${q.number}" · ${q.clientName} · ${eur(q.total)}` : null, () => {
      if (q) moveToTrash('preventivi', `${q.docKind === 'parcella' ? 'Parcella' : 'Preventivo'} ${q.number}`, q, undefined, q.clientName);
      setQuotes((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`quotes/${id}`).catch(() => showToast('Errore preventivi (controlla regole).', 'err'));
      showToast('Documento spostato nel Cestino.', 'err');
    });
  };
  const handleSetQuoteStatus = (id: string, status: Quote['status']) => {
    const q = quotes[id];
    if (!q) return;
    handleSaveQuote({ ...q, status });
    if (status === 'accettato') {
      notifyStudio({ type: 'preventivo', title: `Preventivo accettato: ${q.number}`, body: `${q.clientName} · ${eur(q.total)}`, link: '#preventivi' });
      showToast('Preventivo accettato. Emetti le rate dal piano pagamenti.', 'ok');
    }
  };
  // Genera fattura attiva + scadenza da una rata del piano pagamenti (collegamento a finanza)
  const handleEmitMilestone = (quoteId: string, milestoneId: string) => {
    const q = quotes[quoteId];
    if (!q) return;
    const m = (q.paymentPlan || []).find((x) => x.id === milestoneId);
    if (!m || m.status !== 'da_emettere') return;
    const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const inv: InvoiceActive = {
      id: invId, clientName: q.clientName, projectId: q.projectId || '', projectName: q.projectId ? (projects[q.projectId]?.name || '') : '',
      amount: m.amount,
      // IVA/cassa ereditate dal preventivo (spuntabili nell'editor)
      taxRate: (q.vatEnabled ?? true) ? (q.vatPct ?? 22) : 0,
      cassaPct: q.cassaEnabled ? (q.cassaPct ?? 4) : null,
      status: 'bozza', sdiCode: '', date: todayISO(), dueDate: m.dueDate || todayISO(), sector: q.division as any
    };
    handleSaveFinanceItem('finInvoicesActive', inv);
    const sca: ScadenzaItem = {
      id: `sca-${Date.now()}-${Math.floor(Math.random() * 900)}`, kind: 'entrata', desc: `${q.number} · ${m.label}`,
      clientOrSupplier: q.clientName, amount: m.amount, dueDate: m.dueDate || todayISO(), status: 'pago_attesa', projectId: q.projectId || undefined, sector: q.division as any
    };
    handleSaveFinanceItem('finScadenze', sca);
    const nextPlan: PaymentMilestone[] = (q.paymentPlan || []).map((x) => (x.id === milestoneId ? { ...x, status: 'fatturato', invoiceId: invId } : x));
    handleSaveQuote({ ...q, paymentPlan: nextPlan });
    showToast('Rata emessa: bozza fattura + scadenza create in Finanze.', 'ok');
  };

  // ----------------------------------------------------
  // ADDITIONAL OVERRIDES & PHASE ACTIONS
  // ----------------------------------------------------
  const handleAddPhase = (projId: string) => {
    const phName = prompt('Inserisci il nome della nuova fase:');
    if (!phName || !phName.trim()) return;

    setProjects(prev => {
      const p = prev[projId];
      if (!p) return prev;
      const next = { ...prev };
      const phId = `ph-${Date.now()}`;
      next[projId].phases[phId] = {
        id: phId,
        name: phName.trim(),
        order: Object.keys(p.phases || {}).length,
        tasks: {}
      };
      syncState('projects', next);
      return next;
    });
    showToast('Fase aggiunta.');
  };

  const handleDeletePhase = (projId: string, phId: string) => {
    const phName = projects[projId]?.phases?.[phId]?.name;
    askDelete('Eliminare la fase?', `"${phName || 'Fase'}" e tutti i suoi task verranno rimossi dal fascicolo.`, () => doDeletePhase(projId, phId), true);
  };
  const doDeletePhase = (projId: string, phId: string) => {
    setProjects(prev => {
      const p = prev[projId];
      if (!p || !p.phases[phId]) return prev;
      const next = { ...prev };
      delete next[projId].phases[phId];
      const updated = autoUpdateProjectsCompletion(next);
      syncState('projects', updated);
      return updated;
    });
    showToast('Fase rimossa.', 'err');
  };

  const handleAddPtask = (projId: string, phId: string) => {
    const taskName = prompt('Inserisci il nome dell’attività:');
    if (!taskName || !taskName.trim()) return;

    setProjects(prev => {
      const p = prev[projId];
      if (!p || !p.phases[phId]) return prev;
      const next = { ...prev };
      const tId = `t-${Date.now()}`;
      next[projId].phases[phId].tasks[tId] = {
        id: tId,
        title: taskName.trim(),
        order: Object.keys(p.phases[phId].tasks || {}).length,
        done: false,
        role: 'Progettazione'
      };
      const updated = autoUpdateProjectsCompletion(next);
      syncState('projects', updated);
      return updated;
    });
    showToast('Attività aggiunta.');
  };

  const handleDeletePtask = (projId: string, phId: string, tId: string) => {
    const tTitle = projects[projId]?.phases?.[phId]?.tasks?.[tId]?.title;
    askDelete('Eliminare l\'attività?', `"${tTitle || 'Attività'}" verrà rimossa dalla fase.`, () => {
      setProjects(prev => {
        const p = prev[projId];
        if (!p || !p.phases[phId] || !p.phases[phId].tasks[tId]) return prev;
        const next = { ...prev };
        delete next[projId].phases[phId].tasks[tId];
        const updated = autoUpdateProjectsCompletion(next);
        syncState('projects', updated);
        return updated;
      });
      showToast('Attività rimossa.', 'err');
    }, true);
  };

  // ----------------------------------------------------
  // GENERAL RENDER DELEGATES
  // ----------------------------------------------------

  // Auth gate: wait for Firebase, then require Google sign-in.
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#161616] animate-spin" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-stone-400">
            Onirico Studio OS
          </span>
        </div>
      </div>
    );
  }

  if (!gUser) {
    return <AuthFlow gUser={null} onToast={(m, t) => showToast(m, t)} onLogout={handleLogout} />;
  }

  // Account creato ma non ancora caricato/approvato
  if (!accountsReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#161616] animate-spin" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-stone-400">
            Verifica accesso…
          </span>
        </div>
      </div>
    );
  }

  // Sessione non ancora attiva (currentUser = profilo approvato CON ruolo).
  // Gli account già attivi/approvati saltano direttamente all'app qui sotto.
  if (!currentUser) {
    const mine = ownProfile;

    // Account rifiutato dall'amministratore
    if (mine?.status === 'rejected') {
      return (
        <div className="min-h-screen bg-[#F5F5F3] p-8 flex flex-col justify-center items-center select-none font-sans">
          <div className="w-full max-w-[440px] mx-auto text-center animate-[popIn_0.35s_ease_both]">
            <h1 className="font-black text-[30px] tracking-tight text-[#161616]">
              Onirico Studio <span className="text-stone-400 font-light">· OS</span>
            </h1>
            <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-7 mt-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <b className="text-[16px] text-[#161616]">Accesso non autorizzato</b>
              <p className="text-[13px] text-[#8a8a8a] leading-relaxed">
                Il tuo account non è stato abilitato. Contatta l’amministratore dello studio.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[12px] text-stone-400 font-semibold">
                <User className="w-3.5 h-3.5" /> {gUser.email}
              </div>
              <button onClick={handleLogout} className="btn bg-gray-100 hover:bg-gray-200 border-none text-[#161616] font-bold justify-center mt-3 w-full">
                Esci
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Profilo non ancora completato (primo accesso) → form registrazione/completamento
    if (!mine || !mine.profileComplete) {
      return <AuthFlow gUser={gUser} pendingProfile={mine || null} onToast={(m, t) => showToast(m, t)} onLogout={handleLogout} />;
    }

    // Profilo completo ma ancora senza ruolo approvato → Team in attesa
    return (
      <div className="min-h-screen bg-[#F5F5F3] p-8 flex flex-col justify-center items-center select-none font-sans">
        <div className="w-full max-w-[440px] mx-auto text-center animate-[popIn_0.35s_ease_both]">
          <h1 className="font-black text-[30px] tracking-tight text-[#161616]">
            Onirico Studio <span className="text-stone-400 font-light">· OS</span>
          </h1>
          <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-7 mt-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <b className="text-[16px] text-[#161616]">Richiesta in attesa di approvazione</b>
            <p className="text-[13px] text-[#8a8a8a] leading-relaxed">
              La tua registrazione come <b>Team</b> è stata inviata. Un responsabile dello studio
              deve approvarti e assegnarti un ruolo. Riprova più tardi.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[12px] text-stone-400 font-semibold">
              <User className="w-3.5 h-3.5" /> {gUser.email}
            </div>
            <button onClick={handleLogout} className="btn bg-gray-100 hover:bg-gray-200 border-none text-[#161616] font-bold justify-center mt-3 w-full">
              Esci
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT/PARTNER PORTAL OVERLAY PATH
  const isPortalRole = currentUser.role === 'cliente' || currentUser.role === 'partner';
  if (isPortalRole) {
    return (
      <>
      <ClientPortalView
        profile={currentUser}
        projects={Object.values(projects)}
        users={users}
        activePid={clientActivePid || (currentUser.projectIds ? Object.keys(currentUser.projectIds)[0] : null)}
        openPh={clientOpenPh}
        onSetActivePid={setClientActivePid}
        onSetOpenPh={setClientOpenPh}
        onSendClientMessage={handleSendClientMessage}
        onUploadDocument={handleUploadDocument}
        studioMembers={
          Object.keys(directory).length > 0
            ? Object.entries(directory).map(([uid, v]) => ({ uid, name: v.name, role: v.role } as any))
            : Object.values(users).filter((u) => u.role === 'admin' || u.role === 'manager' || u.role === 'staff')
        }
        onRequestAppointment={handleRequestAppointment}
        matericoRequests={Object.values(matericoRequests)}
        onCreateMatericoRequest={handleCreateMatericoRequest}
        onAcceptMatericoOffer={handleAcceptMatericoOffer}
        onSubmitMatericoOffer={handleSubmitMatericoOffer}
        projectMessages={projectMessages}
        documents={documents}
        furnishings={furnishings}
        onSaveFurnishing={handleSaveFurnishing}
        onDeleteFurnishing={handleDeleteFurnishing}
        moodboard3d={moodboard3d}
        onSaveMoodboard3d={handleSaveMoodboard3d}
        onLogout={handleLogout}
        estimates={Object.values(estimates)}
        onSaveEstimate={handleSaveEstimate}
        onDeleteEstimate={handleDeleteEstimate}
        cantieri={cantieri}
        cantRapportini={cantRapportini}
        cantPresenze={cantPresenze}
        cantFoto={cantFoto}
        cantMateriali={cantMateriali}
        cantChecklist={cantChecklist}
        cantDocumenti={cantDocumenti}
        cantSal={cantSal}
        cantRecords={cantRecords}
        cantMessages={cantMessages}
        cantLog={cantLog}
        impresaDocs={impresaDocs}
        impresaRecords={impresaRecords}
        onSaveCantEntity={handleSaveCantEntity}
        onDeleteCantEntity={handleDeleteCantEntity}
        onSendCantiereMessage={handleSendCantiereMessage}
        onSaveImpresaEntity={handleSaveImpresaEntity}
        onDeleteImpresaEntity={handleDeleteImpresaEntity}
      />
      {/* Doppia conferma eliminazione anche nel portale cliente/partner */}
      {confirmDel && <ConfirmDeleteModal request={confirmDel} onClose={() => setConfirmDel(null)} />}
      </>
    );
  }

  const projectsOfClient = (uid: string) => {
    return Object.values(projects).filter((p: any) => p.clientUid === uid);
  };

  const personalTasksForUser = (uid: string) => {
    const list: any[] = [];
    Object.values(projects).forEach((p: any) => {
      Object.keys(p.phases || {}).forEach(phId => {
        const ph = p.phases[phId];
        Object.keys(ph.tasks || {}).forEach(tId => {
          const t = ph.tasks[tId];
          if (t.assignee === uid) {
            list.push({ ...t, projId: p.id, phaseId: phId });
          }
        });
      });
    });
    return list;
  };

  // Active view content router
  const renderView = () => {
    switch (route) {
      case 'dashboard':
        return (
          <DashboardView
            profile={currentUser}
            tasks={Object.values(tasks)}
            projects={Object.values(projects)}
            users={users}
            appointmentRequests={myApptRequests}
            onConfirmAppointment={handleConfirmAppointment}
            onDeclineAppointment={handleDeclineAppointment}
            onNav={(r) => {
              setRoute(r);
              window.location.hash = `#${r}`;
            }}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onNewTask={() => {
              setEditTaskId(null);
              setTTitle('');
              setTDateInput(todayISO());
              setTTimeInput('');
              setTFreq('once');
              setTPrio('media');
              setTTipo('');
              setTAssignee('');
              setTProjectId('');
              setTNotes('');
              setTaskEditorOpen(true);
            }}
          />
        );

      case 'calendario':
        return (
          <CalendarView
            tasks={Object.values(tasks).filter((t) =>
              t.assignee === currentUser.uid || t.createdBy === currentUser.uid || t.owner === currentUser.uid
            )}
            projects={Object.values(projects)}
            appointments={Object.values(appointments).filter((a) => a.ownerUid === currentUser.uid)}
            calView={calView}
            calDate={calDate}
            onSetCalView={setCalView}
            onSetCalDate={setCalDate}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onNewAppointment={handleOpenNewAppointment}
            onConfirmAppointment={handleConfirmAppointment}
            onDeclineAppointment={handleDeclineAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onNewTask={(pDate) => {
              setEditTaskId(null);
              setTTitle('');
              setTDateInput(pDate || todayISO());
              setTTimeInput('');
              setTFreq('once');
              setTPrio('media');
              setTTipo('');
              setTAssignee('');
              setTProjectId('');
              setTNotes('');
              setTaskEditorOpen(true);
            }}
            myUid={currentUser.uid}
            myName={currentUser.name}
            teamLeave={Object.values(teamLeave)}
            onSaveLeave={handleSaveLeave}
            onDeleteLeave={handleDeleteLeave}
          />
        );

      case 'progetti':
      case 'progetto':
        return (
          <ProjectsView
            projects={Object.values(projects)}
            users={users}
            templates={templates}
            route={route}
            param={routeParam}
            divisionFilter={activeDivision}
            setDivisionFilter={setActiveDivision}
            onNav={(r) => {
              const hash = r.startsWith('progetto/') ? r : r;
              window.location.hash = `#${hash}`;
            }}
            onNewProject={handleOpenNewProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onTogglePtask={handleTogglePtask}
            onEditPtask={(pid, ph, tid) => {
              const task = projects[pid].phases[ph].tasks[tid];
              setPtaskPrjId(pid);
              setPtaskPhId(ph);
              setPtaskEditId(tid);
              setPtTitle(task.title);
              setPtRole(task.role || '');
              setPtAssignee(task.assignee || '');
              setPtDue(task.due || '');
              setPtaskOpen(true);
            }}
            onDeletePtask={handleDeletePtask}
            onAddPtask={(pid, ph) => {
              setPtaskPrjId(pid);
              setPtaskPhId(ph);
              setPtaskEditId(null);
              setPtTitle('');
              setPtRole('');
              setPtAssignee('');
              setPtDue('');
              setPtaskOpen(true);
            }}
            onAddPhase={handleAddPhase}
            onDeletePhase={handleDeletePhase}
            onOpenAnagrafica={(pid) => {
              setAnagProjId(pid);
              const p = projects[pid];
              setPCommittente(p?.committente || '');
              setPClient(p?.client || '');
              setPIndirizzo(p?.indirizzoImmobile || '');
              setPLocation(p?.location || '');
              setPFoglio(p?.foglio || '');
              setPParticella(p?.particella || '');
              setPSub(p?.sub || '');
              setPTipo(p?.tipoIntervento || '');
              setPMarketingBudget(p?.marketingBudget ?? '');
              setPMarketingChannels(p?.marketingChannels ?? '');
              setPMarketingGoal(p?.marketingGoal ?? '');
              setPMatericoEstimatedBudget(p?.matericoEstimatedBudget ?? '');
              setPMatericoFinitureType(p?.matericoFinitureType ?? '');
              setPMatericoSottofondiStatus(p?.matericoSottofondiStatus ?? '');
              setAnagOpen(true);
            }}
            onOpenProjectFinance={(pid) => {
              setFinCtx(pid);
              setFnDesc('');
              setFnAmount('');
              setFnDate(todayISO());
              setFnCat('Studio: Onorari');
              setFnProjLink('');
              setFnNote('');
              setFinOpen(true);
            }}
            onDeleteProjectFinance={(pid, finId) => {
              const m = finances[finId] || (projects[pid]?.finance ? (projects[pid] as any).finance[finId] : null);
              askDelete('Eliminare il movimento?', m ? `"${m.desc}" · ${eur(Number(m.amount) || 0)}` : null, () => {
                if (m) moveToTrash('movimenti', m.desc || 'Movimento', { ...m, id: finId }, undefined, projects[pid]?.name);
                setFinances(prev => {
                  const next = { ...prev };
                  delete next[finId];
                  syncState('finance', next);
                  return next;
                });
                setProjects(prev => {
                  const p = prev[pid];
                  if (!p || !p.finance) return prev;
                  const next = { ...prev };
                  if (next[pid].finance) delete next[pid].finance[finId];
                  syncState('projects', next);
                  return next;
                });
                showToast('Movimento spostato nel Cestino.', 'err');
              });
            }}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onSendClientMessage={handleSendClientMessage}
            projectMessages={projectMessages}
            documents={documents}
            furnishings={furnishings}
            onSaveFurnishing={handleSaveFurnishing}
            onDeleteFurnishing={handleDeleteFurnishing}
            moodboard3d={moodboard3d}
            onSaveMoodboard3d={handleSaveMoodboard3d}
            onToggleStudioManagesMobili={handleToggleStudioManagesMobili}
            isInternalBoss={currentUser.role === 'admin' || currentUser.role === 'manager'}
            myUid={currentUser.uid}
            finance={Object.values(finances)}
            finComputi={finComputi}
            finInvoicesActive={finInvoicesActive}
            finInvoicesPassive={finInvoicesPassive}
            finScadenze={finScadenze}
            onSaveFinanceItem={handleSaveFinanceItem}
            onDeleteFinanceItem={handleDeleteFinanceItem}
            quotes={quotes}
            onSaveQuote={handleSaveQuote}
            onDeleteQuote={handleDeleteQuote}
            onSetQuoteStatus={handleSetQuoteStatus}
            onEmitMilestone={handleEmitMilestone}
            onToggleArchiveProject={handleToggleArchiveProject}
            askDelete={askDelete}
            onTrashItem={moveToTrash}
            estimates={Object.values(estimates)}
            onSaveEstimate={handleSaveEstimate}
            onDeleteEstimate={handleDeleteEstimate}
            matericoRequests={Object.values(matericoRequests)}
            matericoSuppliers={crmSuppliers}
            onUpdateMatericoRequest={handleUpdateMatericoRequest}
            onDeleteMatericoRequest={handleDeleteMatericoRequest}
            unicoDeals={unicoDeals}
            onSaveUnicoDeals={saveUnicoDeals}
            cantieri={cantieri}
            cantRapportini={cantRapportini}
            cantPresenze={cantPresenze}
            cantFoto={cantFoto}
            cantMateriali={cantMateriali}
            cantChecklist={cantChecklist}
            cantDocumenti={cantDocumenti}
            cantSal={cantSal}
            cantLog={cantLog}
            cantRecords={cantRecords}
            cantMessages={cantMessages}
            impresaDocs={impresaDocs}
            impresaRecords={impresaRecords}
            clients={clients}
            partnerAccounts={Object.values(accounts).filter((a: any) => a?.role === 'partner' && a?.status === 'approved') as UserProfile[]}
            onSaveCantiere={handleSaveCantiere}
            onDeleteCantiere={handleDeleteCantiere}
            onAssignPartner={handleAssignPartner}
            onSaveCantEntity={handleSaveCantEntity}
            onDeleteCantEntity={handleDeleteCantEntity}
            onSendCantiereMessage={handleSendCantiereMessage}
            onSaveImpresaEntity={handleSaveImpresaEntity}
            onDeleteImpresaEntity={handleDeleteImpresaEntity}
            onApproveRapportino={handleApproveRapportino}
            onApproveSal={handleApproveSal}
          />
        );

      case 'finanze':
        return (
          <FinanzeView
            finance={Object.values(finances)}
            projects={Object.values(projects)}
            furnishings={furnishings}
            matericoRequests={Object.values(matericoRequests)}
            unicoDeals={unicoDeals}
            onNewMovement={() => {
              setFinCtx('studio');
              setFnDesc('');
              setFnAmount('');
              setFnDate(todayISO());
              setFnCat('Fattura emessa');
              setFnProjLink('');
              setFnNote('');
              setFinOpen(true);
            }}
            onDeleteMovement={handleDeleteMovement}
            cantieri={cantieri}
            cantSal={cantSal}
            onLinkCantiereSal={handleLinkCantiereSalInvoice}
            quotes={quotes}
            clientRecords={clients}
            myUid={currentUser.uid}
            onSaveQuote={handleSaveQuote}
            onDeleteQuote={handleDeleteQuote}
            onSetQuoteStatus={handleSetQuoteStatus}
            onEmitMilestone={handleEmitMilestone}
            initialTab={finStartTab}
            askDelete={askDelete}
          />
        );

      case 'cestino':
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') return null;
        return (
          <TrashView
            trash={trash}
            onRestore={handleRestoreTrash}
            onDeleteForever={handleTrashDeleteForever}
          />
        );

      case 'interactive':
        return <InteractiveView />;

      case 'documenti':
        return (
          <DocumentsView
            documents={documents}
            projects={Object.values(projects)}
            users={users}
            canEdit={currentUser.role !== 'cliente' && currentUser.role !== 'partner'}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        );

      case 'crm':
        return (
          <CrmView
            leads={crmLeads}
            suppliers={crmSuppliers}
            myName={currentUser.name}
            myUid={currentUser.uid}
            onSaveLeads={saveLeads}
            onSaveSuppliers={saveSuppliers}
            onConvertLead={handleConvertLead}
            clients={clients}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            projects={Object.values(projects)}
            members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff'))}
            finInvoicesActive={finInvoicesActive}
            finScadenze={finScadenze}
            askDelete={askDelete}
            onTrashItem={moveToTrash}
          />
        );

      case 'team':
        return (
          <TeamView
            users={users}
            projects={Object.values(projects)}
            peopleTab={peopleTab}
            onSetPeopleTab={setPeopleTab}
            onNewUser={() => {
              setNuName('');
              setNuEmail('');
              setNuPass('');
              setNuRole('staff');
              setNuTitle('');
              setNuFns([]);
              setNewUserOpen(true);
            }}
            onNewClient={() => {
              setNuName('');
              setNuEmail('');
              setNuPass('');
              setNuRole('cliente');
              setNuTitle('studio');
              setNewClientOpen(true);
            }}
            onEditUser={(uid) => {
              const u = users[uid];
              if (!u) return;
              setEditUserId(uid);
              setNuName(u.name);
              setNuEmail(u.email);
              setNuRole(u.role);
              setNuTitle(u.title || '');
              setNuFns(u.functions || []);
              setNuActive(u.active !== false);
              setEditUserOpen(true);
            }}
            onUserMenu={(uid, button) => {
              // Custom immediate edit trigger from table row
              const u = users[uid];
              if (!u) return;
              setEditUserId(uid);
              setNuName(u.name);
              setNuEmail(u.email);
              setNuRole(u.role);
              setNuTitle(u.title || '');
              setNuFns(u.functions || []);
              setNuActive(u.active !== false);
              setEditUserOpen(true);
            }}
            onNav={(r) => {
              window.location.hash = `#${r}`;
            }}
            onPreviewClient={(uid) => {
              const u = users[uid];
              if (u) {
                setCurrentUser(u);
                setIsPreview(true);
              }
            }}
            myUid={currentUser.uid}
            tasks={Object.values(tasks)}
          />
        );

      case 'persona':
        if (routeParam && users[routeParam]) {
          const u = users[routeParam];
          const isClient = u.role === 'cliente';
          const backTo = isClient ? '#team' : '#team';
          const pFns = u.functions || [];

          return (
            <div className="flex flex-col gap-6 text-left">
              <a href={backTo} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8a8a8a] truncate hover:text-[#161616]">
                Indietro a Team
              </a>
              <div className="flex items-center gap-5">
                <span className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-[22px]">
                  {initials(u.name)}
                </span>
                <div>
                  <h2 className="text-[24px] font-black tracking-tight leading-none">{u.name}</h2>
                  <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">{u.email}</p>
                </div>
              </div>

              {isClient ? (
                <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm mt-2">
                  <h3 className="font-bold text-[16px] mb-3">Pratiche collegate</h3>
                  {projectsOfClient(u.uid).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectsOfClient(u.uid).map((p: any) => {
                        const { done, tot } = projTaskCounts(p);
                        const pc = tot ? Math.round((done / tot) * 100) : 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              window.location.hash = `#progetto/${p.id}`;
                            }}
                            className="p-4 rounded-2xl border border-[#f0f0f0] bg-gray-50 hover:bg-[#ececec] transition-colors cursor-pointer flex flex-col gap-2.5"
                          >
                            <b className="text-[14.5px]">{p.name}</b>
                            <div className="w-full h-1 bg-[#ececec] rounded-full overflow-hidden">
                              <div className="h-full bg-[#1b1b1b]" style={{ width: `${pc}%` }} />
                            </div>
                            <span className="text-[11.5px] text-[#8a8a8a]">{pc}% completata</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm italic text-[#8a8a8a]">Nessuna pratica collegata a questo cliente</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap gap-1.5">
                    {pFns.map(f => (
                      <span key={f} className="bg-[#1b1b1b] text-white px-3 py-1 rounded-full text-[11px] uppercase font-bold tracking-wider">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm text-left">
                    <h3 className="text-[16px] font-extrabold text-[#161616] mb-3">Attività in carico</h3>
                    {personalTasksForUser(u.uid).length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {personalTasksForUser(u.uid).map(t => (
                          <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#fafafa] last:border-0">
                            <div>
                              <b className="font-semibold">{t.title}</b>
                              {t.due && <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">Scadenza: {fmtDay(t.due)}</p>}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.done ? 'bg-green-100 text-green-800' : 'bg-orange-105 bg-orange-100 text-orange-800'}`}>
                              {t.done ? 'Chiusa' : 'Aperta'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-[#8a8a8a]">Nessuna attività in carico</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }
        return <p className="text-[13px] text-[#8a8a8a]">Seleziona una persona valida.</p>;

      default:
        return <p className="text-[13px] text-[#8a8a8a]">Sezione in arrivo.</p>;
    }
  };

  const formattedMobileTitle = () => {
    if (route === 'interactive') return 'Premium UI';
    if (route === 'progetto' && routeParam && projects[routeParam]) return projects[routeParam].name;
    const item = ['dashboard', 'calendario', 'progetti', 'documenti', 'finanze', 'team'].find(r => r === route);
    return item ? item : 'Studio OS';
  };

  // Controllo accessi (admin)
  const isAdmin = currentUser.role === 'admin';
  // Gestione accessi (approvazione Team): admin e manager.
  const canManageAccess = currentUser.role === 'admin' || currentUser.role === 'manager';
  const pendingAccounts = Object.values(accounts).filter((a: any) => a?.status === 'pending') as UserProfile[];
  const approvedAccounts = Object.values(accounts).filter((a: any) => a?.status === 'approved') as UserProfile[];

  // Richieste appuntamento in attesa dirette a ME (per notifiche + dashboard)
  const myApptRequests = Object.values(appointments).filter(
    (a) => a.ownerUid === currentUser.uid && a.status === 'pending'
  );
  const apptRequestNotifs = myApptRequests.map((a) => ({
    id: `apptreq-${a.id}`,
    title: 'Richiesta appuntamento',
    text: `${a.createdByName || 'Un cliente'} ha richiesto un appuntamento il ${a.date}${a.time ? ' alle ' + a.time : ''}${a.note ? ' — ' + a.note : ''}.`,
    time: 'Da confermare',
    read: false,
    apptDate: a.date
  }));
  const liveNotifications = [
    ...apptRequestNotifs,
    ...notifications.map((n) => ({
      id: n.id,
      title: n.title,
      text: n.body || '',
      time: new Date(n.at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      read: n.read,
      link: n.link
    }))
  ];

  return (
    <div className="shell flex h-screen select-none bg-[#F5F5F3] relative min-h-0">
      {/* Sidebar for widescreen */}
      <Sidebar
        route={route}
        peopleTab={peopleTab}
        profile={currentUser}
        counts={{
          todoToday: Object.values(tasks).filter((t: any) => sameDay(t.date, todayISO()) && !t.done).length,
          activeProjects: Object.values(projects).filter((p: any) => p.status === 'attivo').length
        }}
        onNav={(r) => {
          setRoute(r);
          window.location.hash = `#${r}`;
        }}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        {/* Responsive Mobile Nav Bar */}
        <Navbar
          route={route}
          profile={currentUser}
          onNav={(r) => {
            setRoute(r);
            window.location.hash = `#${r}`;
          }}
          onOpenProfile={() => setProfileOpen(true)}
          title={formattedMobileTitle()}
          notificationsCount={liveNotifications.filter(n => !n.read).length}
          onNotificationsClick={() => setNotificationsOpen(!notificationsOpen)}
          actionButton={
            route === 'progetti' ? (
              <button onClick={() => handleOpenNewProject(activeDivision)} className="w-8 h-8 rounded-full bg-[#1b1b1b] text-white flex items-center justify-center border-none">
                <Plus className="w-4.5 h-4.5" />
              </button>
            ) : undefined
          }
        />

        {/* Widescreen topbar details header */}
        <div className="hidden md:flex items-center justify-between gap-4 px-[30px] pt-4 pb-2 text-left relative">
          <div className="min-w-0 flex-1">
            {/* Removed current section title: "togli i testi inerenti alla sezione dove ci troviamo" */}
          </div>

          <div className="flex items-center gap-3">
            {route === 'progetti' && (
              <button
                onClick={() => handleOpenNewProject(activeDivision)}
                className="btn btn-primary btn-sm rounded-xl py-1.5 px-3 flex items-center gap-1.5 cursor-pointer font-bold bg-[#1b1b1b] hover:bg-black text-white hover:shadow-md"
              >
                <Plus className="w-4 h-4" /> Nuovo progetto
              </button>
            )}

            {/* Accessi (admin e manager) */}
            {canManageAccess && (
              <button
                onClick={() => setAccessOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#e2e2e2] text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer active:scale-95"
                title="Gestione accessi"
              >
                <Users className="w-4.5 h-4.5" />
                {pendingAccounts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {pendingAccounts.length}
                  </span>
                )}
              </button>
            )}

            {/* Notification Bell (Widescreen) */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#e2e2e2] text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer active:scale-95"
                title="Notifiche"
              >
                <Bell className="w-4.5 h-4.5" />
                {liveNotifications.some(n => !n.read) && (
                  <span className="absolute top-[6px] right-[6px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Desktop Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[340px] bg-white border border-[#ececec] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                      <span className="font-extrabold text-[13.5px] text-[#161616]">
                        Centro Notifiche ({liveNotifications.filter(n => !n.read).length})
                      </span>
                      {notifications.some(n => !n.read) && (
                        <button
                          onClick={() => {
                            markAllNotificationsRead();
                            showToast('Tutte le notifiche segnate come lette.');
                          }}
                          className="text-[11px] font-extrabold text-indigo-650 hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Segna come lette
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                      {liveNotifications.length > 0 ? (
                        liveNotifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if ((n as any).apptDate) {
                                setCalDate(new Date((n as any).apptDate));
                                setCalView('day');
                                setNotificationsOpen(false);
                                window.location.hash = 'calendario';
                                return;
                              }
                              if ((n as any).link) { window.location.hash = String((n as any).link).replace(/^#/, ''); }
                              setNotificationsOpen(false);
                              markNotificationRead(n.id);
                            }}
                            className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer relative ${
                              n.read
                                ? 'bg-transparent border-gray-100 opacity-60'
                                : 'bg-indigo-50/20 border-indigo-100 hover:bg-indigo-50/40'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-[12px] text-[#161616] leading-tight pr-2">{n.title}</h4>
                              <span className="text-[9px] font-bold text-gray-400 shrink-0 mt-0.5">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-605 mt-1 leading-normal">{n.text}</p>
                            {!n.read && (
                              <span className="absolute top-3.5 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400">
                          Nessuna notifica al momento.
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="border-t border-gray-100 pt-2.5 mt-2.5 flex justify-center">
                        <button
                          onClick={() => {
                            clearNotifications();
                            showToast('Le notifiche sono state cancellate.');
                          }}
                          className="text-[11px] font-extrabold text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
                        >
                          Svuota notifiche
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>


          </div>
        </div>

        {/* Mobile Notification Drawer */}
        {notificationsOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex items-end justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setNotificationsOpen(false)} />
            <div className="relative bg-white w-full rounded-t-3xl max-h-[80vh] p-5 flex flex-col shadow-2xl z-20 animate-in slide-in-from-bottom duration-250 select-none text-left">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-[16px] text-[#161616]">Notifiche</h3>
                <div className="flex items-center gap-3">
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={() => {
                        markAllNotificationsRead();
                        showToast('Tutte le notifiche segnate come lette.');
                      }}
                      className="text-[12px] font-extrabold text-indigo-650 bg-transparent border-none cursor-pointer"
                    >
                      Leggi tutte
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[11px] font-extrabold cursor-pointer hover:bg-gray-200 border-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2.5 pb-6">
                {liveNotifications.length > 0 ? (
                  liveNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if ((n as any).apptDate) {
                          setCalDate(new Date((n as any).apptDate));
                          setCalView('day');
                          setNotificationsOpen(false);
                          window.location.hash = 'calendario';
                          return;
                        }
                        if ((n as any).link) { window.location.hash = String((n as any).link).replace(/^#/, ''); }
                        setNotificationsOpen(false);
                        markNotificationRead(n.id);
                      }}
                      className={`p-3 rounded-xl border transition-all relative ${
                        n.read 
                          ? 'bg-transparent border-gray-100 opacity-60' 
                          : 'bg-indigo-50/20 border-indigo-100'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-[12.5px] text-[#161616] leading-tight pr-2">{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11.5px] text-gray-605 mt-1 leading-normal">{n.text}</p>
                      {!n.read && (
                        <span className="absolute top-4 right-3 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-sm text-[#8a8a8a]">
                    Nessuna notifica al momento.
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 pt-3 flex justify-center bg-white">
                  <button
                    onClick={() => {
                      clearNotifications();
                      showToast('Le notifiche sono state cancellate.');
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-none py-1"
                  >
                    Svuota notifiche
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable primary content viewer */}
        <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch px-4 py-4 md:px-[30px] md:pb-[140px] pb-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, scale: 0.994, filter: 'blur(3px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.997 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ----------------------------------------------------
          GLOBAL DISPATCH REUSABLE MODALS
          ---------------------------------------------------- */}

      {/* 1. Profile Manager Modal */}
      <Modal title="Il mio profilo" isOpen={profileOpen} onClose={() => setProfileOpen(false)}>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg">
            {initials(currentUser.name)}
          </span>
          <div>
            <b className="block text-[18px] font-black text-[#161616] leading-none">{currentUser.name}</b>
            <small className="block text-[12px] text-[#8a8a8a] font-semibold mt-1">{currentUser.email}</small>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ruolo nello Studio</label>
            <span className="text-[14px] font-bold text-[#161616] uppercase tracking-wide">
              {currentUser.role}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Mansioni associate</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(currentUser.functions || MANSIONI.slice(0, 3)).map(f => (
                <span key={f} className="text-[10px] bg-slate-100 rounded-full py-0.5 px-2.5 font-extrabold text-gray-800">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {canManageAccess && (
            <button
              onClick={() => { setProfileOpen(false); setAccessOpen(true); }}
              className="btn bg-[#1b1b1b] hover:bg-black text-white font-bold justify-center mt-2 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Gestione accessi{pendingAccounts.length > 0 ? ` (${pendingAccounts.length})` : ''}
            </button>
          )}

          <button onClick={handleLogout} className="btn bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-bold justify-center mt-4">
            Esci dall'account
          </button>
        </div>
      </Modal>

      {/* 1b. Gestione Accessi (admin e manager) */}
      {canManageAccess && (
        <Modal title="Gestione accessi" isOpen={accessOpen} onClose={() => setAccessOpen(false)} wide>
          <AccessRequests
            pending={pendingAccounts}
            members={approvedAccounts}
            currentUid={currentUser.uid}
            onApprove={handleApproveAccount}
            onReject={handleRejectAccount}
            onChangeRole={handleChangeAccountRole}
            onRevoke={handleRevokeAccount}
            onRemove={handleRemoveAccount}
          />
        </Modal>
      )}

      {/* 1c. Nuovo appuntamento / nota agenda */}
      <Modal title={apptKind === 'nota' ? 'Nuova nota' : 'Nuovo appuntamento'} isOpen={apptOpen} onClose={() => setApptOpen(false)}>
        <div className="flex flex-col gap-3 text-left">
          <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] w-fit">
            {(['appuntamento', 'nota'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setApptKind(k)}
                className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none capitalize transition-all ${apptKind === k ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}
              >
                {k}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Titolo *</span>
            <input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" placeholder={apptKind === 'nota' ? 'Promemoria…' : 'Sopralluogo, riunione…'} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Data *</span>
              <input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ora</span>
              <input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Agenda di</span>
            <select value={apptOwner} onChange={(e) => setApptOwner(e.target.value)} className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]">
              <option value={currentUser.uid}>Io ({currentUser.name})</option>
              {Object.values(users)
                .filter((u) => u.uid !== currentUser.uid && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff'))
                .map((u) => (
                  <option key={u.uid} value={u.uid}>{u.name}</option>
                ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Con (controparte)</span>
            <input value={apptWith} onChange={(e) => setApptWith(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" placeholder="Cliente, fornitore… (facoltativo)" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Note</span>
            <textarea value={apptNote} onChange={(e) => setApptNote(e.target.value)} rows={2} className="input border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" />
          </label>

          <button onClick={handleSubmitAppointment} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">
            {apptOwner && apptOwner !== currentUser.uid ? "Aggiungi all'agenda del membro" : 'Aggiungi in agenda'}
          </button>
        </div>
      </Modal>

      {/* 2. Agenda Task Editor Modal */}
      <Modal
        title={editTaskId ? 'Modifica task' : 'Nuovo task agenda'}
        isOpen={taskEditorOpen}
        onClose={() => setTaskEditorOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[12px] font-bold text-[#333]">Titolo attività</label>
            <input
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              className="input mt-1"
              placeholder="Es. Sopralluogo via Roma"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[12px] font-bold text-[#333]">Data</label>
              <input
                type="date"
                value={tDateInput}
                onChange={(e) => setTDateInput(e.target.value)}
                className="input mt-1"
              />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[12px] font-bold text-[#333]">Ora (opzionale)</label>
              <input
                type="time"
                value={tTimeInput}
                onChange={(e) => setTTimeInput(e.target.value)}
                className="input mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[12px] font-bold text-[#333]">Priorità</label>
              <select
                value={tPrio}
                onChange={(e: any) => setTPrio(e.target.value)}
                className="select mt-1"
              >
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="bassa">Bassa</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[12px] font-bold text-[#333]">Ricorrenza</label>
              <select
                value={tFreq}
                onChange={(e: any) => setTFreq(e.target.value)}
                className="select mt-1"
              >
                <option value="once">Una volta</option>
                <option value="daily">Giornaliero</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[12px] font-bold text-[#333]">Tipologia attività <span className="text-gray-400 font-normal">(facoltativa)</span></label>
            <input
              value={tTipo}
              onChange={(e) => setTTipo(e.target.value)}
              list="task-tipi"
              placeholder="Es. Rilievo, Progetto 3D, Computo…"
              className="input mt-1"
            />
            <datalist id="task-tipi">
              {['Rilievo', 'Progetto 3D', 'Computo', 'Pratica edilizia', 'Sopralluogo', 'Render', 'Consegna', 'Riunione'].map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[12px] font-bold text-[#333]">Assegna ad operatore</label>
            <select
              value={tAssignee}
              onChange={(e) => setTAssignee(e.target.value)}
              className="select mt-1"
            >
              <option value="">— Nessuno (personale) —</option>
              {Object.values(users).filter((u: any) => u.role !== 'cliente').map((u: any) => (
                <option key={u.uid} value={u.uid}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[12px] font-bold text-[#333]">Collega a pratica</label>
            <select
              value={tProjectId}
              onChange={(e) => setTProjectId(e.target.value)}
              className="select mt-1"
            >
              <option value="">— Pratica libera —</option>
              {Object.values(projects).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code || 'ARC'})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[12px] font-bold text-[#333]">Note o appunti</label>
            <textarea
              value={tNotes}
              onChange={(e) => setTNotes(e.target.value)}
              className="textarea mt-1 min-h-[70px]"
              placeholder="Fornisci dettagli sul sopralluogo..."
            />
          </div>

          <div className="flex justify-between mt-4">
            {editTaskId && (
              <button onClick={handleDeleteTask} className="btn bg-red-100 hover:bg-red-200 border-none text-red-800 font-bold cursor-pointer">
                Rimuovi
              </button>
            )}
            <button onClick={handleSaveTask} className="btn bg-[#1b1b1b] text-white hover:bg-black font-semibold ml-auto cursor-pointer">
              Salva task
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. New Project Creator Modal */}
      <Modal title={`Nuova commessa — ${DIVISION_META[pDivision].label}`} isOpen={newProjOpen} onClose={() => setNewProjOpen(false)} wide>
        {/* Settore selezionato: il modale si adatta alla divisione scelta in Progetti */}
        <div
          className="flex items-center gap-3 mb-4 p-3 rounded-2xl border"
          style={{ borderColor: `${DIVISION_META[pDivision].color}33`, background: `${DIVISION_META[pDivision].color}0d` }}
        >
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shrink-0"
            style={{ background: DIVISION_META[pDivision].color }}
          >
            {DIVISION_META[pDivision].label}
          </span>
          <span className="text-[12px] text-[#555] font-medium">{DIVISION_META[pDivision].desc}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          <div className="flex flex-col gap-3">
            {pDivision === 'studio' ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-bold text-[#8a8a8a] uppercase tracking-wider block">Categorie di lavorazione</span>
                  <span className="text-[10px] font-bold text-[#8a8a8a]">{pCategorie.length} sel.</span>
                </div>
                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {STUDIO_CATEGORIE_BY_FASE.map(group => {
                    const allSel = group.categorie.every(c => pCategorie.includes(c));
                    return (
                      <div key={group.fase} className="border border-[#ececec] rounded-2xl p-3 bg-[#fafafa]/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#161616]">{group.fase}</span>
                          <button
                            type="button"
                            onClick={() => setPCategorie(prev => allSel ? prev.filter(c => !group.categorie.includes(c)) : Array.from(new Set([...prev, ...group.categorie])))}
                            className="text-[10px] font-bold text-[#8a8a8a] hover:text-[#161616] bg-transparent border-none cursor-pointer"
                          >
                            {allSel ? 'Deseleziona' : 'Tutte'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {group.categorie.map(cat => (
                            <label key={cat} className="flex items-center gap-2 text-[12.5px] text-[#333] cursor-pointer py-0.5">
                              <input type="checkbox" checked={pCategorie.includes(cat)} onChange={() => toggleCategoria(cat)} />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
            <span className="text-[12px] font-bold text-[#8a8a8a] uppercase tracking-wider block mb-1">Seleziona Template Standard</span>
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {Object.values(templates)
                .filter((t: any) => {
                  if (pDivision === 'strategico') return t.id === 'marketing-strategico';
                  if (pDivision === 'materico') return t.id === 'fornitura-materico';
                  if (pDivision === 'unico') return t.id === 'concept-unico';
                  return !['marketing-strategico', 'fornitura-materico', 'concept-unico'].includes(t.id);
                })
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setPTmplPicked(t.id)}
                    type="button"
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      pTmplPicked === t.id ? 'bg-[#1b1b1b]/10 border-[#1b1b1b]' : 'bg-white border-[#ececec] hover:bg-[#fafafa]'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#161616] text-white flex items-center justify-center flex-shrink-0">
                      <Folder className="w-4 h-4" />
                    </span>
                    <div>
                      <b className="block text-[13.5px]">{t.name}</b>
                      <small className="text-[#8a8a8a] truncate block max-w-[200px] mt-0.5">{t.desc}</small>
                    </div>
                  </button>
                ))
              }
              <button
                onClick={() => setPTmplPicked('__blank__')}
                type="button"
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  pTmplPicked === '__blank__' ? 'bg-[#1b1b1b]/10 border-[#1b1b1b]' : 'bg-white border-[#ececec] hover:bg-[#fafafa]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl border border-[#ececec] text-[#a8a8a8] flex items-center justify-center flex-shrink-0">
                  +
                </div>
                <div>
                  <b className="block text-[13.5px]">Vuoto</b>
                  <small className="text-[#a8a8a8] block mt-0.5">Nessuna fase caricata</small>
                </div>
              </button>
            </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Nome della commessa</label>
              <input value={pName} onChange={(e) => setPName(e.target.value)} className="input mt-1" placeholder="Es. Villa Saracena - Carovigno" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Codice Pratica</label>
                <input value={pCode} onChange={(e) => setPCode(e.target.value)} className="input mt-1 font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Città / Località</label>
                <input value={pLocation} onChange={(e) => setPLocation(e.target.value)} className="input mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Cliente (rubrica)</label>
                <select
                  value={pClientRecordId}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__new__') { setNewRubricaOpen(true); return; }
                    setPClientRecordId(v);
                    applyClientRecord(clients[v] || null);
                  }}
                  className="select mt-1"
                >
                  <option value="">— Nessuno (digita a fianco) —</option>
                  {Object.values(clients).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.type === 'azienda' && c.companyName ? c.companyName : c.name}{c.partitaIva ? ` · P.IVA ${c.partitaIva}` : c.codiceFiscale ? ` · ${c.codiceFiscale}` : ''}
                    </option>
                  ))}
                  <option value="__new__">➕ Nuovo cliente…</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Nome cliente {pClientRecordId && <span className="text-emerald-600 normal-case font-normal">(da rubrica)</span>}</label>
                <input value={pClient} onChange={(e) => setPClient(e.target.value)} className="input mt-1" placeholder="Es. Mario Rossi" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Collega account portale <span className="text-gray-400 normal-case font-normal">(facoltativo)</span></label>
              <select value={pClientUid} onChange={(e) => setPClientUid(e.target.value)} className="select mt-1">
                <option value="">— Nessuno —</option>
                {Object.values(users).filter((u: any) => u.role === 'cliente').map((u: any) => (
                  <option key={u.uid} value={u.uid}>
                    {u.accountType === 'azienda' && u.companyName ? `${u.companyName} — ` : ''}{u.name}{u.email ? ` · ${u.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Divisione di Afferenza</label>
              <select value={pDivision} onChange={(e) => handlePDivisionChange(e.target.value as any)} className="select mt-1 font-bold">
                <option value="studio">STUDIO</option>
                <option value="strategico">STRATEGICO</option>
                <option value="materico">MATERICO</option>
                <option value="unico">UNICO</option>
              </select>
            </div>

            {pDivision === 'studio' && (
              <div className="border border-neutral-100 bg-[#fafafa] rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold">Pratica edilizia (STUDIO)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Tipo di intervento edilizio</label>
                    <select value={pIntervento} onChange={(e) => handleInterventoChange(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                      {INTERVENTI_EDILIZI.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Titolo abilitativo <span className="text-gray-400 normal-case font-normal">(auto)</span></label>
                    <select value={pTitolo} onChange={(e) => setPTitolo(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                      {TITOLI_ABILITATIVI.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Committente</label>
                    <input value={pCommittente} onChange={(e) => setPCommittente(e.target.value)} placeholder="Es. Mario Rossi" className="input text-xs bg-white h-9" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Indirizzo Immobile</label>
                    <input value={pIndirizzo} onChange={(e) => setPIndirizzo(e.target.value)} placeholder="Es. Via Roma 15, Lecce" className="input text-xs bg-white h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Foglio</label>
                    <input value={pFoglio} onChange={(e) => setPFoglio(e.target.value)} placeholder="12" className="input text-xs bg-white h-9 font-mono" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Particella</label>
                    <input value={pParticella} onChange={(e) => setPParticella(e.target.value)} placeholder="450" className="input text-xs bg-white h-9 font-mono" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Sub</label>
                    <input value={pSub} onChange={(e) => setPSub(e.target.value)} placeholder="3" className="input text-xs bg-white h-9 font-mono" />
                  </div>
                </div>
                {(() => { const s = studioSummary(pCategorie, pTitolo); return (
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-[#161616] bg-white border border-[#ececec] rounded-xl px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verranno generate <span className="text-emerald-700">{s.fasi} fasi</span> e <span className="text-emerald-700">{s.tasks} task</span> dalla libreria Onirico.
                  </div>
                ); })()}
              </div>
            )}

            {pDivision === 'strategico' && (
              <div className="border border-[#161616]/10 bg-[#fafafa] rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-mono tracking-wider text-[#161616] uppercase font-bold">Parametri Marketing (STRATEGICO)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Budget Campagna (€)</label>
                    <input type="number" value={pMarketingBudget} onChange={(e) => setPMarketingBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 7500" className="input text-xs bg-white h-9" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Canali Primari</label>
                    <input value={pMarketingChannels} onChange={(e) => setPMarketingChannels(e.target.value)} placeholder="Es. Instagram, Meta Ads" className="input text-xs bg-white h-9" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Obiettivo Principale Brand</label>
                  <input value={pMarketingGoal} onChange={(e) => setPMarketingGoal(e.target.value)} placeholder="Es. Lead Generation Masserie Salentine" className="input text-xs bg-white h-9" />
                </div>
              </div>
            )}

            {pDivision === 'materico' && (
              <div className="border border-[#ececec] bg-[#fafafa] rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase font-bold">Forniture e Posa (MATERICO)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Est. Forniture (€)</label>
                    <input type="number" value={pMatericoEstimatedBudget} onChange={(e) => setPMatericoEstimatedBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 45000" className="input text-xs bg-white h-9" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Finiture Selezionate</label>
                    <select value={pMatericoFinitureType} onChange={(e) => setPMatericoFinitureType(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                      <option value="">Seleziona...</option>
                      <option value="infissi_minimali">Infissi Minimali di Pregio</option>
                      <option value="pavimenti_resina">Pavimenti in Resina / Cemento</option>
                      <option value="arredo_sartoriale">Arredamento Su Misura</option>
                      <option value="illuminazione">Illuminazione Architetturale</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Stato Sottofondi</label>
                  <select value={pMatericoSottofondiStatus} onChange={(e) => setPMatericoSottofondiStatus(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                    <option value="">Seleziona...</option>
                    <option value="idoneo">Idoneo per posa immediata</option>
                    <option value="da_asseverare">Da asseverare con termo-camera</option>
                    <option value="da_rifare">Da demolire e rifare</option>
                  </select>
                </div>
              </div>
            )}

            {pDivision === 'unico' && (
              <div className="border border-dashed border-[#ececec] rounded-2xl p-4 text-center">
                <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block font-bold">Atelier Unico (UNICO)</span>
                <p className="text-[11px] text-[#8a8a8a] italic mt-1">Nessun dato personalizzato richiesto per questa divisione di lusso.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Inizio</label>
                <input type="date" value={pStart} onChange={(e) => setPStart(e.target.value)} className="input mt-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Scadenza</label>
                <input type="date" value={pDue} onChange={(e) => setPDue(e.target.value)} className="input mt-1" />
              </div>
            </div>

            <button onClick={handleCreateProject} className="btn bg-[#1b1b1b] hover:bg-black text-white font-bold h-11 justify-center mt-2.5">
              {DIVISION_META[pDivision].cta}
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Project Editing Modal */}
      <Modal title="Modifica pratica" isOpen={editProjOpen} onClose={() => setEditProjOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Nome commessa</label>
            <input value={pName} onChange={(e) => setPName(e.target.value)} className="input mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Codice</label>
              <input value={pCode} onChange={(e) => setPCode(e.target.value)} className="input mt-1 font-mono" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Località</label>
              <input value={pLocation} onChange={(e) => setPLocation(e.target.value)} className="input mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Cliente (rubrica)</label>
              <select
                value={pClientRecordId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') { setNewRubricaOpen(true); return; }
                  setPClientRecordId(v);
                  applyClientRecord(clients[v] || null);
                }}
                className="select mt-1"
              >
                <option value="">— Nessuno (digita a fianco) —</option>
                {Object.values(clients).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'azienda' && c.companyName ? c.companyName : c.name}{c.partitaIva ? ` · P.IVA ${c.partitaIva}` : c.codiceFiscale ? ` · ${c.codiceFiscale}` : ''}
                  </option>
                ))}
                <option value="__new__">➕ Nuovo cliente…</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Nome cliente {pClientRecordId && <span className="text-emerald-600 normal-case font-normal">(da rubrica)</span>}</label>
              <input value={pClient} onChange={(e) => setPClient(e.target.value)} className="input mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Collega account portale <span className="text-gray-400 normal-case font-normal">(facoltativo)</span></label>
            <select value={pClientUid} onChange={(e) => setPClientUid(e.target.value)} className="select mt-1">
              <option value="">— Scollegati —</option>
              {Object.values(users).filter((u: any) => u.role === 'cliente').map((u: any) => (
                <option key={u.uid} value={u.uid}>
                  {u.accountType === 'azienda' && u.companyName ? `${u.companyName} — ` : ''}{u.name}{u.email ? ` · ${u.email}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Divisione di Afferenza</label>
            <select value={pDivision} onChange={(e) => setPDivision(e.target.value as any)} className="select mt-1 font-bold">
              <option value="studio">STUDIO</option>
              <option value="strategico">STRATEGICO</option>
              <option value="materico">MATERICO</option>
              <option value="unico">UNICO</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[12.5px] font-bold text-[#161616] mb-1">Dati catastali</div>
            <div className="grid grid-cols-3 gap-2">
              <input value={pFoglio} onChange={(e) => setPFoglio(e.target.value)} placeholder="Foglio" className="input text-center font-bold" />
              <input value={pParticella} onChange={(e) => setPParticella(e.target.value)} placeholder="Particella" className="input text-center font-bold" />
              <input value={pSub} onChange={(e) => setPSub(e.target.value)} placeholder="Sub" className="input text-center font-bold" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold tracking-widest uppercase text-[#8a8a8a]">Note interne studio</label>
            <textarea value={pNotes} onChange={(e) => setPNotes(e.target.value)} className="textarea mt-1 min-h-[80px]" placeholder="Appunti segreti..." />
          </div>

          <div className="flex justify-between gap-2 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={() => handleDeleteProject(editProjId!)} className="btn bg-red-100 hover:bg-red-200 border-none text-red-800 font-bold">
                Elimina pratica
              </button>
              <button
                onClick={() => { handleToggleArchiveProject(editProjId!); setEditProjOpen(false); }}
                className="btn bg-amber-50 hover:bg-amber-100 border-none text-amber-800 font-bold"
              >
                {projects[editProjId!]?.archived ? 'Ripristina da archivio' : 'Archivia pratica'}
              </button>
            </div>
            <input type="button" value="Salva" onClick={handleSaveEditProject} className="btn bg-[#1b1b1b] text-white hover:bg-black font-semibold ml-auto cursor-pointer px-6" />
          </div>
        </div>
      </Modal>

      {/* 5. Phase Creator Modal */}
      <Modal title="Aggiungi o Rinomina Fase" isOpen={phaseOpen} onClose={() => setPhaseOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Nome macro-fase</label>
            <input
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              className="input mt-1"
              placeholder="Es. Sopralluogo climatico"
            />
          </div>
          <button
            onClick={() => {
              if (!phaseName.trim() || !phasePrjId) return;
              setProjects(prev => {
                const next = { ...prev };
                const phId = phaseEditId || `ph-${Date.now()}`;
                next[phasePrjId].phases[phId] = {
                  id: phId,
                  name: phaseName.trim(),
                  order: phaseEditId ? prev[phasePrjId].phases[phaseEditId].order : Object.keys(prev[phasePrjId].phases || {}).length,
                  tasks: phaseEditId ? prev[phasePrjId].phases[phaseEditId].tasks : {}
                };
                syncState('projects', next);
                return next;
              });
              setPhaseOpen(false);
              showToast('Fase salvata!');
            }}
            className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-4 justify-center"
          >
            Salva fase
          </button>
        </div>
      </Modal>

      {/* 6. Practice Task Activity Modal */}
      <Modal title={ptaskEditId ? 'Modifica attività' : 'Nuova attività'} isOpen={ptaskOpen} onClose={() => setPtaskOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Attività cantiere / pratica</label>
            <input value={ptTitle} onChange={(e) => setPtTitle(e.target.value)} className="input mt-1" placeholder="Es. Rilievo droni esterni" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Ruolo / Mansione</label>
              <select value={ptRole} onChange={(e) => setPtRole(e.target.value)} className="select mt-1">
                <option value="">— Nessuno —</option>
                {MANSIONI.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Responsabile</label>
              <select value={ptAssignee} onChange={(e) => setPtAssignee(e.target.value)} className="select mt-1">
                <option value="">— Non assegnato —</option>
                {Object.values(users).filter((u: any) => u.role !== 'cliente').map((u: any) => (
                  <option key={u.uid} value={u.uid}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Scadenza</label>
            <input type="date" value={ptDue} onChange={(e) => setPtDue(e.target.value)} className="input mt-1" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Descrizione attività</label>
            <textarea value={ptNote} onChange={(e) => setPtNote(e.target.value)} className="textarea mt-1 min-h-[60px]" />
          </div>

          <div className="flex justify-between mt-4">
            {ptaskEditId && (
              <button
                onClick={() => {
                  if (ptaskPrjId && ptaskPhId && ptaskEditId) {
                    handleDeletePtask(ptaskPrjId, ptaskPhId, ptaskEditId);
                    setPtaskOpen(false);
                  }
                }}
                className="btn bg-red-50 text-red-800 hover:bg-red-100 border-none"
              >
                Elimina
              </button>
            )}
            <button
              onClick={() => {
                if (!ptTitle.trim() || !ptaskPrjId || !ptaskPhId) return;

                setProjects(prev => {
                  const next = { ...prev };
                  const tId = ptaskEditId || `t-${Date.now()}`;
                  const targetPh = next[ptaskPrjId].phases[ptaskPhId];
                  targetPh.tasks[tId] = {
                    id: tId,
                    title: ptTitle.trim(),
                    order: ptaskEditId ? targetPh.tasks[ptaskEditId].order : Object.keys(targetPh.tasks || {}).length,
                    done: ptaskEditId ? targetPh.tasks[ptaskEditId].done : false,
                    role: ptRole || null,
                    assignee: ptAssignee || null,
                    due: ptDue || null
                  };
                  const updated = autoUpdateProjectsCompletion(next);
                  syncState('projects', updated);
                  return updated;
                });

                setPtaskOpen(false);
                showToast('Attività salvata!');
              }}
              className="btn bg-[#1b1b1b] text-white hover:bg-black font-semibold ml-auto"
            >
              Salva attività
            </button>
          </div>
        </div>
      </Modal>

      {/* 7. Practice Anagrafica Form Details */}
      <Modal title="Scheda Anagrafica Pratica" isOpen={anagOpen} onClose={() => setAnagOpen(false)} wide>
        <div className="flex flex-col gap-4 text-left max-h-[65vh] overflow-y-auto pr-1 font-sans">
          {(!anagProjId || projects[anagProjId]?.division === 'studio' || !projects[anagProjId]?.division) && (
            <>
              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec]">
                <h4 className="text-[14.5px] font-bold mb-3 flex items-center gap-1">Committente / Intestatario</h4>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input value={pCommittente} onChange={(e) => setPCommittente(e.target.value)} placeholder="Cognome e Nome" className="input" />
                  <input value={pClient} onChange={(e) => setPClient(e.target.value)} placeholder="Ragione sociale ditta" className="input" />
                </div>
                <input value={pIndirizzo} onChange={(e) => setPIndirizzo(e.target.value)} placeholder="Comune / Residenza" className="input" />
              </div>

              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec]">
                <h4 className="text-[14.5px] font-bold mb-3 flex items-center gap-1">Dati Catastali Fabbricato</h4>
                <div className="grid grid-cols-4 gap-3">
                  <input value={pLocation} onChange={(e) => setPLocation(e.target.value)} placeholder="Comune Catastale" className="input" />
                  <input value={pFoglio} onChange={(e) => setPFoglio(e.target.value)} placeholder="Foglio" className="input font-bold" />
                  <input value={pParticella} onChange={(e) => setPParticella(e.target.value)} placeholder="Particella" className="input font-bold" />
                  <input value={pSub} onChange={(e) => setPSub(e.target.value)} placeholder="Sub" className="input font-bold" />
                </div>
              </div>

              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec]">
                <h4 className="text-[14.5px] font-bold mb-3 flex items-center gap-1">Lavori di Progettazione</h4>
                <input value={pTipo} onChange={(e) => setPTipo(e.target.value)} placeholder="Es. Ampliamento residenza, SCIA commerciale..." className="input" />
              </div>
            </>
          )}

          {anagProjId && projects[anagProjId]?.division === 'strategico' && (
            <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-4">
              <h4 className="text-[14.5px] font-bold flex items-center gap-1 text-[#161616]">Dati Strategia e Campagna (STRATEGICO)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Budget Campagna Allocato (€)</label>
                  <input type="number" value={pMarketingBudget} onChange={(e) => setPMarketingBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 7500" className="input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Canali Attivi Primari</label>
                  <input value={pMarketingChannels} onChange={(e) => setPMarketingChannels(e.target.value)} placeholder="Es. Instagram Feed, Meta Ads" className="input" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Obiettivo Principale Brand</label>
                <input value={pMarketingGoal} onChange={(e) => setPMarketingGoal(e.target.value)} placeholder="Es. Lead Generation Masserie Salentine" className="input" />
              </div>
            </div>
          )}

          {anagProjId && projects[anagProjId]?.division === 'materico' && (
            <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-4">
              <h4 className="text-[14.5px] font-bold flex items-center gap-1 text-[#161616]">Dati Computo & Store Partner (MATERICO)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">Estimato Forniture (€)</label>
                  <input type="number" value={pMatericoEstimatedBudget} onChange={(e) => setPMatericoEstimatedBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 45000" className="input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">Finiture Selezionate</label>
                  <select value={pMatericoFinitureType} onChange={(e) => setPMatericoFinitureType(e.target.value)} className="select">
                    <option value="">Seleziona...</option>
                    <option value="infissi_minimali">Infissi Minimali di Pregio</option>
                    <option value="pavimenti_resina">Pavimenti in Resina / Cemento</option>
                    <option value="arredo_sartoriale">Arredamento Su Misura</option>
                    <option value="illuminazione">Illuminazione Architetturale</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500">Stato Sottofondi</label>
                <select value={pMatericoSottofondiStatus} onChange={(e) => setPMatericoSottofondiStatus(e.target.value)} className="select">
                  <option value="">Seleziona...</option>
                  <option value="idoneo">Idoneo per posa immediata</option>
                  <option value="da_asseverare">Da asseverare con termo-camera</option>
                  <option value="da_rifare">Da demolire e rifare</option>
                </select>
              </div>
            </div>
          )}

          {anagProjId && projects[anagProjId]?.division === 'unico' && (
            <div className="bg-[#fafafa] p-5 rounded-2xl border border-dashed border-[#ececec] text-center">
              <h4 className="text-[14.5px] font-mono font-bold text-gray-400 uppercase">Atelier Unico (UNICO)</h4>
              <p className="text-[11.5px] text-gray-400 italic mt-1">Nessun dato aggiuntivo richiesto per UNICO.</p>
            </div>
          )}

          <button
            onClick={() => {
              if (!anagProjId) return;
              setProjects(prev => {
                const next = { ...prev };
                const div = next[anagProjId]?.division || 'studio';
                next[anagProjId] = {
                  ...next[anagProjId],
                  committente: div === 'studio' ? (pCommittente.trim() || null) : next[anagProjId].committente,
                  client: div === 'studio' ? (pClient.trim() || null) : next[anagProjId].client,
                  indirizzoImmobile: div === 'studio' ? (pIndirizzo.trim() || null) : next[anagProjId].indirizzoImmobile,
                  location: div === 'studio' ? (pLocation.trim() || null) : next[anagProjId].location,
                  foglio: div === 'studio' ? (pFoglio.trim() || null) : next[anagProjId].foglio,
                  particella: div === 'studio' ? (pParticella.trim() || null) : next[anagProjId].particella,
                  sub: div === 'studio' ? (pSub.trim() || null) : next[anagProjId].sub,
                  tipoIntervento: div === 'studio' ? (pTipo.trim() || null) : next[anagProjId].tipoIntervento,
                  marketingBudget: div === 'strategico' && pMarketingBudget !== '' ? Number(pMarketingBudget) : next[anagProjId].marketingBudget,
                  marketingChannels: div === 'strategico' ? pMarketingChannels : next[anagProjId].marketingChannels,
                  marketingGoal: div === 'strategico' ? pMarketingGoal : next[anagProjId].marketingGoal,
                  matericoEstimatedBudget: div === 'materico' && pMatericoEstimatedBudget !== '' ? Number(pMatericoEstimatedBudget) : next[anagProjId].matericoEstimatedBudget,
                  matericoFinitureType: div === 'materico' ? pMatericoFinitureType : next[anagProjId].matericoFinitureType,
                  matericoSottofondiStatus: div === 'materico' ? pMatericoSottofondiStatus : next[anagProjId].matericoSottofondiStatus,
                };
                syncState('projects', next);
                return next;
              });
              setAnagOpen(false);
              showToast('Dati pratica salvati correttamente!');
            }}
            className="btn bg-[#1b1b1b] text-white hover:bg-black w-full py-2.5 mt-2 justify-center font-bold"
          >
            Salva Dati Pratica
          </button>
        </div>
      </Modal>

      {/* 8. Studio Finance movement modal */}
      <Modal title="Aggiungi movimento contabile" isOpen={finOpen} onClose={() => setFinOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex justify-center bg-gray-100 rounded-xl p-1 mb-2">
            <button
              onClick={() => setFnKind('entrata')}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors ${
                fnKind === 'entrata' ? 'bg-[#1b1b1b] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#1d1d1d]'
              }`}
            >
              Entrata (+)
            </button>
            <button
              onClick={() => setFnKind('uscita')}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors ${
                fnKind === 'uscita' ? 'bg-[#1b1b1b] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#1d1d1d]'
              }`}
            >
              Uscita (−)
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Causale Movimento</label>
            <input value={fnDesc} onChange={(e) => setFnDesc(e.target.value)} className="input mt-1" placeholder="Es. Acconto commissioni progettista..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Importo (€)</label>
              <input value={fnAmount} onChange={(e) => setFnAmount(e.target.value)} className="input mt-1" placeholder="0.00" inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Data operazione</label>
              <input type="date" value={fnDate} onChange={(e) => setFnDate(e.target.value)} className="input mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Categoria</label>
            <select value={fnCat} onChange={(e) => setFnCat(e.target.value)} className="select mt-1">
              {finCtx === 'studio' ? (
                <>
                  <option value="Fattura emessa">Fattura emessa</option>
                  <option value="Acconto">Acconto</option>
                  <option value="Fornitore">Fornitore</option>
                  <option value="Generico">Generico</option>
                  <option value="Tasse/Inarcassa">Tasse/Inarcassa</option>
                </>
              ) : (
                <>
                  <option value="Studio: Onorari">Studio — Onorari/Competenze</option>
                  <option value="Studio: Spese">Studio — Spese di Commessa</option>
                  <option value="Cantiere: Impresa">Cantiere — Impresa Edile</option>
                  <option value="Cantiere: Fornitore">Cantiere — Fornitore/Materiali</option>
                  <option value="Cantiere: Sicurezza">Cantiere — Professionista/Sicurezza</option>
                  <option value="Cantiere: Tasse">Cantiere — Oneri/Tasse comunali</option>
                  <option value="Cantiere: Generico">Cantiere — Generico</option>
                </>
              )}
            </select>
          </div>

          {finCtx === 'studio' && (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Collega a cantiere progetto</label>
              <select value={fnProjLink} onChange={(e) => setFnProjLink(e.target.value)} className="select mt-1">
                <option value="">— Nessuno (Spesa Generale Studio) —</option>
                {Object.values(projects).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Note o estremi fattura</label>
            <input value={fnNote} onChange={(e) => setFnNote(e.target.value)} className="input mt-1" placeholder="Bonifico bancario num..." />
          </div>

          <button onClick={handleCreateMovement} className="btn bg-[#1b1b1b] hover:bg-black text-white w-full py-2.5 mt-3 justify-center font-bold">
            Registra movimento
          </button>
        </div>
      </Modal>

      {/* 9. Unified New Collaborator / Client Modal */}
      <Modal title="Aggiungi Collaboratore" isOpen={newUserOpen} onClose={() => setNewUserOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Nome e cognome</label>
            <input value={nuName} onChange={(e) => setNuName(e.target.value)} className="input mt-1" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Email</label>
            <input type="email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} className="input mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Ruolo</label>
              <select value={nuRole} onChange={(e: any) => setNuRole(e.target.value)} className="select mt-1">
                <option value="staff">Operatore Staff</option>
                <option value="manager">Project Manager</option>
                <option value="admin">Amministratore</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Titolo / Specializzazione</label>
              <input value={nuTitle} onChange={(e) => setNuTitle(e.target.value)} className="input mt-1" placeholder="Ingegnere, Architetto..." />
            </div>
          </div>

          <button onClick={handleCreateUser} className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-4 justify-center font-bold leading-normal">
            Registra Account Collaboratore
          </button>
        </div>
      </Modal>

      {/* Nuovo cliente in rubrica (inline dal form progetto) */}
      <Modal title="Nuovo cliente (rubrica)" isOpen={newRubricaOpen} onClose={() => setNewRubricaOpen(false)}>
        <div className="flex flex-col gap-3.5 text-left">
          <div className="flex gap-2">
            {(['privato', 'azienda'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNcDraft((d) => ({ ...d, type: t }))}
                className={`flex-1 py-2 rounded-xl text-[13px] font-bold border transition-all ${
                  (ncDraft.type || 'privato') === t ? 'bg-[#1b1b1b] text-white border-[#1b1b1b]' : 'bg-white text-[#333] border-[#e2e2e2] hover:bg-[#fafafa]'
                }`}
              >
                {t === 'privato' ? 'Privato' : 'Azienda'}
              </button>
            ))}
          </div>

          {ncDraft.type === 'azienda' ? (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Ragione sociale</label>
              <input value={ncDraft.companyName || ''} onChange={(e) => setNcDraft((d) => ({ ...d, companyName: e.target.value }))} className="input mt-1" placeholder="Es. Costruzioni Rossi S.r.l." />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Nome</label>
                <input value={ncDraft.firstName || ''} onChange={(e) => setNcDraft((d) => ({ ...d, firstName: e.target.value }))} className="input mt-1" placeholder="Mario" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Cognome</label>
                <input value={ncDraft.lastName || ''} onChange={(e) => setNcDraft((d) => ({ ...d, lastName: e.target.value }))} className="input mt-1" placeholder="Rossi" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Email</label>
              <input type="email" value={ncDraft.email || ''} onChange={(e) => setNcDraft((d) => ({ ...d, email: e.target.value }))} className="input mt-1" placeholder="nome@email.it" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Telefono</label>
              <input value={ncDraft.phone || ''} onChange={(e) => setNcDraft((d) => ({ ...d, phone: e.target.value }))} className="input mt-1" placeholder="+39 …" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">{ncDraft.type === 'azienda' ? 'Sede legale' : 'Residenza'}</label>
            <input value={ncDraft.address || ''} onChange={(e) => setNcDraft((d) => ({ ...d, address: e.target.value }))} className="input mt-1" placeholder="Via, civico, città" />
          </div>

          {ncDraft.type === 'azienda' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">P. IVA</label>
                <input value={ncDraft.partitaIva || ''} onChange={(e) => setNcDraft((d) => ({ ...d, partitaIva: e.target.value }))} className="input mt-1 font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Codice Fiscale</label>
                <input value={ncDraft.codiceFiscale || ''} onChange={(e) => setNcDraft((d) => ({ ...d, codiceFiscale: e.target.value }))} className="input mt-1 font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">PEC</label>
                <input value={ncDraft.pec || ''} onChange={(e) => setNcDraft((d) => ({ ...d, pec: e.target.value }))} className="input mt-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Codice SDI</label>
                <input value={ncDraft.sdi || ''} onChange={(e) => setNcDraft((d) => ({ ...d, sdi: e.target.value }))} className="input mt-1 font-mono" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Codice Fiscale</label>
              <input value={ncDraft.codiceFiscale || ''} onChange={(e) => setNcDraft((d) => ({ ...d, codiceFiscale: e.target.value }))} className="input mt-1 font-mono" />
            </div>
          )}

          <button onClick={handleSaveInlineClient} className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-2 justify-center font-bold leading-normal">
            Salva in rubrica e seleziona
          </button>
        </div>
      </Modal>

      <Modal title="Aggiungi Cliente / Partner B2B" isOpen={newClientOpen} onClose={() => setNewClientOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-gray-700">Cliente o Ragione Sociale</label>
            <input value={nuName} onChange={(e) => setNuName(e.target.value)} className="input mt-1" placeholder="Es. Cliente Rossi o S.p.a. Costruzioni" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-gray-700">Email d'Accesso</label>
            <input type="email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} className="input mt-1" placeholder="nome@portale.com" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-gray-700">Tipologia Account</label>
            <select 
              value={nuRole} 
              onChange={(e) => {
                const val = e.target.value as any;
                setNuRole(val);
                if (val === 'partner') {
                  setNuTitle('partner');
                } else {
                  setNuTitle('studio');
                }
              }} 
              className="input mt-1 bg-white border border-gray-200 py-2 px-3 rounded-lg text-[13.5px] font-medium"
            >
              <option value="cliente">Cliente Portale (B2C/B2B Commessa)</option>
              <option value="partner">Partner B2B (Impresa Partner / Fornitore)</option>
            </select>
          </div>

          {nuRole === 'cliente' && (
            <div className="flex flex-col gap-1 animate-[fadeIn_0.2s_ease_both]">
              <label className="text-[12px] font-bold text-gray-700">Settore / Portale di Riferimento</label>
              <select 
                value={nuTitle} 
                onChange={(e) => setNuTitle(e.target.value)} 
                className="input mt-1 bg-white border border-gray-200 py-2 px-3 rounded-lg text-[13.5px] font-medium"
              >
                <option value="studio">Studio Architettura (Cantieri & Progetti)</option>
                <option value="strategico">Onirico Strategico (Brand, Marketing & Growth)</option>
                <option value="materico">Onirico Materico (Moodboard & Finiture d'Interni)</option>
              </select>
            </div>
          )}

          <button onClick={handleCreateClient} className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-4 h-11 justify-center font-bold font-sans">
            Registra nel Database
          </button>
        </div>
      </Modal>

      {/* Doppia conferma eliminazione (condivisa da tutte le sezioni) */}
      {confirmDel && <ConfirmDeleteModal request={confirmDel} onClose={() => setConfirmDel(null)} />}

      {/* Render Toast notification */}
      <div className="toast-wrap fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-none flex flex-col gap-2.5 items-center">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast bg-[#161616] text-[#eeeeee] py-3 px-[18px] rounded-full text-[13.5px] font-semibold shadow-lg flex items-center gap-2.5 pointer-events-auto border ${
              t.type === 'err' ? 'bg-red-950 border-red-500' : 'bg-black border-[#2c2c2c]'
            }`}
          >
            {t.type === 'err' ? (
              <span className="text-red-500 font-extrabold font-mono">!</span>
            ) : (
              <span className="text-green-500 font-extrabold">✓</span>
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
