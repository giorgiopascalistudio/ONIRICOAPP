/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modulo CRM — stesso schema grafico delle altre sezioni.
 *  - Pipeline commerciale (lead dal primo contatto al contratto firmato)
 *  - Rubrica Fornitori & Subappaltatori
 *  - Storico interazioni per ogni soggetto
 *  - Conversione lead -> commessa con un click
 */

import React, { useMemo, useState } from 'react';
import {
  Target, Plus, X, ChevronLeft, ChevronRight, Building2, Phone, Mail,
  MessageSquarePlus, Trash2, Briefcase, ArrowRightCircle, Euro
} from 'lucide-react';
import { initials, eur } from '../utils';

export interface CrmNote {
  at: number;
  text: string;
  by?: string;
}
export interface Lead {
  id: string;
  name: string;
  company?: string;
  sector?: 'studio' | 'strategico' | 'materico';
  value?: number;
  stage: string;
  email?: string;
  phone?: string;
  notes?: CrmNote[];
  createdAt: number;
}
export interface Supplier {
  id: string;
  name: string;
  category?: string;
  sector?: 'studio' | 'strategico' | 'materico';
  email?: string;
  phone?: string;
  notes?: CrmNote[];
  createdAt: number;
}

interface CrmViewProps {
  leads: Lead[];
  suppliers: Supplier[];
  myName: string;
  onSaveLeads: (arr: Lead[]) => void;
  onSaveSuppliers: (arr: Supplier[]) => void;
  onConvertLead: (lead: Lead) => void;
}

const STAGES: { id: string; label: string }[] = [
  { id: 'nuovo', label: 'Nuovo contatto' },
  { id: 'qualificato', label: 'Qualificato' },
  { id: 'preventivo', label: 'Preventivo' },
  { id: 'negoziazione', label: 'Negoziazione' },
  { id: 'vinto', label: 'Contratto firmato' },
  { id: 'perso', label: 'Perso' }
];
const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label || id;

const sectorBadge = (s?: string) =>
  s === 'strategico'
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : s === 'materico'
    ? 'bg-orange-50 text-orange-850 border-orange-200'
    : 'bg-zinc-50 text-zinc-800 border-zinc-200';
const sectorLabel = (s?: string) => (s === 'strategico' ? 'Strategico' : s === 'materico' ? 'Materico' : 'Studio');
const fmtWhen = (t?: number) => (t ? new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }) : '');

