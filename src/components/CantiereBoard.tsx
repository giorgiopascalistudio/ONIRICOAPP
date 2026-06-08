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
  FileText, TrendingUp, History, Upload, Link as LinkIcon, CloudUpload, AlertTriangle,
  CheckCircle2, CircleSlash, MapPin, Calendar as CalIcon
} from 'lucide-react';

import {
  Cantiere, Rapportino, Presenza, CantiereFoto, CantiereMateriale,
  ChecklistItem, CantiereDoc, CantiereSal, CantiereLog, UserProfile
} from '../types';
import { eur, todayISO, fmtDay } from '../utils';
import { uploadToDrive, driveAvailable } from '../drive';

type Mode = 'studio' | 'partner';
type Tab = 'rapportini' | 'presenze' | 'foto' | 'materiali' | 'checklist' | 'documenti' | 'sal' | 'storico';

export interface CantiereBoardProps {
  mode: Mode;
  myUid: string;
  myName: string;
  myRole: string;
  project?: { id: string; name: string; division?: string }; // studio: progetto corrente (per creare)
  cantieri: Cantiere[];                                       // già filtrati a monte
  rapportini?: Record<string, Record<string, Rapportino>>;
  presenze?: Record<string, Record<string, Presenza>>;
  foto?: Record<string, Record<string, CantiereFoto>>;
  materiali?: Record<string, Record<string, CantiereMateriale>>;
  checklist?: Record<string, Record<string, ChecklistItem>>;
  documenti?: Record<string, Record<string, CantiereDoc>>;
  sal?: Record<string, Record<string, CantiereSal>>;
  log?: Record<string, Record<string, CantiereLog>>;
  partnerAccounts?: UserProfile[];                            // studio: elenco imprese partner per assegnazione
  onSaveCantiere?: (c: Cantiere) => void;
  onDeleteCantiere?: (cid: string) => void;
  onAssignPartner?: (cid: string, uid: string, name: string, on: boolean) => void;
  onSaveEntity?: (coll: string, cid: string, item: any) => void;
  onDeleteEntity?: (coll: string, cid: string, id: string) => void;
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
// DriveUploader — upload reale su Drive con fallback "incolla link"
// ----------------------------------------------------------------
const DriveUploader: React.FC<{
  folderName: string;
  onUploaded: (f: { driveFileId?: string; driveUrl?: string; link?: string; name?: string }) => void;
}> = ({ folderName, onUploaded }) => {
  const [busy, setBusy] = useState(false);
  const [linkMode, setLinkMode] = useState(!driveAvailable());
  const [link, setLink] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await uploadToDrive(file, folderName);
      onUploaded({ driveFileId: res.fileId, driveUrl: res.webViewLink, name: file.name });
    } catch (e: any) {
      // Fallback: Drive non configurato/negato → consenti link manuale
      setLinkMode(true);
      setErr('Upload Drive non disponibile: incolla un link al file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!linkMode && (
        <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[12.5px] font-bold cursor-pointer hover:bg-[#fafafa] ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
          <CloudUpload className="w-4 h-4" /> {busy ? 'Caricamento…' : 'Carica su Drive'}
          <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      )}
      {linkMode && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white">
            <LinkIcon className="w-4 h-4 text-[#9a9a9a]" />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…  (Drive/Dropbox/…)"
              className="flex-1 border-none outline-none text-[12.5px] bg-transparent"
            />
          </div>
          <button
            type="button"
            disabled={!link.trim()}
            onClick={() => { onUploaded({ link: link.trim() }); setLink(''); }}
            className="px-3 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40"
          >
            Allega
          </button>
        </div>
      )}
      {err && <span className="inline-flex items-center gap-1 text-[11px] text-amber-700"><AlertTriangle className="w-3 h-3" /> {err}</span>}
      {!linkMode && driveAvailable() && (
        <button type="button" onClick={() => setLinkMode(true)} className="self-start text-[11px] text-[#9a9a9a] underline">
          oppure incolla un link
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Componente principale
// ----------------------------------------------------------------
export const CantiereBoard: React.FC<CantiereBoardProps> = (props) => {
  const { mode, myUid, myName, myRole, project, cantieri } = props;
  const isStudio = mode === 'studio';
  const [selId, setSelId] = useState<string | null>(cantieri[0]?.id || null);
  const [tab, setTab] = useState<Tab>('rapportini');
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
          tab={tab}
          setTab={setTab}
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
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'rapportini', label: 'Rapportini', icon: FileText },
  { id: 'presenze', label: 'Presenze', icon: Users },
  { id: 'foto', label: 'Foto', icon: ImageIcon },
  { id: 'materiali', label: 'Materiali', icon: Boxes },
  { id: 'checklist', label: 'Checklist', icon: ListChecks },
  { id: 'documenti', label: 'Documenti', icon: FileText },
  { id: 'sal', label: 'SAL & Avanzamento', icon: TrendingUp },
  { id: 'storico', label: 'Storico', icon: History }
];

const CantiereDetail: React.FC<CantiereBoardProps & {
  isStudio: boolean;
  cantiere: Cantiere;
  tab: Tab;
  setTab: (t: Tab) => void;
  folderName: string;
  saveEntity: (coll: string, item: any) => void;
  delEntity: (coll: string, id: string) => void;
}> = (p) => {
  const { cantiere: c, isStudio, tab, setTab, myUid, myName, myRole, folderName, saveEntity, delEntity } = p;
  const cid = c.id;
  const [assignOpen, setAssignOpen] = useState(false);

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

      {/* tabs */}
      <div className="flex gap-1 overflow-x-auto mb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${active ? 'bg-[#161616] text-white' : 'bg-[#f3f3f3] text-[#6b6b6b]'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'rapportini' && <RapportiniTab {...p} />}
      {tab === 'presenze' && <PresenzeTab {...p} />}
      {tab === 'foto' && <FotoTab {...p} />}
      {tab === 'materiali' && <MaterialiTab {...p} />}
      {tab === 'checklist' && <ChecklistTab {...p} />}
      {tab === 'documenti' && <DocumentiTab {...p} />}
      {tab === 'sal' && <SalTab {...p} />}
      {tab === 'storico' && <StoricoTab {...p} />}
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

// -------------------- Documenti --------------------
const DocumentiTab: React.FC<TabProps> = (p) => {
  const { cantiere: c, isStudio, myUid, myRole, folderName, saveEntity, delEntity } = p;
  const list = vals(p.documenti?.[c.id]).sort((a, b) => b.at - a.at);
  return (
    <div className="flex flex-col gap-3">
      <DriveUploader folderName={folderName} onUploaded={(f) => {
        const d: CantiereDoc = { id: newId('doc'), name: f.name || 'Documento', driveFileId: f.driveFileId || null, driveUrl: f.driveUrl || null, link: f.link || null, by: myUid, role: myRole, at: Date.now() };
        saveEntity('cantiereDocumenti', d);
      }} />
      {list.length === 0 ? sectionEmpty('Nessun documento.') : (
        <div className="flex flex-col gap-1.5">
          {list.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <a href={d.driveUrl || d.link || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12.5px] font-medium text-[#161616]">
                <FileText className="w-4 h-4 text-[#9a9a9a]" /> {d.name}
              </a>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#9a9a9a]">{fmtDay(new Date(d.at).toISOString().slice(0, 10))}</span>
                {(isStudio || d.by === myUid) && <button onClick={() => delEntity('cantiereDocumenti', d.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
