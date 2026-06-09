/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modulo "Cantiere" — gestione multi-attore studio ↔ impresa partner.
 * Stesso componente per i due lati (`mode`):
 *  - studio:  dashboard di controllo, approvazioni, checklist/SAL, assegna partner, storico.
 *  - partner: solo i cantieri assegnati; carica dati operativi (rapportini/presenze/foto/
 *             materiali/documenti); checklist/SAL/avanzamento in sola lettura.
 * Le scritture sono granulari per-elemento (handler generici passati da App).
 */

import React, { useState } from 'react';
import {
  HardHat, Plus, X, Trash2, Check, Clock, Users, ImageIcon, Boxes, ListChecks,
  FileText, TrendingUp, History, MapPin, Calendar as CalIcon,
  CheckCircle2, CircleSlash, MessageSquare, Info, ShieldCheck, HardDrive, Truck,
  ClipboardList, BadgeAlert, FolderOpen, Send, Layers
} from 'lucide-react';

import {
  Cantiere, Rapportino, Presenza, CantiereFoto, CantiereMateriale,
  ChecklistItem, CantiereDoc, CantiereSal, CantiereLog, UserProfile,
  CantiereRecord, CantiereMessage, ImpresaDoc, ImpresaRecord
} from '../types';
import { eur, todayISO, fmtDay } from '../utils';
import { DriveUploader } from './cantiere/DriveUploader';
import { DocRegistry, DocItem } from './cantiere/DocRegistry';
import { RecordRegistry, GenericRecord, RecordColumn } from './cantiere/RecordRegistry';
import { SectionPlaceholder } from './cantiere/SectionPlaceholder';

type Mode = 'studio' | 'partner';

export interface CantiereBoardProps {
  mode: Mode;
  myUid: string;
  myName: string;
  myRole: string;
  project?: { id: string; name: string; division?: string; client?: string | null; committente?: string | null; location?: string | null }; // studio: progetto corrente
  cantieri: Cantiere[];                                       // già filtrati a monte
  rapportini?: Record<string, Record<string, Rapportino>>;
  presenze?: Record<string, Record<string, Presenza>>;
  foto?: Record<string, Record<string, CantiereFoto>>;
  materiali?: Record<string, Record<string, CantiereMateriale>>;
  checklist?: Record<string, Record<string, ChecklistItem>>;
  documenti?: Record<string, Record<string, CantiereDoc>>;
  sal?: Record<string, Record<string, CantiereSal>>;
  log?: Record<string, Record<string, CantiereLog>>;
  records?: Record<string, Record<string, CantiereRecord>>;   // registro voci per-cantiere (generico)
  messages?: Record<string, Record<string, CantiereMessage>>; // chat di cantiere
  impresaDocs?: Record<string, Record<string, ImpresaDoc>>;   // Area Impresa: keyed per uid partner
  impresaRecords?: Record<string, Record<string, ImpresaRecord>>;
  partnerAccounts?: UserProfile[];                            // studio: elenco imprese partner per assegnazione
  onSaveCantiere?: (c: Cantiere) => void;
  onDeleteCantiere?: (cid: string) => void;
  onAssignPartner?: (cid: string, uid: string, name: string, on: boolean) => void;
  onSaveEntity?: (coll: string, cid: string, item: any) => void;
  onDeleteEntity?: (coll: string, cid: string, id: string) => void;
  onSendMessage?: (cid: string, text: string) => void;
  onSaveImpresaEntity?: (coll: string, uid: string, item: any) => void;
  onDeleteImpresaEntity?: (coll: string, uid: string, id: string) => void;
  onApproveRapportino?: (cid: string, id: string, approve: boolean) => void;
  onApproveSal?: (cid: string, id: string) => void;
}

const STATUS_LABEL: Record<Cantiere['status'], string> = {
  pianificazione: 'Pianificazione',
  in_corso: 'In corso',
  sospeso: 'Sospeso',
  concluso: 'Concluso'
};
const STATUS_STYLE: Record<Cantiere['status'], string> = {
  pianificazione: 'bg-[#f1f1f1] text-[#6b6b6b]',
  in_corso: 'bg-emerald-50 text-emerald-700',
  sospeso: 'bg-amber-50 text-amber-700',
  concluso: 'bg-indigo-50 text-indigo-700'
};