export const CrmView: React.FC<CrmViewProps> = ({
  leads,
  suppliers,
  myName,
  onSaveLeads,
  onSaveSuppliers,
  onConvertLead
}) => {
  const [tab, setTab] = useState<'pipeline' | 'fornitori'>('pipeline');
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [openSupplier, setOpenSupplier] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  // form state
  const [fName, setFName] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fSector, setFSector] = useState<'studio' | 'strategico' | 'materico'>('studio');
  const [fValue, setFValue] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fCategory, setFCategory] = useState('');

  const resetForm = () => {
    setFName(''); setFCompany(''); setFSector('studio'); setFValue('');
    setFEmail(''); setFPhone(''); setFCategory('');
  };

  const pipelineValue = useMemo(
    () => leads.filter((l) => l.stage !== 'perso').reduce((s, l) => s + (Number(l.value) || 0), 0),
    [leads]
  );

  // ---- Lead ops ----
  const addLead = () => {
    if (!fName.trim()) return;
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      name: fName.trim(),
      company: fCompany.trim() || undefined,
      sector: fSector,
      value: fValue ? Number(fValue.replace(/,/g, '.')) : undefined,
      email: fEmail.trim() || undefined,
      phone: fPhone.trim() || undefined,
      stage: 'nuovo',
      notes: [],
      createdAt: Date.now()
    };
    onSaveLeads([...leads, lead]);
    resetForm();
    setNewLeadOpen(false);
  };
  const moveLead = (id: string, dir: 1 | -1) => {
    onSaveLeads(
      leads.map((l) => {
        if (l.id !== id) return l;
        const idx = STAGES.findIndex((s) => s.id === l.stage);
        const ni = Math.max(0, Math.min(STAGES.length - 1, idx + dir));
        return { ...l, stage: STAGES[ni].id };
      })
    );
  };
  const deleteLead = (id: string) => {
    if (!confirm('Eliminare questo lead?')) return;
    onSaveLeads(leads.filter((l) => l.id !== id));
    setOpenLead(null);
  };
  const addLeadNote = (id: string) => {
    if (!noteDraft.trim()) return;
    onSaveLeads(
      leads.map((l) =>
        l.id === id ? { ...l, notes: [...(l.notes || []), { at: Date.now(), text: noteDraft.trim(), by: myName }] } : l
      )
    );
    setNoteDraft('');
  };

  // ---- Supplier ops ----
  const addSupplier = () => {
    if (!fName.trim()) return;
    const sup: Supplier = {
      id: `sup-${Date.now()}`,
      name: fName.trim(),
      category: fCategory.trim() || undefined,
      sector: fSector,
      email: fEmail.trim() || undefined,
      phone: fPhone.trim() || undefined,
      notes: [],
      createdAt: Date.now()
    };
    onSaveSuppliers([...suppliers, sup]);
    resetForm();
    setNewSupplierOpen(false);
  };
  const deleteSupplier = (id: string) => {
    if (!confirm('Eliminare questo fornitore?')) return;
    onSaveSuppliers(suppliers.filter((s) => s.id !== id));
    setOpenSupplier(null);
  };
  const addSupplierNote = (id: string) => {
    if (!noteDraft.trim()) return;
    onSaveSuppliers(
      suppliers.map((s) =>
        s.id === id ? { ...s, notes: [...(s.notes || []), { at: Date.now(), text: noteDraft.trim(), by: myName }] } : s
      )
    );
    setNoteDraft('');
  };

  const activeLead = openLead ? leads.find((l) => l.id === openLead) : null;
  const activeSupplier = openSupplier ? suppliers.find((s) => s.id === openSupplier) : null;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
            <Target className="w-5 h-5" /> CRM
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">
            Pipeline commerciale, fornitori e storico delle interazioni.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); tab === 'pipeline' ? setNewLeadOpen(true) : setNewSupplierOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none hover:shadow-md active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> {tab === 'pipeline' ? 'Nuovo lead' : 'Nuovo fornitore'}
        </button>
      </div>

      {/* Tabs + KPI */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {([
            { id: 'pipeline', label: 'Pipeline commerciale' },
            { id: 'fornitori', label: 'Fornitori & Subappaltatori' }
          ] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${
                  active ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {tab === 'pipeline' && (
          <span className="text-[11px] font-mono font-bold text-[#8a8a8a] bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Pipeline: {eur(pipelineValue)}
          </span>
        )}
      </div>

      {/* PIPELINE KANBAN */}
      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map((st) => {
            const colLeads = leads.filter((l) => l.stage === st.id);
            return (
              <div key={st.id} className="bg-[#f6f6f4] border border-[#ececec] rounded-2xl p-2.5 flex flex-col gap-2 min-h-[120px]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8a8a8a]">{st.label}</span>
                  <span className="text-[10px] font-extrabold text-[#161616] bg-white border border-[#e2e2e2] rounded-full px-1.5">{colLeads.length}</span>
                </div>
                {colLeads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setOpenLead(l.id)}
                    className="bg-white border border-[#e2e2e2] rounded-xl p-3 cursor-pointer hover:border-black hover:shadow-sm transition-all flex flex-col gap-2"
                  >
                    <b className="text-[12.5px] text-[#161616] truncate">{l.name}</b>
                    {l.company && <span className="text-[11px] text-[#8a8a8a] truncate">{l.company}</span>}
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[8.5px] font-extrabold uppercase tracking-wider border px-1.5 py-0.5 rounded-full ${sectorBadge(l.sector)}`}>
                        {sectorLabel(l.sector)}
                      </span>
                      {l.value ? <span className="text-[11px] font-bold text-[#161616]">{eur(l.value)}</span> : null}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#f0f0f0]">
                      <button onClick={(e) => { e.stopPropagation(); moveLead(l.id, -1); }} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer border-none bg-transparent">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveLead(l.id, 1); }} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer border-none bg-transparent">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* FORNITORI */}
      {tab === 'fornitori' && (
        suppliers.length === 0 ? (
          <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun fornitore o subappaltatore.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                onClick={() => setOpenSupplier(s.id)}
                className="group bg-white border border-[#e2e2e2] rounded-[24px] p-5 hover:border-black hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <span className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-gray-500" /></span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(s.sector)}`}>{sectorLabel(s.sector)}</span>
                </div>
                <div>
                  <h4 className="text-[14.5px] font-extrabold text-[#161616] tracking-tight truncate">{s.name}</h4>
                  {s.category && <span className="text-[11.5px] text-[#8a8a8a]">{s.category}</span>}
                </div>
                {(s.email || s.phone) && (
                  <div className="pt-2 border-t border-dashed border-[#ececec] flex flex-col gap-1">
                    {s.email && <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500 truncate"><Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span className="truncate">{s.email}</span></span>}
                    {s.phone && <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500"><Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />{s.phone}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* DETTAGLIO LEAD */}
      {activeLead && (
        <Overlay onClose={() => { setOpenLead(null); setNoteDraft(''); }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[18px] font-black text-[#161616] leading-none">{activeLead.name}</h3>
              {activeLead.company && <p className="text-[12.5px] text-[#8a8a8a] mt-1">{activeLead.company}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(activeLead.sector)}`}>{sectorLabel(activeLead.sector)}</span>
                <span className="text-[10px] font-bold text-[#161616] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">{stageLabel(activeLead.stage)}</span>
                {activeLead.value ? <span className="text-[11px] font-bold flex items-center gap-1"><Euro className="w-3 h-3" />{eur(activeLead.value)}</span> : null}
              </div>
            </div>
            <button onClick={() => { setOpenLead(null); setNoteDraft(''); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {(activeLead.email || activeLead.phone) && (
            <div className="flex flex-col gap-1 mb-4">
              {activeLead.email && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{activeLead.email}</span>}
              {activeLead.phone && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{activeLead.phone}</span>}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {activeLead.stage !== 'vinto' && activeLead.stage !== 'perso' && (
              <button onClick={() => { onConvertLead(activeLead); onSaveLeads(leads.map(l => l.id === activeLead.id ? { ...l, stage: 'vinto' } : l)); setOpenLead(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none">
                <ArrowRightCircle className="w-4 h-4" /> Converti in commessa
              </button>
            )}
            <button onClick={() => deleteLead(activeLead.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold cursor-pointer border border-red-200">
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          </div>

          <NotesPanel notes={activeLead.notes} draft={noteDraft} setDraft={setNoteDraft} onAdd={() => addLeadNote(activeLead.id)} />
        </Overlay>
      )}

      {/* DETTAGLIO FORNITORE */}
      {activeSupplier && (
        <Overlay onClose={() => { setOpenSupplier(null); setNoteDraft(''); }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[18px] font-black text-[#161616] leading-none">{activeSupplier.name}</h3>
              {activeSupplier.category && <p className="text-[12.5px] text-[#8a8a8a] mt-1">{activeSupplier.category}</p>}
              <div className="mt-2"><span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(activeSupplier.sector)}`}>{sectorLabel(activeSupplier.sector)}</span></div>
            </div>
            <button onClick={() => { setOpenSupplier(null); setNoteDraft(''); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          {(activeSupplier.email || activeSupplier.phone) && (
            <div className="flex flex-col gap-1 mb-4">
              {activeSupplier.email && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{activeSupplier.email}</span>}
              {activeSupplier.phone && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{activeSupplier.phone}</span>}
            </div>
          )}
          <div className="mb-4">
            <button onClick={() => deleteSupplier(activeSupplier.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold cursor-pointer border border-red-200">
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          </div>
          <NotesPanel notes={activeSupplier.notes} draft={noteDraft} setDraft={setNoteDraft} onAdd={() => addSupplierNote(activeSupplier.id)} />
        </Overlay>
      )}

      {/* FORM NUOVO LEAD */}
      {newLeadOpen && (
        <Overlay onClose={() => setNewLeadOpen(false)}>
          <FormHeader title="Nuovo lead" onClose={() => setNewLeadOpen(false)} />
          <div className="flex flex-col gap-3">
            <Field label="Nome contatto *"><input value={fName} onChange={(e) => setFName(e.target.value)} className="crm-input" /></Field>
            <Field label="Azienda"><input value={fCompany} onChange={(e) => setFCompany(e.target.value)} className="crm-input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Settore"><SectorSelect value={fSector} onChange={setFSector} /></Field>
              <Field label="Valore stimato (€)"><input value={fValue} onChange={(e) => setFValue(e.target.value)} inputMode="decimal" className="crm-input" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email"><input value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="crm-input" /></Field>
              <Field label="Telefono"><input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="crm-input" /></Field>
            </div>
            <button onClick={addLead} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">Aggiungi lead</button>
          </div>
        </Overlay>
      )}

      {/* FORM NUOVO FORNITORE */}
      {newSupplierOpen && (
        <Overlay onClose={() => setNewSupplierOpen(false)}>
          <FormHeader title="Nuovo fornitore / subappaltatore" onClose={() => setNewSupplierOpen(false)} />
          <div className="flex flex-col gap-3">
            <Field label="Nome / Ragione sociale *"><input value={fName} onChange={(e) => setFName(e.target.value)} className="crm-input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria"><input value={fCategory} onChange={(e) => setFCategory(e.target.value)} placeholder="es. Impianti, Edile…" className="crm-input" /></Field>
              <Field label="Settore"><SectorSelect value={fSector} onChange={setFSector} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email"><input value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="crm-input" /></Field>
              <Field label="Telefono"><input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="crm-input" /></Field>
            </div>
            <button onClick={addSupplier} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">Aggiungi fornitore</button>
          </div>
        </Overlay>
      )}

      <style>{`.crm-input{width:100%;height:38px;border:1px solid #e2e2e2;border-radius:12px;padding:0 12px;font-size:13px;background:#fbfbfb}.crm-input:focus{outline:none;border-color:#161616}`}</style>
    </div>
  );
};

// --- helpers UI ---
const Overlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.18s_ease_both]" onClick={onClose}>
    <div className="bg-white rounded-[24px] w-full max-w-[480px] max-h-[86vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);
const FormHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-[17px] font-black text-[#161616]">{title}</h3>
    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
  </div>
);
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{label}</span>
    {children}
  </label>
);
const SectorSelect: React.FC<{ value: string; onChange: (v: any) => void }> = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="crm-input">
    <option value="studio">Studio</option>
    <option value="strategico">Strategico</option>
    <option value="materico">Materico</option>
  </select>
);
const NotesPanel: React.FC<{ notes?: CrmNote[]; draft: string; setDraft: (s: string) => void; onAdd: () => void }> = ({ notes, draft, setDraft, onAdd }) => (
  <div>
    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] block mb-2">Storico interazioni</span>
    <div className="flex items-center gap-2 mb-3">
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder="Aggiungi nota / interazione…" className="crm-input flex-grow" />
      <button onClick={onAdd} className="w-9 h-9 rounded-xl bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center shrink-0 cursor-pointer border-none"><MessageSquarePlus className="w-4 h-4" /></button>
    </div>
    {(notes && notes.length > 0) ? (
      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
        {[...notes].sort((a, b) => b.at - a.at).map((n, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50 border border-[#f0f0f0]">
            <p className="text-[13px] text-[#161616]">{n.text}</p>
            <span className="text-[10.5px] text-[#8a8a8a] font-semibold">{[n.by, fmtWhen(n.at)].filter(Boolean).join(' · ')}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-[12.5px] italic text-[#8a8a8a]">Nessuna interazione registrata.</p>
    )}
  </div>
);