const newId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 900)}`;
const vals = <T,>(m?: Record<string, T>): T[] => (m ? Object.values(m) : []);

// ----------------------------------------------------------------
// Componente principale
// ----------------------------------------------------------------
export const CantiereBoard: React.FC<CantiereBoardProps> = (props) => {
  const { mode, myUid, myName, myRole, project, cantieri } = props;
  const isStudio = mode === 'studio';
  const [selId, setSelId] = useState<string | null>(cantieri[0]?.id || null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const sel = cantieri.find((c) => c.id === selId) || cantieri[0] || null;

  const saveEntity = (coll: string, item: any) => sel && props.onSaveEntity?.(coll, sel.id, item);
  const delEntity = (coll: string, id: string) => sel && props.onDeleteEntity?.(coll, sel.id, id);
  const folderName = sel ? `Onirico Cantiere - ${sel.name}` : 'Onirico Cantiere';

  const createCantiere = () => {
    if (!newName.trim() || !project || !props.onSaveCantiere) return;
    const div = (['studio', 'materico', 'unico'].includes(project.division || '') ? project.division : 'studio') as Cantiere['division'];
    const c: Cantiere = {
      id: newId('cant'),
      projectId: project.id,
      name: newName.trim(),
      status: 'pianificazione',
      division: div,
      partnerUids: {},
      progressPct: 0,
      createdBy: myUid,
      createdByName: myName,
      createdAt: Date.now()
    };
    props.onSaveCantiere(c);
    setSelId(c.id);
    setNewName('');
    setCreating(false);
  };

  // -------- empty state --------
  if (cantieri.length === 0 && !isStudio) {
    return (
      <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-8 text-center">
        <HardHat className="w-8 h-8 mx-auto text-[#c9c9c9] mb-2" />
        <p className="text-[13px] font-medium text-[#6b6b6b]">Nessun cantiere assegnato al momento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header + lista cantieri */}
      <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#161616]">
            <HardHat className="w-5 h-5" /> Cantieri
          </h3>
          {isStudio && project && (
            <button
              onClick={() => setCreating((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] text-white text-[12.5px] font-bold"
            >
              <Plus className="w-4 h-4" /> Nuovo cantiere
            </button>
          )}
        </div>

        {creating && (
          <div className="flex items-center gap-2 mb-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome cantiere (es. Lotto A — Posa pavimenti)"
              className="flex-1 px-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && createCantiere()}
            />
            <button onClick={createCantiere} disabled={!newName.trim()} className="px-3 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">Crea</button>
          </div>
        )}

        {cantieri.length === 0 ? (
          <p className="text-[12.5px] italic text-[#9a9a9a] py-2">Nessun cantiere in questo progetto. Creane uno.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cantieri.map((c) => {
              const active = sel?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`shrink-0 text-left px-3 py-2 rounded-2xl border min-w-[180px] ${active ? 'border-[#161616] bg-[#161616] text-white' : 'border-[#e2e2e2] bg-white text-[#161616]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold truncate">{c.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  </div>
                  <div className={`text-[10.5px] mt-1 ${active ? 'text-white/70' : 'text-[#9a9a9a]'}`}>
                    {Object.keys(c.partnerUids || {}).length} partner · {c.progressPct || 0}%
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {sel && (
        <CantiereDetail
          key={sel.id}
          {...props}
          isStudio={isStudio}
          cantiere={sel}
          folderName={folderName}
          saveEntity={saveEntity}
          delEntity={delEntity}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Dettaglio cantiere selezionato
// ----------------------------------------------------------------
type AreaId = 'shared' | 'tecnici' | 'impresa';
const AREAS: { id: AreaId; label: string }[] = [
  { id: 'shared', label: 'Campi condivisi' },
  { id: 'tecnici', label: 'Area Tecnici' },
  { id: 'impresa', label: 'Area Impresa' }
];

type SectionRender =
  | { t: 'comp'; name: 'diario' | 'presenze' | 'foto' | 'materiali' | 'checklist' | 'sal' | 'storico' | 'chat' | 'dati' | 'localizzazione' | 'cliente' }
  | { t: 'cantdoc'; section: string; categories?: string[]; withExpiry?: boolean; partnerWrite?: boolean }
  | { t: 'cantrec'; section: string; columns: RecordColumn[]; statuses?: string[]; partnerWrite?: boolean }
  | { t: 'impdoc'; categories?: string[] }
  | { t: 'imprec'; section: string; columns: RecordColumn[]; statuses?: string[] }
  | { t: 'soon'; hint?: string };

interface SectionDef { area: AreaId; id: string; label: string; icon: React.ElementType; render: SectionRender; }

const SECTIONS: SectionDef[] = [
  // ---- Campi condivisi ----
  { area: 'shared', id: 'dati', label: 'Dati generali', icon: Info, render: { t: 'comp', name: 'dati' } },
  { area: 'shared', id: 'localizzazione', label: 'Localizzazione', icon: MapPin, render: { t: 'comp', name: 'localizzazione' } },
  { area: 'shared', id: 'cliente', label: 'Cliente / Committente', icon: Users, render: { t: 'comp', name: 'cliente' } },
  { area: 'shared', id: 'diario', label: 'Diario di cantiere', icon: FileText, render: { t: 'comp', name: 'diario' } },
  { area: 'shared', id: 'foto', label: 'Foto', icon: ImageIcon, render: { t: 'comp', name: 'foto' } },
  { area: 'shared', id: 'attivita', label: 'Attività & Scadenze', icon: ClipboardList, render: { t: 'cantrec', section: 'scadenze', partnerWrite: true, statuses: ['Da fare', 'In corso', 'Completata'], columns: [{ key: 'title', label: 'Attività / scadenza' }, { key: 'date', label: 'Scadenza', type: 'date' }, { key: 'status', label: 'Stato' }] } },
  { area: 'shared', id: 'documenti', label: 'Documenti', icon: FolderOpen, render: { t: 'cantdoc', section: 'documenti', partnerWrite: true, categories: ['Disegni', 'Verbali', 'Contratti', 'Foto', 'Altro'] } },
  { area: 'shared', id: 'chat', label: 'Comunicazioni', icon: MessageSquare, render: { t: 'comp', name: 'chat' } },

  // ---- Area Tecnici (direzione lavori / progettazione / sicurezza / qualità / doc tecnica) ----
  { area: 'tecnici', id: 'sal', label: 'SAL & Avanzamento', icon: TrendingUp, render: { t: 'comp', name: 'sal' } },
  { area: 'tecnici', id: 'cronoprogramma', label: 'Cronoprogramma', icon: CalIcon, render: { t: 'cantrec', section: 'cronoprogramma', statuses: ['Pianificata', 'In corso', 'Completata'], columns: [{ key: 'title', label: 'Lavorazione / fase' }, { key: 'date', label: 'Inizio', type: 'date' }, { key: 'dateEnd', label: 'Fine', type: 'date' }, { key: 'status', label: 'Stato' }] } },
  { area: 'tecnici', id: 'verifiche', label: 'Verifica lavorazioni', icon: CheckCircle2, render: { t: 'cantrec', section: 'verifiche', statuses: ['Conforme', 'Non conforme', 'In attesa'], columns: [{ key: 'title', label: 'Lavorazione verificata' }, { key: 'date', label: 'Data', type: 'date' }, { key: 'status', label: 'Esito' }] } },
  { area: 'tecnici', id: 'nonconformita', label: 'Non conformità', icon: BadgeAlert, render: { t: 'cantrec', section: 'nonconformita', statuses: ['Aperta', 'In corso', 'Chiusa'], columns: [{ key: 'title', label: 'Non conformità' }, { key: 'date', label: 'Rilevata', type: 'date' }, { key: 'status', label: 'Stato' }] } },
  { area: 'tecnici', id: 'ordini_servizio', label: 'Ordini di servizio / Verbali', icon: FileText, render: { t: 'cantdoc', section: 'verbali', categories: ['Verbale', 'Ordine di servizio', 'Sopralluogo', 'Altro'] } },
  { area: 'tecnici', id: 'sicurezza', label: 'Sicurezza (POS/PSC/DUVRI)', icon: ShieldCheck, render: { t: 'cantdoc', section: 'sicurezza', categories: ['POS', 'PSC', 'DUVRI', 'Verbale sicurezza', 'Altro'] } },
  { area: 'tecnici', id: 'progettazione', label: 'Progettazione', icon: Layers, render: { t: 'cantdoc', section: 'progettazione', categories: ['Elaborati grafici', 'Tavole tecniche', 'Computi metrici', 'Varianti', 'Revisioni'] } },
  { area: 'tecnici', id: 'qualita', label: 'Controllo qualità', icon: ListChecks, render: { t: 'comp', name: 'checklist' } },
  { area: 'tecnici', id: 'doctecnica', label: 'Documentazione tecnica', icon: FolderOpen, render: { t: 'cantdoc', section: 'doctecnica', withExpiry: true, categories: ['Permesso', 'Autorizzazione', 'Pratica comunale', 'Relazione tecnica', 'Certificato'] } },
  { area: 'tecnici', id: 'collaudi', label: 'Collaudi & test materiali', icon: CheckCircle2, render: { t: 'soon', hint: 'Collaudi, test materiali e certificazioni impianti: in preparazione.' } },
  { area: 'tecnici', id: 'storico', label: 'Storico', icon: History, render: { t: 'comp', name: 'storico' } },

  // ---- Area Impresa (profilo impresa partner, riusabile su tutti i cantieri) ----
  { area: 'impresa', id: 'documentazione', label: 'Documentazione impresa', icon: FileText, render: { t: 'impdoc', categories: ['DURC', 'Visura', 'Polizza assicurativa', 'Certificazione SOA', 'Documento dipendente'] } },
  { area: 'impresa', id: 'squadre', label: 'Squadre', icon: Users, render: { t: 'imprec', section: 'squadre', columns: [{ key: 'title', label: 'Nome squadra' }, { key: 'caposquadra', label: 'Caposquadra' }, { key: 'componenti', label: 'N. componenti', type: 'number' }] } },
  { area: 'impresa', id: 'operai', label: 'Operai', icon: HardHat, render: { t: 'imprec', section: 'operai', columns: [{ key: 'title', label: 'Nominativo' }, { key: 'mansione', label: 'Mansione' }, { key: 'contatto', label: 'Contatto' }] } },
  { area: 'impresa', id: 'presenze', label: 'Presenze & ore', icon: Clock, render: { t: 'comp', name: 'presenze' } },
  { area: 'impresa', id: 'mezzi', label: 'Mezzi & attrezzature', icon: Truck, render: { t: 'imprec', section: 'mezzi', statuses: ['Operativo', 'In manutenzione', 'Guasto'], columns: [{ key: 'title', label: 'Mezzo / attrezzatura' }, { key: 'targa', label: 'Targa / codice' }, { key: 'status', label: 'Stato' }] } },
  { area: 'impresa', id: 'materiali', label: 'Materiali (consegne/impiego)', icon: Boxes, render: { t: 'comp', name: 'materiali' } },
  { area: 'impresa', id: 'sicurezza_impresa', label: 'Sicurezza impresa', icon: ShieldCheck, render: { t: 'imprec', section: 'sicurezza_impresa', statuses: ['Valido', 'In scadenza', 'Scaduto'], columns: [{ key: 'title', label: 'Voce (DPI/formazione/visita/patentino)' }, { key: 'lavoratore', label: 'Lavoratore' }, { key: 'date', label: 'Scadenza', type: 'date' }, { key: 'status', label: 'Stato' }] } },
  { area: 'impresa', id: 'magazzino', label: 'Magazzino & ordini', icon: HardDrive, render: { t: 'soon', hint: 'Ordini, fornitori, magazzino e giacenze dell\'impresa: in preparazione.' } }
];

const CantiereDetail: React.FC<CantiereBoardProps & {
  isStudio: boolean;
  cantiere: Cantiere;
  folderName: string;
  saveEntity: (coll: string, item: any) => void;
  delEntity: (coll: string, id: string) => void;
}> = (p) => {
  const { cantiere: c, isStudio, myUid, myName, myRole, folderName, saveEntity, delEntity } = p;
  const cid = c.id;
  const [assignOpen, setAssignOpen] = useState(false);
  const [area, setArea] = useState<AreaId>('shared');
  const [section, setSection] = useState<string>('dati');

  // Impresa attiva per l'Area Impresa: partner = se stesso; studio = partner assegnato selezionato
  const assignedUids = Object.keys(c.partnerUids || {});
  const [impUid, setImpUid] = useState<string>(isStudio ? (assignedUids[0] || '') : myUid);
  const partnerName = (uid: string) => (p.partnerAccounts || []).find((a) => a.uid === uid)?.companyName
    || (p.partnerAccounts || []).find((a) => a.uid === uid)?.name || 'Impresa';
  const partnerAssigned = !!c.partnerUids?.[myUid];

  const areaSections = SECTIONS.filter((s) => s.area === area);
  const def = SECTIONS.find((s) => s.id === section) || areaSections[0];

  const switchArea = (a: AreaId) => {
    setArea(a);
    const first = SECTIONS.find((s) => s.area === a);
    if (first) setSection(first.id);
  };

  // -- builder dati per i registri generici --
  const cantDocItems = (sec: string): DocItem[] =>
    vals(p.documenti?.[cid]).filter((d) => (d.section || 'documenti') === sec)
      .map((d) => ({ id: d.id, name: d.name, driveUrl: d.driveUrl, link: d.link, category: d.category, expiry: d.expiry, by: d.by, at: d.at }));
  const cantRecItems = (sec: string): GenericRecord[] => vals(p.records?.[cid]).filter((r) => r.section === sec);
  const impDocItems = (): DocItem[] =>
    vals(p.impresaDocs?.[impUid]).map((d) => ({ id: d.id, name: d.name, driveUrl: d.driveUrl, link: d.link, category: d.docType, expiry: d.expiry, by: d.by, at: d.at }));
  const impRecItems = (sec: string): GenericRecord[] => vals(p.impresaRecords?.[impUid]).filter((r) => r.section === sec);

  const renderSection = (): React.ReactNode => {
    const r = def.render;
    if (r.t === 'comp') {
      switch (r.name) {
        case 'diario': return <RapportiniTab {...p} />;
        case 'presenze': return <PresenzeTab {...p} />;
        case 'foto': return <FotoTab {...p} />;
        case 'materiali': return <MaterialiTab {...p} />;
        case 'checklist': return <ChecklistTab {...p} />;
        case 'sal': return <SalTab {...p} />;
        case 'storico': return <StoricoTab {...p} />;
        case 'chat': return <ChatTab {...p} />;
        case 'dati': return <DatiGeneraliTab {...p} />;
        case 'localizzazione': return <LocalizzazioneTab {...p} />;
        case 'cliente': return <ClienteTab {...p} />;
      }
    }
    if (r.t === 'cantdoc') {
      const canWrite = isStudio || (!!r.partnerWrite && partnerAssigned);
      return (
        <DocRegistry
          items={cantDocItems(r.section)}
          folderName={folderName}
          canWrite={canWrite}
          canDelete={(d) => isStudio || d.by === myUid}
          categories={r.categories}
          withExpiry={r.withExpiry}
          onAdd={(data) => saveEntity('cantiereDocumenti', { id: newId('doc'), name: data.name, driveFileId: data.driveFileId || null, driveUrl: data.driveUrl || null, link: data.link || null, section: r.section, category: data.category || null, expiry: data.expiry || null, by: myUid, role: myRole, at: Date.now() })}
          onDelete={(id) => delEntity('cantiereDocumenti', id)}
        />
      );
    }
    if (r.t === 'cantrec') {
      const canWrite = isStudio || (!!r.partnerWrite && partnerAssigned);
      return (
        <RecordRegistry
          items={cantRecItems(r.section)}
          columns={r.columns}
          statuses={r.statuses}
          canWrite={canWrite}
          canDelete={(rec) => isStudio || rec.by === myUid}
          onAdd={(data) => saveEntity('cantiereRecords', { id: newId('rec'), section: r.section, title: data.title, date: data.date || null, dateEnd: data.dateEnd || null, status: data.status || null, fields: data.fields, by: myUid, byName: myName, role: myRole, at: Date.now() })}
          onDelete={(id) => delEntity('cantiereRecords', id)}
        />
      );
    }
    if (r.t === 'impdoc' || r.t === 'imprec') {
      if (!impUid) return <SectionPlaceholder label="Nessuna impresa assegnata" hint="Assegna un'impresa partner al cantiere per vederne l'Area Impresa." />;
      const canWrite = !isStudio && impUid === myUid;
      if (r.t === 'impdoc') {
        return (
          <DocRegistry
            items={impDocItems()}
            folderName={`Onirico Impresa - ${partnerName(impUid)}`}
            canWrite={canWrite}
            categories={r.categories}
            withExpiry
            emptyText="Nessun documento dell'impresa."
            onAdd={(data) => p.onSaveImpresaEntity?.('impresaDocs', impUid, { id: newId('idoc'), docType: data.category || 'Documento', name: data.name, expiry: data.expiry || null, driveFileId: data.driveFileId || null, driveUrl: data.driveUrl || null, link: data.link || null, by: myUid, at: Date.now() })}
            onDelete={(id) => p.onDeleteImpresaEntity?.('impresaDocs', impUid, id)}
          />
        );
      }
      return (
        <RecordRegistry
          items={impRecItems(r.section)}
          columns={r.columns}
          statuses={r.statuses}
          canWrite={canWrite}
          onAdd={(data) => p.onSaveImpresaEntity?.('impresaRecords', impUid, { id: newId('irec'), section: r.section, title: data.title, date: data.date || null, status: data.status || null, fields: data.fields, by: myUid, at: Date.now() })}
          onDelete={(id) => p.onDeleteImpresaEntity?.('impresaRecords', impUid, id)}
        />
      );
    }
    return <SectionPlaceholder label={def.label} hint={(r as any).hint} />;
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
      {/* intestazione cantiere */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#f2f2f2] pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[16px] font-extrabold text-[#161616]">{c.name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11.5px] text-[#9a9a9a]">
            {c.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>}
            {c.dueDate && <span className="inline-flex items-center gap-1"><CalIcon className="w-3 h-3" /> consegna {fmtDay(c.dueDate)}</span>}
            <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {Object.keys(c.partnerUids || {}).length} partner</span>
          </div>
        </div>
        {isStudio && (
          <div className="flex items-center gap-2">
            <select
              value={c.status}
              onChange={(e) => p.onSaveCantiere?.({ ...c, status: e.target.value as Cantiere['status'], updatedAt: Date.now() })}
              className="px-2.5 py-1.5 rounded-xl border border-[#e2e2e2] text-[12px] font-bold outline-none"
            >
              {(['pianificazione', 'in_corso', 'sospeso', 'concluso'] as Cantiere['status'][]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button onClick={() => setAssignOpen((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e2e2] text-[12px] font-bold">
              <Users className="w-4 h-4" /> Partner
            </button>
            <button
              onClick={() => { if (confirm('Eliminare il cantiere?')) p.onDeleteCantiere?.(cid); }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[#e2e2e2] text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* assegnazione partner (studio) */}
      {isStudio && assignOpen && (
        <div className="mb-3 p-3 rounded-2xl bg-[#fafafa] border border-[#eee]">
          <p className="text-[12px] font-bold text-[#161616] mb-2">Imprese partner assegnate</p>
          {(p.partnerAccounts || []).length === 0 ? (
            <p className="text-[12px] italic text-[#9a9a9a]">Nessuna impresa partner registrata. Registrane una da Team → Anagrafiche.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {(p.partnerAccounts || []).map((pa) => {
                const on = !!c.partnerUids?.[pa.uid];
                return (
                  <label key={pa.uid} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#eee]">
                    <span className="text-[12.5px] font-medium text-[#161616]">{pa.companyName || pa.name}</span>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => p.onAssignPartner?.(cid, pa.uid, pa.companyName || pa.name, e.target.checked)}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* nav AREA (livello 1) */}
      <div className="flex gap-1.5 mb-2.5 border-b border-[#f2f2f2] pb-2.5">
        {AREAS.map((a) => {
          const active = area === a.id;
          return (
            <button
              key={a.id}
              onClick={() => switchArea(a.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${active ? 'bg-[#161616] text-white' : 'bg-white text-[#6b6b6b] border border-[#e2e2e2] hover:bg-[#fafafa]'}`}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {/* nav SEZIONE (livello 2) */}
      <div className="flex gap-1 overflow-x-auto mb-3">
        {areaSections.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${active ? 'bg-[#2b2b2b] text-white' : 'bg-[#f3f3f3] text-[#6b6b6b]'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* selettore impresa (solo studio, Area Impresa con più partner) */}
      {area === 'impresa' && isStudio && assignedUids.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11.5px] font-bold text-[#9a9a9a]">Impresa:</span>
          <select value={impUid} onChange={(e) => setImpUid(e.target.value)} className="px-2.5 py-1.5 rounded-xl border border-[#e2e2e2] text-[12px] font-bold outline-none">
            {assignedUids.map((uid) => <option key={uid} value={uid}>{partnerName(uid)}</option>)}
          </select>
          <span className="text-[11px] text-[#b0b0b0]">(profilo riusato su tutti i cantieri dell'impresa, sola lettura)</span>
        </div>
      )}

      {renderSection()}
    </div>
  );
};

type TabProps = CantiereBoardProps & {
  isStudio: boolean;
  cantiere: Cantiere;
  folderName: string;
  saveEntity: (coll: string, item: any) => void;
  delEntity: (coll: string, id: string) => void;
};

const sectionEmpty = (txt: string) => <p className="text-[12.5px] italic text-[#9a9a9a] py-3">{txt}</p>;

// -------------------- Rapportini --------------------
const RapportiniTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, myUid, myName, myRole, folderName, saveEntity, delEntity } = p;
  const list = vals(p.rapportini?.[c.id]).sort((a, b) => b.at - a.at);
  const [desc, setDesc] = useState('');
  const [meteo, setMeteo] = useState('');
  const [ore, setOre] = useState('');
  const [foto, setFoto] = useState<string[]>([]);

  const add = () => {
    if (!desc.trim()) return;
    const r: Rapportino = {
      id: newId('rap'), date: todayISO(), partnerUid: myUid, partnerName: myName,
      meteo: meteo || null, ore: ore ? parseFloat(ore.replace(',', '.')) || null : null,
      descrizione: desc.trim(), fotoIds: foto.length ? foto : undefined, status: 'inviato', at: Date.now()
    };
    saveEntity('cantiereRapportini', r);
    setDesc(''); setMeteo(''); setOre(''); setFoto([]);
  };

  return (
    <div className="flex flex-col gap-3">
      {!isStudio && (
        <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input value={meteo} onChange={(e) => setMeteo(e.target.value)} placeholder="Meteo (sereno…)" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-36" />
            <input value={ore} onChange={(e) => setOre(e.target.value)} placeholder="Ore" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-20" />
          </div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrizione lavorazioni della giornata…" rows={3} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none resize-none" />
          <DriveUploader folderName={folderName} onUploaded={(f) => {
            const photo: CantiereFoto = { id: newId('foto'), driveFileId: f.driveFileId || null, driveUrl: f.driveUrl || null, link: f.link || null, caption: 'Rapportino', by: myUid, role: myRole, at: Date.now() };
            saveEntity('cantiereFoto', photo);
            setFoto((arr) => [...arr, photo.id]);
          }} />
          <button onClick={add} disabled={!desc.trim()} className="self-start px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">Invia rapportino</button>
        </div>
      )}

      {list.length === 0 ? sectionEmpty('Nessun rapportino.') : (
        <div className="flex flex-col gap-2">
          {list.map((r) => (
            <div key={r.id} className="p-3 rounded-2xl border border-[#eee]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[12.5px] font-bold text-[#161616]">{fmtDay(r.date)} · {r.partnerName || 'Partner'}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === 'approvato' ? 'bg-emerald-50 text-emerald-700' : r.status === 'rifiutato' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span>
                  {isStudio && r.status === 'inviato' && (
                    <>
                      <button onClick={() => p.onApproveRapportino?.(c.id, r.id, true)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => p.onApproveRapportino?.(c.id, r.id, false)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-700"><X className="w-4 h-4" /></button>
                    </>
                  )}
                  {(isStudio || r.partnerUid === myUid) && (
                    <button onClick={() => delEntity('cantiereRapportini', r.id)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
              <p className="text-[12.5px] text-[#3a3a3a] whitespace-pre-wrap">{r.descrizione}</p>
              <div className="flex gap-3 mt-1 text-[11px] text-[#9a9a9a]">
                {r.meteo && <span>☀ {r.meteo}</span>}
                {r.ore != null && <span>⏱ {r.ore}h</span>}
                {r.fotoIds?.length ? <span>📷 {r.fotoIds.length}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------- Presenze --------------------
const PresenzeTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, myUid, myName, saveEntity, delEntity } = p;
  const list = vals(p.presenze?.[c.id]).sort((a, b) => b.at - a.at);
  const [lav, setLav] = useState('');
  const [ore, setOre] = useState('');
  const [mans, setMans] = useState('');

  const add = () => {
    if (!lav.trim() || !ore) return;
    const r: Presenza = { id: newId('pres'), date: todayISO(), partnerUid: myUid, lavoratore: lav.trim(), ore: parseFloat(ore.replace(',', '.')) || 0, mansione: mans || null, at: Date.now() };
    saveEntity('cantierePresenze', r);
    setLav(''); setOre(''); setMans('');
  };

  return (
    <div className="flex flex-col gap-3">
      {!isStudio && (
        <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-wrap gap-2 items-center">
          <input value={lav} onChange={(e) => setLav(e.target.value)} placeholder="Lavoratore" className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
          <input value={mans} onChange={(e) => setMans(e.target.value)} placeholder="Mansione" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-36" />
          <input value={ore} onChange={(e) => setOre(e.target.value)} placeholder="Ore" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-20" />
          <button onClick={add} disabled={!lav.trim() || !ore} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">Aggiungi</button>
        </div>
      )}
      {list.length === 0 ? sectionEmpty('Nessuna presenza registrata.') : (
        <div className="flex flex-col gap-1.5">
          {list.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <div className="text-[12.5px]"><span className="font-bold text-[#161616]">{r.lavoratore}</span>{r.mansione ? <span className="text-[#9a9a9a]"> · {r.mansione}</span> : null}</div>
              <div className="flex items-center gap-3">
                <span className="text-[11.5px] text-[#9a9a9a]">{fmtDay(r.date)}</span>
                <span className="text-[12px] font-bold text-[#161616]">{r.ore}h</span>
                {(isStudio || r.partnerUid === myUid) && <button onClick={() => delEntity('cantierePresenze', r.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------- Foto --------------------
const FotoTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, myUid, myRole, folderName, saveEntity, delEntity } = p;
  const list = vals(p.foto?.[c.id]).sort((a, b) => b.at - a.at);
  return (
    <div className="flex flex-col gap-3">
      {!isStudio && (
        <DriveUploader folderName={folderName} onUploaded={(f) => {
          const photo: CantiereFoto = { id: newId('foto'), driveFileId: f.driveFileId || null, driveUrl: f.driveUrl || null, link: f.link || null, by: myUid, role: myRole, at: Date.now() };
          saveEntity('cantiereFoto', photo);
        }} />
      )}
      {list.length === 0 ? sectionEmpty('Nessuna foto.') : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {list.map((f) => {
            const url = f.driveUrl || f.link || '';
            return (
              <div key={f.id} className="relative group rounded-2xl border border-[#eee] overflow-hidden bg-[#fafafa] aspect-square flex items-center justify-center">
                <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 text-[11px] text-[#6b6b6b] p-2 text-center">
                  <ImageIcon className="w-6 h-6 text-[#c9c9c9]" />
                  <span className="truncate max-w-full">{f.caption || 'Foto'}</span>
                  <span className="text-[10px] text-[#9a9a9a]">{fmtDay(new Date(f.at).toISOString().slice(0, 10))}</span>
                </a>
                {(isStudio || f.by === myUid) && (
                  <button onClick={() => delEntity('cantiereFoto', f.id)} className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5 mx-auto" /></button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// -------------------- Materiali --------------------
const MaterialiTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, myUid, saveEntity, delEntity } = p;
  const list = vals(p.materiali?.[c.id]).sort((a, b) => b.at - a.at);
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pz');
  const [tipo, setTipo] = useState<'consegna' | 'impiego'>('consegna');

  const add = () => {
    if (!desc.trim() || !qty) return;
    const m: CantiereMateriale = { id: newId('mat'), desc: desc.trim(), qty: parseFloat(qty.replace(',', '.')) || 0, unit, tipo, date: todayISO(), by: myUid, at: Date.now() };
    saveEntity('cantiereMateriali', m);
    setDesc(''); setQty('');
  };

  return (
    <div className="flex flex-col gap-3">
      {!isStudio && (
        <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-wrap gap-2 items-center">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Materiale" className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
          <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qtà" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-20" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unità" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-20" />
          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12px] outline-none">
            <option value="consegna">Consegna</option>
            <option value="impiego">Impiego</option>
          </select>
          <button onClick={add} disabled={!desc.trim() || !qty} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">Aggiungi</button>
        </div>
      )}
      {list.length === 0 ? sectionEmpty('Nessun movimento materiali.') : (
        <div className="flex flex-col gap-1.5">
          {list.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <div className="text-[12.5px]"><span className="font-bold text-[#161616]">{m.desc}</span> <span className="text-[#9a9a9a]">· {m.qty} {m.unit}</span></div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.tipo === 'consegna' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>{m.tipo}</span>
                <span className="text-[11.5px] text-[#9a9a9a]">{fmtDay(m.date)}</span>
                {(isStudio || m.by === myUid) && <button onClick={() => delEntity('cantiereMateriali', m.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------- Checklist (write solo studio) --------------------
const ChecklistTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, myUid, myName, saveEntity, delEntity } = p;
  const list = vals(p.checklist?.[c.id]).sort((a, b) => a.order - b.order);
  const [title, setTitle] = useState('');

  const add = () => {
    if (!title.trim()) return;
    const item: ChecklistItem = { id: newId('chk'), title: title.trim(), done: false, order: list.length, category: null };
    saveEntity('cantiereChecklist', item);
    setTitle('');
  };
  const toggle = (it: ChecklistItem) => {
    if (!isStudio) return;
    saveEntity('cantiereChecklist', { ...it, done: !it.done, doneBy: !it.done ? myName : null, doneAt: !it.done ? Date.now() : null });
  };

  return (
    <div className="flex flex-col gap-3">
      {isStudio && (
        <div className="flex items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Voce di checklist…" className="flex-1 px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button onClick={add} disabled={!title.trim()} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">Aggiungi</button>
        </div>
      )}
      {list.length === 0 ? sectionEmpty('Nessuna voce di checklist.') : (
        <div className="flex flex-col gap-1.5">
          {list.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <button onClick={() => toggle(it)} className={`flex items-center gap-2 text-[12.5px] ${!isStudio ? 'cursor-default' : ''}`}>
                {it.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <CircleSlash className="w-4 h-4 text-[#c9c9c9]" />}
                <span className={it.done ? 'line-through text-[#9a9a9a]' : 'text-[#161616] font-medium'}>{it.title}</span>
              </button>
              {isStudio && <button onClick={() => delEntity('cantiereChecklist', it.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------- Comunicazioni / Chat --------------------
const ChatTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, myUid } = p;
  const list = vals(p.messages?.[c.id]).sort((a, b) => a.at - b.at);
  const [text, setText] = useState('');
  const send = () => { if (!text.trim()) return; p.onSendMessage?.(c.id, text); setText(''); };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
        {list.length === 0 ? sectionEmpty('Nessun messaggio. Avvia il coordinamento di cantiere.') : list.map((m) => {
          const mine = m.from === myUid;
          return (
            <div key={m.id} className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
              <div className={`px-3 py-2 rounded-2xl text-[12.5px] ${mine ? 'bg-[#161616] text-white' : 'bg-[#f3f3f3] text-[#161616]'}`}>{m.text}</div>
              <div className={`text-[10px] text-[#9a9a9a] mt-0.5 ${mine ? 'text-right' : ''}`}>{m.name} · {new Date(m.at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Scrivi un messaggio di cantiere…" className="flex-1 px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
        <button onClick={send} disabled={!text.trim()} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40"><Send className="w-4 h-4" /> Invia</button>
      </div>
    </div>
  );
};

// -------------------- Dati generali (edit studio) --------------------
const DatiGeneraliTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio } = p;
  const upd = (patch: Partial<Cantiere>) => p.onSaveCantiere?.({ ...c, ...patch, updatedAt: Date.now() });
  if (!isStudio) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[12.5px]">
        <Field label="Cantiere" value={c.name} />
        <Field label="Stato" value={STATUS_LABEL[c.status]} />
        <Field label="Inizio" value={c.startDate ? fmtDay(c.startDate) : '—'} />
        <Field label="Consegna prevista" value={c.dueDate ? fmtDay(c.dueDate) : '—'} />
        <Field label="Localizzazione" value={c.location || '—'} />
        <Field label="Avanzamento" value={`${c.progressPct || 0}%`} />
        {c.notes && <div className="md:col-span-2"><Field label="Note" value={c.notes} /></div>}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <LabeledInput label="Nome cantiere" value={c.name} onChange={(v) => upd({ name: v })} />
      <LabeledInput label="Localizzazione" value={c.location || ''} onChange={(v) => upd({ location: v })} />
      <LabeledInput label="Inizio" type="date" value={c.startDate || ''} onChange={(v) => upd({ startDate: v || null })} />
      <LabeledInput label="Consegna prevista" type="date" value={c.dueDate || ''} onChange={(v) => upd({ dueDate: v || null })} />
      <div className="md:col-span-2 flex flex-col gap-1">
        <label className="text-[11.5px] font-bold text-[#6b6b6b]">Note</label>
        <textarea value={c.notes || ''} onChange={(e) => upd({ notes: e.target.value })} rows={3} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none resize-none" />
      </div>
    </div>
  );
};

// -------------------- Localizzazione --------------------
const LocalizzazioneTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio } = p;
  const loc = c.location || p.project?.location || '';
  return (
    <div className="flex flex-col gap-3">
      {isStudio ? (
        <LabeledInput label="Indirizzo / località del cantiere" value={c.location || ''} onChange={(v) => p.onSaveCantiere?.({ ...c, location: v, updatedAt: Date.now() })} />
      ) : (
        <Field label="Localizzazione" value={loc || '—'} />
      )}
      {loc && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold text-[#161616] hover:bg-[#fafafa]">
          <MapPin className="w-4 h-4" /> Apri in Google Maps
        </a>
      )}
    </div>
  );
};

// -------------------- Cliente / Committente --------------------
const ClienteTab: React.FC<TabProps> = (p) => {
  const cl = p.project?.client;
  const com = p.project?.committente;
  if (!cl && !com) return sectionEmpty('Dati cliente/committente non disponibili (collega il cliente dal fascicolo progetto).');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[12.5px]">
      <Field label="Cliente" value={cl || '—'} />
      <Field label="Committente" value={com || cl || '—'} />
    </div>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-3 py-2 rounded-xl border border-[#eee] bg-[#fafafa]">
    <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a]">{label}</div>
    <div className="text-[12.5px] font-medium text-[#161616] mt-0.5 whitespace-pre-wrap">{value}</div>
  </div>
);

const LabeledInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11.5px] font-bold text-[#6b6b6b]">{label}</label>
    <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
  </div>
);

// -------------------- SAL & Avanzamento (write solo studio) --------------------
const SalTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, saveEntity, delEntity } = p;
  const list = vals(p.sal?.[c.id]).sort((a, b) => a.number - b.number);
  const [descr, setDescr] = useState('');
  const [importo, setImporto] = useState('');
  const [prog, setProg] = useState('');

  const add = () => {
    const s: CantiereSal = {
      id: newId('sal'), number: list.length + 1, descrizione: descr || null,
      importo: importo ? parseFloat(importo.replace(',', '.')) || null : null,
      progressPct: prog ? parseFloat(prog) || null : c.progressPct ?? null,
      status: 'bozza', at: Date.now()
    };
    saveEntity('cantiereSal', s);
    setDescr(''); setImporto(''); setProg('');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* avanzamento globale */}
      <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-bold text-[#161616]">Avanzamento cantiere</span>
          <span className="text-[13px] font-extrabold text-[#161616]">{c.progressPct || 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#eaeaea] overflow-hidden">
          <div className="h-full bg-[#161616]" style={{ width: `${Math.min(100, c.progressPct || 0)}%` }} />
        </div>
        {isStudio && (
          <input
            type="range" min={0} max={100} value={c.progressPct || 0}
            onChange={(e) => p.onSaveCantiere?.({ ...c, progressPct: parseInt(e.target.value, 10), updatedAt: Date.now() })}
            className="w-full mt-2"
          />
        )}
      </div>

      {isStudio && (
        <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-wrap gap-2 items-center">
          <input value={descr} onChange={(e) => setDescr(e.target.value)} placeholder="Descrizione SAL" className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
          <input value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="Importo €" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-28" />
          <input value={prog} onChange={(e) => setProg(e.target.value)} placeholder="% avanz." className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-24" />
          <button onClick={add} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold">Crea SAL</button>
        </div>
      )}

      {list.length === 0 ? sectionEmpty('Nessun SAL.') : (
        <div className="flex flex-col gap-2">
          {list.map((s) => (
            <div key={s.id} className="p-3 rounded-2xl border border-[#eee]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[#161616]">SAL {s.number}{s.descrizione ? ` — ${s.descrizione}` : ''}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === 'approvato' ? 'bg-emerald-50 text-emerald-700' : s.status === 'inviato' ? 'bg-amber-50 text-amber-700' : 'bg-[#f1f1f1] text-[#6b6b6b]'}`}>{s.status}</span>
                  {s.linkedInvoiceId && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">fatturato</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11.5px] text-[#9a9a9a]">
                {s.importo != null && <span className="font-bold text-[#161616]">{eur(s.importo)}</span>}
                {s.progressPct != null && <span>{s.progressPct}%</span>}
              </div>
              {isStudio && s.status !== 'approvato' && (
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => p.onApproveSal?.(c.id, s.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11.5px] font-bold">Approva SAL</button>
                  <button onClick={() => delEntity('cantiereSal', s.id)} className="px-3 py-1.5 rounded-lg border border-[#e2e2e2] text-[11.5px] font-bold text-rose-600">Elimina</button>
                </div>
              )}
              {isStudio && s.status === 'approvato' && !s.linkedInvoiceId && (
                <p className="mt-2 text-[11px] text-emerald-700 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Approvato — emetti la bozza fattura da Finanze → SAL.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------- Storico (audit, lato studio) --------------------
const StoricoTab: React.FC<TabProps> = (p) => {
  const { cantiere: c } = p;
  const list = vals(p.log?.[c.id]).sort((a, b) => b.at - a.at);
  if (list.length === 0) return sectionEmpty('Nessuna azione registrata.');
  return (
    <div className="flex flex-col gap-1.5">
      {list.map((l) => (
        <div key={l.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#eee] text-[12px]">
          <Clock className="w-3.5 h-3.5 text-[#9a9a9a]" />
          <span className="font-bold text-[#161616]">{l.action}</span>
          <span className="text-[#9a9a9a]">{l.detail || ''}</span>
          <span className="ml-auto text-[11px] text-[#bdbdbd]">{new Date(l.at).toLocaleString('it-IT')}</span>
        </div>
      ))}
    </div>
  );
};
